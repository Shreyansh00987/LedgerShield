import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.config import DB_PATH

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        filename TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        session_id TEXT NOT NULL,
        id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT DEFAULT '',
        typical_merchants TEXT DEFAULT '[]',
        PRIMARY KEY (session_id, id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        date TEXT NOT NULL,
        original_description TEXT NOT NULL,
        normalized_merchant TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        suggested_account_id TEXT,
        confidence REAL NOT NULL DEFAULT 0.0,
        match_source TEXT NOT NULL,
        status TEXT NOT NULL,
        explanation TEXT DEFAULT '',
        evidence TEXT DEFAULT '',
        requires_review INTEGER NOT NULL DEFAULT 1,
        missing_information TEXT,
        human_note TEXT,
        reviewed_at TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rules (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        account_id TEXT NOT NULL,
        is_exact INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL DEFAULT 'user_learned',
        description TEXT DEFAULT ''
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

def log_audit(action: str, details: str = ""):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO audit_logs (timestamp, action, details) VALUES (?, ?, ?)",
            (datetime.now().isoformat(), action, details)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass
