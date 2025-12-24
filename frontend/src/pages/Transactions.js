import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Eye, Edit, Trash2, Printer, Filter, FileSpreadsheet, FileText, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import SignaturePad from '../components/SignaturePad';

// Inline export functions
const formatCurrencyExport = (value) => {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(value || 0);
};

const formatDateExport = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID');
  } catch {
    return dateStr;
  }
};

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [filterBranch, setFilterBranch] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    transaction_type: 'jual',
    currency_id: '',
    amount: '',
    exchange_rate: '',
    voucher_number: '',
    notes: '',
    delivery_channel: 'kantor_kupva',
    payment_method: 'cash',
    transaction_purpose: ''
  });
  
  // Multi-currency transaction state
  const [isMultiCurrency, setIsMultiCurrency] = useState(false);
  const [multiItems, setMultiItems] = useState([
    { currency_id: '', transaction_type: 'jual', amount: '', exchange_rate: '' }
  ]);
  
  const [showQuickCustomerDialog, setShowQuickCustomerDialog] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    customer_type: 'perorangan',
    name: '',
    entity_name: '',
    gender: 'L',
    identity_number: '',
    npwp: '',
    phone: '',
    pic_phone: '',
    identity_type: 'KTP',
    domicile_address: '',
    branch_id: ''
  });
  
  // Company settings for receipts
  const [companySettings, setCompanySettings] = useState({
    company_name: 'Mulia Bali Valuta',
    company_address: '',
    company_phone: '',
    receipt_footer: 'Terima kasih atas kepercayaan Anda'
  });
  
  // Signature states
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [pendingPrintTransaction, setPendingPrintTransaction] = useState(null);

  useEffect(() => {
    fetchInitialData();
    fetchCompanySettings();
  }, []);
  
  const fetchCompanySettings = async () => {
    try {
      const response = await api.get('/settings/company');
      setCompanySettings(response.data);
    } catch (error) {
      console.log('Using default company settings');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterBranch, filterCurrency, filterStartDate, filterEndDate]);

  const fetchInitialData = async () => {
    try {
      const [customersRes, currenciesRes, branchesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/currencies'),
        api.get('/branches')
      ]);
      setCustomers(customersRes.data);
      setCurrencies(currenciesRes.data);
      setBranches(branchesRes.data);
      fetchTransactions();
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      let url = '/transactions?';
      const params = [];
      if (filterBranch && filterBranch !== 'all') params.push(`branch_id=${filterBranch}`);
      if (filterCurrency && filterCurrency !== 'all') params.push(`currency_id=${filterCurrency}`);
      if (filterStartDate) params.push(`start_date=${filterStartDate}`);
      if (filterEndDate) params.push(`end_date=${filterEndDate}`);
      url += params.join('&');
      
      const response = await api.get(url);
      setTransactions(response.data);
    } catch (error) {
      toast.error('Gagal memuat transaksi');
    }
  };

  const handleSubmit = async (e, shouldPrint = false) => {
    e.preventDefault();
    try {
      let response;
      
      if (isMultiCurrency && !editingTransaction) {
        // Multi-currency transaction
        const validItems = multiItems.filter(item => item.currency_id && item.amount && item.exchange_rate);
        if (validItems.length === 0) {
          toast.error('Tambahkan minimal satu mata uang');
          return;
        }
        
        const payload = {
          customer_id: formData.customer_id,
          items: validItems.map(item => ({
            currency_id: item.currency_id,
            transaction_type: item.transaction_type,
            amount: parseFloat(item.amount),
            exchange_rate: parseFloat(item.exchange_rate)
          })),
          voucher_number: formData.voucher_number || undefined,
          notes: formData.notes || undefined,
          delivery_channel: formData.delivery_channel,
          payment_method: formData.payment_method,
          transaction_purpose: formData.transaction_purpose || undefined
        };
        
        response = await api.post('/transactions/multi', payload);
        toast.success(`${response.data.transactions.length} transaksi berhasil dibuat`);
        
        if (shouldPrint && response.data.transactions.length > 0) {
          // Print with signature if available
          response.data.transactions.forEach(t => printTransaction(t, customerSignature));
        }
      } else {
        // Single transaction
        const payload = {
          ...formData,
          amount: parseFloat(formData.amount),
          exchange_rate: parseFloat(formData.exchange_rate)
        };
        
        if (editingTransaction) {
          response = await api.put(`/transactions/${editingTransaction.id}`, payload);
          toast.success('Transaksi berhasil diperbarui');
        } else {
          response = await api.post('/transactions', payload);
          toast.success('Transaksi berhasil dibuat');
        }
        
        if (shouldPrint) {
          // Print with signature if available
          printTransaction(response.data, customerSignature);
        }
      }
      
      setShowDialog(false);
      resetForm();
      setCustomerSignature(null); // Clear signature after transaction
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan transaksi');
    }
  };
  
  // Multi-currency item handlers
  const addCurrencyItem = () => {
    setMultiItems([...multiItems, { currency_id: '', transaction_type: 'jual', amount: '', exchange_rate: '' }]);
  };
  
  const removeCurrencyItem = (index) => {
    if (multiItems.length > 1) {
      setMultiItems(multiItems.filter((_, i) => i !== index));
    }
  };
  
  const updateCurrencyItem = (index, field, value) => {
    const newItems = [...multiItems];
    newItems[index][field] = value;
    setMultiItems(newItems);
  };
  
  const calculateMultiTotal = () => {
    return multiItems.reduce((total, item) => {
      if (item.amount && item.exchange_rate) {
        return total + (parseFloat(item.amount) * parseFloat(item.exchange_rate));
      }
      return total;
    }, 0);
  };
  
  const handleQuickCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get branch_id from form, or user's branch, or first branch available
      let branchId = quickCustomerForm.branch_id;
      if (!branchId && user?.branch_id) {
        branchId = user.branch_id;
      }
      if (!branchId && branches.length > 0) {
        branchId = branches[0].id;
      }
      
      if (!branchId) {
        toast.error('Cabang tidak ditemukan. Silakan pilih cabang terlebih dahulu.');
        return;
      }
      
      const response = await api.post('/customers', {
        ...quickCustomerForm,
        branch_id: branchId
      });
      
      toast.success('Nasabah berhasil ditambahkan dan dipilih');
      
      // Refresh customers list
      const customersRes = await api.get('/customers');
      setCustomers(customersRes.data);
      
      // Auto-select the new customer in the form
      setFormData({ ...formData, customer_id: response.data.id });
      
      // Clear customer search
      setCustomerSearch('');
      
      setShowQuickCustomerDialog(false);
      setQuickCustomerForm({
        customer_type: 'perorangan',
        name: '',
        entity_name: '',
        identity_number: '',
        npwp: '',
        phone: '',
        pic_phone: '',
        identity_type: 'KTP',
        gender: 'L',
        domicile_address: '',
        branch_id: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan nasabah');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      customer_id: transaction.customer_id,
      transaction_type: transaction.transaction_type,
      currency_id: transaction.currency_id,
      amount: transaction.amount.toString(),
      exchange_rate: transaction.exchange_rate.toString(),
      voucher_number: transaction.voucher_number || '',
      notes: transaction.notes || '',
      delivery_channel: transaction.delivery_channel || 'kantor_kupva',
      payment_method: transaction.payment_method || 'cash',
      transaction_purpose: transaction.transaction_purpose || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await api.delete(`/transactions/${id}`);
        toast.success('Transaksi berhasil dihapus');
        fetchTransactions();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Gagal menghapus transaksi');
      }
    }
  };
  
  const printTransaction = (transaction, signatureData = null) => {
    // Validate transaction data before printing
    if (!transaction || !transaction.transaction_number) {
      toast.error('Data transaksi tidak valid untuk dicetak');
      return;
    }
    
    const customer = customers.find(c => c.id === transaction.customer_id);
    const currency = currencies.find(c => c.id === transaction.currency_id);
    const branch = branches.find(b => b.id === transaction.branch_id);
    
    // Validate required data
    if (!customer) {
      toast.warning('Data nasabah tidak ditemukan. Transaksi dapat dicetak dengan data terbatas.');
    }
    
    // Use company settings for receipt
    const companyName = companySettings.company_name || 'Mulia Bali Valuta';
    const companyAddress = companySettings.company_address || branch?.address || '';
    const companyPhone = companySettings.company_phone || branch?.phone || '';
    const receiptFooter = companySettings.receipt_footer || 'Terima kasih atas kepercayaan Anda';
    
    // Use safe values with fallbacks
    const customerName = customer?.name || customer?.entity_name || transaction.customer_name || 'N/A';
    const customerIdentity = customer?.identity_number || customer?.npwp || '-';
    const customerPhone = customer?.phone || customer?.pic_phone || '-';
    const currencyCode = currency?.code || transaction.currency_code || 'N/A';
    const branchName = branch?.name || transaction.branch_name || 'N/A';
    
    // Signature section - either show captured signature or empty line
    const signatureSection = signatureData 
      ? `<div class="signature">
           <p style="margin-bottom: 5px;">Tanda Tangan Nasabah:</p>
           <img src="${signatureData}" style="max-width: 150px; max-height: 60px; border-bottom: 1px solid #000;" />
           <p style="margin-top: 5px;">${customerName}</p>
         </div>`
      : `<div class="signature">
           <div class="signature-line"></div>
           <p>Tanda Tangan Nasabah</p>
         </div>`;
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Transaksi - ${transaction.transaction_number}</title>
        <style>
          @media print { body { margin: 0; padding: 20px; font-family: 'Courier New', monospace; } }
          body { max-width: 300px; margin: 0 auto; padding: 20px; font-family: 'Courier New', monospace; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .header h1 { margin: 0; font-size: 20px; }
          .header p { margin: 5px 0; font-size: 10px; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .label { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .total { font-size: 16px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; font-size: 10px; }
          .signature { margin-top: 30px; text-align: center; }
          .signature-line { border-top: 1px solid #000; width: 150px; margin: 40px auto 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          <p>Money Changer - ${branchName}</p>
          <p>${companyAddress || branch?.address || ''}</p>
          <p>Telp: ${companyPhone || branch?.phone || ''}</p>
        </div>
        
        <div class="row"><span class="label">No. Transaksi:</span><span>${transaction.transaction_number}</span></div>
        ${transaction.voucher_number ? `<div class="row"><span class="label">No. Voucher:</span><span>${transaction.voucher_number}</span></div>` : ''}
        <div class="row"><span class="label">Tanggal:</span><span>${format(new Date(transaction.transaction_date || new Date()), 'dd/MM/yyyy HH:mm')}</span></div>
        <div class="row"><span class="label">Kode Nasabah:</span><span>${transaction.customer_code || '-'}</span></div>
        <div class="row"><span class="label">Nasabah:</span><span>${customerName}</span></div>
        <div class="row"><span class="label">Teller:</span><span>${transaction.accountant_name || '-'}</span></div>
        
        <div class="divider"></div>
        
        <div class="row"><span class="label">Tipe:</span><span>${transaction.transaction_type === 'beli' || transaction.transaction_type === 'buy' ? 'BELI' : 'JUAL'}</span></div>
        <div class="row"><span class="label">Mata Uang:</span><span>${currencyCode}</span></div>
        <div class="row"><span class="label">Jumlah:</span><span>${parseFloat(transaction.amount).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span></div>
        <div class="row"><span class="label">Kurs:</span><span>Rp ${parseFloat(transaction.exchange_rate).toLocaleString('id-ID')}</span></div>
        ${transaction.transaction_purpose ? `<div class="row"><span class="label">Tujuan:</span><span>${transaction.transaction_purpose}</span></div>` : ''}
        
        <div class="divider"></div>
        
        <div class="row total"><span class="label">TOTAL:</span><span>Rp ${parseFloat(transaction.total_idr).toLocaleString('id-ID', { minimumFractionDigits: 0 })}</span></div>
        
        ${transaction.delivery_channel ? `
        <div class="divider"></div>
        <div class="row"><span class="label">Delivery:</span><span>${transaction.delivery_channel === 'kantor_kupva' ? 'Kantor Kupva' : transaction.delivery_channel === 'online_merchant' ? 'Online Merchant' : 'Delivery Service'}</span></div>
        ` : ''}
        
        ${transaction.payment_method ? `<div class="row"><span class="label">Pembayaran:</span><span>${transaction.payment_method === 'cash' ? 'Cash' : 'Transfer'}</span></div>` : ''}
        
        ${transaction.notes ? `<div class="divider"></div><div class="row"><span class="label">Catatan:</span></div><div style="margin-top: 5px;">${transaction.notes}</div>` : ''}
        
        ${signatureSection}
        
        <div class="footer">
          <p>${receiptFooter}</p>
          <p>${companyName} Money Changer</p>
        </div>
        
        <script>window.onload = function() { setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 100); }, 500); }</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };
  
  // Print with signature - opens signature dialog first
  const printWithSignature = (transaction) => {
    setPendingPrintTransaction(transaction);
    setCustomerSignature(null);
    setShowSignatureDialog(true);
  };
  
  // Handle signature save and print
  const handleSignatureSave = (signatureData) => {
    setCustomerSignature(signatureData);
    if (pendingPrintTransaction) {
      printTransaction(pendingPrintTransaction, signatureData);
    }
    setShowSignatureDialog(false);
    setPendingPrintTransaction(null);
    toast.success('Struk dengan tanda tangan berhasil dicetak');
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      transaction_type: 'jual',
      currency_id: '',
      amount: '',
      exchange_rate: '',
      voucher_number: '',
      notes: '',
      delivery_channel: 'kantor_kupva',
      payment_method: 'cash',
      transaction_purpose: ''
    });
    setEditingTransaction(null);
    setIsMultiCurrency(false);
    setMultiItems([{ currency_id: '', transaction_type: 'jual', amount: '', exchange_rate: '' }]);
  };

  const clearFilters = () => {
    setFilterBranch('');
    setFilterCurrency('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const filteredTransactions = transactions.filter(t => 
    t.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.customer_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter customers for dropdown (search + sorted by most recent)
  const filteredCustomers = useMemo(() => {
    // Get user's branch customers only (or all for admin)
    let branchCustomers = customers;
    if (user?.role !== 'admin' && user?.branch_id) {
      branchCustomers = customers.filter(c => c.branch_id === user.branch_id);
    }
    
    // If search term exists, filter by search
    if (customerSearch && customerSearch.length > 0) {
      const search = customerSearch.toLowerCase();
      const filtered = branchCustomers.filter(c => 
        (c.name || '').toLowerCase().includes(search) ||
        (c.entity_name || '').toLowerCase().includes(search) ||
        (c.customer_code || '').toLowerCase().includes(search) ||
        (c.identity_number || '').toLowerCase().includes(search) ||
        (c.phone || '').toLowerCase().includes(search)
      );
      // Return up to 10 results when searching
      return filtered.slice(0, 10);
    }
    
    // If no search, show max 10 most recent customers
    // Sort by created_at descending and take first 10
    const sorted = [...branchCustomers].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
    return sorted.slice(0, 10);
  }, [customers, customerSearch, user]);

  // Export functions
  const exportColumns = [
    { header: 'No. Transaksi', key: 'transaction_number' },
    { header: 'No. Voucher', key: 'voucher_number', accessor: (r) => r.voucher_number || '-' },
    { header: 'Tanggal', key: 'transaction_date', accessor: (r) => formatDateExport(r.transaction_date) },
    { header: 'Kode Nasabah', key: 'customer_code', accessor: (r) => r.customer_code || '-' },
    { header: 'Nama Nasabah', key: 'customer_name' },
    { header: 'Tipe', key: 'transaction_type', accessor: (r) => r.transaction_type === 'beli' || r.transaction_type === 'buy' ? 'Beli' : 'Jual' },
    { header: 'Mata Uang', key: 'currency_code' },
    { header: 'Jumlah', key: 'amount', accessor: (r) => formatCurrencyExport(r.amount) },
    { header: 'Total IDR', key: 'total_idr', accessor: (r) => formatCurrencyExport(r.total_idr) }
  ];

  const handleExportExcel = () => {
    // Export to Excel using simple CSV approach
    const headers = exportColumns.map(c => c.header).join(',');
    const rows = filteredTransactions.map(row => 
      exportColumns.map(col => col.accessor ? col.accessor(row) : row[col.key] || '-').join(',')
    ).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Data_Transaksi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export Excel berhasil');
  };

  const handleExportPDF = () => {
    handlePrintTable(); // Use print as PDF alternative
    toast.success('Silakan simpan sebagai PDF dari dialog print');
  };

  const handlePrintTable = () => {
    const tableRows = filteredTransactions.map(function(row) {
      return '<tr>' + exportColumns.map(function(col) {
        return '<td>' + (col.accessor ? col.accessor(row) : row[col.key] || '-') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    
    const headers = exportColumns.map(function(c) { return '<th>' + c.header + '</th>'; }).join('');
    const compName = companySettings.company_name || 'Mulia Bali Valuta';
    const compAddr = companySettings.company_address || '';
    
    const printWindow = window.open('', '_blank');
    const html = '<!DOCTYPE html><html><head><title>Data Transaksi</title>' +
      '<style>body{font-family:Arial;font-size:12px;margin:20px}h1{color:#064E3B}' +
      'table{width:100%;border-collapse:collapse}th{background:#064E3B;color:#FEF3C7;padding:8px;text-align:left}' +
      'td{border-bottom:1px solid #ddd;padding:6px}</style></head><body>' +
      '<h1>' + compName + ' Money Changer</h1><p>' + compAddr + '</p>' +
      '<h2>Laporan Data Transaksi</h2>' +
      '<table><thead><tr>' + headers + '</tr></thead><tbody>' + tableRows + '</tbody></table>' +
      '<script>setTimeout(function(){window.print();},500);</script></body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const viewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailDialog(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37] text-xl">Memuat...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Transaksi
          </h1>
          <p className="text-[#D1FAE5] mt-2">Kelola transaksi money changer</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handlePrintTable} className="btn-secondary flex items-center gap-2">
            <Printer size={18} /> Cetak
          </Button>
          <Button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2">
            <FileSpreadsheet size={18} /> Excel
          </Button>
          <Button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
            <FileText size={18} /> PDF
          </Button>
          <Button
            data-testid="create-transaction-button"
            onClick={() => { resetForm(); setShowDialog(true); }}
            className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Transaksi Baru</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6EE7B7]" size={20} />
            <Input
              data-testid="search-transaction-input"
              type="text"
              placeholder="Cari berdasarkan nomor transaksi, kode atau nama nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/20 border-white/10 text-[#FEF3C7] placeholder:text-[#6EE7B7]/50"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter size={18} />
            Filter
          </Button>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-white/10">
            {user?.role === 'admin' && (
              <div>
                <Label className="text-[#FEF3C7] text-sm">Cabang</Label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#064E3B] border-white/10">
                    <SelectItem value="all" className="text-[#FEF3C7]">Semua Cabang</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id} className="text-[#FEF3C7]">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-[#FEF3C7] text-sm">Mata Uang</Label>
              <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue placeholder="Semua Mata Uang" />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="all" className="text-[#FEF3C7]">Semua Mata Uang</SelectItem>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id} className="text-[#FEF3C7]">
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#FEF3C7] text-sm">Tanggal Mulai</Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="bg-black/20 border-white/10 text-[#FEF3C7]"
              />
            </div>
            <div>
              <Label className="text-[#FEF3C7] text-sm">Tanggal Akhir</Label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="bg-black/20 border-white/10 text-[#FEF3C7]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={clearFilters} className="btn-secondary w-full">
                Reset Filter
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">No. Transaksi</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">No. Voucher</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Tanggal</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Kode Nasabah</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Nama Nasabah</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Tipe</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Mata Uang</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Jumlah</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Total (IDR)</th>
                <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                    <td className="py-4 px-4">
                      <span className="mono text-[#6EE7B7] text-xs">{transaction.transaction_number}</span>
                    </td>
                    <td className="py-4 px-4">
                      {transaction.voucher_number ? (
                        <span className="mono text-[#FEF3C7] text-xs">{transaction.voucher_number}</span>
                      ) : null}
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7] text-sm">
                      {format(new Date(transaction.transaction_date), 'dd MMM yyyy', { locale: localeId })}
                    </td>
                    <td className="py-4 px-4">
                      <span className="mono text-[#D4AF37] font-semibold">{transaction.customer_code || '-'}</span>
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7]">{transaction.customer_name}</td>
                    <td className="py-4 px-4">
                      {transaction.transaction_type === 'beli' || transaction.transaction_type === 'buy' ? (
                        <span className="flex items-center gap-1 text-blue-400">
                          <ArrowDownRight size={16} /> Beli
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <ArrowUpRight size={16} /> Jual
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="mono text-[#D4AF37] font-semibold">{transaction.currency_code}</span>
                    </td>
                    <td className="py-4 px-4 text-right mono text-[#FEF3C7]">
                      {transaction.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 text-right mono text-[#D4AF37] font-semibold">
                      {formatCurrency(transaction.total_idr)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => viewDetail(transaction)}
                          className="text-[#6EE7B7] hover:text-[#A7F3D0] transition-colors duration-300 p-1.5"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        {/* Reprint - Admin & Kasir */}
                        {(user?.role === 'admin' || user?.role === 'kasir') && (
                          <>
                            <button
                              onClick={() => printTransaction(transaction)}
                              className="text-[#D4AF37] hover:text-[#FCD34D] transition-colors duration-300 p-1.5"
                              title="Cetak Ulang"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => printWithSignature(transaction)}
                              className="text-emerald-400 hover:text-emerald-300 transition-colors duration-300 p-1.5"
                              title="Cetak dengan Tanda Tangan"
                            >
                              <PenTool size={16} />
                            </button>
                          </>
                        )}
                        {/* Edit - Admin Only */}
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-400 hover:text-blue-300 transition-colors duration-300 p-1.5"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {/* Delete - Admin Only */}
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-300 p-1.5"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-[#6EE7B7]">
                    {searchTerm ? 'Tidak ada transaksi yang ditemukan' : 'Belum ada transaksi'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Transaction Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              {editingTransaction ? 'Edit Transaksi' : 'Transaksi Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Customer & Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-[#FEF3C7]">Cari Nasabah</Label>
                <Input
                  type="text"
                  placeholder="Ketik nama, kode, atau no. identitas nasabah..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="bg-black/20 border-white/10 text-[#FEF3C7] placeholder:text-[#6EE7B7]/50"
                />
              </div>
              <div>
                <Label className="text-[#FEF3C7]">Nasabah *</Label>
                <div className="flex gap-2">
                  <Select value={formData.customer_id} onValueChange={(value) => { setFormData({ ...formData, customer_id: value }); setCustomerSearch(''); }}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7] flex-1">
                      <SelectValue placeholder="Pilih nasabah" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#064E3B] border-white/10 max-h-60">
                      {filteredCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id} className="text-[#FEF3C7]">
                          {customer.customer_code ? `[${customer.customer_code}] ` : ''}{customer.name || customer.entity_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button type="button" onClick={() => setShowQuickCustomerDialog(true)} className="px-3 py-2 bg-[#D4AF37] text-black rounded-lg hover:bg-[#D4AF37]/90 font-bold text-lg">+</button>
                </div>
              </div>
              <div>
                <Label className="text-[#FEF3C7]">No. Voucher</Label>
                <Input type="text" value={formData.voucher_number} onChange={(e) => setFormData({ ...formData, voucher_number: e.target.value })} className="bg-black/20 border-white/10 text-[#FEF3C7]" placeholder="Opsional" />
              </div>
            </div>

            {/* Multi-currency Toggle */}
            {!editingTransaction && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <input type="checkbox" checked={isMultiCurrency} onChange={(e) => setIsMultiCurrency(e.target.checked)} className="w-5 h-5" />
                <Label className="text-[#D4AF37] font-semibold cursor-pointer" onClick={() => setIsMultiCurrency(!isMultiCurrency)}>
                  Multi-Currency Transaction (Transaksi lebih dari 1 mata uang)
                </Label>
              </div>
            )}

            {/* Single Currency Form */}
            {!isMultiCurrency && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#FEF3C7]">Tipe Transaksi *</Label>
                  <Select value={formData.transaction_type} onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#064E3B] border-white/10">
                      <SelectItem value="jual" className="text-[#FEF3C7]">Jual</SelectItem>
                      <SelectItem value="beli" className="text-[#FEF3C7]">Beli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Mata Uang *</Label>
                  <Select value={formData.currency_id} onValueChange={(value) => setFormData({ ...formData, currency_id: value })}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]"><SelectValue placeholder="Pilih mata uang" /></SelectTrigger>
                    <SelectContent className="bg-[#064E3B] border-white/10">
                      {currencies.map((c) => <SelectItem key={c.id} value={c.id} className="text-[#FEF3C7]">{c.code} - {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Jumlah *</Label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="bg-black/20 border-white/10 text-[#FEF3C7]" required={!isMultiCurrency} />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Kurs (IDR) *</Label>
                  <Input type="number" step="0.01" value={formData.exchange_rate} onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })} className="bg-black/20 border-white/10 text-[#FEF3C7]" required={!isMultiCurrency} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#FEF3C7]">Total (IDR)</Label>
                  <div className="px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-[#D4AF37] font-semibold mono text-xl">
                    {formData.amount && formData.exchange_rate ? formatCurrency(parseFloat(formData.amount) * parseFloat(formData.exchange_rate)) : 'Rp 0'}
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Currency Form */}
            {isMultiCurrency && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#D4AF37] font-semibold">Daftar Mata Uang</Label>
                  <Button type="button" onClick={addCurrencyItem} className="btn-secondary text-sm px-3 py-1">+ Tambah Mata Uang</Button>
                </div>
                {multiItems.map((item, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#D4AF37] font-semibold">#{index + 1}</span>
                      {multiItems.length > 1 && (
                        <button type="button" onClick={() => removeCurrencyItem(index)} className="text-red-400 hover:text-red-300 text-sm">Hapus</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-[#FEF3C7] text-sm">Mata Uang</Label>
                        <Select value={item.currency_id} onValueChange={(value) => updateCurrencyItem(index, 'currency_id', value)}>
                          <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]"><SelectValue placeholder="Pilih" /></SelectTrigger>
                          <SelectContent className="bg-[#064E3B] border-white/10">
                            {currencies.map((c) => <SelectItem key={c.id} value={c.id} className="text-[#FEF3C7]">{c.code}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[#FEF3C7] text-sm">Tipe</Label>
                        <Select value={item.transaction_type} onValueChange={(value) => updateCurrencyItem(index, 'transaction_type', value)}>
                          <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#064E3B] border-white/10">
                            <SelectItem value="jual" className="text-[#FEF3C7]">Jual</SelectItem>
                            <SelectItem value="beli" className="text-[#FEF3C7]">Beli</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[#FEF3C7] text-sm">Jumlah</Label>
                        <Input type="number" step="0.01" value={item.amount} onChange={(e) => updateCurrencyItem(index, 'amount', e.target.value)} className="bg-black/20 border-white/10 text-[#FEF3C7]" />
                      </div>
                      <div>
                        <Label className="text-[#FEF3C7] text-sm">Kurs (IDR)</Label>
                        <Input type="number" step="0.01" value={item.exchange_rate} onChange={(e) => updateCurrencyItem(index, 'exchange_rate', e.target.value)} className="bg-black/20 border-white/10 text-[#FEF3C7]" />
                      </div>
                    </div>
                    {item.amount && item.exchange_rate && (
                      <div className="text-right text-[#6EE7B7] text-sm">
                        Subtotal: {formatCurrency(parseFloat(item.amount) * parseFloat(item.exchange_rate))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="p-4 bg-[#D4AF37]/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-[#D4AF37] font-bold">TOTAL KESELURUHAN</span>
                    <span className="text-[#D4AF37] font-bold text-2xl mono">{formatCurrency(calculateMultiTotal())}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#FEF3C7]">Tujuan Transaksi</Label>
                <Select value={formData.transaction_purpose} onValueChange={(value) => setFormData({ ...formData, transaction_purpose: value })}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]"><SelectValue placeholder="Pilih tujuan" /></SelectTrigger>
                  <SelectContent className="bg-[#064E3B] border-white/10">
                    <SelectItem value="traveling" className="text-[#FEF3C7]">Traveling</SelectItem>
                    <SelectItem value="bisnis" className="text-[#FEF3C7]">Bisnis</SelectItem>
                    <SelectItem value="pendidikan" className="text-[#FEF3C7]">Pendidikan</SelectItem>
                    <SelectItem value="investasi" className="text-[#FEF3C7]">Investasi</SelectItem>
                    <SelectItem value="keluarga" className="text-[#FEF3C7]">Kiriman Keluarga</SelectItem>
                    <SelectItem value="lainnya" className="text-[#FEF3C7]">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#FEF3C7]">Delivery Channel</Label>
                <Select value={formData.delivery_channel} onValueChange={(value) => setFormData({ ...formData, delivery_channel: value })}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#064E3B] border-white/10">
                    <SelectItem value="kantor_kupva" className="text-[#FEF3C7]">Kantor Kupva</SelectItem>
                    <SelectItem value="online_merchant" className="text-[#FEF3C7]">Online Merchant</SelectItem>
                    <SelectItem value="delivery_service" className="text-[#FEF3C7]">Delivery Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#FEF3C7]">Metode Pembayaran</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#064E3B] border-white/10">
                    <SelectItem value="cash" className="text-[#FEF3C7]">Cash</SelectItem>
                    <SelectItem value="transfer" className="text-[#FEF3C7]">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#FEF3C7]">Catatan</Label>
                <Input type="text" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-black/20 border-white/10 text-[#FEF3C7]" placeholder="Opsional" />
              </div>
            </div>

            {/* Signature Section */}
            {!editingTransaction && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[#D4AF37] text-lg flex items-center gap-2">
                    <PenTool size={18} /> Tanda Tangan Nasabah
                  </Label>
                  {customerSignature && (
                    <Button 
                      type="button" 
                      onClick={() => setCustomerSignature(null)} 
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Hapus Tanda Tangan
                    </Button>
                  )}
                </div>
                {customerSignature ? (
                  <div className="border-2 border-emerald-500/50 rounded-lg p-4 bg-white/5 text-center">
                    <img src={customerSignature} alt="Tanda tangan" className="max-h-24 mx-auto" />
                    <p className="text-emerald-400 text-sm mt-2">✓ Tanda tangan sudah diambil</p>
                  </div>
                ) : (
                  <SignaturePad 
                    onSave={(sig) => setCustomerSignature(sig)}
                    onCancel={null}
                  />
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={(e) => handleSubmit(e, false)} className="btn-primary flex-1">
                {editingTransaction ? 'Perbarui' : 'Simpan'}
              </Button>
              {!editingTransaction && (
                <Button type="button" onClick={(e) => handleSubmit(e, true)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Printer size={18} /> Cetak & Simpan
                </Button>
              )}
              <Button type="button" onClick={() => { setShowDialog(false); resetForm(); }} className="btn-secondary flex-1">Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Detail Transaksi
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#6EE7B7] text-sm">No. Transaksi</p>
                  <p className="text-[#FEF3C7] font-semibold mono">{selectedTransaction.transaction_number}</p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">No. Voucher</p>
                  <p className="text-[#FEF3C7] font-semibold mono">{selectedTransaction.voucher_number || '-'}</p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Tanggal</p>
                  <p className="text-[#FEF3C7] font-semibold">
                    {format(new Date(selectedTransaction.transaction_date), 'dd MMMM yyyy HH:mm', { locale: localeId })}
                  </p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Kode Nasabah</p>
                  <p className="text-[#D4AF37] font-bold mono">{selectedTransaction.customer_code || '-'}</p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Nama Nasabah</p>
                  <p className="text-[#FEF3C7] font-semibold">{selectedTransaction.customer_name}</p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Teller</p>
                  <p className="text-[#FEF3C7] font-semibold">{selectedTransaction.accountant_name || '-'}</p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Tipe Transaksi</p>
                  <p className="text-[#FEF3C7] font-semibold">
                    {selectedTransaction.transaction_type === 'beli' || selectedTransaction.transaction_type === 'buy' ? 'Beli' : 'Jual'}
                  </p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Mata Uang</p>
                  <p className="text-[#D4AF37] font-bold mono text-xl">{selectedTransaction.currency_code}</p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Jumlah</p>
                  <p className="text-[#FEF3C7] font-semibold mono">{selectedTransaction.amount.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Kurs (IDR)</p>
                  <p className="text-[#FEF3C7] font-semibold mono">{selectedTransaction.exchange_rate.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[#6EE7B7] text-sm">Total (IDR)</p>
                  <p className="text-[#D4AF37] font-bold mono text-xl">{formatCurrency(selectedTransaction.total_idr)}</p>
                </div>
                {selectedTransaction.transaction_purpose && (
                  <div>
                    <p className="text-[#6EE7B7] text-sm">Tujuan Transaksi</p>
                    <p className="text-[#FEF3C7] font-semibold capitalize">{selectedTransaction.transaction_purpose}</p>
                  </div>
                )}
                {selectedTransaction.delivery_channel && (
                  <div>
                    <p className="text-[#6EE7B7] text-sm">Delivery Channel</p>
                    <p className="text-[#FEF3C7] font-semibold">
                      {selectedTransaction.delivery_channel === 'kantor_kupva' ? 'Kantor Kupva' : 
                       selectedTransaction.delivery_channel === 'online_merchant' ? 'Online Merchant' : 'Delivery Service'}
                    </p>
                  </div>
                )}
                {selectedTransaction.payment_method && (
                  <div>
                    <p className="text-[#6EE7B7] text-sm">Metode Pembayaran</p>
                    <p className="text-[#FEF3C7] font-semibold">{selectedTransaction.payment_method === 'cash' ? 'Cash' : 'Transfer'}</p>
                  </div>
                )}
              </div>
              {selectedTransaction.notes && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[#6EE7B7] text-sm mb-2">Catatan</p>
                  <p className="text-[#FEF3C7]">{selectedTransaction.notes}</p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                {(user?.role === 'admin' || user?.role === 'kasir') && (
                  <Button onClick={() => printTransaction(selectedTransaction)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Printer size={18} />
                    Cetak Struk
                  </Button>
                )}
                <Button onClick={() => setShowDetailDialog(false)} className="btn-secondary flex-1">
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Add Customer Dialog */}
      <Dialog open={showQuickCustomerDialog} onOpenChange={setShowQuickCustomerDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Tambah Nasabah Baru (Quick)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickCustomerSubmit} className="space-y-4 mt-4">
            <div>
              <Label className="text-[#FEF3C7]">Jenis Nasabah</Label>
              <Select 
                value={quickCustomerForm.customer_type} 
                onValueChange={(value) => setQuickCustomerForm({ ...quickCustomerForm, customer_type: value })}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="perorangan" className="text-[#FEF3C7]">Perorangan</SelectItem>
                  <SelectItem value="badan_usaha" className="text-[#FEF3C7]">Badan Usaha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {quickCustomerForm.customer_type === 'perorangan' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#FEF3C7]">Nama Lengkap *</Label>
                  <Input
                    value={quickCustomerForm.name}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, name: e.target.value })}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Jenis Kelamin *</Label>
                  <Select 
                    value={quickCustomerForm.gender} 
                    onValueChange={(value) => setQuickCustomerForm({ ...quickCustomerForm, gender: value })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#064E3B] border-white/10">
                      <SelectItem value="L" className="text-[#FEF3C7]">Laki-laki</SelectItem>
                      <SelectItem value="P" className="text-[#FEF3C7]">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Jenis Identitas</Label>
                  <Select 
                    value={quickCustomerForm.identity_type} 
                    onValueChange={(value) => setQuickCustomerForm({ ...quickCustomerForm, identity_type: value })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#064E3B] border-white/10">
                      <SelectItem value="KTP" className="text-[#FEF3C7]">KTP</SelectItem>
                      <SelectItem value="SIM" className="text-[#FEF3C7]">SIM</SelectItem>
                      <SelectItem value="Passport" className="text-[#FEF3C7]">Passport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">No. Identitas *</Label>
                  <Input
                    value={quickCustomerForm.identity_number}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, identity_number: e.target.value })}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Nomor Telepon *</Label>
                  <Input
                    value={quickCustomerForm.phone}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, phone: e.target.value })}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#FEF3C7]">Alamat</Label>
                  <Input
                    value={quickCustomerForm.domicile_address}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, domicile_address: e.target.value })}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="Alamat lengkap"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#FEF3C7]">Nama Badan Usaha *</Label>
                  <Input
                    value={quickCustomerForm.entity_name}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, entity_name: e.target.value })}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">NPWP *</Label>
                  <Input
                    value={quickCustomerForm.npwp}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, npwp: e.target.value })}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Telepon PIC *</Label>
                  <Input
                    value={quickCustomerForm.pic_phone}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, pic_phone: e.target.value })}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="btn-primary flex-1">
                Simpan Nasabah
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setShowQuickCustomerDialog(false);
                  setQuickCustomerForm({
                    customer_type: 'perorangan',
                    name: '',
                    entity_name: '',
                    gender: 'L',
                    identity_number: '',
                    npwp: '',
                    phone: '',
                    pic_phone: '',
                    identity_type: 'KTP',
                    domicile_address: '',
                    branch_id: ''
                  });
                }} 
                className="btn-secondary flex-1"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]">
              Tanda Tangan Nasabah
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SignaturePad 
              onSave={handleSignatureSave}
              onCancel={() => {
                setShowSignatureDialog(false);
                setPendingPrintTransaction(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
