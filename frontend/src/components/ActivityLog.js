import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Activity, User, Clock, LogIn, LogOut, Filter, RefreshCw, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [userStatus, setUserStatus] = useState({ users: [], online_count: 0, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statusRes, usersRes] = await Promise.all([
        api.get('/activity-logs', {
          params: {
            user_id: selectedUser === 'all' ? undefined : selectedUser,
            action: selectedAction === 'all' ? undefined : selectedAction,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            limit: 200
          }
        }),
        api.get('/users/online-status'),
        api.get('/users')
      ]);
      setLogs(logsRes.data);
      setUserStatus(statusRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Gagal memuat data aktivitas');
    } finally {
      setLoading(false);
    }
  }, [selectedUser, selectedAction, startDate, endDate]);

  useEffect(() => {
    fetchData();
    
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'login':
        return <LogIn size={14} className="text-emerald-400" />;
      case 'logout':
        return <LogOut size={14} className="text-red-400" />;
      case 'lock_sipesat':
        return <Activity size={14} className="text-amber-400" />;
      default:
        return <Activity size={14} className="text-blue-400" />;
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      'login': 'Login',
      'logout': 'Logout',
      'lock_sipesat': 'Kunci SIPESAT',
      'create_transaction': 'Buat Transaksi',
      'update_transaction': 'Update Transaksi',
      'delete_transaction': 'Hapus Transaksi',
      'create_customer': 'Buat Nasabah',
      'update_customer': 'Update Nasabah',
      'delete_customer': 'Hapus Nasabah'
    };
    return labels[action] || action;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      return format(new Date(timestamp), 'dd MMM yyyy HH:mm:ss', { locale: localeId });
    } catch {
      return timestamp;
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Tidak pernah';
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return `${diffDays} hari lalu`;
    } catch {
      return 'Tidak diketahui';
    }
  };

  return (
    <div className="space-y-6">
      {/* Online Users Section */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
            <User size={24} />
            Status User
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 text-emerald-400">
              <Circle size={10} fill="currentColor" /> Online: {userStatus.online_count}
            </span>
            <span className="flex items-center gap-2 text-gray-400">
              <Circle size={10} fill="currentColor" /> Total: {userStatus.total_count}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {userStatus.users.map((user) => (
            <div 
              key={user.id} 
              className={`p-4 rounded-lg border transition-all ${
                user.is_online 
                  ? 'bg-emerald-900/20 border-emerald-500/50' 
                  : 'bg-gray-800/30 border-gray-600/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#064E3B] ${
                    user.is_online ? 'bg-emerald-500' : 'bg-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#FEF3C7] font-semibold truncate">{user.name}</p>
                  <p className="text-gray-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 
                  user.role === 'kasir' ? 'bg-blue-500/20 text-blue-400' : 
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {user.role}
                </span>
                <span className={`text-xs ${user.is_online ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {user.is_online ? 'Online' : formatRelativeTime(user.last_login)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log Section */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
            <Activity size={24} />
            Log Aktivitas
          </h2>
          <Button 
            onClick={fetchData} 
            disabled={loading} 
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-black/20 rounded-lg">
          <div>
            <Label className="text-[#FEF3C7] text-sm">User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                <SelectValue placeholder="Semua User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua User</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#FEF3C7] text-sm">Aksi</Label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                <SelectValue placeholder="Semua Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="lock_sipesat">Kunci SIPESAT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#FEF3C7] text-sm">Dari Tanggal</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-[#FEF3C7] rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label className="text-[#FEF3C7] text-sm">Sampai Tanggal</Label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-[#FEF3C7] rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={() => { setSelectedUser('all'); setSelectedAction('all'); setStartDate(''); setEndDate(''); }}
              className="btn-secondary w-full"
            >
              <Filter size={16} className="mr-2" /> Reset
            </Button>
          </div>
        </div>

        {/* Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Waktu</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">User</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Aksi</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log, idx) => (
                  <tr key={log.id || idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock size={14} />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-[#FEF3C7] font-semibold text-sm">{log.user_name}</p>
                        <p className="text-gray-500 text-xs">{log.user_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-[#FEF3C7] text-sm">{getActionLabel(log.action)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    Tidak ada log aktivitas
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

export default ActivityLog;
