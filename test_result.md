#====================================================================================================
# Testing Data
#====================================================================================================

user_problem_statement: |
  MOZTEC Money Changer Application - Complete feature implementation:
  1. Mutasi Valas dinamis dari transaksi
  2. Multi-Currency Transaction
  3. Filter transaksi (cabang, mata uang, tanggal)
  4. Tombol role-based (Edit/Delete Admin, Reprint Admin/Kasir)
  5. Profil Perusahaan di Settings
  6. Saldo Awal per cabang di Settings
  7. Profil Nasabah dengan Member Card dan YTD
  8. Print KYC
  9. Form Transaksi dengan Tujuan Transaksi

backend:
  - task: "Multi-Currency Transaction Endpoint"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "POST /api/transactions/multi - Creates multiple transactions with same voucher number"

  - task: "Company Settings Endpoints"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "GET/PUT /api/settings/company - Store and retrieve company profile"

  - task: "Branch Balances Endpoints"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "GET/PUT /api/branches/{id}/balances - Opening balance IDR and currency balances"

  - task: "Mutasi Valas with Opening Balance"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Mutasi valas now uses branch currency_balances for beginning stock"

frontend:
  - task: "Multi-Currency Transaction Form"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Transactions.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Toggle checkbox enables multi-currency mode with add/remove currency items"

  - task: "Company Profile Settings"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Settings.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "New Perusahaan tab with company name, address, phone, email, license, NPWP, receipt footer"

  - task: "Branch Opening Balance Settings"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Settings.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Wallet icon on branch row opens dialog for IDR opening balance and per-currency balances"

metadata:
  created_by: "main_agent"
  version: "3.0"
  test_sequence: 3
  run_ui: true

test_plan:
  current_focus:
    - "Multi-Currency Transaction Form"
    - "Company Profile Settings"
    - "Branch Opening Balance Settings"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      BATCH 3 - FORK CONTINUATION:
      
      FIXES COMPLETED:
      1. Fixed critical syntax error in Transactions.js (unterminated JSX)
      
      NEW FEATURES ADDED:
      1. Export buttons (Cetak/Excel/PDF) on Data Nasabah page
      2. Export buttons (Cetak/Excel/PDF) on Mutasi Valas page
      3. All pages now have consistent export functionality
      
      PAGES WITH EXPORT BUTTONS:
      - Transaksi: ✅ Cetak, Excel, PDF
      - Buku Kas: ✅ Cetak, Excel, PDF
      - Data Nasabah: ✅ Cetak, Excel, PDF (NEW)
      - Mutasi Valas: ✅ Cetak, Excel, PDF (NEW)
      
      CREDENTIALS: admin@moztec.com / admin123
      
      TEST SCENARIOS:
      1. Verify Transactions page loads with all export buttons
      2. Verify Cash Book page loads with all export buttons
      3. Verify Customers page loads with all export buttons
      4. Verify Mutasi Valas page loads with all export buttons
      5. Test customer search in transaction form
      6. Test export functionality on each page
      
  - agent: "main"
    message: |
      BATCH 4 - ADDITIONAL FEATURES:
      
      BACKEND UPDATES:
      1. Soft delete for Customers (was hard delete) - preserves transaction history
      2. Soft delete for Transactions - preserves audit trail
      3. Added WITA timezone support for accounting period (closes at 24:00 WITA)
      4. Added accounting_date_wita field to Transaction model
      
      SOFT DELETE STATUS:
      - User: ✅ Soft delete (is_active: false)
      - Branch: ✅ Soft delete (is_active: false)
      - Currency: ✅ Soft delete (is_active: false)
      - Customer: ✅ Soft delete (is_active: false) - UPDATED
      - Transaction: ✅ Soft delete (is_deleted: true) - UPDATED
      
      ACCOUNTING PERIOD:
      - Added WITA timezone utility functions
      - Transactions now store accounting_date_wita
      - All queries filter soft-deleted records
