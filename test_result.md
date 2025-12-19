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
      BATCH 2 IMPLEMENTATION COMPLETE:
      
      BACKEND:
      1. POST /api/transactions/multi - Multi-currency transactions
      2. GET/PUT /api/settings/company - Company profile
      3. GET/PUT /api/branches/{id}/balances - Branch opening balances
      4. Mutasi Valas uses branch currency_balances for beginning stock
      
      FRONTEND:
      1. Transactions.js - Multi-currency toggle with dynamic item list
      2. Settings.js - New "Perusahaan" tab with company profile form
      3. Settings.js - Wallet icon on branches to set opening balances
      
      CREDENTIALS: admin@moztec.com / admin123
      
      TEST SCENARIOS:
      1. Enable multi-currency checkbox in new transaction form
      2. Add multiple currency items with different types (jual/beli)
      3. Verify total calculation updates dynamically
      4. Save multi-currency transaction
      5. Update company profile in Settings > Perusahaan
      6. Set branch opening balance via Wallet icon in Settings > Cabang
      7. Verify Mutasi Valas uses the opening balance
