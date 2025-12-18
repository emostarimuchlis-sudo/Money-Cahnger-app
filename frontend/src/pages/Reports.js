import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { FileText, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Pilih tanggal mulai dan tanggal akhir');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/reports/transactions', {
        params: { start_date: startDate, end_date: endDate }
      });
      setReportData(response.data);
      toast.success('Laporan berhasil dibuat');
    } catch (error) {
      toast.error('Gagal membuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData || !reportData.transactions) return;

    const ws = XLSX.utils.json_to_sheet(
      reportData.transactions.map(t => ({
        'No. Transaksi': t.transaction_number,
        'Tanggal': format(new Date(t.transaction_date), 'dd/MM/yyyy'),
        'Nasabah': t.customer_name,
        'Tipe': t.transaction_type === 'buy' ? 'Beli' : 'Jual',
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
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

      {/* Filter Section */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#FEF3C7] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          <Calendar className="inline mr-2" size={24} />
          Periode Laporan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-[#FEF3C7]">Tanggal Mulai</Label>
            <Input
              data-testid="report-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-black/20 border-white/10 text-[#FEF3C7]"
            />
          </div>
          <div>
            <Label className="text-[#FEF3C7]">Tanggal Akhir</Label>
            <Input
              data-testid="report-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-black/20 border-white/10 text-[#FEF3C7]"
            />
          </div>
          <div className="flex items-end">
            <Button
              data-testid="generate-report-button"
              onClick={fetchReport}
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Memuat...' : 'Buat Laporan'}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card rounded-xl p-6">
              <p className="text-[#6EE7B7] text-sm mb-2">Total Transaksi</p>
              <p className="text-3xl font-bold text-[#FEF3C7]">
                {reportData.summary.total_transactions}
              </p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <p className="text-[#6EE7B7] text-sm mb-2">Total Pembelian</p>
              <p className="text-2xl font-bold text-blue-400 mono">
                {formatCurrency(reportData.summary.total_buy)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <p className="text-[#6EE7B7] text-sm mb-2">Total Penjualan</p>
              <p className="text-2xl font-bold text-emerald-400 mono">
                {formatCurrency(reportData.summary.total_sell)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-[#D4AF37]/20 to-transparent">
              <p className="text-[#D4AF37] text-sm mb-2 font-semibold">Pendapatan Bersih</p>
              <p className="text-2xl font-bold text-[#D4AF37] mono">
                {formatCurrency(reportData.summary.net_revenue)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#FEF3C7] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Distribusi Transaksi
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#FEF3C7] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Perbandingan
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#6EE7B7" />
                  <YAxis stroke="#6EE7B7" />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#064E3B', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="value" fill="#D4AF37" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button
              data-testid="export-excel-button"
              onClick={exportToExcel}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <Download size={20} />
              <span>Export ke Excel</span>
            </Button>
          </div>

          {/* Transactions Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-[#FEF3C7]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Detail Transaksi
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">No. Transaksi</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Tanggal</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Nasabah</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Tipe</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Mata Uang</th>
                    <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Total (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.transactions.slice(0, 50).map((transaction) => (
                    <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                      <td className="py-4 px-4">
                        <span className="mono text-[#6EE7B7]">{transaction.transaction_number}</span>
                      </td>
                      <td className="py-4 px-4 text-[#FEF3C7]">
                        {format(new Date(transaction.transaction_date), 'dd MMM yyyy', { locale: localeId })}
                      </td>
                      <td className="py-4 px-4 text-[#FEF3C7]">{transaction.customer_name}</td>
                      <td className="py-4 px-4 text-[#FEF3C7] capitalize">
                        {transaction.transaction_type === 'buy' ? 'Beli' : 'Jual'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="mono text-[#D4AF37] font-semibold">{transaction.currency_code}</span>
                      </td>
                      <td className="py-4 px-4 text-right mono text-[#D4AF37] font-semibold">
                        {formatCurrency(transaction.total_idr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reportData.transactions.length > 50 && (
              <div className="p-4 text-center text-[#6EE7B7]">
                Menampilkan 50 dari {reportData.transactions.length} transaksi. Export untuk melihat semua data.
              </div>
            )}
          </div>
        </>
      )}

      {!reportData && (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="mx-auto mb-4 text-[#D4AF37]" size={64} />
          <h3 className="text-2xl font-bold text-[#FEF3C7] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Pilih Periode Laporan
          </h3>
          <p className="text-[#D1FAE5]">
            Pilih tanggal mulai dan akhir untuk membuat laporan transaksi
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;