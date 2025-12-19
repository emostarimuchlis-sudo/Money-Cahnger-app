import requests
import sys
import json
from datetime import datetime, timezone

class MOZTECAPITester:
    def __init__(self, base_url="https://moztec-finance.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.teller_token = None
        self.kasir_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Store created IDs for cleanup and testing
        self.created_branch_id = None
        self.created_currency_id = None
        self.created_customer_id = None
        self.created_transaction_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, token=None, expected_status=None):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            if expected_status and response.status_code != expected_status:
                return False, f"Expected {expected_status}, got {response.status_code}: {response.text}"
            
            return True, response.json() if response.status_code < 400 else response.text
            
        except requests.exceptions.Timeout:
            return False, "Request timeout"
        except requests.exceptions.ConnectionError:
            return False, "Connection error"
        except Exception as e:
            return False, f"Request error: {str(e)}"

    def test_login(self, email, password, role_name):
        """Test login functionality"""
        success, response = self.make_request(
            'POST', 'auth/login', 
            {'email': email, 'password': password}, 
            expected_status=200
        )
        
        if success and 'token' in response:
            token = response['token']
            user = response.get('user', {})
            
            # Store tokens for different roles
            if user.get('role') == 'admin':
                self.admin_token = token
            elif user.get('role') == 'teller':
                self.teller_token = token
            elif user.get('role') == 'kasir':
                self.kasir_token = token
            
            self.log_test(f"Login {role_name}", True)
            return True, token
        else:
            self.log_test(f"Login {role_name}", False, str(response))
            return False, None

    def test_dashboard_stats(self, token, role_name):
        """Test dashboard stats endpoint"""
        success, response = self.make_request('GET', 'dashboard/stats', token=token, expected_status=200)
        
        if success:
            required_fields = ['total_transactions_today', 'total_revenue_today', 'total_customers', 'total_branches']
            has_all_fields = all(field in response for field in required_fields)
            self.log_test(f"Dashboard stats ({role_name})", has_all_fields, 
                         "Missing required fields" if not has_all_fields else "")
            return has_all_fields
        else:
            self.log_test(f"Dashboard stats ({role_name})", False, str(response))
            return False

    def test_branch_management(self):
        """Test branch CRUD operations (admin only)"""
        if not self.admin_token:
            self.log_test("Branch Management", False, "No admin token available")
            return False

        # Create branch
        branch_data = {
            "name": "Test Branch",
            "code": "TST001",
            "address": "Test Address",
            "phone": "081234567890",
            "is_headquarters": False
        }
        
        success, response = self.make_request('POST', 'branches', branch_data, self.admin_token, 200)
        if success:
            self.created_branch_id = response.get('id')
            self.log_test("Create Branch", True)
        else:
            self.log_test("Create Branch", False, str(response))
            return False

        # Get branches
        success, response = self.make_request('GET', 'branches', token=self.admin_token, expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Branches", True)
        else:
            self.log_test("Get Branches", False, str(response))

        # Update branch
        if self.created_branch_id:
            update_data = {
                "name": "Updated Test Branch",
                "code": "TST001",
                "address": "Updated Address",
                "phone": "081234567890"
            }
            success, response = self.make_request('PUT', f'branches/{self.created_branch_id}', 
                                                update_data, self.admin_token, 200)
            self.log_test("Update Branch", success, str(response) if not success else "")

        return True

    def test_currency_management(self):
        """Test currency CRUD operations (admin only)"""
        if not self.admin_token:
            self.log_test("Currency Management", False, "No admin token available")
            return False

        # Create currency
        currency_data = {
            "code": "TST",
            "name": "Test Currency",
            "symbol": "T$"
        }
        
        success, response = self.make_request('POST', 'currencies', currency_data, self.admin_token, 200)
        if success:
            self.created_currency_id = response.get('id')
            self.log_test("Create Currency", True)
        else:
            self.log_test("Create Currency", False, str(response))
            return False

        # Get currencies
        success, response = self.make_request('GET', 'currencies', token=self.admin_token, expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Currencies", True)
        else:
            self.log_test("Get Currencies", False, str(response))

        return True

    def test_customer_management(self, token, role_name):
        """Test customer CRUD operations with extended fields"""
        # Get branches first to use in customer creation
        success, branches = self.make_request('GET', 'branches', token=token, expected_status=200)
        if not success or not branches:
            self.log_test(f"Customer Management ({role_name}) - Get Branches", False, "No branches available")
            return False

        branch_id = branches[0]['id']

        # Create customer with extended fields (JK, Alamat, Pekerjaan)
        customer_data = {
            "customer_type": "perorangan",
            "name": "Test Customer",
            "gender": "L",  # JK field
            "identity_type": "KTP",
            "identity_number": "1234567890123456",
            "phone": "081234567890",
            "occupation": "Software Engineer",  # Pekerjaan field
            "domicile_address": "Jl. Test No. 123, Jakarta",  # Alamat field
            "identity_address": "Jl. Test No. 123, Jakarta",
            "branch_id": branch_id,
            "birth_place": "Jakarta",
            "birth_date": "1990-01-01",
            "fund_source": "Gaji",
            "is_pep": False
        }
        
        success, response = self.make_request('POST', 'customers', customer_data, token, 200)
        if success:
            self.created_customer_id = response.get('id')
            # Verify extended fields are present
            if all(field in response for field in ['gender', 'occupation', 'domicile_address']):
                self.log_test(f"Create Customer with Extended Fields ({role_name})", True)
            else:
                self.log_test(f"Create Customer with Extended Fields ({role_name})", False, "Missing extended fields")
        else:
            self.log_test(f"Create Customer with Extended Fields ({role_name})", False, str(response))
            return False

        # Get customers
        success, response = self.make_request('GET', 'customers', token=token, expected_status=200)
        if success and isinstance(response, list):
            self.log_test(f"Get Customers ({role_name})", True)
        else:
            self.log_test(f"Get Customers ({role_name})", False, str(response))

        return True

    def test_customer_ytd_transactions(self, token, role_name):
        """Test customer YTD transactions endpoint"""
        if not self.created_customer_id:
            self.log_test(f"Customer YTD Transactions ({role_name})", False, "No customer ID available")
            return False

        success, response = self.make_request('GET', f'customers/{self.created_customer_id}/transactions', 
                                            token=token, expected_status=200)
        
        if success and 'customer' in response and 'transactions' in response and 'ytd_summary' in response:
            ytd_summary = response['ytd_summary']
            required_ytd_fields = ['total_transactions', 'total_buy_idr', 'total_sell_idr', 'net_total_idr']
            if all(field in ytd_summary for field in required_ytd_fields):
                self.log_test(f"Customer YTD Transactions ({role_name})", True)
            else:
                self.log_test(f"Customer YTD Transactions ({role_name})", False, "Missing YTD summary fields")
        else:
            self.log_test(f"Customer YTD Transactions ({role_name})", False, str(response))

        return True

    def test_transaction_management(self, token, role_name):
        """Test transaction CRUD operations"""
        if not self.created_customer_id or not self.created_currency_id:
            self.log_test(f"Transaction Management ({role_name})", False, "Missing customer or currency")
            return False

        # Create transaction with new transaction_purpose field
        transaction_data = {
            "customer_id": self.created_customer_id,
            "transaction_type": "jual",
            "currency_id": self.created_currency_id,
            "amount": 100.0,
            "exchange_rate": 15000.0,
            "notes": "Test transaction",
            "transaction_purpose": "traveling",
            "voucher_number": "VCH001",
            "delivery_channel": "kantor_kupva",
            "payment_method": "cash"
        }
        
        success, response = self.make_request('POST', 'transactions', transaction_data, token, 200)
        if success:
            self.created_transaction_id = response.get('id')
            self.log_test(f"Create Transaction with Purpose ({role_name})", True)
        else:
            self.log_test(f"Create Transaction with Purpose ({role_name})", False, str(response))
            return False

        # Test transaction filters
        success, response = self.make_request('GET', 'transactions', token=token, expected_status=200)
        if success and isinstance(response, list):
            self.log_test(f"Get Transactions ({role_name})", True)
        else:
            self.log_test(f"Get Transactions ({role_name})", False, str(response))

        # Test transaction filters with parameters
        if self.created_branch_id and self.created_currency_id:
            filter_params = f"?branch_id={self.created_branch_id}&currency_id={self.created_currency_id}&start_date=2024-01-01&end_date=2024-12-31"
            success, response = self.make_request('GET', f'transactions{filter_params}', token=token, expected_status=200)
            self.log_test(f"Get Transactions with Filters ({role_name})", success, str(response) if not success else "")

        return True

    def test_transaction_admin_operations(self):
        """Test admin-only transaction operations (PUT/DELETE)"""
        if not self.admin_token or not self.created_transaction_id:
            self.log_test("Transaction Admin Operations", False, "Missing admin token or transaction ID")
            return False

        # Test UPDATE transaction (admin only)
        update_data = {
            "customer_id": self.created_customer_id,
            "transaction_type": "beli",
            "currency_id": self.created_currency_id,
            "amount": 150.0,
            "exchange_rate": 15500.0,
            "notes": "Updated test transaction",
            "transaction_purpose": "bisnis"
        }
        
        success, response = self.make_request('PUT', f'transactions/{self.created_transaction_id}', 
                                            update_data, self.admin_token, 200)
        self.log_test("Update Transaction (Admin Only)", success, str(response) if not success else "")

        # Test DELETE transaction (admin only)
        success, response = self.make_request('DELETE', f'transactions/{self.created_transaction_id}', 
                                            token=self.admin_token, expected_status=200)
        self.log_test("Delete Transaction (Admin Only)", success, str(response) if not success else "")
        
        if success:
            self.created_transaction_id = None  # Clear since it's deleted

        return True

    def test_cashbook(self, token, role_name):
        """Test cashbook operations"""
        # Get cashbook entries
        success, response = self.make_request('GET', 'cashbook', token=token, expected_status=200)
        if success and 'entries' in response:
            self.log_test(f"Get Cashbook ({role_name})", True)
        else:
            self.log_test(f"Get Cashbook ({role_name})", False, str(response))

    def test_mutasi_valas(self, token, role_name):
        """Test mutasi valas operations"""
        success, response = self.make_request('GET', 'mutasi-valas', token=token, expected_status=200)
        if success and isinstance(response, list):
            self.log_test(f"Get Mutasi Valas ({role_name})", True)
        else:
            self.log_test(f"Get Mutasi Valas ({role_name})", False, str(response))

    def test_reports(self, token, role_name):
        """Test reports functionality"""
        start_date = "2024-01-01T00:00:00Z"
        end_date = "2024-12-31T23:59:59Z"
        
        success, response = self.make_request('GET', f'reports/transactions?start_date={start_date}&end_date={end_date}', 
                                            token=token, expected_status=200)
        if success and 'transactions' in response and 'summary' in response:
            self.log_test(f"Get Reports ({role_name})", True)
        else:
            self.log_test(f"Get Reports ({role_name})", False, str(response))

    def test_user_management(self):
        """Test user management (admin only)"""
        if not self.admin_token:
            self.log_test("User Management", False, "No admin token available")
            return False

        # Get users
        success, response = self.make_request('GET', 'users', token=self.admin_token, expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Users", True)
        else:
            self.log_test("Get Users", False, str(response))

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting MOZTEC API Testing...")
        print(f"📍 Testing endpoint: {self.base_url}")
        print("=" * 60)

        # Test authentication for all roles
        print("\n📋 Testing Authentication...")
        admin_success, admin_token = self.test_login("admin@moztec.com", "admin123", "Admin")
        teller_success, teller_token = self.test_login("teller@moztec.com", "teller123", "Teller")
        kasir_success, kasir_token = self.test_login("kasir@moztec.com", "kasir123", "Kasir")

        if not any([admin_success, teller_success, kasir_success]):
            print("❌ All login attempts failed. Cannot proceed with testing.")
            return False

        # Test dashboard for all authenticated users
        print("\n📊 Testing Dashboard...")
        if admin_token:
            self.test_dashboard_stats(admin_token, "Admin")
        if teller_token:
            self.test_dashboard_stats(teller_token, "Teller")
        if kasir_token:
            self.test_dashboard_stats(kasir_token, "Kasir")

        # Test admin-only features
        if admin_token:
            print("\n🏢 Testing Admin Features...")
            self.test_branch_management()
            self.test_currency_management()
            self.test_user_management()

        # Test CRUD operations for different roles
        print("\n👥 Testing Customer Management...")
        if admin_token:
            self.test_customer_management(admin_token, "Admin")
        if teller_token:
            self.test_customer_management(teller_token, "Teller")

        print("\n💰 Testing Transaction Management...")
        if admin_token and self.created_customer_id and self.created_currency_id:
            self.test_transaction_management(admin_token, "Admin")

        # Test other features
        print("\n📚 Testing Other Features...")
        if admin_token:
            self.test_cashbook(admin_token, "Admin")
            self.test_mutasi_valas(admin_token, "Admin")
            self.test_reports(admin_token, "Admin")

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = MOZTECAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())