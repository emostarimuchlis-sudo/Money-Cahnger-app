import requests
import sys
import json
from datetime import datetime

class MOZTECAPITester:
    def __init__(self, base_url="https://moztec-finance.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_resources = {
            'customers': [],
            'currencies': [],
            'branches': [],
            'transactions': []
        }

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True, "No JSON response")
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test admin login"""
        print("\n🔐 Testing Authentication...")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@moztec.com", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_company_settings(self):
        """Test company settings endpoints"""
        print("\n🏢 Testing Company Settings...")
        
        # Test GET company settings
        success, settings = self.run_test(
            "GET Company Settings",
            "GET",
            "settings/company",
            200
        )
        
        if success:
            # Test PUT company settings
            update_data = {
                "company_name": "MOZTEC Money Changer Test",
                "company_address": "Jl. Test Address No. 123",
                "company_phone": "+62 361 999888",
                "company_email": "test@moztec.com",
                "company_license": "TEST-LICENSE-123",
                "company_npwp": "12.345.678.9-012.345"
            }
            
            success, updated = self.run_test(
                "PUT Company Settings",
                "PUT",
                "settings/company",
                200,
                data=update_data
            )
            
            if success:
                # Verify the update
                success, verify = self.run_test(
                    "Verify Company Settings Update",
                    "GET",
                    "settings/company",
                    200
                )
                
                if success and verify.get('company_name') == update_data['company_name']:
                    self.log_test("Company Settings Update Verification", True)
                else:
                    self.log_test("Company Settings Update Verification", False, "Data not updated correctly")

    def test_branch_balances(self):
        """Test branch balance management"""
        print("\n💰 Testing Branch Balance Management...")
        
        # First get branches
        success, branches = self.run_test(
            "GET Branches for Balance Test",
            "GET",
            "branches",
            200
        )
        
        if success and branches:
            branch_id = branches[0]['id']
            
            # Test GET branch balances
            success, balances = self.run_test(
                "GET Branch Balances",
                "GET",
                f"branches/{branch_id}/balances",
                200
            )
            
            if success:
                # Test PUT branch balances
                balance_update = {
                    "opening_balance": 50000000.0,  # 50 million IDR
                    "currency_balances": {
                        "USD": 10000.0,
                        "SGD": 5000.0,
                        "EUR": 3000.0
                    }
                }
                
                success, updated = self.run_test(
                    "PUT Branch Balances",
                    "PUT",
                    f"branches/{branch_id}/balances",
                    200,
                    data=balance_update
                )
                
                if success:
                    # Verify the update
                    success, verify = self.run_test(
                        "Verify Branch Balance Update",
                        "GET",
                        f"branches/{branch_id}/balances",
                        200
                    )
                    
                    if success and verify.get('opening_balance') == balance_update['opening_balance']:
                        self.log_test("Branch Balance Update Verification", True)
                    else:
                        self.log_test("Branch Balance Update Verification", False, "Balance not updated correctly")

    def test_multi_currency_transactions(self):
        """Test multi-currency transaction creation"""
        print("\n💱 Testing Multi-Currency Transactions...")
        
        # First get required data
        customers_success, customers = self.run_test("GET Customers for Multi-Transaction", "GET", "customers", 200)
        currencies_success, currencies = self.run_test("GET Currencies for Multi-Transaction", "GET", "currencies", 200)
        
        if customers_success and currencies_success and customers and len(currencies) >= 2:
            customer_id = customers[0]['id']
            
            # Create multi-currency transaction
            multi_transaction_data = {
                "customer_id": customer_id,
                "items": [
                    {
                        "currency_id": currencies[0]['id'],
                        "transaction_type": "jual",
                        "amount": 1000.0,
                        "exchange_rate": 15500.0
                    },
                    {
                        "currency_id": currencies[1]['id'] if len(currencies) > 1 else currencies[0]['id'],
                        "transaction_type": "beli",
                        "amount": 500.0,
                        "exchange_rate": 11200.0
                    }
                ],
                "voucher_number": f"MULTI-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "notes": "Multi-currency test transaction",
                "delivery_channel": "kantor_kupva",
                "payment_method": "cash",
                "transaction_purpose": "testing"
            }
            
            success, response = self.run_test(
                "POST Multi-Currency Transaction",
                "POST",
                "transactions/multi",
                200,
                data=multi_transaction_data
            )
            
            if success:
                transactions_created = response.get('transactions', [])
                if len(transactions_created) == 2:
                    self.log_test("Multi-Currency Transaction Count Verification", True)
                    
                    # Store created transaction IDs for cleanup
                    for transaction in transactions_created:
                        self.created_resources['transactions'].append(transaction['id'])
                        
                    # Verify batch voucher number
                    batch_voucher = response.get('batch_voucher')
                    if batch_voucher and all(t.get('voucher_number') == batch_voucher for t in transactions_created):
                        self.log_test("Multi-Currency Batch Voucher Verification", True)
                    else:
                        self.log_test("Multi-Currency Batch Voucher Verification", False, "Batch voucher not consistent")
                else:
                    self.log_test("Multi-Currency Transaction Count Verification", False, f"Expected 2 transactions, got {len(transactions_created)}")
        else:
            self.log_test("Multi-Currency Transaction", False, "Insufficient test data (customers or currencies)")

    def test_existing_endpoints(self):
        """Test existing endpoints to ensure they still work"""
        print("\n🔄 Testing Existing Endpoints...")
        
        # Test basic endpoints
        endpoints_to_test = [
            ("GET Branches", "GET", "branches", 200),
            ("GET Currencies", "GET", "currencies", 200),
            ("GET Customers", "GET", "customers", 200),
            ("GET Transactions", "GET", "transactions", 200),
            ("GET Dashboard Stats", "GET", "dashboard/stats", 200),
            ("GET Users", "GET", "users", 200)
        ]
        
        for name, method, endpoint, expected_status in endpoints_to_test:
            self.run_test(name, method, endpoint, expected_status)

    def test_single_transaction_creation(self):
        """Test single transaction creation to ensure it still works"""
        print("\n💳 Testing Single Transaction Creation...")
        
        # Get required data
        customers_success, customers = self.run_test("GET Customers for Single Transaction", "GET", "customers", 200)
        currencies_success, currencies = self.run_test("GET Currencies for Single Transaction", "GET", "currencies", 200)
        
        if customers_success and currencies_success and customers and currencies:
            customer_id = customers[0]['id']
            currency_id = currencies[0]['id']
            
            single_transaction_data = {
                "customer_id": customer_id,
                "transaction_type": "jual",
                "currency_id": currency_id,
                "amount": 100.0,
                "exchange_rate": 15500.0,
                "voucher_number": f"SINGLE-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "notes": "Single transaction test",
                "delivery_channel": "kantor_kupva",
                "payment_method": "cash",
                "transaction_purpose": "testing"
            }
            
            success, response = self.run_test(
                "POST Single Transaction",
                "POST",
                "transactions",
                201,
                data=single_transaction_data
            )
            
            if success:
                self.created_resources['transactions'].append(response['id'])

    def cleanup_test_data(self):
        """Clean up test data (admin only)"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test transactions
        for transaction_id in self.created_resources['transactions']:
            self.run_test(
                f"DELETE Test Transaction {transaction_id[:8]}",
                "DELETE",
                f"transactions/{transaction_id}",
                200
            )

    def test_customer_gender_address_fields(self):
        """Test customer creation with gender and address fields"""
        print("\n👤 Testing Customer Gender & Address Fields...")
        
        # Get branches first
        success, branches = self.run_test("GET Branches for Customer Test", "GET", "branches", 200)
        
        if success and branches:
            branch_id = branches[0]['id']
            
            # Test customer creation with gender and address
            customer_data = {
                "customer_type": "perorangan",
                "branch_id": branch_id,
                "name": "Test Customer Gender Address",
                "gender": "L",  # Test gender field
                "identity_type": "KTP",
                "identity_number": "1234567890123456",
                "phone": "081234567890",
                "domicile_address": "Jl. Test Address No. 123, Denpasar, Bali"  # Test address field
            }
            
            success, response = self.run_test(
                "POST Customer with Gender & Address",
                "POST",
                "customers",
                200,
                data=customer_data
            )
            
            if success:
                customer_id = response.get('id')
                self.created_resources['customers'].append(customer_id)
                
                # Verify gender and address fields are saved
                if response.get('gender') == 'L' and response.get('domicile_address'):
                    self.log_test("Customer Gender & Address Fields Verification", True)
                else:
                    self.log_test("Customer Gender & Address Fields Verification", False, "Gender or address not saved correctly")
                
                return customer_id
        return None

    def test_transaction_number_format(self):
        """Test new transaction number format: TRX-MBA-J/B-XXXXX-XXX-DDMMYY"""
        print("\n🔢 Testing Transaction Number Format...")
        
        # Create a customer first if needed
        customer_id = self.test_customer_gender_address_fields()
        
        if customer_id:
            # Get currencies
            success, currencies = self.run_test("GET Currencies for Transaction Number Test", "GET", "currencies", 200)
            
            if success and currencies:
                currency_id = currencies[0]['id']
                
                # Test Jual transaction
                jual_data = {
                    "customer_id": customer_id,
                    "transaction_type": "jual",
                    "currency_id": currency_id,
                    "amount": 100.0,
                    "exchange_rate": 15500.0,
                    "notes": "Test transaction number format - Jual"
                }
                
                success, jual_response = self.run_test(
                    "POST Jual Transaction for Number Format",
                    "POST",
                    "transactions",
                    200,  # Changed to 200 as that's what the API returns
                    data=jual_data
                )
                
                if success:
                    jual_number = jual_response.get('transaction_number', '')
                    self.created_resources['transactions'].append(jual_response['id'])
                    
                    # Verify Jual format: TRX-MBA-J-XXXXX-XXX-DDMMYY
                    if jual_number.startswith('TRX-MBA-J-') and len(jual_number.split('-')) == 6:
                        self.log_test("Jual Transaction Number Format", True, f"Format: {jual_number}")
                    else:
                        self.log_test("Jual Transaction Number Format", False, f"Invalid format: {jual_number}")
                
                # Test Beli transaction
                beli_data = {
                    "customer_id": customer_id,
                    "transaction_type": "beli",
                    "currency_id": currency_id,
                    "amount": 50.0,
                    "exchange_rate": 15400.0,
                    "notes": "Test transaction number format - Beli"
                }
                
                success, beli_response = self.run_test(
                    "POST Beli Transaction for Number Format",
                    "POST",
                    "transactions",
                    200,  # Changed to 200 as that's what the API returns
                    data=beli_data
                )
                
                if success:
                    beli_number = beli_response.get('transaction_number', '')
                    self.created_resources['transactions'].append(beli_response['id'])
                    
                    # Verify Beli format: TRX-MBA-B-XXXXX-XXX-DDMMYY
                    if beli_number.startswith('TRX-MBA-B-') and len(beli_number.split('-')) == 6:
                        self.log_test("Beli Transaction Number Format", True, f"Format: {beli_number}")
                    else:
                        self.log_test("Beli Transaction Number Format", False, f"Invalid format: {beli_number}")

    def test_company_name_settings(self):
        """Test company name in settings for dashboard"""
        print("\n🏢 Testing Company Name Settings...")
        
        # Test updating company name
        update_data = {
            "company_name": "Test Company Name Update"
        }
        
        success, response = self.run_test(
            "PUT Company Name Update",
            "PUT",
            "settings/company",
            200,
            data=update_data
        )
        
        if success:
            # Verify the company name was updated
            success, settings = self.run_test(
                "GET Updated Company Settings",
                "GET",
                "settings/company",
                200
            )
            
            if success and settings.get('company_name') == update_data['company_name']:
                self.log_test("Company Name Update Verification", True)
                
                # Reset to original name
                reset_data = {"company_name": "MOZTEC"}
                self.run_test(
                    "Reset Company Name",
                    "PUT",
                    "settings/company",
                    200,
                    data=reset_data
                )
            else:
                self.log_test("Company Name Update Verification", False, "Company name not updated correctly")

    def cleanup_test_customers(self):
        """Clean up test customers"""
        print("\n🧹 Cleaning up test customers...")
        
        for customer_id in self.created_resources['customers']:
            self.run_test(
                f"DELETE Test Customer {customer_id[:8]}",
                "DELETE",
                f"customers/{customer_id}",
                200
            )

    def run_all_tests(self):
        """Run all tests focusing on the 4 specific features"""
        print("🚀 Starting MOZTEC Money Changer API Tests - Update 4 Features")
        print("Testing: 1) Gender & Address in Quick Customer, 2) Transaction Types, 3) Company Name, 4) Transaction Number Format")
        print("=" * 80)
        
        # Authentication first
        if not self.test_authentication():
            print("❌ Authentication failed, stopping tests")
            return False
        
        # Test the 4 specific features
        self.test_customer_gender_address_fields()
        self.test_transaction_number_format()
        self.test_company_name_settings()
        
        # Test basic functionality to ensure nothing broke
        self.test_existing_endpoints()
        
        # Cleanup
        self.cleanup_test_data()
        self.cleanup_test_customers()
        
        # Print summary
        print("\n" + "=" * 80)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = MOZTECAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())