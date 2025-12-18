import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

const AdvancedAnalytics = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/trends');
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Gagal memuat analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading || !analytics) {
    return <div className="text-[#6EE7B7]">Memuat analytics...</div>;
  }

  const { daily_trend, top_currencies, peak_hours, comparison } = analytics;

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-3xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
        {t('advanced_analytics')}
      </h2>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[#6EE7B7] text-sm mb-1">{t('revenue_trend')}</p>
              <p className="text-2xl font-bold text-[#FEF3C7] mono">{formatCurrency(comparison.current_revenue)}</p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${comparison.revenue_change_percent >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {comparison.revenue_change_percent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-semibold">{Math.abs(comparison.revenue_change_percent).toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-[#6EE7B7] text-sm">
            vs {formatCurrency(comparison.previous_revenue)} ({t('previous_period')})
          </p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[#6EE7B7] text-sm mb-1">{t('transaction_trend')}</p>
              <p className="text-2xl font-bold text-[#FEF3C7]">{comparison.current_transactions}</p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${comparison.transaction_change_percent >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {comparison.transaction_change_percent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-semibold">{Math.abs(comparison.transaction_change_percent).toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-[#6EE7B7] text-sm">
            vs {comparison.previous_transactions} ({t('previous_period')})
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#FEF3C7] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('revenue_trend')} (7 Hari)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={daily_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#6EE7B7" />
              <YAxis stroke="#6EE7B7" />
              <Tooltip 
                formatter={(value) => formatCurrency(value)} 
                contentStyle={{ backgroundColor: '#064E3B', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Currencies */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#FEF3C7] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('top_currencies')}
          </h3>
          <div className="space-y-3">
            {top_currencies.map((curr, idx) => (
              <div key={curr.currency} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#D4AF37]">#{idx + 1}</span>
                  <span className="text-lg font-semibold mono text-[#FEF3C7]">{curr.currency}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#D4AF37]">{formatCurrency(curr.total)}</p>
                  <p className="text-xs text-[#6EE7B7]">{curr.count} transaksi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Hours */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#FEF3C7] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          <Clock className="inline mr-2" size={24} />
          {t('peak_hours')}
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={peak_hours}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="hour" stroke="#6EE7B7" />
            <YAxis stroke="#6EE7B7" />
            <Tooltip contentStyle={{ backgroundColor: '#064E3B', border: '1px solid rgba(255,255,255,0.1)' }} />
            <Bar dataKey="count" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
