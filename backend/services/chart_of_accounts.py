import json
from typing import List, Dict, Optional
from backend.models import Account, ChartOfAccounts
from backend.database import get_connection

DEFAULT_TRADE_COA = [
    # Assets
    Account(id="1010", name="Operating Checking", type="asset", description="Primary operating checking account for business cash flow", typical_merchants=["Transfer", "Payroll", "Deposit"]),
    Account(id="1020", name="Savings & Reserve", type="asset", description="Business reserve and tax savings account", typical_merchants=["Interest", "Transfer"]),
    Account(id="1200", name="Accounts Receivable", type="asset", description="Invoiced customer payments receivable", typical_merchants=["Client Payment", "Wire"]),
    # Liabilities
    Account(id="2010", name="Accounts Payable", type="liability", description="Unpaid vendor bills and invoices", typical_merchants=["Vendor Bill"]),
    Account(id="2020", name="Credit Card Clearing", type="liability", description="Business credit card liability clearing", typical_merchants=["Amex", "Chase", "Card Payment"]),
    Account(id="2100", name="Payroll Liabilities", type="liability", description="Accrued payroll taxes and withholding", typical_merchants=["IRS", "State Tax", "EFTPS"]),
    # Equity
    Account(id="3010", name="Owner's Capital", type="equity", description="Owner initial investment and contributions", typical_merchants=["Owner Contribution"]),
    Account(id="3020", name="Owner's Draw", type="equity", description="Personal distributions and non-business withdrawals", typical_merchants=["Owner Draw", "Personal"]),
    # Revenue
    Account(id="4010", name="Contracting Revenue", type="revenue", description="Income from electrical services, contracting, and installations", typical_merchants=["Invoice", "Stripe", "Square", "Customer"]),
    Account(id="4020", name="Service & Maintenance Revenue", type="revenue", description="Recurring service calls and routine maintenance agreements", typical_merchants=["Maintenance Plan", "Service Call"]),
    Account(id="4090", name="Other Income", type="revenue", description="Interest income, vendor rebates, miscellaneous credits", typical_merchants=["Cashback", "Dividend", "Rebate"]),
    # Expenses - Cost of Goods Sold
    Account(id="5010", name="COGS - Electrical Materials & Parts", type="expense", description="Wire, conduit, breakers, panels, fixtures directly installed for clients", typical_merchants=["Home Depot", "Lowe's", "Grainger", "Platt Electric", "Rexel"]),
    Account(id="5020", name="COGS - Subcontractor Labor", type="expense", description="1099 independent contractors, specialized trenching, engineering consultants", typical_merchants=["Subcontractor", "Engineering", "Excavation"]),
    Account(id="5030", name="COGS - Equipment Rental", type="expense", description="Scissor lifts, boom trucks, generators rented for job sites", typical_merchants=["Sunbelt Rentals", "United Rentals", "Herc"]),
    # Expenses - Operating & Overhead
    Account(id="6010", name="Advertising & Marketing", type="expense", description="Website, local search ads, flyers, branded uniforms", typical_merchants=["Google Ads", "Facebook Ads", "Yelp", "Vistaprint"]),
    Account(id="6020", name="Vehicle & Fleet Fuel", type="expense", description="Gas, diesel, fleet fuel cards for work vans", typical_merchants=["Shell", "Chevron", "Exxon", "Costco Gas", "Speedway", "BP"]),
    Account(id="6030", name="Vehicle Maintenance & Repairs", type="expense", description="Oil changes, tires, van repairs, vehicle inspections", typical_merchants=["AutoZone", "Jiffy Lube", "Firestone", "Ford Service"]),
    Account(id="6040", name="Small Tools & Shop Equipment", type="expense", description="Hand tools, drills, meters under capitalization threshold (<$2,500)", typical_merchants=["Milwaukee Tool", "Harbor Freight", "Klein Tools", "Ace Hardware"]),
    Account(id="6050", name="Insurance - General & Commercial Auto", type="expense", description="Commercial general liability, inland marine, vehicle insurance", typical_merchants=["State Farm", "Next Insurance", "Hartford", "Progressive"]),
    Account(id="6060", name="Office Supplies & Software", type="expense", description="QuickBooks, Google Workspace, Microsoft 365, printer paper", typical_merchants=["Microsoft", "Intuit", "Adobe", "Google", "Staples", "Slack"]),
    Account(id="6070", name="Meals & Client Entertainment (50%)", type="expense", description="Meals with clients or crew during overtime work", typical_merchants=["Starbucks", "Subway", "Chipotle", "Dunkin", "Panera"]),
    Account(id="6080", name="Professional Fees - Legal & Accounting", type="expense", description="CPA fees, legal counsel, tax prep", typical_merchants=["Accounting Firm", "LegalZoom", "Attorney"]),
    Account(id="6090", name="Bank & Merchant Processing Fees", type="expense", description="Square fees, Stripe fees, monthly bank service charges", typical_merchants=["Square Inc", "Stripe", "Bank Fee", "Service Charge"]),
    Account(id="6100", name="Utilities & Phone", type="expense", description="Mobile phones for crew, shop electric, high-speed internet", typical_merchants=["Verizon", "AT&T", "T-Mobile", "Comcast", "Electric Utility"])
]

def save_chart_of_accounts(session_id: str, accounts: List[Account]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM accounts WHERE session_id = ?", (session_id,))
    for acc in accounts:
        cursor.execute(
            """INSERT INTO accounts (session_id, id, name, type, description, typical_merchants)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, acc.id, acc.name, acc.type, acc.description, json.dumps(acc.typical_merchants))
        )
    conn.commit()
    conn.close()

def get_chart_of_accounts(session_id: str) -> List[Account]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, type, description, typical_merchants FROM accounts WHERE session_id = ?", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        # Default fallback
        save_chart_of_accounts(session_id, DEFAULT_TRADE_COA)
        return DEFAULT_TRADE_COA
        
    accounts = []
    for r in rows:
        accounts.append(Account(
            id=r["id"],
            name=r["name"],
            type=r["type"],
            description=r["description"] or "",
            typical_merchants=json.loads(r["typical_merchants"] or "[]")
        ))
    return accounts

def validate_account_id(session_id: str, account_id: str) -> bool:
    """Strictly verify if account_id exists in Chart of Accounts for this session."""
    accounts = get_chart_of_accounts(session_id)
    return any(a.id == account_id for a in accounts)

def get_account_by_id(session_id: str, account_id: str) -> Optional[Account]:
    accounts = get_chart_of_accounts(session_id)
    for a in accounts:
        if a.id == account_id:
            return a
    return None
