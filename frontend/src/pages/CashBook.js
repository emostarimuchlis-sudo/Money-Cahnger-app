import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, Filter, Printer, FileSpreadsheet, FileText, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
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
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  // Period date for daily view
  const [periodDate, setPeriodDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
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
      // Use period date for daily view
      if (periodDate) {
        url += `&start_date=${periodDate}&end_date=${periodDate}`;
      } else if (filterStartDate) {
        url += `&start_date=${filterStartDate}`;
      }
      if (filterEndDate && !periodDate) url += `&end_date=${filterEndDate}`;
      
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
    
    return true;
  });

  const clearFilters = () => {
    setFilterType('all');
    setFilterTransactionType('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  // Export columns configuration
  const exportColumns = [
    { header: 'Tanggal', key: 'date', accessor: (row) => formatDateExport(row.date) },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-white/10">
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
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-[#6EE7B7]">
                    Belum ada entri
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
    </div>
  );
};

export default CashBook;
