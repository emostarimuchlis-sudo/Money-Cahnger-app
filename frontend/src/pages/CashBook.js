import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, Filter, Printer, FileSpreadsheet, FileText, Eye, Calendar, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { exportToExcel, exportToPDF, printTable } from '../utils/exportUtils';

const CashBook = () => {
  const { user } = useAuth();
  const [cashbook, setCashbook] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [companySettings, setCompanySettings] = useState({});
  
  // Filter states
  const [filterType, setFilterType] = useState('all'); // all, debit, credit
  const [filterTransactionType, setFilterTransactionType] = useState('all'); // all, pembelian, penjualan
  const [filterEntrySource, setFilterEntrySource] = useState('all'); // all, manual, transaction
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  // Period date for daily view
  const [periodDate, setPeriodDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Edit/Delete states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editFormData, setEditFormData] = useState({
    entry_type: 'debit',
    amount: '',
    description: ''
  });
  
  const [formData, setFormData] = useState({
    entry_type: 'debit',
    amount: '',
    description: '',
    branch_id: ''
  });

  useEffect(() => {
    fetchBranches();
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    if (selectedBranch || user?.branch_id) {
      fetchCashbook();
    }
  }, [selectedBranch, user, periodDate]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
      if (user?.role !== 'admin' && user?.branch_id) {
        setSelectedBranch(user.branch_id);
        setFormData(prev => ({ ...prev, branch_id: user.branch_id }));
      } else if (response.data.length > 0) {
        setSelectedBranch(response.data[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat data cabang');
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await api.get('/settings/company');
      setCompanySettings(response.data);
    } catch (error) {
      console.log('Using default company settings');
    }
  };

  const fetchCashbook = async () => {
    try {
      const branchId = selectedBranch || user?.branch_id;
      let url = `/cashbook?branch_id=${branchId}`;
      // Use period_date parameter for daily view
      if (periodDate) {
        url += `&period_date=${periodDate}`;
      }
      
      const response = await api.get(url);
      setCashbook(response.data);
    } catch (error) {
      toast.error('Gagal memuat buku kas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cashbook', {
        ...formData,
        amount: parseFloat(formData.amount),
        branch_id: selectedBranch || user?.branch_id
      });
      toast.success('Entri berhasil ditambahkan');
      setShowDialog(false);
      setFormData({ entry_type: 'debit', amount: '', description: '', branch_id: '' });
      fetchCashbook();
    } catch (error) {
      toast.error('Gagal menambahkan entri');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
  };

  const formatDateExport = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch { return date; }
  };

  const formatCurrencyExport = (value) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(value || 0);
  };

  // Navigate to previous/next day
  const navigateDay = (direction) => {
    const current = new Date(periodDate);
    current.setDate(current.getDate() + direction);
    setPeriodDate(format(current, 'yyyy-MM-dd'));
  };

  // View transaction detail
  const viewTransactionDetail = async (entry) => {
    if (entry.reference_id && entry.reference_type === 'transaction') {
      try {
        const response = await api.get(`/transactions/${entry.reference_id}`);
        setSelectedTransaction(response.data);
        setShowTransactionDetail(true);
      } catch (error) {
        toast.error('Gagal memuat detail transaksi');
      }
    } else {
      toast.info('Entry ini bukan transaksi valas');
    }
  };

  // Apply client-side filters
  const filteredEntries = (cashbook?.entries || []).filter(entry => {
    // Filter by entry type (debit/credit)
    if (filterType !== 'all' && entry.entry_type !== filterType) return false;
    
    // Filter by transaction type (pembelian/penjualan)
    if (filterTransactionType !== 'all') {
      const desc = (entry.description || '').toLowerCase();
      if (filterTransactionType === 'pembelian' && !desc.includes('pembelian')) return false;
      if (filterTransactionType === 'penjualan' && !desc.includes('penjualan')) return false;
    }
    
    // Filter by entry source (manual/transaction)
    if (filterEntrySource !== 'all') {
      const isManual = !entry.reference_id;
      if (filterEntrySource === 'manual' && !isManual) return false;
      if (filterEntrySource === 'transaction' && isManual) return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setFilterType('all');
    setFilterTransactionType('all');
    setFilterEntrySource('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  // Edit entry handler
  const handleEditClick = (entry) => {
    setSelectedEntry(entry);
    setEditFormData({
      entry_type: entry.entry_type,
      amount: entry.amount.toString(),
      description: entry.description
    });
    setShowEditDialog(true);
  };

  // Submit edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/cashbook/${selectedEntry.id}`, null, {
        params: {
          entry_type: editFormData.entry_type,
          amount: parseFloat(editFormData.amount),
          description: editFormData.description
        }
      });
      toast.success('Entri berhasil diperbarui');
      setShowEditDialog(false);
      setSelectedEntry(null);
      fetchCashbook();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal memperbarui entri');
    }
  };

  // Delete entry handler
  const handleDeleteClick = (entry) => {
    setSelectedEntry(entry);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/cashbook/${selectedEntry.id}`);
      toast.success('Entri berhasil dihapus');
      setShowDeleteConfirm(false);
      setSelectedEntry(null);
      fetchCashbook();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus entri');
    }
  };

  // Check and fix data consistency
  const [showDataCheckDialog, setShowDataCheckDialog] = useState(false);
  const [dataCheckResult, setDataCheckResult] = useState(null);
  const [checkingData, setCheckingData] = useState(false);
  const [fixingData, setFixingData] = useState(false);

  const handleCheckDataConsistency = async () => {
    setCheckingData(true);
    setShowDataCheckDialog(true);
    try {
      const response = await api.get('/admin/check-data-consistency');
      setDataCheckResult(response.data);
      
      if (response.data.status === 'healthy') {
        toast.success('Data konsisten! Tidak ada masalah ditemukan.');
      } else {
        toast.warning(`Ditemukan ${response.data.summary.mismatches_found} ketidaksesuaian data`);
      }
    } catch (error) {
      toast.error('Gagal memeriksa konsistensi data');
      console.error(error);
    } finally {
      setCheckingData(false);
    }
  };

  const handleFixDataConsistency = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memperbaiki data? Proses ini akan menyinkronkan Buku Kas dengan Transaksi.')) {
      return;
    }
    
    setFixingData(true);
    try {
      const response = await api.post('/admin/sync-cashbook');
      toast.success(`Data berhasil diperbaiki! ${response.data.stats.updated} entry diupdate, ${response.data.stats.created} entry dibuat.`);
      
      // Re-check consistency
      await handleCheckDataConsistency();
      
      // Refresh cashbook
      fetchCashbook();
    } catch (error) {
      toast.error('Gagal memperbaiki data');
      console.error(error);
    } finally {
      setFixingData(false);
    }
  };

  // Print single entry
  const handlePrintEntry = (entry) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">${companySettings.company_name || 'MBA Money Changer'}</h2>
          <p style="margin: 5px 0; font-size: 12px;">${companySettings.company_address || ''}</p>
          <p style="margin: 5px 0; font-size: 12px;">${companySettings.company_phone || ''}</p>
        </div>
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <h3 style="text-align: center; margin: 10px 0;">BUKTI KAS ${entry.entry_type === 'debit' ? 'MASUK' : 'KELUAR'}</h3>
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="padding: 5px 0;">Tanggal</td><td style="text-align: right;">${format(new Date(entry.date), 'dd/MM/yyyy HH:mm', { locale: localeId })}</td></tr>
          <tr><td style="padding: 5px 0;">Tipe</td><td style="text-align: right; font-weight: bold; color: ${entry.entry_type === 'debit' ? 'green' : 'red'};">${entry.entry_type === 'debit' ? 'DEBIT' : 'KREDIT'}</td></tr>
          <tr><td style="padding: 5px 0;">Keterangan</td><td style="text-align: right;">${entry.description}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: bold;">Jumlah</td><td style="text-align: right; font-weight: bold; font-size: 16px;">${formatCurrency(entry.amount)}</td></tr>
        </table>
        <hr style="border: 1px dashed #000; margin: 15px 0;">
        <p style="text-align: center; font-size: 11px; color: #666;">Dicetak: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: localeId })}</p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Bukti Kas</title></head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  // Export columns configuration
  const exportColumns = [
    { header: 'Tanggal', key: 'date', accessor: (row) => formatDateExport(row.date) },
    { header: 'Referensi', key: 'reference_id', accessor: (row) => row.reference_id || '-' },
    { header: 'Tipe', key: 'entry_type', accessor: (row) => row.entry_type === 'debit' ? 'Debit' : 'Kredit' },
    { header: 'Keterangan', key: 'description' },
    { header: 'Jumlah', key: 'amount', accessor: (row) => formatCurrencyExport(row.amount) }
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredEntries, exportColumns, 'Buku_Kas');
    toast.success('Export Excel berhasil');
  };

  const handleExportPDF = () => {
    const branchName = branches.find(b => b.id === selectedBranch)?.name || '';
    exportToPDF(filteredEntries, exportColumns, 'Buku_Kas', `Buku Kas - ${branchName}`, {
      name: companySettings.company_name,
      address: companySettings.company_address,
      phone: companySettings.company_phone,
      footer: companySettings.receipt_footer
    });
    toast.success('Export PDF berhasil');
  };

  const handlePrint = () => {
    const branchName = branches.find(b => b.id === selectedBranch)?.name || '';
    printTable(filteredEntries, exportColumns, `Buku Kas - ${branchName}`, {
      name: companySettings.company_name,
      address: companySettings.company_address,
      phone: companySettings.company_phone,
      footer: companySettings.receipt_footer
    });
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
            Buku Kas
          </h1>
          <p className="text-[#D1FAE5] mt-2">Kelola catatan kas harian</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Admin: Data Check Button */}
          {user && user.role === 'admin' && (
            <Button 
              onClick={handleCheckDataConsistency} 
              className="btn-accent flex items-center gap-2"
              disabled={checkingData}
            >
              <AlertTriangle size={18} />
              {checkingData ? 'Memeriksa...' : 'Periksa Data'}
            </Button>
          )}
          {/* Export Buttons */}
          <Button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={18} /> Cetak
          </Button>
          <Button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2">
            <FileSpreadsheet size={18} /> Excel
          </Button>
          <Button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
            <FileText size={18} /> PDF
          </Button>
          <Button onClick={() => setShowDialog(true)} className="btn-primary px-6 py-3 flex items-center gap-2">
            <Plus size={20} />
            <span>Tambah Entri</span>
          </Button>
        </div>
      </div>

      {/* Branch Selector & Filters */}
      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Period Navigation */}
          <div className="flex items-center gap-2">
            <Button onClick={() => navigateDay(-1)} className="btn-secondary px-4 py-2 flex items-center gap-1">
              <span>←</span>
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-4 py-2">
              <Calendar size={18} className="text-[#D4AF37]" />
              <Input 
                type="date" 
                value={periodDate} 
                onChange={(e) => setPeriodDate(e.target.value)}
                className="bg-transparent border-none text-[#FEF3C7] w-40"
              />
            </div>
            <Button onClick={() => navigateDay(1)} className="btn-secondary px-4 py-2 flex items-center gap-1">
              <span className="hidden sm:inline">Berikutnya</span>
              <span>→</span>
            </Button>
            <Button onClick={() => setPeriodDate(format(new Date(), 'yyyy-MM-dd'))} className="btn-primary text-sm px-4">
              Hari Ini
            </Button>
          </div>

          {user?.role === 'admin' && (
            <div className="w-full lg:w-64">
              <Label className="text-[#FEF3C7] text-sm">Cabang</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="text-[#FEF3C7]">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex-1"></div>
          <Button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 ${showFilters ? 'btn-primary' : 'btn-secondary'}`}>
            <Filter size={18} /> Filter
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pt-4 border-t border-white/10">
            <div>
              <Label className="text-[#FEF3C7] text-sm">Tipe Entry</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="all" className="text-[#FEF3C7]">Semua</SelectItem>
                  <SelectItem value="debit" className="text-[#FEF3C7]">Debit</SelectItem>
                  <SelectItem value="credit" className="text-[#FEF3C7]">Kredit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#FEF3C7] text-sm">Sumber Entri</Label>
              <Select value={filterEntrySource} onValueChange={setFilterEntrySource}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="all" className="text-[#FEF3C7]">Semua</SelectItem>
                  <SelectItem value="manual" className="text-[#FEF3C7]">Manual</SelectItem>
                  <SelectItem value="transaction" className="text-[#FEF3C7]">Transaksi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#FEF3C7] text-sm">Jenis Transaksi</Label>
              <Select value={filterTransactionType} onValueChange={setFilterTransactionType}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="all" className="text-[#FEF3C7]">Semua</SelectItem>
                  <SelectItem value="pembelian" className="text-[#FEF3C7]">Pembelian</SelectItem>
                  <SelectItem value="penjualan" className="text-[#FEF3C7]">Penjualan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#FEF3C7] text-sm">Tanggal Mulai</Label>
              <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="bg-black/20 border-white/10 text-[#FEF3C7]" />
            </div>
            <div>
              <Label className="text-[#FEF3C7] text-sm">Tanggal Akhir</Label>
              <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="bg-black/20 border-white/10 text-[#FEF3C7]" />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => fetchCashbook()} className="btn-primary flex-1">Terapkan</Button>
              <Button onClick={clearFilters} className="btn-secondary">Reset</Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-[#6EE7B7] text-sm">Saldo Awal</p>
              <p className="text-2xl font-bold text-blue-400 mono">
                {formatCurrency(cashbook?.opening_balance || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-emerald-500/20">
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-[#6EE7B7] text-sm">Total Debit</p>
              <p className="text-2xl font-bold text-[#FEF3C7] mono">
                {formatCurrency(cashbook?.total_debit || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-red-500/20">
              <TrendingDown className="text-red-400" size={24} />
            </div>
            <div>
              <p className="text-[#6EE7B7] text-sm">Total Kredit</p>
              <p className="text-2xl font-bold text-[#FEF3C7] mono">
                {formatCurrency(cashbook?.total_credit || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-[#D4AF37]/20 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-[#D4AF37]/30">
              <TrendingUp className="text-[#D4AF37]" size={24} />
            </div>
            <div>
              <p className="text-[#D4AF37] text-sm font-semibold">Saldo Akhir</p>
              <p className="text-3xl font-bold text-[#D4AF37] mono">
                {formatCurrency(cashbook?.balance || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Tanggal</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Tipe</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Keterangan</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Debit</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Kredit</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Sumber</th>
                <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const isManual = !entry.reference_id;
                  return (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-[#FEF3C7]">
                      {format(new Date(entry.date), 'dd MMM yyyy', { locale: localeId })}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        entry.entry_type === 'debit' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {entry.entry_type === 'debit' ? 'Debit' : 'Kredit'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7]">{entry.description}</td>
                    <td className="py-4 px-4 text-right mono text-emerald-400 font-semibold">
                      {entry.entry_type === 'debit' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className="py-4 px-4 text-right mono text-red-400 font-semibold">
                      {entry.entry_type === 'credit' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        isManual 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {isManual ? 'Manual' : 'Transaksi'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* View transaction detail - only for transaction-linked entries */}
                        {entry.reference_id && entry.reference_type === 'transaction' && (
                          <Button 
                            onClick={() => viewTransactionDetail(entry)} 
                            size="sm" 
                            className="btn-secondary p-1.5"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye size={14} />
                          </Button>
                        )}
                        
                        {/* Print entry - available for all */}
                        <Button 
                          onClick={() => handlePrintEntry(entry)} 
                          size="sm" 
                          className="btn-secondary p-1.5"
                          title="Cetak Bukti"
                        >
                          <Printer size={14} />
                        </Button>
                        
                        {/* Edit & Delete - only for admin and manual entries */}
                        {user?.role === 'admin' && isManual && (
                          <>
                            <Button 
                              onClick={() => handleEditClick(entry)} 
                              size="sm" 
                              className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 p-1.5"
                              title="Edit Entri"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteClick(entry)} 
                              size="sm" 
                              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 p-1.5"
                              title="Hapus Entri"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[#6EE7B7]">
                    Belum ada entri untuk tanggal {format(new Date(periodDate), 'dd MMMM yyyy', { locale: localeId })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]">Tambah Entri Kas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Tipe Entry</Label>
              <Select value={formData.entry_type} onValueChange={(value) => setFormData({...formData, entry_type: value})}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="debit" className="text-[#FEF3C7]">Debit (Pemasukan)</SelectItem>
                  <SelectItem value="credit" className="text-[#FEF3C7]">Kredit (Pengeluaran)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah (IDR)</Label>
              <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
            </div>
            <div>
              <Label>Keterangan</Label>
              <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="btn-primary flex-1">Simpan</Button>
              <Button type="button" onClick={() => setShowDialog(false)} className="btn-secondary flex-1">Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={showTransactionDetail} onOpenChange={setShowTransactionDetail}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]">Detail Transaksi</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 mt-4">
              <div className="bg-emerald-900/30 rounded-lg p-4 border border-emerald-700/50">
                <p className="text-gray-400 text-sm">No. Transaksi</p>
                <p className="text-[#D4AF37] font-bold text-lg font-mono">{selectedTransaction.transaction_number}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Tanggal</p>
                  <p className="text-white">{selectedTransaction.transaction_date ? format(new Date(selectedTransaction.transaction_date), 'dd MMMM yyyy HH:mm', { locale: localeId }) : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tipe</p>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${
                    selectedTransaction.transaction_type === 'jual' || selectedTransaction.transaction_type === 'sell'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {selectedTransaction.transaction_type === 'jual' || selectedTransaction.transaction_type === 'sell' ? 'JUAL' : 'BELI'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Nasabah</p>
                  <p className="text-white">{selectedTransaction.customer_name}</p>
                  <p className="text-[#D4AF37] text-sm font-mono">{selectedTransaction.customer_code}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Cabang</p>
                  <p className="text-white">{selectedTransaction.branch_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Mata Uang</p>
                  <p className="text-white font-bold">{selectedTransaction.currency_code}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Jumlah</p>
                  <p className="text-white font-mono">{new Intl.NumberFormat('id-ID').format(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Kurs</p>
                  <p className="text-white font-mono">{formatCurrency(selectedTransaction.exchange_rate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total IDR</p>
                  <p className="text-[#D4AF37] font-bold text-lg">{formatCurrency(selectedTransaction.total_idr)}</p>
                </div>
              </div>

              {selectedTransaction.notes && (
                <div>
                  <p className="text-gray-400 text-sm">Catatan</p>
                  <p className="text-white">{selectedTransaction.notes}</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowTransactionDetail(false)} className="btn-secondary">
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]">Edit Entri Kas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Tipe Entry</Label>
              <Select value={editFormData.entry_type} onValueChange={(value) => setEditFormData({...editFormData, entry_type: value})}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="debit" className="text-[#FEF3C7]">Debit (Pemasukan)</SelectItem>
                  <SelectItem value="credit" className="text-[#FEF3C7]">Kredit (Pengeluaran)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah (IDR)</Label>
              <Input 
                type="number" 
                value={editFormData.amount} 
                onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})} 
                className="bg-black/20 border-white/10 text-[#FEF3C7]" 
                required 
              />
            </div>
            <div>
              <Label>Keterangan</Label>
              <Input 
                value={editFormData.description} 
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} 
                className="bg-black/20 border-white/10 text-[#FEF3C7]" 
                required 
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="btn-primary flex-1">Simpan</Button>
              <Button type="button" onClick={() => setShowEditDialog(false)} className="btn-secondary flex-1">Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle size={24} /> Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#FEF3C7]">Apakah Anda yakin ingin menghapus entri ini?</p>
            {selectedEntry && (
              <div className="mt-4 p-4 bg-black/20 rounded-lg">
                <p className="text-sm text-[#6EE7B7]">Keterangan:</p>
                <p className="text-[#FEF3C7] font-semibold">{selectedEntry.description}</p>
                <p className="text-sm text-[#6EE7B7] mt-2">Jumlah:</p>
                <p className={`font-bold ${selectedEntry.entry_type === 'debit' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(selectedEntry.amount)} ({selectedEntry.entry_type === 'debit' ? 'Debit' : 'Kredit'})
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
              Batal
            </Button>
            <Button onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 size={16} className="mr-2" /> Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Consistency Check Dialog */}
      <Dialog open={showDataCheckDialog} onOpenChange={setShowDataCheckDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
              <AlertTriangle size={24} /> Hasil Pemeriksaan Data
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {checkingData ? (
              <div className="text-center py-8">
                <p className="text-[#FEF3C7]">Memeriksa konsistensi data...</p>
              </div>
            ) : dataCheckResult ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-black/20 rounded-lg p-4">
                    <p className="text-sm text-[#6EE7B7]">Total Transaksi</p>
                    <p className="text-2xl font-bold text-[#FEF3C7]">{dataCheckResult.summary.total_transactions}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <p className="text-sm text-[#6EE7B7]">Total Buku Kas</p>
                    <p className="text-2xl font-bold text-[#FEF3C7]">{dataCheckResult.summary.total_cashbook_entries}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <p className="text-sm text-red-300">Ketidaksesuaian</p>
                    <p className="text-2xl font-bold text-red-400">{dataCheckResult.summary.mismatches_found}</p>
                  </div>
                </div>

                {/* Status */}
                {dataCheckResult.status === 'healthy' ? (
                  <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4">
                    <p className="text-emerald-300 font-semibold">✓ Data Konsisten!</p>
                    <p className="text-sm text-emerald-200 mt-1">Tidak ada ketidaksesuaian antara Transaksi dan Buku Kas.</p>
                  </div>
                ) : (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-300 font-semibold">⚠ Ditemukan Ketidaksesuaian!</p>
                    <p className="text-sm text-red-200 mt-1">Ada {dataCheckResult.summary.mismatches_found} transaksi yang tidak sinkron dengan Buku Kas.</p>
                  </div>
                )}

                {/* Mismatches */}
                {dataCheckResult.mismatches && dataCheckResult.mismatches.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-[#D4AF37] mb-2">Detail Ketidaksesuaian:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dataCheckResult.mismatches.map((mismatch, index) => (
                        <div key={index} className="bg-black/20 rounded-lg p-3 border border-red-500/30">
                          <p className="text-sm font-semibold text-[#FEF3C7]">{mismatch.transaction_number}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div>
                              <p className="text-[#6EE7B7]">Transaksi:</p>
                              <p className="text-[#FEF3C7]">{formatCurrency(mismatch.transaction_amount)}</p>
                            </div>
                            <div>
                              <p className="text-[#6EE7B7]">Buku Kas:</p>
                              <p className="text-red-300">{formatCurrency(mismatch.cashbook_amount)}</p>
                            </div>
                          </div>
                          {mismatch.amount_diff !== 0 && (
                            <p className="text-xs text-red-300 mt-1">Selisih: {formatCurrency(Math.abs(mismatch.amount_diff))}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Cashbook */}
                {dataCheckResult.missing_cashbook && dataCheckResult.missing_cashbook.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-[#D4AF37] mb-2">Transaksi Tanpa Entry Buku Kas:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {dataCheckResult.missing_cashbook.map((item, index) => (
                        <div key={index} className="bg-black/20 rounded-lg p-2 border border-yellow-500/30 text-xs">
                          <p className="text-[#FEF3C7]">{item.transaction_number} - {formatCurrency(item.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={() => setShowDataCheckDialog(false)} className="btn-secondary">
              Tutup
            </Button>
            {dataCheckResult && dataCheckResult.status !== 'healthy' && (
              <Button 
                onClick={handleFixDataConsistency} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={fixingData}
              >
                {fixingData ? 'Memperbaiki...' : '🔧 Perbaiki Sekarang'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashBook;
