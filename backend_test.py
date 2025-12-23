#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class MBAMoneyChangerTester:
    def __init__(self, base_url="https://muliabali-fx.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.customer_id = None
        self.transaction_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - {name}")
                print(f"   Expected: {expected_status}, Got: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - {name}")
            print(f"   Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with admin@moztec.com / admin123"""
        success, response = self.run_test(
            "Login dengan admin@moztec.com / admin123",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@moztec.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response.get('user', {})
            print(f"   User: {self.user_data.get('name', 'Unknown')} ({self.user_data.get('role', 'Unknown')})")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET", 
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Total Transactions Today: {response.get('total_transactions_today', 0)}")
            print(f"   Total Revenue Today: {response.get('total_revenue_today', 0)}")
            print(f"   Total Customers: {response.get('total_customers', 0)}")
            print(f"   Total Branches: {response.get('total_branches', 0)}")
        return success

    def test_branches(self):
        """Test branches endpoint"""
        success, response = self.run_test(
            "Get Branches",
            "GET",
            "branches", 
            200
        )
        if success:
            print(f"   Found {len(response)} branches")
        return success

    def test_currencies(self):
        """Test currencies endpoint"""
        success, response = self.run_test(
            "Get Currencies",
            "GET",
            "currencies",
            200
        )
        if success:
            print(f"   Found {len(response)} currencies")
        return success

    def test_customers(self):
        """Test customers endpoint and get customer for transaction testing"""
        success, response = self.run_test(
            "Get Customers",
            "GET",
            "customers",
            200
        )
        if success:
            print(f"   Found {len(response)} customers")
            if response:
                self.customer_id = response[0]['id']
                print(f"   Using customer: {response[0].get('name', response[0].get('entity_name', 'Unknown'))}")
        return success

    def test_customer_transactions(self):
        """Test customer transactions endpoint (for Buku Transaksi)"""
        if not self.customer_id:
            print("❌ No customer ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Customer Transactions (Buku Transaksi)",
            "GET",
            f"customers/{self.customer_id}/transactions",
            200
        )
        if success:
            transactions = response.get('transactions', [])
            ytd_summary = response.get('ytd_summary', {})
            print(f"   Found {len(transactions)} transactions")
            print(f"   YTD Summary - Total: {ytd_summary.get('total_transactions', 0)}")
            print(f"   YTD Summary - Buy: {ytd_summary.get('total_buy_idr', 0)}")
            print(f"   YTD Summary - Sell: {ytd_summary.get('total_sell_idr', 0)}")
        return success

    def test_transactions(self):
        """Test transactions endpoint"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "transactions",
            200
        )
        if success:
            print(f"   Found {len(response)} transactions")
            if response:
                self.transaction_id = response[0]['id']
        return success

    def test_cashbook(self):
        """Test cashbook endpoint (Buku Kas)"""
        success, response = self.run_test(
            "Get Cashbook (Buku Kas)",
            "GET",
            "cashbook",
            200
        )
        if success:
            entries = response.get('entries', [])
            print(f"   Found {len(entries)} cashbook entries")
            print(f"   Opening Balance: {response.get('opening_balance', 0)}")
            print(f"   Total Debit: {response.get('total_debit', 0)}")
            print(f"   Total Credit: {response.get('total_credit', 0)}")
            print(f"   Current Balance: {response.get('balance', 0)}")
        return success

    def test_mutasi_valas_calculate(self):
        """Test Mutasi Valas calculation with new logic"""
        # Test with last 30 days
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Mutasi Valas Calculate (New Logic)",
            "GET",
            f"mutasi-valas/calculate?start_date={start_date}&end_date={end_date}",
            200
        )
        if success:
            print(f"   Found {len(response)} currency mutations")
            for mutation in response[:3]:  # Show first 3
                print(f"   {mutation.get('currency_code')}: Stock Awal {mutation.get('beginning_stock_valas', 0)}, "
                      f"Stock Akhir {mutation.get('ending_stock_valas', 0)}, "
                      f"Avg Rate {mutation.get('avg_rate', 0)}, "
                      f"P/L {mutation.get('profit_loss', 0)}")
        return success

    def test_reports_transactions(self):
        """Test transaction reports"""
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Transaction Reports",
            "GET",
            f"reports/transactions?start_date={start_date}&end_date={end_date}",
            200
        )
        if success:
            transactions = response.get('transactions', [])
            summary = response.get('summary', {})
            print(f"   Found {len(transactions)} transactions in report")
            print(f"   Summary - Total: {summary.get('total_transactions', 0)}")
            print(f"   Summary - Buy: {summary.get('total_buy', 0)}")
            print(f"   Summary - Sell: {summary.get('total_sell', 0)}")
        return success

    def test_reports_sipesat(self):
        """Test SIPESAT reports (new feature)"""
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "SIPESAT Reports (New Feature)",
            "GET",
            f"reports/sipesat?start_date={start_date}&end_date={end_date}",
            200
        )
        if success:
            data = response.get('data', [])
            summary = response.get('summary', {})
            print(f"   Found {len(data)} SIPESAT records")
            print(f"   Summary - Total Nasabah: {summary.get('total_nasabah', 0)}")
            print(f"   Summary - Perorangan: {summary.get('perorangan', 0)}")
            print(f"   Summary - Badan Usaha: {summary.get('badan_usaha', 0)}")
        return success

    def test_company_settings(self):
        """Test company settings endpoint"""
        success, response = self.run_test(
            "Company Settings",
            "GET",
            "settings/company",
            200
        )
        if success:
            print(f"   Company: {response.get('company_name', 'N/A')}")
            print(f"   IDPJK: {response.get('idpjk', 'N/A')}")
        return success

    def test_transaction_detail(self):
        """Test transaction detail endpoint (for clickable references in Buku Kas)"""
        if not self.transaction_id:
            print("❌ No transaction ID available for testing")
            return False
            
        success, response = self.run_test(
            "Transaction Detail (Clickable Reference)",
            "GET",
            f"transactions/{self.transaction_id}",
            200
        )
        if success:
            print(f"   Transaction: {response.get('transaction_number', 'N/A')}")
            print(f"   Customer: {response.get('customer_name', 'N/A')}")
            print(f"   Amount: {response.get('total_idr', 0)}")
        return success

def main():
    print("🚀 Starting MBA Money Changer Backend API Testing")
    print("=" * 60)
    
    tester = MBAMoneyChangerTester()
    
    # Test sequence based on the requirements
    tests = [
        ("Login Authentication", tester.test_login),
        ("Dashboard Statistics", tester.test_dashboard_stats),
        ("Branches Management", tester.test_branches),
        ("Currencies Management", tester.test_currencies),
        ("Customers Management", tester.test_customers),
        ("Customer Transactions (Buku Transaksi)", tester.test_customer_transactions),
        ("Transactions Management", tester.test_transactions),
        ("Transaction Detail (Clickable Reference)", tester.test_transaction_detail),
        ("Cashbook (Buku Kas)", tester.test_cashbook),
        ("Mutasi Valas (New Logic)", tester.test_mutasi_valas_calculate),
        ("Transaction Reports", tester.test_reports_transactions),
        ("SIPESAT Reports (New)", tester.test_reports_sipesat),
        ("Company Settings", tester.test_company_settings),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ EXCEPTION in {test_name}: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"✅ Tests Passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"❌ Tests Failed: {len(failed_tests)}")
    
    if failed_tests:
        print(f"\n🔴 Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n🎉 ALL TESTS PASSED!")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())