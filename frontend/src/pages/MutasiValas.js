import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Coins } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';

const MutasiValas = () => {
  const { user } = useAuth();
  const [mutasi, setMutasi] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch || user?.branch_id) {
      fetchMutasi();
    }
  }, [selectedBranch, user]);

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

  const fetchMutasi = async () => {
    try {
      const branchParam = user?.role === 'admin' && selectedBranch ? `?branch_id=${selectedBranch}` : '';
      const response = await api.get(`/mutasi-valas${branchParam}`);
      setMutasi(response.data);
    } catch (error) {
      toast.error('Gagal memuat mutasi valas');
    } finally {
      setLoading(false);
    }
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
            Mutasi Valas
          </h1>
          <p className="text-[#D1FAE5] mt-2">Pencatatan mutasi mata uang asing</p>
        </div>
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
              Mutasi valas mencatat pergerakan stok mata uang asing berdasarkan transaksi yang dilakukan.
              Data ini dihitung otomatis dari transaksi beli dan jual yang tercatat dalam sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Mutasi Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Tanggal</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Mata Uang</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Stok Awal</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Pembelian</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Penjualan</th>
                <th className="text-right py-4 px-4 text-[#D4AF37] font-semibold">Stok Akhir</th>
              </tr>
            </thead>
            <tbody>
              {mutasi.length > 0 ? (
                mutasi.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                    <td className="py-4 px-4 text-[#FEF3C7]">
                      {format(new Date(item.date), 'dd MMM yyyy', { locale: localeId })}
                    </td>
                    <td className="py-4 px-4">
                      <span className="mono text-[#D4AF37] font-bold text-lg">{item.currency_code}</span>
                    </td>
                    <td className="py-4 px-4 text-right mono text-[#FEF3C7]">
                      {item.beginning_stock.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right mono text-emerald-400">
                      +{item.purchase.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right mono text-red-400">
                      -{item.sale.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right mono text-[#D4AF37] font-bold">
                      {item.ending_stock.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[#6EE7B7]">
                    Belum ada data mutasi valas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MutasiValas;