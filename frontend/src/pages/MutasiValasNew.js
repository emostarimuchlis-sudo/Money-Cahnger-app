import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Coins, Calendar, Printer, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import { exportToExcel, exportToPDF, printTable } from '../utils/exportUtils';
import { format, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const MutasiValasNew = () => {
  const { user } = useAuth();
  const [mutasi, setMutasi] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [companySettings, setCompanySettings] = useState({});
  
  // Period date for daily view
  const [periodDate, setPeriodDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Recalculate dialog state
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [recalculateStartDate, setRecalculateStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [recalculateEndDate, setRecalculateEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    fetchCompanySettings();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (periodDate) {
      fetchMutasi();
    }
  }, [selectedBranch, periodDate, user]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
      if (user?.role !== 'admin' && user?.branch_id) {
        setSelectedBranch(user.branch_id);
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

  const fetchMutasi = async () => {
    setLoading(true);
    try {
      const branchParam = user?.role === 'admin' && selectedBranch ? `&branch_id=${selectedBranch}` : '';
      const response = await api.get(`/mutasi-valas/calculate?period_date=${periodDate}${branchParam}`);
      setMutasi(response.data);
    } catch (error) {
      toast.error('Gagal memuat mutasi valas');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous/next day
  const navigateDay = (direction) => {
    const current = new Date(periodDate);
    current.setDate(current.getDate() + direction);
    setPeriodDate(format(current, 'yyyy-MM-dd'));
  };

  // Recalculate all snapshots for consistency fix
  const handleRecalculate = async () => {
    if (!recalculateStartDate || !recalculateEndDate) {
      toast.error('Pilih rentang tanggal terlebih dahulu');
      return;
    }

    setIsRecalculating(true);
    const loadingToast = toast.loading('Memperbaiki data stock... Mohon tunggu');

    try {
      // Step 1: Reset all snapshots
      const branchParam = selectedBranch ? `branch_id=${selectedBranch}` : '';
      await api.delete(`/mutasi-valas/snapshots/reset?${branchParam}`);
      
      // Step 2: Recalculate all snapshots
      const response = await api.post(
        `/mutasi-valas/recalculate-all?start_date=${recalculateStartDate}&end_date=${recalculateEndDate}&${branchParam}`
      );
      
      toast.dismiss(loadingToast);
      toast.success(`Data berhasil diperbaiki! ${response.data.results?.length || 0} hari diproses`);
      
      // Refresh current view
      fetchMutasi();
      setShowRecalculateDialog(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Gagal memperbaiki data: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsRecalculating(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatIDR = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Export columns and functions
  const exportColumns = [
    { header: 'Valas', key: 'currency_code' },
    { header: 'Stock Awal (Valas)', key: 'beginning_stock_valas', accessor: (r) => formatCurrency(r.beginning_stock_valas) },
    { header: 'Stock Awal (IDR)', key: 'beginning_stock_idr', accessor: (r) => formatIDR(r.beginning_stock_idr) },
    { header: 'Pembelian (Valas)', key: 'purchase_valas', accessor: (r) => formatCurrency(r.purchase_valas) },
    { header: 'Pembelian (IDR)', key: 'purchase_idr', accessor: (r) => formatIDR(r.purchase_idr) },
    { header: 'Penjualan (Valas)', key: 'sale_valas', accessor: (r) => formatCurrency(r.sale_valas) },
    { header: 'Penjualan (IDR)', key: 'sale_idr', accessor: (r) => formatIDR(r.sale_idr) },
    { header: 'Stock Akhir (Valas)', key: 'ending_stock_valas', accessor: (r) => formatCurrency(r.ending_stock_valas) },
    { header: 'Stock Akhir (IDR)', key: 'ending_stock_idr', accessor: (r) => formatIDR(r.ending_stock_idr) },
    { header: 'Avg Rate', key: 'avg_rate', accessor: (r) => formatCurrency(r.avg_rate) },
    { header: 'Laba/Rugi', key: 'profit_loss', accessor: (r) => formatIDR(r.profit_loss) }
  ];

  const handleExportExcel = () => {
    if (mutasi.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }
    exportToExcel(mutasi, exportColumns, `Mutasi_Valas_${periodDate}`);
    toast.success('Export Excel berhasil');
  };

  const handleExportPDF = () => {
    if (mutasi.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }
    const formattedDate = format(new Date(periodDate), 'dd MMMM yyyy', { locale: localeId });
    exportToPDF(mutasi, exportColumns, `Mutasi_Valas_${periodDate}`, `Laporan Mutasi Valas - ${formattedDate}`, {
      name: companySettings.company_name || 'Mulia Bali Valuta',
      address: companySettings.company_address || '',
      phone: companySettings.company_phone || ''
    });
    toast.success('Export PDF berhasil');
  };

  const handlePrintTable = () => {
    if (mutasi.length === 0) {
      toast.error('Tidak ada data untuk dicetak');
      return;
    }
    const formattedDate = format(new Date(periodDate), 'dd MMMM yyyy', { locale: localeId });
    printTable(mutasi, exportColumns, `Laporan Mutasi Valas - ${formattedDate}`, {
      name: companySettings.company_name || 'Mulia Bali Valuta',
      address: companySettings.company_address || '',
      phone: companySettings.company_phone || '',
      footer: companySettings.receipt_footer || 'Terima kasih'
    });
  };

  // Check if there's any transaction for the period
  const hasTransactions = mutasi.some(item => item.transaction_count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Mutasi Valas
          </h1>
          <p className="text-[#D1FAE5] mt-2">Pencatatan mutasi mata uang asing per hari</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user?.role === 'admin' && (
            <Button 
              onClick={() => setShowRecalculateDialog(true)} 
              className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
            >
              <RefreshCw size={18} /> Perbaiki Data
            </Button>
          )}
          <Button onClick={handlePrintTable} className="btn-secondary flex items-center gap-2" disabled={mutasi.length === 0}>
            <Printer size={18} /> Cetak
          </Button>
          <Button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2" disabled={mutasi.length === 0}>
            <FileSpreadsheet size={18} /> Excel
          </Button>
          <Button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2" disabled={mutasi.length === 0}>
            <FileText size={18} /> PDF
          </Button>
        </div>
      </div>

      {/* Period Navigation & Filters */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Period Navigation */}
          <div className="flex items-center gap-2">
            <Button onClick={() => navigateDay(-1)} className="btn-secondary px-4 py-2 flex items-center gap-1">
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-4 py-2 min-w-[280px] justify-center">
              <Calendar size={18} className="text-[#D4AF37]" />
              <Input 
                type="date" 
                value={periodDate} 
                onChange={(e) => setPeriodDate(e.target.value)}
                className="bg-transparent border-none text-[#FEF3C7] w-40 text-center"
              />
              <span className="text-[#6EE7B7] text-sm hidden md:inline">
                {format(new Date(periodDate), 'EEEE', { locale: localeId })}
              </span>
            </div>
            <Button onClick={() => navigateDay(1)} className="btn-secondary px-4 py-2 flex items-center gap-1">
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight size={20} />
            </Button>
            <Button onClick={() => setPeriodDate(format(new Date(), 'yyyy-MM-dd'))} className="btn-primary text-sm px-4">
              Hari Ini
            </Button>
          </div>

          {/* Branch Selector */}
          {user?.role === 'admin' && branches.length > 0 && (
            <div className="w-full lg:w-64">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue placeholder="Pilih Cabang" />
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
        </div>

        {/* Current Period Display */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[#D4AF37] text-lg font-semibold text-center">
            Periode: {format(new Date(periodDate), 'dd MMMM yyyy', { locale: localeId })}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#D4AF37]/20">
            <Coins className="text-[#D4AF37]" size={24} />
          </div>
          <div className="text-sm">
            <p className="text-[#D1FAE5]">
              <strong>Saldo Awal</strong> = Saldo Akhir hari sebelumnya. 
              <strong> Pembelian</strong> = beli dari nasabah. 
              <strong> Penjualan</strong> = jual ke nasabah.
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-[#D4AF37] text-lg">Memuat data...</p>
        </div>
      )}

      {/* Mutasi Table */}
      {!loading && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold" rowSpan="2">Valas</th>
                  <th className="text-center py-2 px-4 text-[#D4AF37] font-semibold border-l border-r border-white/10" colSpan="2">
                    Stock Awal
                  </th>
                  <th className="text-center py-2 px-4 text-[#D4AF37] font-semibold border-r border-white/10" colSpan="2">
                    Pembelian
                  </th>
                  <th className="text-center py-2 px-4 text-[#D4AF37] font-semibold border-r border-white/10" colSpan="2">
                    Penjualan
                  </th>
                  <th className="text-center py-2 px-4 text-[#D4AF37] font-semibold border-r border-white/10" colSpan="2">
                    Stock Akhir
                  </th>
                  <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold" rowSpan="2">Avg Rate</th>
                  <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold" rowSpan="2">Laba/Rugi</th>
                </tr>
                <tr>
                  <th className="text-center py-2 px-4 text-[#6EE7B7] text-sm font-medium border-l border-white/10">Valas</th>
                  <th className="text-center py-2 px-4 text-[#6EE7B7] text-sm font-medium border-r border-white/10">Rupiah</th>
                  <th className="text-center py-2 px-4 text-[#6EE7B7] text-sm font-medium">Valas</th>
                  <th className="text-center py-2 px-4 text-[#6EE7B7] text-sm font-medium border-r border-white/10">Rupiah</th>
                  <th className="text-center py-2 px-4 text-[#6EE7B7] text-sm font-medium">Valas</th>
                  <th className="text-center py-2 px-4 text-[#6EE7B7] text-sm font-medium border-r border-white/10">Rupiah</th>
                  <th className="text-center py-2 px-4 text-[#6EE7B7] text-sm font-medium">Valas</th>
                  <th className="text-center py-2 px-4 text-[#6EE7B7] text-sm font-medium border-r border-white/10">Rupiah</th>
                </tr>
              </thead>
              <tbody>
                {mutasi.length > 0 ? (
                  mutasi.map((item) => (
                    <tr key={item.currency_code} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                      <td className="py-4 px-4">
                        <div>
                          <span className="mono text-[#D4AF37] font-bold text-lg">{item.currency_code}</span>
                          <p className="text-xs text-[#6EE7B7]">{item.currency_name}</p>
                        </div>
                      </td>
                      
                      {/* Stock Awal */}
                      <td className="py-4 px-4 text-center mono text-[#FEF3C7] border-l border-white/10">
                        {formatCurrency(item.beginning_stock_valas)}
                      </td>
                      <td className="py-4 px-4 text-center mono text-[#FEF3C7] border-r border-white/10">
                        {formatIDR(item.beginning_stock_idr)}
                      </td>
                      
                      {/* Pembelian */}
                      <td className="py-4 px-4 text-center mono text-emerald-400 font-semibold">
                        {item.purchase_valas > 0 ? formatCurrency(item.purchase_valas) : '-'}
                      </td>
                      <td className="py-4 px-4 text-center mono text-emerald-400 font-semibold border-r border-white/10">
                        {item.purchase_idr > 0 ? formatIDR(item.purchase_idr) : '-'}
                      </td>
                      
                      {/* Penjualan */}
                      <td className="py-4 px-4 text-center mono text-red-400 font-semibold">
                        {item.sale_valas > 0 ? formatCurrency(item.sale_valas) : '-'}
                      </td>
                      <td className="py-4 px-4 text-center mono text-red-400 font-semibold border-r border-white/10">
                        {item.sale_idr > 0 ? formatIDR(item.sale_idr) : '-'}
                      </td>
                      
                      {/* Stock Akhir */}
                      <td className="py-4 px-4 text-center mono text-[#D4AF37] font-bold">
                        {formatCurrency(item.ending_stock_valas)}
                      </td>
                      <td className="py-4 px-4 text-center mono text-[#D4AF37] font-bold border-r border-white/10">
                        {formatIDR(item.ending_stock_idr)}
                      </td>
                      
                      {/* Avg Rate */}
                      <td className="py-4 px-4 text-center mono text-[#FEF3C7]">
                        {item.ending_stock_valas > 0 ? formatCurrency(item.avg_rate) : '-'}
                      </td>
                      
                      {/* Laba/Rugi */}
                      <td className="py-4 px-4 text-center mono font-bold">
                        <span className={item.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {item.profit_loss !== 0 ? formatIDR(item.profit_loss) : '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center py-12 text-[#6EE7B7]">
                      Tidak ada data mata uang aktif
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Table IDR */}
      {mutasi.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="bg-emerald-900/50 px-4 py-3 border-b border-white/10">
            <h3 className="text-lg font-bold text-[#D4AF37]">Ringkasan Total Rupiah</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold">Keterangan</th>
                  <th className="text-right py-3 px-4 text-[#D4AF37] font-semibold">Jumlah (IDR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 text-[#FEF3C7]">Total Stock Awal (Rupiah)</td>
                  <td className="py-3 px-4 text-right mono text-[#FEF3C7] font-semibold">
                    {formatIDR(mutasi.reduce((sum, item) => sum + item.beginning_stock_idr, 0))}
                  </td>
                </tr>
                <tr className="border-b border-white/5 bg-emerald-900/10">
                  <td className="py-3 px-4 text-emerald-400">+ Total Pembelian (Rupiah)</td>
                  <td className="py-3 px-4 text-right mono text-emerald-400 font-semibold">
                    {formatIDR(mutasi.reduce((sum, item) => sum + item.purchase_idr, 0))}
                  </td>
                </tr>
                <tr className="border-b border-white/5 bg-red-900/10">
                  <td className="py-3 px-4 text-red-400">- Total Penjualan (Rupiah)</td>
                  <td className="py-3 px-4 text-right mono text-red-400 font-semibold">
                    {formatIDR(mutasi.reduce((sum, item) => sum + item.sale_idr, 0))}
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 text-[#D4AF37] font-bold">Total Stock Akhir (Rupiah)</td>
                  <td className="py-3 px-4 text-right mono text-[#D4AF37] font-bold text-lg">
                    {formatIDR(mutasi.reduce((sum, item) => sum + item.ending_stock_idr, 0))}
                  </td>
                </tr>
                <tr className="bg-white/5">
                  <td className="py-3 px-4 text-[#FEF3C7] font-bold">Laba/Rugi Hari Ini</td>
                  <td className={`py-3 px-4 text-right mono font-bold text-lg ${
                    mutasi.reduce((sum, item) => sum + item.profit_loss, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatIDR(mutasi.reduce((sum, item) => sum + item.profit_loss, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {mutasi.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-[#6EE7B7] text-sm mb-1">Transaksi Hari Ini</p>
            <p className="text-2xl font-bold text-[#FEF3C7] mono">
              {mutasi.reduce((sum, item) => sum + item.transaction_count, 0)}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-[#6EE7B7] text-sm mb-1">Total Pembelian</p>
            <p className="text-xl font-bold text-emerald-400 mono">
              {formatIDR(mutasi.reduce((sum, item) => sum + item.purchase_idr, 0))}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-[#6EE7B7] text-sm mb-1">Total Penjualan</p>
            <p className="text-xl font-bold text-red-400 mono">
              {formatIDR(mutasi.reduce((sum, item) => sum + item.sale_idr, 0))}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-[#6EE7B7] text-sm mb-1">Laba/Rugi Hari Ini</p>
            <p className={`text-xl font-bold mono ${
              mutasi.reduce((sum, item) => sum + item.profit_loss, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {formatIDR(mutasi.reduce((sum, item) => sum + item.profit_loss, 0))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MutasiValasNew;
