import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_data():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if data already exists
    existing_admin = await db.users.find_one({"email": "admin@moztec.com"})
    if existing_admin:
        print("Data sudah ada, skip seeding")
        return
    
    # Create admin user
    admin_id = str(uuid.uuid4())
    admin = {
        "id": admin_id,
        "email": "admin@moztec.com",
        "name": "Administrator",
        "password_hash": pwd_context.hash("admin123"),
        "role": "admin",
        "branch_id": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin)
    print("✓ Admin user created (email: admin@moztec.com, password: admin123)")
    
    # Create branches
    hq_id = str(uuid.uuid4())
    branch1_id = str(uuid.uuid4())
    
    branches = [
        {
            "id": hq_id,
            "name": "Kantor Pusat Denpasar",
            "code": "HQ-DPS",
            "address": "Jl. Sunset Road No. 123, Denpasar, Bali",
            "phone": "+62 361 123456",
            "is_headquarters": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": branch1_id,
            "name": "Cabang Ubud",
            "code": "UBD-01",
            "address": "Jl. Raya Ubud No. 45, Ubud, Bali",
            "phone": "+62 361 789012",
            "is_headquarters": False,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.branches.insert_many(branches)
    print("✓ Branches created")
    
    # Create teller and kasir users
    teller_id = str(uuid.uuid4())
    kasir_id = str(uuid.uuid4())
    
    users = [
        {
            "id": teller_id,
            "email": "teller@moztec.com",
            "name": "Teller HQ",
            "password_hash": pwd_context.hash("teller123"),
            "role": "teller",
            "branch_id": hq_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": kasir_id,
            "email": "kasir@moztec.com",
            "name": "Kasir HQ",
            "password_hash": pwd_context.hash("kasir123"),
            "role": "kasir",
            "branch_id": hq_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.users.insert_many(users)
    print("✓ Teller and Kasir users created")
    
    # Create currencies
    currencies = [
        {"id": str(uuid.uuid4()), "code": "USD", "name": "US Dollar", "symbol": "$", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "EUR", "name": "Euro", "symbol": "€", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "AUD", "name": "Australian Dollar", "symbol": "A$", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "SGD", "name": "Singapore Dollar", "symbol": "S$", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "JPY", "name": "Japanese Yen", "symbol": "¥", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "CNY", "name": "Chinese Yuan", "symbol": "¥", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "GBP", "name": "British Pound", "symbol": "£", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "CHF", "name": "Swiss Franc", "symbol": "CHF", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "KRW", "name": "South Korean Won", "symbol": "₩", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "HKD", "name": "Hong Kong Dollar", "symbol": "HK$", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.currencies.insert_many(currencies)
    print("✓ Currencies created")
    
    # Create sample customers
    customers = [
        {
            "id": str(uuid.uuid4()),
            "name": "John Doe",
            "identity_number": "1234567890",
            "phone": "+62 812 3456 7890",
            "email": "john@example.com",
            "address": "Jl. Kuta Beach No. 10, Kuta, Bali",
            "branch_id": hq_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Jane Smith",
            "identity_number": "0987654321",
            "phone": "+62 813 9876 5432",
            "email": "jane@example.com",
            "address": "Jl. Legian No. 20, Legian, Bali",
            "branch_id": hq_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.customers.insert_many(customers)
    print("✓ Sample customers created")
    
    print("\n=== SEED DATA COMPLETED ===")
    print("Admin login:")
    print("  Email: admin@moztec.com")
    print("  Password: admin123")
    print("\nTeller login:")
    print("  Email: teller@moztec.com")
    print("  Password: teller123")
    print("\nKasir login:")
    print("  Email: kasir@moztec.com")
    print("  Password: kasir123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
