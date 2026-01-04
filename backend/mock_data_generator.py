from faker import Faker
import random
from datetime import datetime, timedelta, timezone
import uuid

fake = Faker()

CATEGORIES = ["Retail", "Dining", "Travel", "Entertainment", "Gas", "Groceries", "Online Shopping", "Healthcare"]
SEGMENTS = ["Premium", "Standard", "Basic", "VIP"]
LOCATIONS = ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "San Francisco, CA", "Miami, FL", "Seattle, WA"]

def generate_mock_data():
    """Generate mock banking data for demonstration"""
    
    # Generate merchants
    merchants = []
    for i in range(50):
        merchants.append({
            "id": str(uuid.uuid4()),
            "name": fake.company(),
            "category": random.choice(CATEGORIES),
            "offer_performance": round(random.uniform(60, 95), 2)
        })
    
    # Generate customers
    customers = []
    for i in range(200):
        customers.append({
            "id": str(uuid.uuid4()),
            "name": fake.name(),
            "email": fake.email(),
            "segment": random.choice(SEGMENTS),
            "risk_score": round(random.uniform(0, 1), 2),
            "join_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d")
        })
    
    # Generate transactions
    transactions = []
    for i in range(2000):
        customer = random.choice(customers)
        merchant = random.choice(merchants)
        amount = round(random.uniform(10, 5000), 2)
        
        # Randomly mark some as fraudulent (5% fraud rate)
        is_fraudulent = random.random() < 0.05
        fraud_score = round(random.uniform(0.8, 1.0), 2) if is_fraudulent else round(random.uniform(0, 0.3), 2)
        
        transactions.append({
            "id": str(uuid.uuid4()),
            "customer_id": customer["id"],
            "merchant_id": merchant["id"],
            "merchant_name": merchant["name"],
            "amount": amount,
            "transaction_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))).isoformat(),
            "category": merchant["category"],
            "location": random.choice(LOCATIONS),
            "is_fraudulent": is_fraudulent,
            "fraud_score": fraud_score
        })
    
    return {
        "transactions": transactions,
        "merchants": merchants,
        "customers": customers
    }