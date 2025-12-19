import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Coins, Calendar, Printer, FileSpreadsheet, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { exportToExcel, exportToPDF, printTable } from '../utils/exportUtils';

const MutasiValasNew = () => {
  const { user } = useAuth();
  const [mutasi, setMutasi] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [companySettings, setCompanySettings] = useState({});

  useEffect(() => {
    fetchCompanySettings();
    fetchBranches();
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchMutasi();
    }
  }, [selectedBranch, startDate, endDate, user]);

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
      const response = await api.get(`/mutasi-valas/calculate?start_date=${startDate}&end_date=${endDate}${branchParam}`);
      setMutasi(response.data);
    } catch (error) {
      toast.error('Gagal memuat mutasi valas');
    } finally {
      setLoading(false);
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
    exportToExcel(mutasi, exportColumns, 'Mutasi_Valas');
    toast.success('Export Excel berhasil');
  };

  const handleExportPDF = () => {
    exportToPDF(mutasi, exportColumns, 'Mutasi_Valas', `Laporan Mutasi Valas (${startDate} - ${endDate})`, {
      name: companySettings.company_name || 'Mulia Bali Valuta',
      address: companySettings.company_address || '',
      phone: companySettings.company_phone || ''
    });
    toast.success('Export PDF berhasil');
  };

  const handlePrintTable = () => {
    printTable(mutasi, exportColumns, `Laporan Mutasi Valas (${startDate} - ${endDate})`, {
      name: companySettings.company_name || 'Mulia Bali Valuta',
      address: companySettings.company_address || '',
      phone: companySettings.company_phone || '',
      footer: companySettings.receipt_footer || 'Terima kasih'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Mutasi Valas
          </h1>
          <p className="text-[#D1FAE5] mt-2">Pencatatan mutasi mata uang asing berdasarkan transaksi</p>
        </div>
        <div className="flex flex-wrap gap-3">
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

      {/* Info Card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-[#D4AF37]/20">
            <Coins className="text-[#D4AF37]" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#FEF3C7] mb-2">Tentang Mutasi Valas</h3>
            <p className="text-[#D1FAE5] leading-relaxed">
              Mutasi valas dihitung otomatis dari transaksi. <strong>Pembelian</strong> adalah saat kami membeli dari customer (customer jual). 
              <strong> Penjualan</strong> adalah saat kami jual ke customer (customer beli).
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#FEF3C7] mb-4 flex items-center gap-2">
          <Calendar size={24} />
          Filter Periode
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-[#FEF3C7]">Tanggal Mulai</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-black/20 border-white/10 text-[#FEF3C7]"
            />
          </div>
          <div>
            <Label className="text-[#FEF3C7]">Tanggal Akhir</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-black/20 border-white/10 text-[#FEF3C7]"
            />
          </div>
          {user?.role === 'admin' && branches.length > 0 && (
            <div>
              <Label className="text-[#FEF3C7]">Cabang</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue />
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
          <div className="flex items-end">
            <Button
              onClick={fetchMutasi}
              disabled={loading || !startDate || !endDate}
              className="btn-primary w-full"
            >
              {loading ? 'Memuat...' : 'Lihat Mutasi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mutasi Table */}
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
                      {formatCurrency(item.purchase_valas)}
                    </td>
                    <td className="py-4 px-4 text-center mono text-emerald-400 font-semibold border-r border-white/10">
                      {formatIDR(item.purchase_idr)}
                    </td>
                    
                    {/* Penjualan */}
                    <td className="py-4 px-4 text-center mono text-red-400 font-semibold">
                      {formatCurrency(item.sale_valas)}
                    </td>
                    <td className="py-4 px-4 text-center mono text-red-400 font-semibold border-r border-white/10">
                      {formatIDR(item.sale_idr)}
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
                      {formatCurrency(item.avg_rate)}
                    </td>
                    
                    {/* Laba/Rugi */}
                    <td className="py-4 px-4 text-center mono font-bold">
                      <span className={item.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatIDR(item.profit_loss)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-[#6EE7B7]">
                    {loading ? 'Memuat data...' : 'Tidak ada data mutasi untuk periode yang dipilih'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {mutasi.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-6">
            <p className="text-[#6EE7B7] text-sm mb-2">Total Pembelian</p>
            <p className="text-2xl font-bold text-emerald-400 mono">
              {formatIDR(mutasi.reduce((sum, item) => sum + item.purchase_idr, 0))}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6">
            <p className="text-[#6EE7B7] text-sm mb-2">Total Penjualan</p>
            <p className="text-2xl font-bold text-red-400 mono">
              {formatIDR(mutasi.reduce((sum, item) => sum + item.sale_idr, 0))}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6">
            <p className="text-[#6EE7B7] text-sm mb-2">Total Laba/Rugi</p>
            <p className={`text-2xl font-bold mono ${
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
