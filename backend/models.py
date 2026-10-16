from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class Account(BaseModel):
    id: str
    name: str
    type: Literal["asset", "liability", "equity", "revenue", "expense"]
    description: str = ""
    typical_merchants: List[str] = Field(default_factory=list)

class ChartOfAccounts(BaseModel):
    name: str
    accounts: List[Account]

class TransactionBase(BaseModel):
    id: str
    date: str
    original_description: str
    normalized_merchant: str
    amount: float
    currency: str = "USD"
    suggested_account_id: Optional[str] = None
    confidence: float = 0.0
    match_source: Literal["exact_rule", "historical_pattern", "local_ai", "heuristic_fallback", "manual"] = "heuristic_fallback"
    status: Literal["unreviewed", "suggested", "accepted", "edited", "rejected", "needs_clarification"] = "unreviewed"
    explanation: str = ""
    evidence: str = ""
    requires_review: bool = True
    missing_information: Optional[str] = None
    human_note: Optional[str] = None
    reviewed_at: Optional[str] = None

class TransactionUpdate(BaseModel):
    suggested_account_id: Optional[str] = None
    status: Optional[Literal["unreviewed", "suggested", "accepted", "edited", "rejected", "needs_clarification"]] = None
    human_note: Optional[str] = None

class BatchActionRequest(BaseModel):
    transaction_ids: List[str]
    action: Literal["accept", "reject", "mark_clarification"]
    account_id: Optional[str] = None

class Rule(BaseModel):
    id: str
    pattern: str
    account_id: str
    is_exact: bool = False
    created_by: Literal["system", "user_learned"] = "user_learned"
    description: str = ""

class ClientInquiryItem(BaseModel):
    transaction_id: str
    date: str
    amount: float
    description: str
    normalized_merchant: str
    suggested_account: Optional[str]
    question: str
    options: List[str] = Field(default_factory=list)
    client_response: Optional[str] = None

class ClientInquiryPackage(BaseModel):
    client_name: str
    period: str
    items: List[ClientInquiryItem]
    custom_message: Optional[str] = None

class SessionSummary(BaseModel):
    id: str
    name: str
    created_at: str
    total_count: int
    unreviewed_count: int
    accepted_count: int
    edited_count: int
    rejected_count: int
    needs_clarification_count: int
    auto_matched_count: int
