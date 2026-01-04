from pyspark.sql import SparkSession
from pyspark.sql.functions import col, avg, sum as spark_sum, count, when
import json

# Initialize Spark session (lightweight for demo)
spark = None

def get_spark_session():
    global spark
    if spark is None:
        spark = SparkSession.builder \
            .appName("BankingAnalytics") \
            .master("local[*]") \
            .config("spark.driver.memory", "2g") \
            .getOrCreate()
        spark.sparkContext.setLogLevel("ERROR")
    return spark

def run_spark_transformations(transactions: list, operation: str) -> dict:
    """Run PySpark transformations on transaction data"""
    
    try:
        spark = get_spark_session()
        
        # Convert transactions to Spark DataFrame
        df = spark.createDataFrame(transactions)
        
        result = {"operation": operation, "success": True}
        
        if operation == "aggregate_by_category":
            # Aggregate transactions by category
            agg_df = df.groupBy("category").agg(
                count("*").alias("transaction_count"),
                spark_sum("amount").alias("total_amount"),
                avg("amount").alias("avg_amount")
            ).orderBy(col("total_amount").desc())
            
            result["data"] = [row.asDict() for row in agg_df.collect()]
            result["code"] = """
df.groupBy("category").agg(
    count("*").alias("transaction_count"),
    sum("amount").alias("total_amount"),
    avg("amount").alias("avg_amount")
).orderBy(col("total_amount").desc())
"""
        
        elif operation == "fraud_analysis":
            # Analyze fraud patterns
            fraud_df = df.withColumn(
                "fraud_category",
                when(col("fraud_score") >= 0.8, "High Risk")
                .when(col("fraud_score") >= 0.5, "Medium Risk")
                .otherwise("Low Risk")
            ).groupBy("fraud_category").agg(
                count("*").alias("count"),
                spark_sum("amount").alias("total_amount")
            )
            
            result["data"] = [row.asDict() for row in fraud_df.collect()]
            result["code"] = """
df.withColumn(
    "fraud_category",
    when(col("fraud_score") >= 0.8, "High Risk")
    .when(col("fraud_score") >= 0.5, "Medium Risk")
    .otherwise("Low Risk")
).groupBy("fraud_category").agg(
    count("*").alias("count"),
    sum("amount").alias("total_amount")
)
"""
        
        elif operation == "merchant_performance":
            # Merchant performance analysis
            merchant_df = df.groupBy("merchant_name", "category").agg(
                count("*").alias("transaction_count"),
                spark_sum("amount").alias("total_revenue"),
                avg("amount").alias("avg_transaction")
            ).orderBy(col("total_revenue").desc()).limit(10)
            
            result["data"] = [row.asDict() for row in merchant_df.collect()]
            result["code"] = """
df.groupBy("merchant_name", "category").agg(
    count("*").alias("transaction_count"),
    sum("amount").alias("total_revenue"),
    avg("amount").alias("avg_transaction")
).orderBy(col("total_revenue").desc()).limit(10)
"""
        
        else:
            result["success"] = False
            result["error"] = f"Unknown operation: {operation}"
        
        return result
        
    except Exception as e:
        return {
            "operation": operation,
            "success": False,
            "error": str(e)
        }

async def execute_sql_query(query: str, db) -> dict:
    """Execute SQL-like query on MongoDB data"""
    
    try:
        # For demo, we'll support basic queries
        query_lower = query.lower().strip()
        
        if "select * from transactions" in query_lower:
            limit = 20
            if "limit" in query_lower:
                try:
                    limit = int(query_lower.split("limit")[1].strip())
                except:
                    pass
            
            transactions = await db.transactions.find({}, {"_id": 0}).limit(limit).to_list(limit)
            return {
                "success": True,
                "query": query,
                "result": transactions,
                "count": len(transactions)
            }
        
        elif "select * from merchants" in query_lower:
            merchants = await db.merchants.find({}, {"_id": 0}).limit(20).to_list(20)
            return {
                "success": True,
                "query": query,
                "result": merchants,
                "count": len(merchants)
            }
        
        elif "select * from customers" in query_lower:
            customers = await db.customers.find({}, {"_id": 0}).limit(20).to_list(20)
            return {
                "success": True,
                "query": query,
                "result": customers,
                "count": len(customers)
            }
        
        elif "count" in query_lower and "from transactions" in query_lower:
            count = await db.transactions.count_documents({})
            return {
                "success": True,
                "query": query,
                "result": [{"count": count}],
                "count": 1
            }
        
        else:
            return {
                "success": False,
                "query": query,
                "error": "Query not supported. Try: SELECT * FROM transactions LIMIT 10"
            }
            
    except Exception as e:
        return {
            "success": False,
            "query": query,
            "error": str(e)
        }