#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class MBAMoneyChangerTester:
    def __init__(self, base_url="https://mullafx.preview.emergentagent.com"):
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
        """Test cashbook endpoint (Buku Kas) - both general and period-specific"""
        # Test general cashbook
        success1, response1 = self.run_test(
            "Get Cashbook (Buku Kas) - General",
            "GET",
            "cashbook",
            200
        )
        if success1:
            entries = response1.get('entries', [])
            print(f"   Found {len(entries)} cashbook entries")
            print(f"   Opening Balance: {response1.get('opening_balance', 0)}")
            print(f"   Total Debit: {response1.get('total_debit', 0)}")
            print(f"   Total Credit: {response1.get('total_credit', 0)}")
            print(f"   Current Balance: {response1.get('balance', 0)}")
        
        # Test period-specific cashbook (today)
        today = datetime.now().strftime('%Y-%m-%d')
        success2, response2 = self.run_test(
            "Get Cashbook (Buku Kas) - Period Specific (Today)",
            "GET",
            f"cashbook?period_date={today}",
            200
        )
        if success2:
            entries = response2.get('entries', [])
            print(f"   Period {today}: Found {len(entries)} entries")
            print(f"   Opening Balance: {response2.get('opening_balance', 0)}")
            print(f"   Total Debit: {response2.get('total_debit', 0)}")
            print(f"   Total Credit: {response2.get('total_credit', 0)}")
            print(f"   Closing Balance: {response2.get('balance', 0)}")
            print(f"   Period Date: {response2.get('period_date', 'N/A')}")
        
        # Test period-specific cashbook (yesterday)
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        success3, response3 = self.run_test(
            "Get Cashbook (Buku Kas) - Period Specific (Yesterday)",
            "GET",
            f"cashbook?period_date={yesterday}",
            200
        )
        if success3:
            entries = response3.get('entries', [])
            print(f"   Period {yesterday}: Found {len(entries)} entries")
            print(f"   Opening Balance: {response3.get('opening_balance', 0)}")
            print(f"   Closing Balance: {response3.get('balance', 0)}")
        
        return success1 and success2 and success3

    def test_mutasi_valas_calculate(self):
        """Test Mutasi Valas calculation with period-based logic"""
        # Test with period_date (today)
        today = datetime.now().strftime('%Y-%m-%d')
        success1, response1 = self.run_test(
            "Mutasi Valas Calculate - Period Date (Today)",
            "GET",
            f"mutasi-valas/calculate?period_date={today}",
            200
        )
        if success1:
            print(f"   Period {today}: Found {len(response1)} currency mutations")
            for mutation in response1[:3]:  # Show first 3
                print(f"   {mutation.get('currency_code')}: Stock Awal {mutation.get('beginning_stock_valas', 0)}, "
                      f"Stock Akhir {mutation.get('ending_stock_valas', 0)}, "
                      f"Avg Rate {mutation.get('avg_rate', 0)}, "
                      f"P/L {mutation.get('profit_loss', 0)}")
        
        # Test with period_date (yesterday)
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        success2, response2 = self.run_test(
            "Mutasi Valas Calculate - Period Date (Yesterday)",
            "GET",
            f"mutasi-valas/calculate?period_date={yesterday}",
            200
        )
        if success2:
            print(f"   Period {yesterday}: Found {len(response2)} currency mutations")
            for mutation in response2[:2]:  # Show first 2
                print(f"   {mutation.get('currency_code')}: Stock Awal {mutation.get('beginning_stock_valas', 0)}, "
                      f"Stock Akhir {mutation.get('ending_stock_valas', 0)}")
        
        # Test with date range (backward compatibility)
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        success3, response3 = self.run_test(
            "Mutasi Valas Calculate - Date Range (Backward Compatible)",
            "GET",
            f"mutasi-valas/calculate?start_date={start_date}&end_date={end_date}",
            200
        )
        if success3:
            print(f"   Date Range {start_date} to {end_date}: Found {len(response3)} currency mutations")
        
        return success1 and success2 and success3

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
        """Test SIPESAT reports with new period-based system"""
        # Test with year and period parameters (new system)
        current_year = datetime.now().year
        
        success, response = self.run_test(
            "SIPESAT Reports (Period-based System)",
            "GET",
            f"reports/sipesat?year={current_year}&period=4",
            200
        )
        if success:
            data = response.get('data', [])
            summary = response.get('summary', {})
            print(f"   Found {len(data)} SIPESAT records")
            print(f"   Summary - Total Nasabah: {summary.get('total_nasabah', 0)}")
            print(f"   Summary - Perorangan: {summary.get('perorangan', 0)}")
            print(f"   Summary - Badan Usaha: {summary.get('badan_usaha', 0)}")
            print(f"   Status: {response.get('status', 'N/A')}")
            print(f"   Is Locked: {response.get('is_locked', False)}")
        return success

    def test_sipesat_status(self):
        """Test SIPESAT status endpoint for all periods"""
        current_year = datetime.now().year
        
        success, response = self.run_test(
            "SIPESAT Status (All Periods)",
            "GET",
            f"reports/sipesat/status?year={current_year}",
            200
        )
        if success:
            print(f"   Status for year {current_year}:")
            for period, status in response.items():
                locked_status = "🔒 Locked" if status.get('locked', False) else "🔓 Unlocked"
                customer_count = status.get('customer_count', 0)
                print(f"   Period {period}: {locked_status} ({customer_count} customers)")
        return success

    def test_activity_logs(self):
        """Test activity logs endpoint (new feature)"""
        success, response = self.run_test(
            "Activity Logs (New Feature)",
            "GET",
            "activity-logs?limit=10",
            200
        )
        if success:
            print(f"   Found {len(response)} activity log entries")
            for log in response[:3]:  # Show first 3
                print(f"   {log.get('timestamp', 'N/A')}: {log.get('user_name', 'Unknown')} - {log.get('action', 'Unknown')}")
        return success

    def test_users_online_status(self):
        """Test users online status endpoint (new feature)"""
        success, response = self.run_test(
            "Users Online Status (New Feature)",
            "GET",
            "users/online-status",
            200
        )
        if success:
            users = response.get('users', [])
            online_count = response.get('online_count', 0)
            total_count = response.get('total_count', 0)
            print(f"   Online Users: {online_count}/{total_count}")
            for user in users[:3]:  # Show first 3
                status = "🟢 Online" if user.get('is_online', False) else "🔴 Offline"
                print(f"   {user.get('name', 'Unknown')}: {status}")
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
        ("SIPESAT Reports (Period-based)", tester.test_reports_sipesat),
        ("SIPESAT Status (All Periods)", tester.test_sipesat_status),
        ("Activity Logs (New Feature)", tester.test_activity_logs),
        ("Users Online Status (New Feature)", tester.test_users_online_status),
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