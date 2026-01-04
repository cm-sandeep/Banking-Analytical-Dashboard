from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone, timedelta
import asyncio
from mock_data_generator import generate_mock_data
from fraud_detector import analyze_fraud_with_gemini
from spark_processor import run_spark_transformations, execute_sql_query

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    merchant_id: str
    merchant_name: str
    amount: float
    transaction_date: str
    category: str
    location: str
    is_fraudulent: bool = False
    fraud_score: float = 0.0

class Merchant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    total_transactions: int = 0
    total_revenue: float = 0.0
    offer_performance: float = 0.0
    avg_transaction: float = 0.0

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    segment: str
    total_spent: float = 0.0
    transaction_count: int = 0
    risk_score: float = 0.0
    join_date: str

class FraudAnalysisRequest(BaseModel):
    transaction_id: str

class SQLQueryRequest(BaseModel):
    query: str

class PySparkRequest(BaseModel):
    operation: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "AMEX Banking Analytics API"}

@api_router.post("/init-data")
async def initialize_data():
    """Initialize database with mock data"""
    try:
        # Check if data already exists
        existing_count = await db.transactions.count_documents({})
        if existing_count > 0:
            return {"message": "Data already initialized", "count": existing_count}
        
        # Generate mock data
        data = generate_mock_data()
        
        # Insert into MongoDB
        if data["transactions"]:
            await db.transactions.insert_many([t for t in data["transactions"]])
        if data["merchants"]:
            await db.merchants.insert_many([m for m in data["merchants"]])
        if data["customers"]:
            await db.customers.insert_many([c for c in data["customers"]])
        
        return {
            "message": "Mock data initialized successfully",
            "transactions": len(data["transactions"]),
            "merchants": len(data["merchants"]),
            "customers": len(data["customers"])
        }
    except Exception as e:
        logging.error(f"Error initializing data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/dashboard/overview")
async def get_dashboard_overview():
    """Get dashboard overview with key metrics"""
    try:
        # Calculate metrics
        total_transactions = await db.transactions.count_documents({})
        transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
        
        if not transactions:
            return {
                "total_transactions": 0,
                "total_revenue": 0,
                "fraud_alerts": 0,
                "active_merchants": 0,
                "avg_transaction_value": 0,
                "fraud_rate": 0,
                "recent_transactions": [],
                "revenue_trend": []
            }
        
        total_revenue = sum(t.get("amount", 0) for t in transactions)
        fraud_alerts = sum(1 for t in transactions if t.get("is_fraudulent", False))
        active_merchants = await db.merchants.count_documents({})
        avg_transaction_value = total_revenue / total_transactions if total_transactions > 0 else 0
        fraud_rate = (fraud_alerts / total_transactions * 100) if total_transactions > 0 else 0
        
        # Get recent transactions
        recent_transactions = sorted(transactions, key=lambda x: x.get("transaction_date", ""), reverse=True)[:10]
        
        # Revenue trend (last 7 days)
        revenue_trend = []
        for i in range(7):
            date = (datetime.now(timezone.utc) - timedelta(days=6-i)).strftime("%Y-%m-%d")
            day_revenue = sum(t.get("amount", 0) for t in transactions if t.get("transaction_date", "").startswith(date))
            revenue_trend.append({"date": date, "revenue": round(day_revenue, 2)})
        
        return {
            "total_transactions": total_transactions,
            "total_revenue": round(total_revenue, 2),
            "fraud_alerts": fraud_alerts,
            "active_merchants": active_merchants,
            "avg_transaction_value": round(avg_transaction_value, 2),
            "fraud_rate": round(fraud_rate, 2),
            "recent_transactions": recent_transactions[:5],
            "revenue_trend": revenue_trend
        }
    except Exception as e:
        logging.error(f"Error getting dashboard overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/merchants/analytics")
async def get_merchant_analytics():
    """Get merchant analytics and performance data"""
    try:
        merchants = await db.merchants.find({}, {"_id": 0}).to_list(1000)
        transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
        
        # Calculate merchant performance
        merchant_stats = []
        for merchant in merchants:
            merchant_txns = [t for t in transactions if t.get("merchant_id") == merchant.get("id")]
            total_revenue = sum(t.get("amount", 0) for t in merchant_txns)
            txn_count = len(merchant_txns)
            avg_txn = total_revenue / txn_count if txn_count > 0 else 0
            
            merchant_stats.append({
                **merchant,
                "total_transactions": txn_count,
                "total_revenue": round(total_revenue, 2),
                "avg_transaction": round(avg_txn, 2),
                "offer_performance": round(merchant.get("offer_performance", 0), 2)
            })
        
        # Sort by revenue
        merchant_stats = sorted(merchant_stats, key=lambda x: x["total_revenue"], reverse=True)
        
        # Category breakdown
        category_breakdown = {}
        for m in merchant_stats:
            cat = m.get("category", "Other")
            if cat not in category_breakdown:
                category_breakdown[cat] = {"count": 0, "revenue": 0}
            category_breakdown[cat]["count"] += 1
            category_breakdown[cat]["revenue"] += m["total_revenue"]
        
        return {
            "merchants": merchant_stats[:20],
            "category_breakdown": category_breakdown,
            "top_performers": merchant_stats[:5]
        }
    except Exception as e:
        logging.error(f"Error getting merchant analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers/segmentation")
async def get_customer_segmentation():
    """Get customer segmentation analysis"""
    try:
        customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
        transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
        
        # Calculate customer stats
        customer_stats = []
        for customer in customers:
            customer_txns = [t for t in transactions if t.get("customer_id") == customer.get("id")]
            total_spent = sum(t.get("amount", 0) for t in customer_txns)
            txn_count = len(customer_txns)
            
            customer_stats.append({
                **customer,
                "total_spent": round(total_spent, 2),
                "transaction_count": txn_count,
                "avg_transaction": round(total_spent / txn_count, 2) if txn_count > 0 else 0
            })
        
        # Segment breakdown
        segment_breakdown = {}
        for c in customer_stats:
            seg = c.get("segment", "Other")
            if seg not in segment_breakdown:
                segment_breakdown[seg] = {"count": 0, "total_spent": 0, "avg_spent": 0}
            segment_breakdown[seg]["count"] += 1
            segment_breakdown[seg]["total_spent"] += c["total_spent"]
        
        for seg in segment_breakdown:
            if segment_breakdown[seg]["count"] > 0:
                segment_breakdown[seg]["avg_spent"] = round(
                    segment_breakdown[seg]["total_spent"] / segment_breakdown[seg]["count"], 2
                )
        
        return {
            "customers": customer_stats[:50],
            "segment_breakdown": segment_breakdown,
            "total_customers": len(customer_stats)
        }
    except Exception as e:
        logging.error(f"Error getting customer segmentation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/fraud/monitor")
async def get_fraud_monitoring():
    """Get fraud monitoring data and alerts"""
    try:
        transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
        
        # Filter fraudulent transactions
        fraud_transactions = [t for t in transactions if t.get("is_fraudulent", False) or t.get("fraud_score", 0) > 0.7]
        fraud_transactions = sorted(fraud_transactions, key=lambda x: x.get("fraud_score", 0), reverse=True)
        
        # Fraud statistics
        total_fraud_amount = sum(t.get("amount", 0) for t in fraud_transactions)
        fraud_by_category = {}
        fraud_by_location = {}
        
        for t in fraud_transactions:
            cat = t.get("category", "Other")
            loc = t.get("location", "Unknown")
            
            if cat not in fraud_by_category:
                fraud_by_category[cat] = {"count": 0, "amount": 0}
            fraud_by_category[cat]["count"] += 1
            fraud_by_category[cat]["amount"] += t.get("amount", 0)
            
            if loc not in fraud_by_location:
                fraud_by_location[loc] = {"count": 0, "amount": 0}
            fraud_by_location[loc]["count"] += 1
            fraud_by_location[loc]["amount"] += t.get("amount", 0)
        
        return {
            "fraud_transactions": fraud_transactions[:20],
            "total_fraud_count": len(fraud_transactions),
            "total_fraud_amount": round(total_fraud_amount, 2),
            "fraud_by_category": fraud_by_category,
            "fraud_by_location": fraud_by_location,
            "high_risk_transactions": [t for t in fraud_transactions if t.get("fraud_score", 0) > 0.8][:5]
        }
    except Exception as e:
        logging.error(f"Error getting fraud monitoring: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fraud/analyze")
async def analyze_fraud(request: FraudAnalysisRequest):
    """Analyze a specific transaction for fraud using Gemini AI"""
    try:
        # Get transaction
        transaction = await db.transactions.find_one(
            {"id": request.transaction_id},
            {"_id": 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Analyze with Gemini
        analysis = await analyze_fraud_with_gemini(transaction)
        
        return {
            "transaction": transaction,
            "analysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error analyzing fraud: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/sql/query")
async def execute_sql(request: SQLQueryRequest):
    """Execute SQL query on transaction data"""
    try:
        result = await execute_sql_query(request.query, db)
        return result
    except Exception as e:
        logging.error(f"Error executing SQL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/pyspark/transform")
async def run_pyspark(request: PySparkRequest):
    """Run PySpark transformation"""
    try:
        transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
        result = run_spark_transformations(transactions, request.operation)
        return result
    except Exception as e:
        logging.error(f"Error running PySpark: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()