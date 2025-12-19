from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'moztec-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class UserRole(str):
    ADMIN = "admin"
    TELLER = "teller"
    KASIR = "kasir"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str
    branch_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    branch_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Branch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    address: str
    phone: str
    is_headquarters: bool = False
    is_active: bool = True
    opening_balance: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BranchCreate(BaseModel):
    name: str
    code: str
    address: str
    phone: str
    is_headquarters: bool = False
    opening_balance: float = 0.0

class Currency(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    symbol: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CurrencyCreate(BaseModel):
    code: str
    name: str
    symbol: str

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_type: str = "perorangan"  # "perorangan" or "badan_usaha" - default for backward compatibility
    customer_code: str = Field(default_factory=lambda: f"MBA{uuid.uuid4().hex[:8].upper()}")
    
    # Common fields
    branch_id: str
    
    # Perorangan fields
    name: Optional[str] = None
    gender: Optional[str] = None
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    birth_place: Optional[str] = None
    birth_date: Optional[str] = None
    identity_address: Optional[str] = None
    domicile_address: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    fund_source: Optional[str] = None
    transaction_purpose: Optional[str] = None
    is_pep: Optional[bool] = False
    pep_relation: Optional[str] = None
    beneficial_owner_name: Optional[str] = None
    beneficial_owner_id: Optional[str] = None
    
    # Badan Usaha fields
    entity_type: Optional[str] = None
    entity_name: Optional[str] = None
    license_number: Optional[str] = None
    npwp: Optional[str] = None
    license_issue_place: Optional[str] = None
    license_issue_date: Optional[str] = None
    entity_address: Optional[str] = None
    pic_name: Optional[str] = None
    pic_phone: Optional[str] = None
    pic_id_number: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    customer_type: str = "perorangan"
    branch_id: str
    
    # Perorangan fields
    name: Optional[str] = None
    gender: Optional[str] = None
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    birth_place: Optional[str] = None
    birth_date: Optional[str] = None
    identity_address: Optional[str] = None
    domicile_address: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    fund_source: Optional[str] = None
    transaction_purpose: Optional[str] = None
    is_pep: Optional[bool] = False
    pep_relation: Optional[str] = None
    beneficial_owner_name: Optional[str] = None
    beneficial_owner_id: Optional[str] = None
    
    # Badan Usaha fields
    entity_type: Optional[str] = None
    entity_name: Optional[str] = None
    license_number: Optional[str] = None
    npwp: Optional[str] = None
    license_issue_place: Optional[str] = None
    license_issue_date: Optional[str] = None
    entity_address: Optional[str] = None
    pic_name: Optional[str] = None
    pic_phone: Optional[str] = None
    pic_id_number: Optional[str] = None

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_number: str
    voucher_number: Optional[str] = None  # Manual input, optional
    customer_id: str
    customer_code: Optional[str] = None  # For backward compatibility
    customer_name: str
    customer_identity_type: Optional[str] = None
    branch_id: str
    branch_name: Optional[str] = None  # For backward compatibility
    user_id: str
    accountant_name: Optional[str] = None  # For backward compatibility
    transaction_type: str  # "jual" (we sell to customer) or "beli" (we buy from customer)
    currency_id: str
    currency_code: str
    amount: float
    exchange_rate: float
    total_idr: float
    notes: Optional[str] = None
    delivery_channel: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_purpose: Optional[str] = None  # Tujuan transaksi
    transaction_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    customer_id: str
    transaction_type: str
    currency_id: str
    amount: float
    exchange_rate: float
    voucher_number: Optional[str] = None  # Manual input, optional
    notes: Optional[str] = None
    delivery_channel: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_purpose: Optional[str] = None  # Tujuan transaksi
    transaction_date: Optional[datetime] = None

class CashBookEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    branch_id: str
    date: datetime
    entry_type: str
    amount: float
    description: str
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CashBookEntryCreate(BaseModel):
    branch_id: str
    entry_type: str
    amount: float
    description: str
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None

class MutasiValas(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    branch_id: str
    currency_id: str
    currency_code: str
    date: datetime
    beginning_stock_valas: float
    beginning_stock_idr: float
    purchase_valas: float
    purchase_idr: float
    sale_valas: float
    sale_idr: float
    ending_stock_valas: float
    ending_stock_idr: float
    avg_rate: float
    profit_loss: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Company Settings Model
class CompanySettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default="company_settings")
    company_name: str = "MOZTEC"
    company_address: str = ""
    company_phone: str = ""
    company_email: str = ""
    company_website: str = ""
    company_license: str = ""  # Nomor izin BI
    company_npwp: str = ""
    receipt_footer: str = "Terima kasih atas kepercayaan Anda"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    company_license: Optional[str] = None
    company_npwp: Optional[str] = None
    receipt_footer: Optional[str] = None

# Multi-Currency Transaction Item
class TransactionItem(BaseModel):
    currency_id: str
    transaction_type: str  # "jual" or "beli"
    amount: float
    exchange_rate: float

class MultiTransactionCreate(BaseModel):
    customer_id: str
    items: List[TransactionItem]
    voucher_number: Optional[str] = None
    notes: Optional[str] = None
    delivery_channel: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_purpose: Optional[str] = None
    transaction_date: Optional[datetime] = None

# Branch Initial Balances (per currency)
class BranchBalanceUpdate(BaseModel):
    opening_balance: float = 0.0  # IDR
    currency_balances: Optional[dict] = None  # {"USD": 1000, "SGD": 500}

class DashboardStats(BaseModel):
    total_transactions_today: int
    total_revenue_today: float
    total_customers: int
    total_branches: int
    recent_transactions: List[Transaction]

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def generate_transaction_number(transaction_type: str, branch_id: str):
    """Generate transaction number with format: TRX-MBA-J/B-XXXXX-BRANCHCODE-DDMMYY"""
    now = datetime.now(timezone.utc)
    
    # Get transaction type indicator
    type_indicator = "J" if transaction_type in ["jual", "sell"] else "B"
    
    # Get branch code
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    branch_code = branch.get("code", "00")[:3].upper() if branch else "00"
    
    # Get sequential number for today
    today_start = now.strftime('%Y-%m-%d')
    count = await db.transactions.count_documents({
        "transaction_date": {"$gte": today_start, "$lt": today_start + "T23:59:59Z"}
    })
    seq_number = str(count + 1).zfill(5)
    
    # Format date as DDMMYY
    date_str = now.strftime('%d%m%y')
    
    return f"TRX-MBA-{type_indicator}-{seq_number}-{branch_code}-{date_str}"

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        branch_id=user_data.branch_id
    )
    
    user_dict = user.model_dump()
    user_dict["password_hash"] = hashed_pwd
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    
    user_obj = User(**user)
    return {"token": token, "user": user_obj}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============= BRANCH ENDPOINTS =============

@api_router.post("/branches", response_model=Branch)
async def create_branch(branch_data: BranchCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can create branches")
    
    existing = await db.branches.find_one({"code": branch_data.code}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Branch code already exists")
    
    branch = Branch(**branch_data.model_dump())
    branch_dict = branch.model_dump()
    branch_dict["created_at"] = branch_dict["created_at"].isoformat()
    
    await db.branches.insert_one(branch_dict)
    return branch

@api_router.get("/branches", response_model=List[Branch])
async def get_branches(current_user: User = Depends(get_current_user)):
    branches = await db.branches.find({"is_active": True}, {"_id": 0}).to_list(1000)
    for branch in branches:
        if isinstance(branch.get("created_at"), str):
            branch["created_at"] = datetime.fromisoformat(branch["created_at"])
    return branches

@api_router.put("/branches/{branch_id}", response_model=Branch)
async def update_branch(branch_id: str, branch_data: BranchCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update branches")
    
    result = await db.branches.update_one(
        {"id": branch_id},
        {"$set": branch_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    updated = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return Branch(**updated)

@api_router.delete("/branches/{branch_id}")
async def delete_branch(branch_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete branches")
    
    result = await db.branches.update_one({"id": branch_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Branch not found")
    return {"message": "Branch deleted successfully"}

# ============= CURRENCY ENDPOINTS =============

@api_router.post("/currencies", response_model=Currency)
async def create_currency(currency_data: CurrencyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can create currencies")
    
    currency = Currency(**currency_data.model_dump())
    currency_dict = currency.model_dump()
    currency_dict["created_at"] = currency_dict["created_at"].isoformat()
    
    await db.currencies.insert_one(currency_dict)
    return currency

@api_router.get("/currencies", response_model=List[Currency])
async def get_currencies(current_user: User = Depends(get_current_user)):
    currencies = await db.currencies.find({"is_active": True}, {"_id": 0}).to_list(1000)
    for currency in currencies:
        if isinstance(currency.get("created_at"), str):
            currency["created_at"] = datetime.fromisoformat(currency["created_at"])
    return currencies

@api_router.put("/currencies/{currency_id}", response_model=Currency)
async def update_currency(currency_id: str, currency_data: CurrencyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update currencies")
    
    result = await db.currencies.update_one(
        {"id": currency_id},
        {"$set": currency_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Currency not found")
    
    updated = await db.currencies.find_one({"id": currency_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return Currency(**updated)

@api_router.delete("/currencies/{currency_id}")
async def delete_currency(currency_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete currencies")
    
    result = await db.currencies.update_one({"id": currency_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Currency not found")
    return {"message": "Currency deleted successfully"}

# ============= CUSTOMER ENDPOINTS =============

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN and customer_data.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="You can only create customers for your branch")
    
    customer = Customer(**customer_data.model_dump())
    customer_dict = customer.model_dump()
    customer_dict["created_at"] = customer_dict["created_at"].isoformat()
    
    await db.customers.insert_one(customer_dict)
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
    
    customers = await db.customers.find(query, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer.get("created_at"), str):
            customer["created_at"] = datetime.fromisoformat(customer["created_at"])
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if current_user.role != UserRole.ADMIN and customer["branch_id"] != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if isinstance(customer.get("created_at"), str):
        customer["created_at"] = datetime.fromisoformat(customer["created_at"])
    return Customer(**customer)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    existing = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if current_user.role != UserRole.ADMIN and existing["branch_id"] != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": customer_data.model_dump()}
    )
    
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return Customer(**updated)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete customers")
    
    existing = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    await db.customers.delete_one({"id": customer_id})
    return {"message": "Customer deleted successfully"}

@api_router.get("/customers/{customer_id}/transactions")
async def get_customer_transactions(customer_id: str, current_user: User = Depends(get_current_user)):
    """Get all transactions for a specific customer (YTD view)"""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if current_user.role != UserRole.ADMIN and customer["branch_id"] != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get current year start
    current_year = datetime.now(timezone.utc).year
    year_start = f"{current_year}-01-01"
    
    transactions = await db.transactions.find(
        {"customer_id": customer_id, "transaction_date": {"$gte": year_start}}, 
        {"_id": 0}
    ).sort("transaction_date", -1).to_list(1000)
    
    for transaction in transactions:
        if isinstance(transaction.get("created_at"), str):
            transaction["created_at"] = datetime.fromisoformat(transaction["created_at"])
        if isinstance(transaction.get("transaction_date"), str):
            transaction["transaction_date"] = datetime.fromisoformat(transaction["transaction_date"])
    
    # Calculate YTD summary
    total_buy = sum(t["total_idr"] for t in transactions if t.get("transaction_type") in ["beli", "buy"])
    total_sell = sum(t["total_idr"] for t in transactions if t.get("transaction_type") in ["jual", "sell"])
    
    return {
        "customer": customer,
        "transactions": transactions,
        "ytd_summary": {
            "total_transactions": len(transactions),
            "total_buy_idr": total_buy,
            "total_sell_idr": total_sell,
            "net_total_idr": total_sell - total_buy
        }
    }

# ============= TRANSACTION ENDPOINTS =============

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": transaction_data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    currency = await db.currencies.find_one({"id": transaction_data.currency_id}, {"_id": 0})
    if not currency:
        raise HTTPException(status_code=404, detail="Currency not found")
    
    branch = await db.branches.find_one({"id": customer["branch_id"]}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    if current_user.role != UserRole.ADMIN and customer["branch_id"] != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    total_idr = transaction_data.amount * transaction_data.exchange_rate
    
    # Get or generate customer code (MBA + 8 random digits)
    customer_code = customer.get("customer_code")
    if not customer_code:
        # Generate new code for old customers
        import random
        customer_code = f"MBA{random.randint(10000000, 99999999)}"
        # Update customer with new code
        await db.customers.update_one(
            {"id": transaction_data.customer_id},
            {"$set": {"customer_code": customer_code}}
        )
    
    customer_name = customer.get("name") or customer.get("entity_name", "")
    
    transaction = Transaction(
        transaction_number=await generate_transaction_number(transaction_data.transaction_type, customer["branch_id"]),
        voucher_number=transaction_data.voucher_number if transaction_data.voucher_number else None,
        customer_id=transaction_data.customer_id,
        customer_code=customer_code,
        customer_name=customer_name,
        customer_identity_type=customer.get("identity_type", customer.get("entity_type", "")),
        branch_id=customer["branch_id"],
        branch_name=branch["name"],
        user_id=current_user.id,
        accountant_name=current_user.name,
        transaction_type=transaction_data.transaction_type,
        currency_id=transaction_data.currency_id,
        currency_code=currency["code"],
        amount=transaction_data.amount,
        exchange_rate=transaction_data.exchange_rate,
        total_idr=total_idr,
        notes=transaction_data.notes,
        delivery_channel=transaction_data.delivery_channel,
        payment_method=transaction_data.payment_method,
        transaction_purpose=transaction_data.transaction_purpose,
        transaction_date=transaction_data.transaction_date or datetime.now(timezone.utc)
    )
    
    transaction_dict = transaction.model_dump()
    transaction_dict["created_at"] = transaction_dict["created_at"].isoformat()
    transaction_dict["transaction_date"] = transaction_dict["transaction_date"].isoformat()
    
    await db.transactions.insert_one(transaction_dict)
    
    entry_type = "debit" if transaction_data.transaction_type == "sell" else "credit"
    cashbook_entry = CashBookEntry(
        branch_id=customer["branch_id"],
        date=transaction.transaction_date,
        entry_type=entry_type,
        amount=total_idr,
        description=f"Transaction {transaction.transaction_number}",
        reference_type="transaction",
        reference_id=transaction.id
    )
    cashbook_dict = cashbook_entry.model_dump()
    cashbook_dict["created_at"] = cashbook_dict["created_at"].isoformat()
    cashbook_dict["date"] = cashbook_dict["date"].isoformat()
    await db.cashbook_entries.insert_one(cashbook_dict)
    
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    branch_id: Optional[str] = None,
    currency_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
    elif branch_id:
        query["branch_id"] = branch_id
    
    if currency_id:
        query["currency_id"] = currency_id
    
    if start_date and end_date:
        query["transaction_date"] = {"$gte": start_date, "$lte": end_date + "T23:59:59Z"}
    elif start_date:
        query["transaction_date"] = {"$gte": start_date}
    elif end_date:
        query["transaction_date"] = {"$lte": end_date + "T23:59:59Z"}
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for transaction in transactions:
        if isinstance(transaction.get("created_at"), str):
            transaction["created_at"] = datetime.fromisoformat(transaction["created_at"])
        if isinstance(transaction.get("transaction_date"), str):
            transaction["transaction_date"] = datetime.fromisoformat(transaction["transaction_date"])
    return transactions

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str, current_user: User = Depends(get_current_user)):
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if current_user.role != UserRole.ADMIN and transaction["branch_id"] != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if isinstance(transaction.get("created_at"), str):
        transaction["created_at"] = datetime.fromisoformat(transaction["created_at"])
    if isinstance(transaction.get("transaction_date"), str):
        transaction["transaction_date"] = datetime.fromisoformat(transaction["transaction_date"])
    return Transaction(**transaction)

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, transaction_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update transactions")
    
    existing = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Get customer and currency info
    customer = await db.customers.find_one({"id": transaction_data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    currency = await db.currencies.find_one({"id": transaction_data.currency_id}, {"_id": 0})
    if not currency:
        raise HTTPException(status_code=404, detail="Currency not found")
    
    total_idr = transaction_data.amount * transaction_data.exchange_rate
    customer_name = customer.get("name") or customer.get("entity_name", "")
    
    update_data = {
        "customer_id": transaction_data.customer_id,
        "customer_name": customer_name,
        "customer_code": customer.get("customer_code"),
        "transaction_type": transaction_data.transaction_type,
        "currency_id": transaction_data.currency_id,
        "currency_code": currency["code"],
        "amount": transaction_data.amount,
        "exchange_rate": transaction_data.exchange_rate,
        "total_idr": total_idr,
        "notes": transaction_data.notes,
        "delivery_channel": transaction_data.delivery_channel,
        "payment_method": transaction_data.payment_method,
        "transaction_purpose": transaction_data.transaction_purpose,
        "voucher_number": transaction_data.voucher_number
    }
    
    await db.transactions.update_one({"id": transaction_id}, {"$set": update_data})
    
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("transaction_date"), str):
        updated["transaction_date"] = datetime.fromisoformat(updated["transaction_date"])
    return Transaction(**updated)

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete transactions")
    
    existing = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Also delete related cashbook entry
    await db.cashbook_entries.delete_one({"reference_id": transaction_id, "reference_type": "transaction"})
    await db.transactions.delete_one({"id": transaction_id})
    
    return {"message": "Transaction deleted successfully"}

# ============= CASHBOOK ENDPOINTS =============

@api_router.get("/cashbook")
async def get_cashbook(branch_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    target_branch_id = None
    
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
        target_branch_id = current_user.branch_id
    elif branch_id:
        query["branch_id"] = branch_id
        target_branch_id = branch_id
    
    entries = await db.cashbook_entries.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for entry in entries:
        if isinstance(entry.get("created_at"), str):
            entry["created_at"] = datetime.fromisoformat(entry["created_at"])
        if isinstance(entry.get("date"), str):
            entry["date"] = datetime.fromisoformat(entry["date"])
    
    # Get opening balance from branch
    opening_balance = 0.0
    if target_branch_id:
        branch = await db.branches.find_one({"id": target_branch_id}, {"_id": 0})
        if branch:
            opening_balance = branch.get("opening_balance", 0.0)
    
    total_debit = sum(e["amount"] for e in entries if e["entry_type"] == "debit")
    total_credit = sum(e["amount"] for e in entries if e["entry_type"] == "credit")
    balance = opening_balance + total_debit - total_credit
    
    return {
        "entries": entries,
        "opening_balance": opening_balance,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "balance": balance
    }

@api_router.post("/cashbook", response_model=CashBookEntry)
async def create_cashbook_entry(entry_data: CashBookEntryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN and entry_data.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    entry = CashBookEntry(**entry_data.model_dump(), date=datetime.now(timezone.utc))
    entry_dict = entry.model_dump()
    entry_dict["created_at"] = entry_dict["created_at"].isoformat()
    entry_dict["date"] = entry_dict["date"].isoformat()
    
    await db.cashbook_entries.insert_one(entry_dict)
    return entry

# ============= MUTASI VALAS ENDPOINTS =============

@api_router.get("/mutasi-valas/calculate")
async def calculate_mutasi_valas(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Calculate mutasi valas from transactions"""
    query = {}
    
    # Branch filter
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
        target_branch_id = current_user.branch_id
    elif branch_id:
        query["branch_id"] = branch_id
        target_branch_id = branch_id
    else:
        target_branch_id = None
    
    # Date filter
    if start_date and end_date:
        query["transaction_date"] = {"$gte": start_date, "$lte": end_date}
    
    # Get all transactions
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    
    # Get all currencies
    currencies = await db.currencies.find({"is_active": True}, {"_id": 0}).to_list(1000)
    
    # Calculate mutasi per currency
    mutasi_data = []
    
    # Get branch opening balances if branch is specified
    branch_currency_balances = {}
    if target_branch_id:
        branch = await db.branches.find_one({"id": target_branch_id}, {"_id": 0})
        if branch:
            branch_currency_balances = branch.get("currency_balances", {})
    
    for currency in currencies:
        currency_code = currency["code"]
        
        # Filter transactions for this currency
        currency_transactions = [
            t for t in transactions 
            if t.get("currency_code") == currency_code
        ]
        
        # Get beginning stock from branch settings, or default to 0
        beginning_stock_valas = float(branch_currency_balances.get(currency_code, 0.0))
        # Calculate IDR equivalent using average market rate (assume purchase rate as baseline)
        beginning_stock_idr = 0.0  # Will be calculated based on first transaction rate if needed
        
        # Skip if no transactions AND no opening balance
        if not currency_transactions and beginning_stock_valas == 0:
            continue
        
        # Calculate purchases (we buy from customer = customer sells to us = type "beli" or "buy")
        purchase_valas = sum(
            t["amount"] for t in currency_transactions 
            if t.get("transaction_type") in ["beli", "buy"]
        )
        purchase_idr = sum(
            t["total_idr"] for t in currency_transactions 
            if t.get("transaction_type") in ["beli", "buy"]
        )
        
        # Calculate sales (we sell to customer = customer buys from us = type "jual" or "sell")
        sale_valas = sum(
            t["amount"] for t in currency_transactions 
            if t.get("transaction_type") in ["jual", "sell"]
        )
        sale_idr = sum(
            t["total_idr"] for t in currency_transactions 
            if t.get("transaction_type") in ["jual", "sell"]
        )
        
        # Calculate ending stock
        ending_stock_valas = beginning_stock_valas + purchase_valas - sale_valas
        ending_stock_idr = beginning_stock_idr + purchase_idr - sale_idr
        
        # Calculate average rate
        avg_rate = 0.0
        if ending_stock_valas != 0:
            avg_rate = abs(ending_stock_idr / ending_stock_valas)
        elif purchase_valas > 0:
            avg_rate = purchase_idr / purchase_valas
        
        # Calculate profit/loss
        profit_loss = sale_idr - (sale_valas * avg_rate) if sale_valas > 0 else 0.0
        
        mutasi_data.append({
            "currency_code": currency_code,
            "currency_name": currency["name"],
            "currency_symbol": currency["symbol"],
            "beginning_stock_valas": beginning_stock_valas,
            "beginning_stock_idr": beginning_stock_idr,
            "purchase_valas": purchase_valas,
            "purchase_idr": purchase_idr,
            "sale_valas": sale_valas,
            "sale_idr": sale_idr,
            "ending_stock_valas": ending_stock_valas,
            "ending_stock_idr": ending_stock_idr,
            "avg_rate": avg_rate,
            "profit_loss": profit_loss,
            "transaction_count": len(currency_transactions)
        })
    
    return mutasi_data

@api_router.get("/mutasi-valas")
async def get_mutasi_valas(branch_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
    elif branch_id:
        query["branch_id"] = branch_id
    
    mutasi = await db.mutasi_valas.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for m in mutasi:
        if isinstance(m.get("created_at"), str):
            m["created_at"] = datetime.fromisoformat(m["created_at"])
        if isinstance(m.get("date"), str):
            m["date"] = datetime.fromisoformat(m["date"])
    return mutasi

# ============= USER MANAGEMENT =============

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can view users")
    
    users = await db.users.find({"is_active": True}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get("created_at"), str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
    return users

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update users")
    
    update_data = {k: v for k, v in user_data.items() if k != "password" and v is not None}
    
    if "password" in user_data and user_data["password"]:
        update_data["password_hash"] = hash_password(user_data["password"])
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return User(**updated)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete users")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ============= DASHBOARD =============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
    
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_iso = today.isoformat()
    
    transactions_today = await db.transactions.count_documents({
        **query,
        "transaction_date": {"$gte": today_iso}
    })
    
    total_customers = await db.customers.count_documents(query)
    
    if current_user.role == UserRole.ADMIN:
        total_branches = await db.branches.count_documents({"is_active": True})
    else:
        total_branches = 1
    
    recent_transactions = await db.transactions.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    for transaction in recent_transactions:
        if isinstance(transaction.get("created_at"), str):
            transaction["created_at"] = datetime.fromisoformat(transaction["created_at"])
        if isinstance(transaction.get("transaction_date"), str):
            transaction["transaction_date"] = datetime.fromisoformat(transaction["transaction_date"])
    
    revenue_pipeline = [
        {"$match": {**query, "transaction_date": {"$gte": today_iso}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_idr"}}}
    ]
    revenue_result = await db.transactions.aggregate(revenue_pipeline).to_list(1)
    total_revenue_today = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_transactions_today": transactions_today,
        "total_revenue_today": total_revenue_today,
        "total_customers": total_customers,
        "total_branches": total_branches,
        "recent_transactions": recent_transactions
    }

# ============= REPORTS =============

@api_router.get("/reports/transactions")
async def get_transaction_report(
    start_date: str,
    end_date: str,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {
        "transaction_date": {
            "$gte": start_date,
            "$lte": end_date
        }
    }
    
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
    elif branch_id:
        query["branch_id"] = branch_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("transaction_date", -1).to_list(10000)
    
    for transaction in transactions:
        if isinstance(transaction.get("created_at"), str):
            transaction["created_at"] = datetime.fromisoformat(transaction["created_at"])
        if isinstance(transaction.get("transaction_date"), str):
            transaction["transaction_date"] = datetime.fromisoformat(transaction["transaction_date"])
    
    total_buy = sum(t["total_idr"] for t in transactions if t["transaction_type"] == "buy")
    total_sell = sum(t["total_idr"] for t in transactions if t["transaction_type"] == "sell")
    total_transactions = len(transactions)
    
    return {
        "transactions": transactions,
        "summary": {
            "total_transactions": total_transactions,
            "total_buy": total_buy,
            "total_sell": total_sell,
            "net_revenue": total_sell - total_buy
        }
    }

# ============= ADVANCED ANALYTICS =============

@api_router.get("/analytics/trends")
async def get_analytics_trends(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
    
    # Last 7 days trend
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = today - timedelta(days=7)
    
    daily_data = []
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        next_day = day + timedelta(days=1)
        
        day_transactions = await db.transactions.find({
            **query,
            "transaction_date": {
                "$gte": day.isoformat(),
                "$lt": next_day.isoformat()
            }
        }, {"_id": 0}).to_list(10000)
        
        revenue = sum(t.get("total_idr", 0) for t in day_transactions if t.get("transaction_type") == "sell")
        count = len(day_transactions)
        
        daily_data.append({
            "date": day.strftime("%Y-%m-%d"),
            "revenue": revenue,
            "transactions": count
        })
    
    # Top currencies
    all_transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    currency_stats = {}
    for t in all_transactions:
        code = t.get("currency_code", "Unknown")
        if code not in currency_stats:
            currency_stats[code] = {"count": 0, "total": 0}
        currency_stats[code]["count"] += 1
        currency_stats[code]["total"] += t.get("total_idr", 0)
    
    top_currencies = sorted(
        [{"currency": k, "count": v["count"], "total": v["total"]} for k, v in currency_stats.items()],
        key=lambda x: x["total"],
        reverse=True
    )[:5]
    
    # Peak hours
    hour_stats = {}
    for t in all_transactions:
        if isinstance(t.get("transaction_date"), str):
            dt = datetime.fromisoformat(t["transaction_date"])
        else:
            dt = t.get("transaction_date")
        
        if dt:
            hour = dt.hour
            hour_stats[hour] = hour_stats.get(hour, 0) + 1
    
    peak_hours = sorted([{"hour": k, "count": v} for k, v in hour_stats.items()], key=lambda x: x["count"], reverse=True)[:5]
    
    # Current vs previous period comparison
    current_period_start = today - timedelta(days=30)
    current_transactions = await db.transactions.find({
        **query,
        "transaction_date": {"$gte": current_period_start.isoformat()}
    }, {"_id": 0}).to_list(10000)
    
    previous_period_start = current_period_start - timedelta(days=30)
    previous_transactions = await db.transactions.find({
        **query,
        "transaction_date": {
            "$gte": previous_period_start.isoformat(),
            "$lt": current_period_start.isoformat()
        }
    }, {"_id": 0}).to_list(10000)
    
    current_revenue = sum(t.get("total_idr", 0) for t in current_transactions if t.get("transaction_type") == "sell")
    previous_revenue = sum(t.get("total_idr", 0) for t in previous_transactions if t.get("transaction_type") == "sell")
    
    revenue_change = ((current_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
    transaction_change = ((len(current_transactions) - len(previous_transactions)) / len(previous_transactions) * 100) if len(previous_transactions) > 0 else 0
    
    return {
        "daily_trend": daily_data,
        "top_currencies": top_currencies,
        "peak_hours": peak_hours,
        "comparison": {
            "current_revenue": current_revenue,
            "previous_revenue": previous_revenue,
            "revenue_change_percent": round(revenue_change, 2),
            "current_transactions": len(current_transactions),
            "previous_transactions": len(previous_transactions),
            "transaction_change_percent": round(transaction_change, 2)
        }
    }

# ============= NOTIFICATIONS =============

@api_router.get("/notifications/recent")
async def get_recent_notifications(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role != UserRole.ADMIN:
        query["branch_id"] = current_user.branch_id
    
    # Get large transactions (> 50 million IDR) from last 24 hours
    yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
    
    large_transactions = await db.transactions.find({
        **query,
        "total_idr": {"$gte": 50000000},
        "transaction_date": {"$gte": yesterday.isoformat()}
    }, {"_id": 0}).sort("transaction_date", -1).limit(10).to_list(10)
    
    notifications = []
    for t in large_transactions:
        if isinstance(t.get("transaction_date"), str):
            t["transaction_date"] = datetime.fromisoformat(t["transaction_date"])
        
        notifications.append({
            "id": t["id"],
            "type": "large_transaction",
            "title": "Transaksi Besar",
            "message": f"Transaksi {t['currency_code']} senilai {t['total_idr']:,.0f} IDR oleh {t['customer_name']}",
            "transaction_id": t["id"],
            "amount": t["total_idr"],
            "timestamp": t["transaction_date"].isoformat()
        })
    
    return notifications

# ============= DATABASE BACKUP =============

@api_router.get("/backup/download")
async def download_backup(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can download backup")
    
    import json
    from fastapi.responses import StreamingResponse
    import io
    
    # Export all collections
    backup_data = {
        "backup_date": datetime.now(timezone.utc).isoformat(),
        "users": await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(10000),
        "branches": await db.branches.find({}, {"_id": 0}).to_list(10000),
        "currencies": await db.currencies.find({}, {"_id": 0}).to_list(10000),
        "customers": await db.customers.find({}, {"_id": 0}).to_list(10000),
        "transactions": await db.transactions.find({}, {"_id": 0}).to_list(10000),
        "cashbook_entries": await db.cashbook_entries.find({}, {"_id": 0}).to_list(10000),
        "mutasi_valas": await db.mutasi_valas.find({}, {"_id": 0}).to_list(10000)
    }
    
    # Convert to JSON
    json_data = json.dumps(backup_data, indent=2, default=str)
    
    # Create file stream
    file_stream = io.BytesIO(json_data.encode())
    
    filename = f"moztec_backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    
    return StreamingResponse(
        file_stream,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ============= COMPANY SETTINGS ENDPOINTS =============

@api_router.get("/settings/company")
async def get_company_settings(current_user: User = Depends(get_current_user)):
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        return CompanySettings().model_dump()
    return settings

@api_router.put("/settings/company")
async def update_company_settings(settings_update: CompanySettingsUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update company settings")
    
    # Get existing or create default
    existing = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    if not existing:
        existing = CompanySettings().model_dump()
    
    # Update only provided fields
    update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.company_settings.update_one(
        {"id": "company_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})

# ============= BRANCH BALANCE ENDPOINTS =============

@api_router.put("/branches/{branch_id}/balances")
async def update_branch_balances(branch_id: str, balance_update: BranchBalanceUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update branch balances")
    
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    update_data = {}
    if balance_update.opening_balance is not None:
        update_data["opening_balance"] = balance_update.opening_balance
    if balance_update.currency_balances is not None:
        update_data["currency_balances"] = balance_update.currency_balances
    
    await db.branches.update_one({"id": branch_id}, {"$set": update_data})
    
    updated = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    return updated

@api_router.get("/branches/{branch_id}/balances")
async def get_branch_balances(branch_id: str, current_user: User = Depends(get_current_user)):
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    return {
        "branch_id": branch_id,
        "branch_name": branch.get("name"),
        "opening_balance": branch.get("opening_balance", 0.0),
        "currency_balances": branch.get("currency_balances", {})
    }

# ============= MULTI-CURRENCY TRANSACTION ENDPOINT =============

@api_router.post("/transactions/multi")
async def create_multi_transaction(transaction_data: MultiTransactionCreate, current_user: User = Depends(get_current_user)):
    """Create multiple transactions for the same customer in one request"""
    
    # Get customer
    customer = await db.customers.find_one({"id": transaction_data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get branch
    branch = await db.branches.find_one({"id": customer["branch_id"]}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Get customer name and code
    customer_name = customer.get("name") or customer.get("entity_name", "")
    customer_code = customer.get("customer_code", "")
    
    # Generate a single voucher number for all transactions in this batch
    batch_voucher = transaction_data.voucher_number or f"MULTI-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    
    created_transactions = []
    
    for item in transaction_data.items:
        # Get currency
        currency = await db.currencies.find_one({"id": item.currency_id}, {"_id": 0})
        if not currency:
            continue
        
        total_idr = item.amount * item.exchange_rate
        
        transaction = Transaction(
            transaction_number=generate_transaction_number(),
            voucher_number=batch_voucher,
            customer_id=transaction_data.customer_id,
            customer_code=customer_code,
            customer_name=customer_name,
            customer_identity_type=customer.get("identity_type", customer.get("entity_type", "")),
            branch_id=customer["branch_id"],
            branch_name=branch["name"],
            user_id=current_user.id,
            accountant_name=current_user.name,
            transaction_type=item.transaction_type,
            currency_id=item.currency_id,
            currency_code=currency["code"],
            amount=item.amount,
            exchange_rate=item.exchange_rate,
            total_idr=total_idr,
            notes=transaction_data.notes,
            delivery_channel=transaction_data.delivery_channel,
            payment_method=transaction_data.payment_method,
            transaction_purpose=transaction_data.transaction_purpose,
            transaction_date=transaction_data.transaction_date or datetime.now(timezone.utc)
        )
        
        await db.transactions.insert_one(transaction.model_dump())
        
        # Create cashbook entry for each transaction
        entry_type = "debit" if item.transaction_type in ["beli", "buy"] else "credit"
        cashbook_entry = CashBookEntry(
            branch_id=customer["branch_id"],
            date=transaction.transaction_date,
            entry_type=entry_type,
            amount=total_idr,
            description=f"{'Pembelian' if entry_type == 'debit' else 'Penjualan'} {currency['code']} - {customer_name}",
            reference_type="transaction",
            reference_id=transaction.id
        )
        await db.cashbook_entries.insert_one(cashbook_entry.model_dump())
        
        created_transactions.append(transaction.model_dump())
    
    return {
        "message": f"Successfully created {len(created_transactions)} transactions",
        "batch_voucher": batch_voucher,
        "transactions": created_transactions
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()