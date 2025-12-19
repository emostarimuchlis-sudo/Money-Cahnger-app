import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { toast } from 'sonner';
import {
  TrendingUp,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import AdvancedAnalytics from '../components/AdvancedAnalytics';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Mulia Bali Valuta (MBA Money Changer)');

  useEffect(() => {
    fetchDashboardStats();
    fetchCompanySettings();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCompanySettings = async () => {
    try {
      const response = await api.get('/settings/company');
      if (response.data?.company_name) {
        setCompanyName(response.data.company_name + ' Money Changer');
      }
    } catch (error) {
      console.log('Using default company name');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="glass-card rounded-xl p-6 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#6EE7B7] text-sm mb-2">{label}</p>
          <p className="text-3xl font-bold text-[#FEF3C7]">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`text-${color}-400`} size={24} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37] text-xl">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-4xl lg:text-5xl font-bold text-[#D4AF37] mb-2"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Dashboard
        </h1>
        <p className="text-[#D1FAE5] text-lg">
          Selamat datang, {user?.name}!
        </p>
      </div>

      {/* Company Info Section */}
      <div className="glass-card rounded-2xl p-8 lg:p-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2
              className="text-3xl lg:text-4xl font-bold text-[#FEF3C7] mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {companyName}
            </h2>
            <p className="text-[#D4AF37] text-xl mb-4 font-semibold">MBA Money Changer</p>
            <p className="text-[#D1FAE5] text-lg mb-6 leading-relaxed">
              Layanan penukaran mata uang asing terpercaya di Bali, Indonesia. Kami menyediakan kurs kompetitif dengan pelayanan profesional untuk kebutuhan valuta asing Anda.
            </p>
            <div className="space-y-2 text-[#6EE7B7]">
              <p>📍 Lokasi: Bali, Indonesia</p>
              <p>⏰ Operasional: Senin - Sabtu, 09:00 - 18:00 WITA</p>
              <p>💰 Berbagai mata uang tersedia</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1746173098263-8262c7725b1e?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt="MBA Money Changer Office"
              className="w-full h-64 lg:h-80 object-cover"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid - Only for Admin and Kasir */}
      {(user?.role === 'admin' || user?.role === 'kasir') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            data-testid="stat-transactions"
            icon={TrendingUp}
            label="Transaksi Hari Ini"
            value={stats?.total_transactions_today || 0}
            color="emerald"
          />
          <StatCard
            data-testid="stat-revenue"
            icon={ArrowUpRight}
            label="Pendapatan Hari Ini"
            value={formatCurrency(stats?.total_revenue_today || 0)}
            color="amber"
          />
          <StatCard
            data-testid="stat-customers"
            icon={Users}
            label="Total Nasabah"
            value={stats?.total_customers || 0}
            color="blue"
          />
          {user?.role === 'admin' && (
            <StatCard
              data-testid="stat-branches"
              icon={Building2}
              label="Cabang Aktif"
              value={stats?.total_branches || 0}
              color="purple"
            />
          )}
        </div>
      )}

      {/* Recent Transactions - Only for Admin and Kasir */}
      {(user?.role === 'admin' || user?.role === 'kasir') && (
        <div className="glass-card rounded-xl p-6 lg:p-8">
        <h3 className="text-2xl font-bold text-[#FEF3C7] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
          Transaksi Terbaru
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold">No. Transaksi</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold">Nasabah</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold">Mata Uang</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold">Tipe</th>
                <th className="text-right py-3 px-4 text-[#D4AF37] font-semibold">Total (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_transactions?.length > 0 ? (
                stats.recent_transactions.map((trx) => (
                  <tr key={trx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                    <td className="py-3 px-4">
                      <span className="mono text-[#6EE7B7]">{trx.transaction_number}</span>
                    </td>
                    <td className="py-3 px-4 text-[#FEF3C7]">{trx.customer_name}</td>
                    <td className="py-3 px-4">
                      <span className="mono text-[#D4AF37]">{trx.currency_code}</span>
                    </td>
                    <td className="py-3 px-4">
                      {trx.transaction_type === 'buy' ? (
                        <span className="flex items-center gap-1 text-blue-400">
                          <ArrowDownRight size={16} /> Beli
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <ArrowUpRight size={16} /> Jual
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="mono text-[#FEF3C7] font-semibold">
                        {formatCurrency(trx.total_idr)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[#6EE7B7]">
                    Belum ada transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Advanced Analytics - Only for Admin and Kasir */}
      {(user?.role === 'admin' || user?.role === 'kasir') && (
        <AdvancedAnalytics />
      )}

      {/* Message for Teller */}
      {user?.role === 'teller' && (
        <div className="glass-card rounded-xl p-8 text-center">
          <h3 className="text-xl font-bold text-[#D4AF37] mb-2">Selamat Bekerja!</h3>
          <p className="text-[#6EE7B7]">Anda dapat mengakses menu Transaksi dan Data Nasabah untuk mengelola transaksi harian.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;