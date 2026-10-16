import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from backend.config import DB_PATH, MAX_UPLOAD_SIZE_BYTES, DATA_DIR
from backend.database import init_db, get_connection, log_audit
from backend.models import (
    Account, ChartOfAccounts, TransactionBase, TransactionUpdate,
    BatchActionRequest, Rule, ClientInquiryPackage, SessionSummary
)
from backend.services.csv_parser import parse_csv_content
from backend.services.chart_of_accounts import (
    get_chart_of_accounts, save_chart_of_accounts, DEFAULT_TRADE_COA, validate_account_id
)
from backend.services.matching_engine import (
    normalize_merchant_name, match_deterministic, get_all_rules, add_user_rule
)
from backend.services.ai_reconciler import check_local_model_health, predict_transaction
from backend.services.client_inquiry import generate_client_inquiry, format_inquiry_as_markdown
from backend.services.export_service import export_transactions_to_csv
from backend.services.evaluator import run_evaluation_benchmark

# Initialize database schema on startup
init_db()

app = FastAPI(
    title="LedgerShield API",
    description="Privacy-First Transaction Reconciliation Assistant",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def get_health():
    """Health, privacy status, and local model runtime detection."""
    model_status = check_local_model_health()
    return {
        "status": "healthy",
        "app": "LedgerShield",
        "version": "1.0.0",
        "privacy": {
            "mode": "local-first",
            "remote_ai_traffic": False,
            "database": "sqlite-local",
            "db_path": str(DB_PATH)
        },
        "model_runtime": model_status
    }

@app.get("/api/chart-of-accounts", response_model=List[Account])
def api_get_chart_of_accounts(session_id: str = Query("default")):
    return get_chart_of_accounts(session_id)

@app.post("/api/chart-of-accounts")
def api_save_chart_of_accounts(accounts: List[Account], session_id: str = Query("default")):
    save_chart_of_accounts(session_id, accounts)
    log_audit("update_chart_of_accounts", f"Saved {len(accounts)} accounts for session {session_id}")
    return {"status": "success", "count": len(accounts)}

@app.get("/api/rules", response_model=List[Rule])
def api_get_rules():
    return get_all_rules()

@app.post("/api/rules", response_model=Rule)
async def api_create_rule(request: Request):
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
        pattern = data.get("pattern", "")
        account_id = data.get("account_id", "")
        description = data.get("description", "")
    else:
        form = await request.form()
        pattern = form.get("pattern", "")
        account_id = form.get("account_id", "")
        description = form.get("description", "")
        
    if not pattern or not account_id:
        raise HTTPException(status_code=400, detail="Missing required fields: 'pattern' and 'account_id'")
        
    rule = add_user_rule(str(pattern), str(account_id), str(description or ""))
    log_audit("create_rule", f"Created rule for '{pattern}' -> {account_id}")
    return rule

@app.post("/api/demo/load")
def load_demo_session():
    """Load Northstar Electrical Services synthetic demo session."""
    demo_file = DATA_DIR / "demo_northstar_transactions.csv"
    if not demo_file.exists():
        raise HTTPException(status_code=404, detail="Demo dataset not found")
        
    with open(demo_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    session_id = f"demo-northstar-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    transactions, diagnostics = parse_csv_content(content)
    
    if diagnostics.get("error"):
        raise HTTPException(status_code=400, detail=diagnostics["error"])
        
    # Save default CoA for this session
    save_chart_of_accounts(session_id, DEFAULT_TRADE_COA)

    # Save session
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sessions (id, name, created_at, filename) VALUES (?, ?, ?, ?)",
        (session_id, "Northstar Electrical Services (Demo)", datetime.now().isoformat(), "demo_northstar_transactions.csv")
    )
    
    # Insert parsed transactions
    for t in transactions:
        tx_id = f"tx-{uuid.uuid4().hex[:10]}"
        norm_merchant = normalize_merchant_name(t["description"])
        cursor.execute(
            """INSERT INTO transactions 
               (id, session_id, date, original_description, normalized_merchant, amount, currency, status, match_source, confidence, requires_review)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (tx_id, session_id, t["date"], t["description"], norm_merchant, t["amount"], "USD", "unreviewed", "heuristic_fallback", 0.0, 1)
        )
        
    conn.commit()
    conn.close()
    
    log_audit("load_demo_session", f"Loaded demo session {session_id} with {len(transactions)} rows")
    return {
        "session_id": session_id,
        "name": "Northstar Electrical Services (Demo)",
        "transaction_count": len(transactions),
        "diagnostics": diagnostics
    }

@app.post("/api/import")
@app.post("/api/upload-csv")
async def import_csv(
    file: UploadFile = File(...),
    session_name: Optional[str] = Form(None)
):
    """Import and validate client CSV file."""
    content_bytes = await file.read(MAX_UPLOAD_SIZE_BYTES + 1024)
    if len(content_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum upload size of {MAX_UPLOAD_SIZE_BYTES / (1024*1024):.0f}MB")
        
    try:
        content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content = content_bytes.decode("latin-1")
        
    transactions, diagnostics = parse_csv_content(content)
    if diagnostics.get("error"):
        return {"success": False, "diagnostics": diagnostics}
        
    session_id = f"sess-{uuid.uuid4().hex[:8]}"
    s_name = session_name or file.filename or f"Session {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    
    # Initialize CoA
    save_chart_of_accounts(session_id, DEFAULT_TRADE_COA)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sessions (id, name, created_at, filename) VALUES (?, ?, ?, ?)",
        (session_id, s_name, datetime.now().isoformat(), file.filename or "upload.csv")
    )
    
    for t in transactions:
        tx_id = f"tx-{uuid.uuid4().hex[:10]}"
        norm_merchant = normalize_merchant_name(t["description"])
        cursor.execute(
            """INSERT INTO transactions 
               (id, session_id, date, original_description, normalized_merchant, amount, currency, status, match_source, confidence, requires_review)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (tx_id, session_id, t["date"], t["description"], norm_merchant, t["amount"], "USD", "unreviewed", "heuristic_fallback", 0.0, 1)
        )
        
    conn.commit()
    conn.close()
    
    log_audit("import_csv", f"Imported {len(transactions)} rows into session {session_id}")
    return {
        "success": True,
        "session_id": session_id,
        "session_name": s_name,
        "total_parsed": len(transactions),
        "diagnostics": diagnostics
    }

@app.get("/api/sessions", response_model=List[SessionSummary])
def list_sessions():
    """List all saved reconciliation sessions with summary counts."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, created_at FROM sessions ORDER BY created_at DESC")
    sessions_rows = cursor.fetchall()
    
    summaries = []
    for s in sessions_rows:
        s_id = s["id"]
        cursor.execute(
            """SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = 'unreviewed' THEN 1 ELSE 0 END) as unreviewed,
                 SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                 SUM(CASE WHEN status = 'edited' THEN 1 ELSE 0 END) as edited,
                 SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                 SUM(CASE WHEN status = 'needs_clarification' THEN 1 ELSE 0 END) as needs_clarification,
                 SUM(CASE WHEN match_source IN ('exact_rule', 'historical_pattern') THEN 1 ELSE 0 END) as auto_matched
               FROM transactions WHERE session_id = ?""",
            (s_id,)
        )
        counts = cursor.fetchone()
        summaries.append(SessionSummary(
            id=s_id,
            name=s["name"],
            created_at=s["created_at"],
            total_count=counts["total"] or 0,
            unreviewed_count=counts["unreviewed"] or 0,
            accepted_count=counts["accepted"] or 0,
            edited_count=counts["edited"] or 0,
            rejected_count=counts["rejected"] or 0,
            needs_clarification_count=counts["needs_clarification"] or 0,
            auto_matched_count=counts["auto_matched"] or 0
        ))
        
    conn.close()
    return summaries

@app.get("/api/sessions/{session_id}/transactions", response_model=List[TransactionBase])
def get_session_transactions(
    session_id: str,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Retrieve transactions for a session with optional filters."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """SELECT id, date, original_description, normalized_merchant, amount, currency,
                      suggested_account_id, confidence, match_source, status, explanation,
                      evidence, requires_review, missing_information, human_note, reviewed_at
               FROM transactions WHERE session_id = ?"""
    params: List[Any] = [session_id]
    
    if status and status != "all":
        query += " AND status = ?"
        params.append(status)
        
    if search:
        query += " AND (original_description LIKE ? OR normalized_merchant LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term])
        
    query += " ORDER BY date ASC, amount ASC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    txs = []
    for r in rows:
        txs.append(TransactionBase(
            id=r["id"],
            date=r["date"],
            original_description=r["original_description"],
            normalized_merchant=r["normalized_merchant"],
            amount=r["amount"],
            currency=r["currency"],
            suggested_account_id=r["suggested_account_id"],
            confidence=r["confidence"],
            match_source=r["match_source"],
            status=r["status"],
            explanation=r["explanation"] or "",
            evidence=r["evidence"] or "",
            requires_review=bool(r["requires_review"]),
            missing_information=r["missing_information"],
            human_note=r["human_note"],
            reviewed_at=r["reviewed_at"]
        ))
    return txs

@app.post("/api/sessions/{session_id}/reconcile")
def run_session_reconciliation(session_id: str):
    """
    Run the end-to-end reconciliation pipeline:
    1. Deterministic Rule & Normalization Engine
    2. Local Semantic AI / Fallback Engine for remaining items
    3. Strict Chart of Accounts validation
    """
    accounts = get_chart_of_accounts(session_id)
    valid_account_ids = {a.id for a in accounts}
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT id, date, original_description, normalized_merchant, amount 
           FROM transactions 
           WHERE session_id = ? AND status IN ('unreviewed', 'suggested')""",
        (session_id,)
    )
    rows = cursor.fetchall()
    
    deterministic_count = 0
    ai_count = 0
    clarification_count = 0
    
    for r in rows:
        tx_id = r["id"]
        raw_desc = r["original_description"]
        norm = r["normalized_merchant"] or normalize_merchant_name(raw_desc)
        amt = r["amount"]
        date = r["date"]
        
        # 1. Deterministic match check
        det_match = match_deterministic(raw_desc, norm, valid_account_ids)
        if det_match:
            acc_id, conf, source, expl, evid = det_match
            deterministic_count += 1
            cursor.execute(
                """UPDATE transactions SET 
                   suggested_account_id = ?, confidence = ?, match_source = ?,
                   status = 'suggested', explanation = ?, evidence = ?, requires_review = 1
                   WHERE id = ?""",
                (acc_id, conf, source, expl, evid, tx_id)
            )
        else:
            # 2. Local AI / Heuristic Prediction
            pred = predict_transaction(tx_id, date, raw_desc, norm, amt, accounts)
            ai_count += 1
            new_status = "needs_clarification" if not pred.suggested_account_id else "suggested"
            if new_status == "needs_clarification":
                clarification_count += 1
                
            cursor.execute(
                """UPDATE transactions SET 
                   suggested_account_id = ?, confidence = ?, match_source = ?,
                   status = ?, explanation = ?, evidence = ?, requires_review = ?,
                   missing_information = ?
                   WHERE id = ?""",
                (pred.suggested_account_id, pred.confidence, pred.match_source,
                 new_status, pred.explanation, pred.evidence,
                 1 if pred.requires_review else 0, pred.missing_information, tx_id)
            )
            
    conn.commit()
    conn.close()
    
    log_audit("reconcile_session", f"Reconciled session {session_id}: {deterministic_count} deterministic, {ai_count} AI/heuristic")
    return {
        "status": "completed",
        "processed_count": len(rows),
        "deterministic_matches": deterministic_count,
        "ai_suggestions": ai_count,
        "needs_clarification": clarification_count
    }

@app.patch("/api/transactions/{transaction_id}")
def update_transaction(transaction_id: str, update: TransactionUpdate):
    """Update single transaction decision with audit trail."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT session_id, normalized_merchant FROM transactions WHERE id = ?", (transaction_id,))
    tx = cursor.fetchone()
    if not tx:
        conn.close()
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    session_id = tx["session_id"]
    norm_merchant = tx["normalized_merchant"]
    
    # If account changed, strictly validate against CoA
    if update.suggested_account_id:
        if not validate_account_id(session_id, update.suggested_account_id):
            conn.close()
            raise HTTPException(status_code=400, detail=f"Account '{update.suggested_account_id}' does not exist in Chart of Accounts")
            
    updates = []
    params = []
    
    if update.suggested_account_id is not None:
        updates.append("suggested_account_id = ?")
        params.append(update.suggested_account_id)
        
    if update.status is not None:
        updates.append("status = ?")
        params.append(update.status)
        updates.append("reviewed_at = ?")
        params.append(datetime.now().isoformat())
        
    if update.human_note is not None:
        updates.append("human_note = ?")
        params.append(update.human_note)
        
    if not updates:
        conn.close()
        return {"status": "no change"}
        
    params.append(transaction_id)
    cursor.execute(f"UPDATE transactions SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    
    log_audit("update_transaction", f"Updated transaction {transaction_id}: status={update.status}, account={update.suggested_account_id}")
    return {"status": "success", "id": transaction_id}

@app.post("/api/transactions/batch")
def batch_action(req: BatchActionRequest):
    """Perform batch actions with safety checks."""
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()
    
    if req.action == "accept":
        cursor.executemany(
            "UPDATE transactions SET status = 'accepted', reviewed_at = ? WHERE id = ? AND suggested_account_id IS NOT NULL",
            [(now_str, tx_id) for tx_id in req.transaction_ids]
        )
    elif req.action == "reject":
        cursor.executemany(
            "UPDATE transactions SET status = 'rejected', reviewed_at = ? WHERE id = ?",
            [(now_str, tx_id) for tx_id in req.transaction_ids]
        )
    elif req.action == "mark_clarification":
        cursor.executemany(
            "UPDATE transactions SET status = 'needs_clarification', reviewed_at = ? WHERE id = ?",
            [(now_str, tx_id) for tx_id in req.transaction_ids]
        )
        
    conn.commit()
    conn.close()
    
    log_audit("batch_action", f"Batch {req.action} applied to {len(req.transaction_ids)} items")
    return {"status": "success", "count": len(req.transaction_ids), "action": req.action}

@app.post("/api/inquiry/generate", response_model=ClientInquiryPackage)
def create_inquiry(session_id: str, client_name: str = "Client"):
    """Generate structured client inquiry package for unresolved items."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT id, date, original_description, normalized_merchant, amount, currency,
                  suggested_account_id, confidence, match_source, status, explanation,
                  evidence, requires_review, missing_information, human_note, reviewed_at
           FROM transactions 
           WHERE session_id = ? AND status IN ('needs_clarification', 'unreviewed')""",
        (session_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    txs = [
        TransactionBase(
            id=r["id"],
            date=r["date"],
            original_description=r["original_description"],
            normalized_merchant=r["normalized_merchant"],
            amount=r["amount"],
            currency=r["currency"],
            suggested_account_id=r["suggested_account_id"],
            confidence=r["confidence"],
            match_source=r["match_source"],
            status=r["status"],
            explanation=r["explanation"] or "",
            evidence=r["evidence"] or "",
            requires_review=bool(r["requires_review"]),
            missing_information=r["missing_information"],
            human_note=r["human_note"],
            reviewed_at=r["reviewed_at"]
        ) for r in rows
    ]
    
    pkg = generate_client_inquiry(txs, client_name=client_name)
    return pkg

@app.get("/api/inquiry/markdown", response_class=PlainTextResponse)
def get_inquiry_markdown(session_id: str, client_name: str = "Client"):
    pkg = create_inquiry(session_id, client_name)
    return format_inquiry_as_markdown(pkg)

@app.get("/api/sessions/{session_id}/export")
def export_csv(session_id: str):
    """Export reviewed reconciliation results to clean CSV."""
    accounts = get_chart_of_accounts(session_id)
    txs = get_session_transactions(session_id)
    csv_text, summary = export_transactions_to_csv(txs, accounts)
    
    log_audit("export_csv", f"Exported {len(txs)} transactions for session {session_id}")
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=ledgershield_reconciled_{session_id}.csv",
            "X-Reconciliation-Total": str(summary["total_rows"]),
            "X-Reconciliation-Unresolved": str(summary["unresolved_count"])
        }
    )

@app.get("/api/evaluation/run")
def api_run_evaluation():
    """Execute reproducible evaluation benchmark."""
    res = run_evaluation_benchmark()
    return res

@app.post("/api/privacy/clear-data")
@app.post("/api/privacy/clear")
def clear_all_local_data():
    """Wipe local SQLite tables and reset session database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions")
    cursor.execute("DELETE FROM accounts")
    cursor.execute("DELETE FROM sessions")
    cursor.execute("DELETE FROM audit_logs")
    conn.commit()
    conn.close()
    
    log_audit("clear_data", "User purged all local sessions and transaction records")
    return {"status": "cleared", "message": "All local financial records and sessions successfully deleted"}
