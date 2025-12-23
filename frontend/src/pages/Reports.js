import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { FileText, Download, Calendar, Users, FileSpreadsheet, Printer, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [sipesatData, setSipesatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [companySettings, setCompanySettings] = useState({});

  useEffect(() => {
    fetchBranches();
    fetchCompanySettings();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Failed to fetch branches');
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

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Pilih tanggal mulai dan tanggal akhir');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/reports/transactions', {
        params: { start_date: startDate, end_date: endDate, branch_id: selectedBranch || undefined }
      });
      setReportData(response.data);
      toast.success('Laporan berhasil dibuat');
    } catch (error) {
      toast.error('Gagal membuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const fetchSipesat = async () => {
    if (!startDate || !endDate) {
      toast.error('Pilih tanggal mulai dan tanggal akhir');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/reports/sipesat', {
        params: { start_date: startDate, end_date: endDate, branch_id: selectedBranch || undefined }
      });
      setSipesatData(response.data);
      toast.success('Data SIPESAT berhasil dimuat');
    } catch (error) {
      toast.error('Gagal memuat data SIPESAT');
    } finally {
      setLoading(false);
    }
  };

  const exportTransactionsToExcel = () => {
    if (!reportData || !reportData.transactions) return;

    const ws = XLSX.utils.json_to_sheet(
      reportData.transactions.map(t => ({
        'No. Transaksi': t.transaction_number,
        'Tanggal': format(new Date(t.transaction_date), 'dd/MM/yyyy'),
        'Nasabah': t.customer_name,
        'Tipe': t.transaction_type === 'beli' || t.transaction_type === 'buy' ? 'Beli' : 'Jual',
        'Mata Uang': t.currency_code,
        'Jumlah': t.amount,
        'Kurs': t.exchange_rate,
        'Total IDR': t.total_idr
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    XLSX.writeFile(wb, `Laporan_Transaksi_${startDate}_${endDate}.xlsx`);
    toast.success('Data berhasil diekspor ke Excel');
  };

  const exportSipesatToExcel = () => {
    if (!sipesatData || !sipesatData.data) return;

    const ws = XLSX.utils.json_to_sheet(
      sipesatData.data.map(d => ({
        'IDPJK': d.idpjk,
        'NASABAH': d.jenis_nasabah,
        'NAMA': d.nama,
        'TEMPAT_LAHIR': d.tempat_lahir,
        'TANGGAL_LAHIR': d.tanggal_lahir,
        'ALAMAT': d.alamat,
        'KTP': d.ktp,
        'IDENTITAS_LAIN': d.identitas_lain,
        'KEPESERTAAN': d.kepesertaan,
        'NPWP': d.npwp
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SIPESAT');
    XLSX.writeFile(wb, `SIPESAT_${startDate}_${endDate}.xlsx`);
    toast.success('Data SIPESAT berhasil diekspor ke Excel');
  };

  const printSipesat = () => {
    if (!sipesatData || !sipesatData.data) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Izinkan popup untuk mencetak.');
      return;
    }

    const tableRows = sipesatData.data.map(d => `
      <tr>
        <td>${d.idpjk || '-'}</td>
        <td>${d.jenis_nasabah}</td>
        <td>${d.nama || '-'}</td>
        <td>${d.tempat_lahir || '-'}</td>
        <td>${d.tanggal_lahir || '-'}</td>
        <td>${d.alamat || '-'}</td>
        <td>${d.ktp || '-'}</td>
        <td>${d.identitas_lain || '-'}</td>
        <td>${d.kepesertaan || '-'}</td>
        <td>${d.npwp || '-'}</td>
      </tr>
    `).join('');

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>SIPESAT - ${companySettings.company_name || 'Mulia Bali Valuta'}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9px; }
    .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; }
    .header h1 { font-size: 14px; color: #1e3a5f; margin-bottom: 3px; }
    .header .subtitle { font-size: 11px; color: #666; }
    .header .company { font-size: 12px; font-weight: bold; color: #d4af37; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a5f; color: white; padding: 6px 4px; text-align: left; font-size: 8px; }
    td { padding: 5px 4px; border-bottom: 1px solid #ddd; font-size: 8px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .summary { margin-top: 15px; font-size: 10px; }
    .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #666; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">${companySettings.company_name || 'Mulia Bali Valuta'}</div>
    <h1>SIPESAT - Sistem Informasi Pengguna Jasa Terpadu</h1>
    <div class="subtitle">Periode: ${startDate} s/d ${endDate}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>IDPJK</th>
        <th>NASABAH</th>
        <th>NAMA</th>
        <th>TEMPAT LAHIR</th>
        <th>TGL LAHIR</th>
        <th>ALAMAT</th>
        <th>KTP</th>
        <th>ID LAIN</th>
        <th>KEPESERTAAN</th>
        <th>NPWP</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <div class="summary">
    <strong>Ringkasan:</strong> ${sipesatData.summary.total_nasabah} Nasabah 
    (Perorangan: ${sipesatData.summary.perorangan}, Badan Usaha: ${sipesatData.summary.badan_usaha})
  </div>
  
  <div class="footer">
    Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })} | 
    Dokumen ini sah tanpa tanda tangan
  </div>
  
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    toast.success('Membuka halaman cetak SIPESAT...');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const COLORS = ['#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  const pieData = reportData
    ? [
        { name: 'Pembelian', value: reportData.summary.total_buy },
        { name: 'Penjualan', value: reportData.summary.total_sell },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Laporan
        </h1>
        <p className="text-[#D1FAE5] mt-2">Analisis dan ekspor data transaksi</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-emerald-900/30 mb-6">
          <TabsTrigger value="transactions" className="flex items-center gap-2 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#064E3B]">
            <FileText size={18} /> Laporan Transaksi
          </TabsTrigger>
          <TabsTrigger value="sipesat" className="flex items-center gap-2 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#064E3B]">
            <Users size={18} /> SIPESAT
          </TabsTrigger>
        </TabsList>

        {/* Transaction Report Tab */}
        <TabsContent value="transactions">
          {/* Filter Section */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-[#FEF3C7] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              <Calendar className="inline mr-2" size={24} />
              Periode Laporan
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
              {user?.role === 'admin' && (
                <div>
                  <Label className="text-[#FEF3C7]">Cabang</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                      <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Cabang</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-end">
                <Button onClick={fetchReport} disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Memuat...' : 'Buat Laporan'}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {reportData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="glass-card rounded-xl p-6">
                  <p className="text-[#6EE7B7] text-sm mb-2">Total Transaksi</p>
                  <p className="text-3xl font-bold text-[#FEF3C7]">
                    {reportData.summary.total_transactions}
                  </p>
                </div>
                <div className="glass-card rounded-xl p-6">
                  <p className="text-[#6EE7B7] text-sm mb-2">Total Pembelian</p>
                  <p className="text-xl font-bold text-blue-400 mono">
                    {formatCurrency(reportData.summary.total_buy)}
                  </p>
                </div>
                <div className="glass-card rounded-xl p-6">
                  <p className="text-[#6EE7B7] text-sm mb-2">Total Penjualan</p>
                  <p className="text-xl font-bold text-emerald-400 mono">
                    {formatCurrency(reportData.summary.total_sell)}
                  </p>
                </div>
                <div className="glass-card rounded-xl p-6">
                  <p className="text-[#6EE7B7] text-sm mb-2">Net Revenue</p>
                  <p className={`text-xl font-bold mono ${reportData.summary.net_revenue >= 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                    {formatCurrency(reportData.summary.net_revenue)}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="glass-card rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-[#FEF3C7] mb-4">Distribusi Transaksi</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-center">
                <Button onClick={exportTransactionsToExcel} className="btn-primary flex items-center gap-2 px-8">
                  <FileSpreadsheet size={18} />
                  Export ke Excel
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* SIPESAT Tab */}
        <TabsContent value="sipesat">
          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
            <h4 className="text-[#D4AF37] font-semibold mb-2 flex items-center gap-2">
              <Building2 size={18} />
              SIPESAT - Sistem Informasi Pengguna Jasa Terpadu
            </h4>
            <p className="text-gray-300 text-sm">
              Laporan ini berisi data nasabah yang melakukan transaksi pada periode tertentu sesuai format pelaporan Bank Indonesia.
            </p>
          </div>

          {/* Filter Section */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-[#FEF3C7] mb-4">
              <Calendar className="inline mr-2" size={24} />
              Periode Laporan SIPESAT
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
              {user?.role === 'admin' && (
                <div>
                  <Label className="text-[#FEF3C7]">Cabang</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                      <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Cabang</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-end">
                <Button onClick={fetchSipesat} disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Memuat...' : 'Generate SIPESAT'}
                </Button>
              </div>
            </div>
          </div>

          {/* SIPESAT Data */}
          {sipesatData && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-[#6EE7B7] text-sm mb-1">Total Nasabah</p>
                  <p className="text-2xl font-bold text-[#FEF3C7]">{sipesatData.summary.total_nasabah}</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-[#6EE7B7] text-sm mb-1">Perorangan (1)</p>
                  <p className="text-2xl font-bold text-blue-400">{sipesatData.summary.perorangan}</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-[#6EE7B7] text-sm mb-1">Badan Usaha (2)</p>
                  <p className="text-2xl font-bold text-emerald-400">{sipesatData.summary.badan_usaha}</p>
                </div>
              </div>

              {/* Table */}
              <div className="glass-card rounded-xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-emerald-900/50">
                      <tr>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">IDPJK</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">NASABAH</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">NAMA</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">TEMPAT LAHIR</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">TGL LAHIR</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">ALAMAT</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">KTP</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">ID LAIN</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">KEPESERTAAN</th>
                        <th className="text-left py-3 px-3 text-[#D4AF37] font-semibold text-xs">NPWP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sipesatData.data.length > 0 ? sipesatData.data.map((d, idx) => (
                        <tr key={idx} className="border-b border-emerald-800/30 hover:bg-emerald-900/20">
                          <td className="py-2 px-3 text-gray-400 text-xs">{d.idpjk || '-'}</td>
                          <td className="py-2 px-3 text-white text-xs text-center">
                            <span className={`px-2 py-0.5 rounded text-xs ${d.jenis_nasabah === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                              {d.jenis_nasabah}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-white text-xs font-medium">{d.nama || '-'}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs">{d.tempat_lahir || '-'}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs">{d.tanggal_lahir || '-'}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs max-w-[150px] truncate">{d.alamat || '-'}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs font-mono">{d.ktp || '-'}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs font-mono">{d.identitas_lain || '-'}</td>
                          <td className="py-2 px-3 text-[#D4AF37] text-xs font-mono">{d.kepesertaan || '-'}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs font-mono">{d.npwp || '-'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="10" className="py-8 text-center text-gray-500">
                            Tidak ada data untuk periode ini
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex justify-center gap-4">
                <Button onClick={printSipesat} className="btn-secondary flex items-center gap-2 px-6">
                  <Printer size={18} />
                  Cetak
                </Button>
                <Button onClick={exportSipesatToExcel} className="btn-primary flex items-center gap-2 px-6">
                  <FileSpreadsheet size={18} />
                  Export Excel
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
