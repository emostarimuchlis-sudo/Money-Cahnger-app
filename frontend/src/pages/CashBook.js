import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';

const CashBook = () => {
  const { user } = useAuth();
  const [cashbook, setCashbook] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    entry_type: 'debit',
    amount: '',
    description: '',
    branch_id: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch || user?.branch_id) {
      fetchCashbook();
    }
  }, [selectedBranch, user]);

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

  const fetchCashbook = async () => {
    try {
      const branchParam = user?.role === 'admin' && selectedBranch ? `?branch_id=${selectedBranch}` : '';
      const response = await api.get(`/cashbook${branchParam}`);
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
        branch_id: user?.role === 'admin' ? formData.branch_id : user?.branch_id
      });
      toast.success('Entri berhasil ditambahkan');
      setShowDialog(false);
      resetForm();
      fetchCashbook();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan entri');
    }
  };

  const resetForm = () => {
    setFormData({
      entry_type: 'debit',
      amount: '',
      description: '',
      branch_id: user?.branch_id || ''
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
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
          <p className="text-[#D1FAE5] mt-2">Kelola pencatatan debit dan kredit</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && branches.length > 0 && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10 text-[#FEF3C7]">
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
          )}
          <Button
            data-testid="create-cashbook-entry-button"
            onClick={() => setShowDialog(true)}
            className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Tambah Entri</span>
          </Button>
        </div>
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
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Deskripsi</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {cashbook?.entries?.length > 0 ? (
                cashbook.entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                    <td className="py-4 px-4 text-[#FEF3C7]">
                      {format(new Date(entry.date), 'dd MMM yyyy HH:mm', { locale: localeId })}
                    </td>
                    <td className="py-4 px-4">
                      {entry.entry_type === 'debit' ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <TrendingUp size={16} /> Debit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400">
                          <TrendingDown size={16} /> Kredit
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7]">{entry.description}</td>
                    <td className="py-4 px-4 text-right">
                      <span className={`mono font-semibold ${entry.entry_type === 'debit' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-[#6EE7B7]">
                    Belum ada entri
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Entry Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Tambah Entri Buku Kas
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry_type" className="text-[#FEF3C7]">Tipe Entri</Label>
                <Select
                  value={formData.entry_type}
                  onValueChange={(value) => setFormData({ ...formData, entry_type: value })}
                >
                  <SelectTrigger data-testid="cashbook-type-select" className="bg-black/20 border-white/10 text-[#FEF3C7]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#064E3B] border-white/10">
                    <SelectItem value="debit" className="text-[#FEF3C7]">Debit (Pemasukan)</SelectItem>
                    <SelectItem value="credit" className="text-[#FEF3C7]">Kredit (Pengeluaran)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount" className="text-[#FEF3C7]">Jumlah (IDR)</Label>
                <Input
                  data-testid="cashbook-amount-input"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-black/20 border-white/10 text-[#FEF3C7]"
                  required
                />
              </div>

              {user?.role === 'admin' && (
                <div className="md:col-span-2">
                  <Label htmlFor="branch" className="text-[#FEF3C7]">Cabang</Label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  >
                    <SelectTrigger data-testid="cashbook-branch-select" className="bg-black/20 border-white/10 text-[#FEF3C7]">
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
            </div>

            <div>
              <Label htmlFor="description" className="text-[#FEF3C7]">Deskripsi</Label>
              <Input
                data-testid="cashbook-description-input"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-black/20 border-white/10 text-[#FEF3C7]"
                required
                placeholder="Keterangan transaksi..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" data-testid="cashbook-submit-button" className="btn-primary flex-1">
                Simpan Entri
              </Button>
              <Button type="button" onClick={() => { setShowDialog(false); resetForm(); }} className="btn-secondary flex-1">
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashBook;