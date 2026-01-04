import requests
import sys
import json
from datetime import datetime

class BankingAnalyticsAPITester:
    def __init__(self, base_url="https://amex-fraud-analytics.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:500]
                })
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            self.failed_tests.append({"test": name, "error": "Timeout"})
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({"test": name, "error": str(e)})
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_init_data(self):
        """Test data initialization"""
        return self.run_test("Initialize Data", "POST", "init-data", 200)

    def test_dashboard_overview(self):
        """Test dashboard overview endpoint"""
        return self.run_test("Dashboard Overview", "GET", "dashboard/overview", 200)

    def test_merchant_analytics(self):
        """Test merchant analytics endpoint"""
        return self.run_test("Merchant Analytics", "GET", "merchants/analytics", 200)

    def test_customer_segmentation(self):
        """Test customer segmentation endpoint"""
        return self.run_test("Customer Segmentation", "GET", "customers/segmentation", 200)

    def test_fraud_monitoring(self):
        """Test fraud monitoring endpoint"""
        return self.run_test("Fraud Monitoring", "GET", "fraud/monitor", 200)

    def test_fraud_analysis(self):
        """Test AI fraud analysis with a sample transaction"""
        # First get some fraud transactions
        success, fraud_data = self.test_fraud_monitoring()
        if success and fraud_data.get("fraud_transactions"):
            transaction_id = fraud_data["fraud_transactions"][0]["id"]
            return self.run_test(
                "AI Fraud Analysis", 
                "POST", 
                "fraud/analyze", 
                200,
                {"transaction_id": transaction_id},
                timeout=60  # AI analysis might take longer
            )
        else:
            print("❌ Cannot test fraud analysis - no fraud transactions available")
            return False, {}

    def test_sql_query(self):
        """Test SQL query execution"""
        test_queries = [
            "SELECT * FROM transactions LIMIT 5",
            "SELECT * FROM merchants LIMIT 5", 
            "SELECT * FROM customers LIMIT 5",
            "SELECT COUNT(*) FROM transactions"
        ]
        
        results = []
        for query in test_queries:
            success, data = self.run_test(
                f"SQL Query: {query[:30]}...", 
                "POST", 
                "sql/query", 
                200,
                {"query": query}
            )
            results.append(success)
        
        return all(results), {}

    def test_pyspark_transformations(self):
        """Test PySpark transformations"""
        operations = [
            "aggregate_by_category",
            "fraud_analysis", 
            "merchant_performance"
        ]
        
        results = []
        for operation in operations:
            success, data = self.run_test(
                f"PySpark: {operation}", 
                "POST", 
                "pyspark/transform", 
                200,
                {"operation": operation},
                timeout=45  # PySpark might take longer
            )
            results.append(success)
        
        return all(results), {}

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting Banking Analytics API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Test sequence
        test_methods = [
            self.test_root_endpoint,
            self.test_init_data,
            self.test_dashboard_overview,
            self.test_merchant_analytics,
            self.test_customer_segmentation,
            self.test_fraud_monitoring,
            self.test_fraud_analysis,
            self.test_sql_query,
            self.test_pyspark_transformations
        ]

        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ Test {test_method.__name__} crashed: {str(e)}")
                self.failed_tests.append({
                    "test": test_method.__name__,
                    "error": f"Test crashed: {str(e)}"
                })

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for failure in self.failed_tests:
                print(f"   - {failure['test']}: {failure.get('error', 'Status code mismatch')}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BankingAnalyticsAPITester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())