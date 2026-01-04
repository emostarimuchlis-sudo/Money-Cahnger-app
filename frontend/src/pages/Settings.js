import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Users, Building2, Coins, Plus, Edit, Trash2, Settings2, Wallet, Activity, HelpCircle, FileText, FileSpreadsheet, Download, Book } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ActivityLog from '../components/ActivityLog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Date Migration Tool Component
const DateMigrationTool = () => {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const checkMigration = async () => {
    setIsChecking(true);
    try {
      const response = await api.post('/admin/migrate-date-formats?dry_run=true');
      setMigrationStatus(response.data);
      
      if (response.data.summary.total_records_updated === 0) {
        toast.success('Semua data sudah dalam format yang benar!');
      } else {
        toast.info(`Ditemukan ${response.data.summary.total_records_updated} record yang perlu dimigrasi`);
      }
    } catch (error) {
      toast.error('Gagal memeriksa data: ' + (error.response?.data?.detail || error.message));
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const executeMigration = async () => {
    setIsMigrating(true);
    try {
      const response = await api.post('/admin/migrate-date-formats?dry_run=false');
      setMigrationStatus(response.data);
      toast.success(`Migrasi berhasil! ${response.data.summary.total_records_updated} record telah diperbarui.`);
      setShowConfirmDialog(false);
    } catch (error) {
      toast.error('Gagal melakukan migrasi: ' + (error.response?.data?.detail || error.message));
      console.error(error);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-amber-500/20 rounded-lg">
            <Settings2 className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Migrasi Format Tanggal
            </h2>
            <p className="text-[#FEF3C7]/70 mt-2">
              Tools untuk memperbaiki inkonsistensi format tanggal di database
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#FEF3C7]/90">
              <p className="font-semibold mb-2">Apa itu Migrasi Format Tanggal?</p>
              <p className="mb-2">
                Karena perubahan sistem, beberapa data tanggal di database masih tersimpan sebagai <span className="font-mono bg-black/30 px-1 rounded">string</span> bukan sebagai <span className="font-mono bg-black/30 px-1 rounded">datetime</span>. 
                Ini bisa menyebabkan bug saat query atau filter berdasarkan tanggal.
              </p>
              <p>
                Tools ini akan mengkonversi semua field tanggal ke format yang benar untuk meningkatkan performa dan mencegah bug di masa depan.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={checkMigration} 
            disabled={isChecking}
            className="btn-secondary w-full md:w-auto px-8 py-3 flex items-center gap-2"
          >
            <Activity size={20} />
            {isChecking ? 'Memeriksa...' : 'Periksa Status Data'}
          </Button>

          {migrationStatus && (
            <div className="glass-card rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#D4AF37]">Hasil Pemeriksaan</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  migrationStatus.mode.includes('DRY RUN') ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                }`}>
                  {migrationStatus.mode}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-xs text-[#6EE7B7] mb-1">Total Dicek</p>
                  <p className="text-2xl font-bold text-[#FEF3C7]">{migrationStatus.summary.total_records_checked}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-xs text-[#6EE7B7] mb-1">Perlu Diupdate</p>
                  <p className="text-2xl font-bold text-amber-400">{migrationStatus.summary.total_records_updated}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-xs text-[#6EE7B7] mb-1">Gagal</p>
                  <p className="text-2xl font-bold text-red-400">{migrationStatus.summary.total_records_failed}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-xs text-[#6EE7B7] mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-emerald-400">{migrationStatus.summary.success_rate}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[#D4AF37]">Detail per Collection:</h4>
                {Object.entries(migrationStatus.details_by_collection).map(([collection, stats]) => (
                  stats.checked > 0 && (
                    <div key={collection} className="flex items-center justify-between bg-black/20 rounded p-3">
                      <div>
                        <p className="text-[#FEF3C7] font-semibold capitalize">{collection.replace('_', ' ')}</p>
                        <p className="text-xs text-[#6EE7B7]">{stats.checked} records dicek</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-bold">{stats.updated} update</p>
                        {stats.failed > 0 && <p className="text-xs text-red-400">{stats.failed} gagal</p>}
                      </div>
                    </div>
                  )
                ))}
              </div>

              {migrationStatus.summary.total_records_updated > 0 && migrationStatus.mode.includes('DRY RUN') && (
                <div className="pt-4 border-t border-white/10">
                  <Button 
                    onClick={() => setShowConfirmDialog(true)} 
                    className="btn-primary w-full md:w-auto px-8 py-3 flex items-center gap-2"
                  >
                    <Download size={20} />
                    Jalankan Migrasi Sekarang
                  </Button>
                  <p className="text-xs text-[#6EE7B7] mt-2">
                    ⚠️ Ini akan mengubah data di database. Pastikan Anda sudah membackup data.
                  </p>
                </div>
              )}

              {migrationStatus.mode.includes('EKSEKUSI') && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4">
                  <p className="text-emerald-300 font-semibold">✓ Migrasi Selesai!</p>
                  <p className="text-sm text-emerald-200 mt-1">{migrationStatus.note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <HelpCircle size={24} /> Konfirmasi Migrasi
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#FEF3C7] mb-4">
              Apakah Anda yakin ingin menjalankan migrasi format tanggal?
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 mb-4">
              <p className="text-sm text-amber-200">
                <strong>Akan mengupdate:</strong> {migrationStatus?.summary.total_records_updated} records
              </p>
              <p className="text-xs text-amber-300 mt-2">
                ⚠️ Proses ini akan mengubah data di database. Pastikan Anda sudah backup data terlebih dahulu.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowConfirmDialog(false)} 
                className="btn-secondary flex-1"
                disabled={isMigrating}
              >
                Batal
              </Button>
              <Button 
                onClick={executeMigration} 
                className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
                disabled={isMigrating}
              >
                {isMigrating ? 'Memproses...' : 'Ya, Jalankan Migrasi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'teller', branch_id: '' });
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '', is_headquarters: false });
  const [currencyForm, setCurrencyForm] = useState({ code: '', name: '', symbol: '' });
  const [balanceForm, setBalanceForm] = useState({ opening_balance: 0, currency_balances: {}, currency_balances_idr: {} });
  
  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    company_name: 'Mulia Bali Valuta',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    company_license: '',
    company_npwp: '',
    receipt_footer: 'Terima kasih atas kepercayaan Anda'
  });

  useEffect(() => {
    fetchData();
    fetchCompanySettings();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, branchesRes, currenciesRes] = await Promise.all([
        api.get('/users'),
        api.get('/branches'),
        api.get('/currencies')
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
      setCurrencies(currenciesRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
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

  const handleCompanySettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/company', companySettings);
      toast.success('Pengaturan perusahaan berhasil disimpan');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan pengaturan');
    }
  };

  // User Management
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/users/${editingItem.id}`, userForm);
        toast.success('User berhasil diperbarui');
      } else {
        await api.post('/auth/register', userForm);
        toast.success('User berhasil ditambahkan');
      }
      setShowUserDialog(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('User berhasil dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus user');
      }
    }
  };

  const resetUserForm = () => {
    setUserForm({ name: '', email: '', password: '', role: 'teller', branch_id: '' });
    setEditingItem(null);
  };

  // Branch Management
  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/branches/${editingItem.id}`, branchForm);
        toast.success('Cabang berhasil diperbarui');
      } else {
        await api.post('/branches', branchForm);
        toast.success('Cabang berhasil ditambahkan');
      }
      setShowBranchDialog(false);
      resetBranchForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan cabang');
    }
  };

  const handleDeleteBranch = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus cabang ini?')) {
      try {
        await api.delete(`/branches/${id}`);
        toast.success('Cabang berhasil dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus cabang');
      }
    }
  };

  const resetBranchForm = () => {
    setBranchForm({ name: '', code: '', address: '', phone: '', is_headquarters: false });
    setEditingItem(null);
  };

  // Balance Management
  const openBalanceDialog = async (branch) => {
    setSelectedBranch(branch);
    try {
      const response = await api.get(`/branches/${branch.id}/balances`);
      setBalanceForm({
        opening_balance: response.data.opening_balance || 0,
        currency_balances: response.data.currency_balances || {},
        currency_balances_idr: response.data.currency_balances_idr || {}
      });
    } catch (error) {
      setBalanceForm({ opening_balance: 0, currency_balances: {}, currency_balances_idr: {} });
    }
    setShowBalanceDialog(true);
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/branches/${selectedBranch.id}/balances`, balanceForm);
      toast.success('Saldo awal berhasil disimpan');
      setShowBalanceDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan saldo');
    }
  };

  const updateCurrencyBalance = (currencyCode, value) => {
    setBalanceForm(prev => ({
      ...prev,
      currency_balances: {
        ...prev.currency_balances,
        [currencyCode]: parseFloat(value) || 0
      }
    }));
  };

  const updateCurrencyBalanceIdr = (currencyCode, value) => {
    setBalanceForm(prev => ({
      ...prev,
      currency_balances_idr: {
        ...prev.currency_balances_idr,
        [currencyCode]: parseFloat(value) || 0
      }
    }));
  };

  // Currency Management
  const handleCurrencySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/currencies/${editingItem.id}`, currencyForm);
        toast.success('Mata uang berhasil diperbarui');
      } else {
        await api.post('/currencies', currencyForm);
        toast.success('Mata uang berhasil ditambahkan');
      }
      setShowCurrencyDialog(false);
      resetCurrencyForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan mata uang');
    }
  };

  const handleDeleteCurrency = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus mata uang ini?')) {
      try {
        await api.delete(`/currencies/${id}`);
        toast.success('Mata uang berhasil dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus mata uang');
      }
    }
  };

  const resetCurrencyForm = () => {
    setCurrencyForm({ code: '', name: '', symbol: '' });
    setEditingItem(null);
  };

  const handleDownloadBackup = async () => {
    try {
      const response = await api.get('/backup/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mba_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh backup');
    }
  };

  const handleDownloadManual = async (format) => {
    try {
      toast.loading(`Mengunduh file ${format.toUpperCase()}...`);
      
      const response = await fetch(`${API_URL}/api/manual/download/${format}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Petunjuk_Teknis_MBA_Money_Changer.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.dismiss();
      toast.success(`File ${format.toUpperCase()} berhasil diunduh`);
    } catch (error) {
      toast.dismiss();
      toast.error(`Gagal mengunduh file ${format.toUpperCase()}`);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37] text-xl">Memuat...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Pengaturan
          </h1>
          <p className="text-[#D1FAE5] mt-2">Kelola pengguna, cabang, mata uang, dan pengaturan perusahaan</p>
        </div>
        <Button onClick={handleDownloadBackup} className="btn-primary px-6 py-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Backup
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="glass-card p-1 flex flex-wrap gap-1">
          <TabsTrigger value="company" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Settings2 size={18} className="mr-2" /> Perusahaan
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Users size={18} className="mr-2" /> Pengguna
          </TabsTrigger>
          <TabsTrigger value="branches" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Building2 size={18} className="mr-2" /> Cabang
          </TabsTrigger>
          <TabsTrigger value="currencies" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Coins size={18} className="mr-2" /> Mata Uang
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Activity size={18} className="mr-2" /> Log Aktivitas
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Book size={18} className="mr-2" /> Petunjuk Teknis
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Settings2 size={18} className="mr-2" /> Maintenance
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#D4AF37] mb-6">Profil Perusahaan</h2>
            <form onSubmit={handleCompanySettingsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#FEF3C7]">Nama Perusahaan</Label>
                  <Input
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings({...companySettings, company_name: e.target.value})}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="Mulia Bali Valuta"
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">No. Izin BI</Label>
                  <Input
                    value={companySettings.company_license}
                    onChange={(e) => setCompanySettings({...companySettings, company_license: e.target.value})}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="No. xxx/xxx/xxx"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#FEF3C7]">Alamat</Label>
                  <Input
                    value={companySettings.company_address}
                    onChange={(e) => setCompanySettings({...companySettings, company_address: e.target.value})}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="Jl. Sunset Road No. 123, Denpasar, Bali"
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Telepon</Label>
                  <Input
                    value={companySettings.company_phone}
                    onChange={(e) => setCompanySettings({...companySettings, company_phone: e.target.value})}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="+62 361 123456"
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Email</Label>
                  <Input
                    value={companySettings.company_email}
                    onChange={(e) => setCompanySettings({...companySettings, company_email: e.target.value})}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="info@mbamoneychange.com"
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">Website</Label>
                  <Input
                    value={companySettings.company_website}
                    onChange={(e) => setCompanySettings({...companySettings, company_website: e.target.value})}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="www.mbamoneychange.com"
                  />
                </div>
                <div>
                  <Label className="text-[#FEF3C7]">NPWP</Label>
                  <Input
                    value={companySettings.company_npwp}
                    onChange={(e) => setCompanySettings({...companySettings, company_npwp: e.target.value})}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="xx.xxx.xxx.x-xxx.xxx"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#FEF3C7]">Footer Struk</Label>
                  <Input
                    value={companySettings.receipt_footer}
                    onChange={(e) => setCompanySettings({...companySettings, receipt_footer: e.target.value})}
                    className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    placeholder="Terima kasih atas kepercayaan Anda"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="btn-primary px-8">
                  Simpan Pengaturan
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { resetUserForm(); setShowUserDialog(true); }} className="btn-primary px-6 py-3 flex items-center gap-2">
                <Plus size={20} /> Tambah Pengguna
              </Button>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Nama</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Email</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Role</th>
                    <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 text-[#FEF3C7] font-semibold">{user.name}</td>
                      <td className="py-4 px-4 text-[#FEF3C7]">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 p-2">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { resetBranchForm(); setShowBranchDialog(true); }} className="btn-primary px-6 py-3 flex items-center gap-2">
                <Plus size={20} /> Tambah Cabang
              </Button>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Kode</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Nama</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Alamat</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Telepon</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Saldo Awal</th>
                    <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4">
                        <span className="mono text-[#D4AF37] font-bold">{branch.code}</span>
                      </td>
                      <td className="py-4 px-4 text-[#FEF3C7] font-semibold">
                        {branch.name}
                        {branch.is_headquarters && (
                          <span className="ml-2 text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded">HQ</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[#FEF3C7]">{branch.address}</td>
                      <td className="py-4 px-4 text-[#FEF3C7]">{branch.phone}</td>
                      <td className="py-4 px-4 text-[#6EE7B7] mono font-semibold">
                        {formatCurrency(branch.opening_balance)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openBalanceDialog(branch)}
                            className="bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50 p-2.5 rounded-lg transition-all border border-emerald-500/50"
                            title="Atur Saldo Awal"
                          >
                            <Wallet size={18} />
                          </button>
                          <button
                            onClick={() => { setEditingItem(branch); setBranchForm(branch); setShowBranchDialog(true); }}
                            className="bg-amber-500/30 text-amber-300 hover:bg-amber-500/50 p-2.5 rounded-lg transition-all border border-amber-500/50"
                            title="Edit Cabang"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteBranch(branch.id)} 
                            className="bg-red-500/30 text-red-300 hover:bg-red-500/50 p-2.5 rounded-lg transition-all border border-red-500/50"
                            title="Hapus Cabang"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Currencies Tab */}
        <TabsContent value="currencies">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { resetCurrencyForm(); setShowCurrencyDialog(true); }} className="btn-primary px-6 py-3 flex items-center gap-2">
                <Plus size={20} /> Tambah Mata Uang
              </Button>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Kode</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Nama</th>
                    <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Simbol</th>
                    <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((currency) => (
                    <tr key={currency.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4">
                        <span className="mono text-[#D4AF37] font-bold text-lg">{currency.code}</span>
                      </td>
                      <td className="py-4 px-4 text-[#FEF3C7] font-semibold">{currency.name}</td>
                      <td className="py-4 px-4 text-[#FEF3C7]">{currency.symbol}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setEditingItem(currency); setCurrencyForm(currency); setShowCurrencyDialog(true); }}
                            className="text-[#D4AF37] hover:text-[#FCD34D] p-2"
                          >
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteCurrency(currency.id)} className="text-red-400 hover:text-red-300 p-2">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <ActivityLog />
        </TabsContent>

        {/* User Manual Tab */}
        <TabsContent value="manual">
          <div className="space-y-6">
            {/* Download Section */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Download Modul Petunjuk Teknis
              </h2>
              <p className="text-[#FEF3C7]/70 mb-6">
                Unduh modul petunjuk teknis lengkap dalam format yang Anda inginkan:
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => handleDownloadManual('docx')} 
                  className="btn-primary flex items-center gap-3 px-6 py-4"
                >
                  <FileSpreadsheet size={24} />
                  <div className="text-left">
                    <div className="font-bold">Download Word</div>
                    <div className="text-xs opacity-80">Format .docx (Microsoft Word)</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => handleDownloadManual('pdf')} 
                  className="btn-secondary flex items-center gap-3 px-6 py-4"
                >
                  <FileText size={24} />
                  <div className="text-left">
                    <div className="font-bold">Download PDF</div>
                    <div className="text-xs opacity-80">Format .pdf (Adobe Reader)</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Daftar Isi Modul
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: <Book className="w-6 h-6" />, title: 'Pendahuluan', desc: 'Tentang aplikasi, fitur utama, dan role pengguna' },
                  { icon: <Users className="w-6 h-6" />, title: 'Login & Logout', desc: 'Cara masuk dan keluar dari aplikasi' },
                  { icon: <Activity className="w-6 h-6" />, title: 'Dashboard', desc: 'Ringkasan operasional harian' },
                  { icon: <Coins className="w-6 h-6" />, title: 'Manajemen Transaksi', desc: 'Membuat transaksi jual/beli valas' },
                  { icon: <Users className="w-6 h-6" />, title: 'Data Nasabah', desc: 'Mengelola data nasabah perorangan dan badan usaha' },
                  { icon: <Wallet className="w-6 h-6" />, title: 'Buku Kas', desc: 'Mencatat aliran kas harian' },
                  { icon: <Activity className="w-6 h-6" />, title: 'Mutasi Valas', desc: 'Pergerakan stok mata uang asing' },
                  { icon: <FileText className="w-6 h-6" />, title: 'Laporan', desc: 'Laporan SIPESAT dan pelaporan regulasi' },
                  { icon: <Settings2 className="w-6 h-6" />, title: 'Pengaturan', desc: 'Konfigurasi sistem (khusus Admin)' },
                  { icon: <Download className="w-6 h-6" />, title: 'Backup & Export', desc: 'Cara export dan backup data' },
                  { icon: <HelpCircle className="w-6 h-6" />, title: 'FAQ & Troubleshooting', desc: 'Pertanyaan umum dan pemecahan masalah' },
                ].map((chapter, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#D4AF37]/20 rounded-lg text-[#D4AF37]">
                        {chapter.icon}
                      </div>
                      <div>
                        <h3 className="text-[#FEF3C7] font-semibold">{index + 1}. {chapter.title}</h3>
                        <p className="text-[#6EE7B7] text-sm mt-1">{chapter.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Guide */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Panduan Cepat
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-[#D4AF37] pl-4">
                  <h3 className="text-[#FEF3C7] font-bold mb-2">Cara Login</h3>
                  <ol className="text-[#6EE7B7] text-sm space-y-1 list-decimal list-inside">
                    <li>Buka aplikasi melalui browser</li>
                    <li>Masukkan Email dan Password</li>
                    <li>Klik tombol &quot;Masuk&quot;</li>
                  </ol>
                </div>
                
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="text-[#FEF3C7] font-bold mb-2">Membuat Transaksi</h3>
                  <ol className="text-[#6EE7B7] text-sm space-y-1 list-decimal list-inside">
                    <li>Buka menu &quot;Transaksi&quot;</li>
                    <li>Klik &quot;+ Transaksi Baru&quot;</li>
                    <li>Pilih nasabah (atau tambah baru)</li>
                    <li>Pilih tipe: Jual atau Beli</li>
                    <li>Masukkan mata uang, jumlah, dan kurs</li>
                    <li>Minta nasabah tanda tangan</li>
                    <li>Klik &quot;Cetak & Simpan&quot;</li>
                  </ol>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-[#FEF3C7] font-bold mb-2">Export Data</h3>
                  <ol className="text-[#6EE7B7] text-sm space-y-1 list-decimal list-inside">
                    <li>Buka halaman yang ingin di-export</li>
                    <li>Klik tombol &quot;Export Excel&quot; atau &quot;Export PDF&quot;</li>
                    <li>File akan otomatis terunduh</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <DateMigrationTool />
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]">{editingItem ? 'Edit' : 'Tambah'} Pengguna</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Nama</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
            </div>
            {!editingItem && (
              <div>
                <Label>Password</Label>
                <Input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
              </div>
            )}
            <div>
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="admin" className="text-[#FEF3C7]">Admin</SelectItem>
                  <SelectItem value="teller" className="text-[#FEF3C7]">Teller</SelectItem>
                  <SelectItem value="kasir" className="text-[#FEF3C7]">Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cabang</Label>
              <Select value={userForm.branch_id} onValueChange={(value) => setUserForm({...userForm, branch_id: value})}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  {branches.map(b => <SelectItem key={b.id} value={b.id} className="text-[#FEF3C7]">{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="btn-primary flex-1">Simpan</Button>
              <Button type="button" onClick={() => setShowUserDialog(false)} className="btn-secondary flex-1">Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Branch Dialog */}
      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]">{editingItem ? 'Edit' : 'Tambah'} Cabang</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBranchSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kode</Label>
                <Input value={branchForm.code} onChange={(e) => setBranchForm({...branchForm, code: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
              </div>
              <div>
                <Label>Nama</Label>
                <Input value={branchForm.name} onChange={(e) => setBranchForm({...branchForm, name: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
              </div>
            </div>
            <div>
              <Label>Alamat</Label>
              <Input value={branchForm.address} onChange={(e) => setBranchForm({...branchForm, address: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input value={branchForm.phone} onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" required />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="btn-primary flex-1">Simpan</Button>
              <Button type="button" onClick={() => { setShowBranchDialog(false); resetBranchForm(); }} className="btn-secondary flex-1">Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Balance Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]">
              Saldo Awal - {selectedBranch?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBalanceSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-2">
              <div>
                <Label className="text-[#FEF3C7]">Saldo Awal IDR (Buku Kas)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={balanceForm.opening_balance}
                  onChange={(e) => setBalanceForm({...balanceForm, opening_balance: parseFloat(e.target.value) || 0})}
                  className="bg-black/20 border-white/10 text-[#FEF3C7]"
                />
                <p className="text-xs text-[#6EE7B7] mt-1">Saldo kas Rupiah awal untuk Buku Kas</p>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <Label className="text-[#D4AF37] text-lg">Saldo Awal Per Mata Uang (Valas)</Label>
                <p className="text-[#6EE7B7] text-sm mb-4">Untuk perhitungan mutasi valas - isi jumlah valas DAN nilai rupiahnya</p>
                
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-emerald-900/30 rounded-t-lg border-b border-white/10">
                  <div className="col-span-2 text-[#D4AF37] text-sm font-semibold">Kode</div>
                  <div className="col-span-4 text-[#D4AF37] text-sm font-semibold">Jumlah Valas</div>
                  <div className="col-span-4 text-[#D4AF37] text-sm font-semibold">Nilai IDR</div>
                  <div className="col-span-2 text-[#D4AF37] text-sm font-semibold">Nama</div>
                </div>
                
                <div className="space-y-1 max-h-[35vh] overflow-y-auto">
                  {currencies.map((currency) => (
                    <div key={currency.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-black/10 hover:bg-black/20 rounded">
                      <div className="col-span-2">
                        <span className="mono text-[#D4AF37] font-bold">{currency.code}</span>
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="number"
                          step="0.01"
                          value={balanceForm.currency_balances[currency.code] || ''}
                          onChange={(e) => updateCurrencyBalance(currency.code, e.target.value)}
                          className="bg-black/20 border-white/10 text-[#FEF3C7] text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="number"
                          step="1"
                          value={balanceForm.currency_balances_idr?.[currency.code] || ''}
                          onChange={(e) => updateCurrencyBalanceIdr(currency.code, e.target.value)}
                          className="bg-black/20 border-white/10 text-[#FEF3C7] text-sm"
                          placeholder="Rp 0"
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400 truncate">{currency.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-amber-400 mt-2">
                  * Nilai IDR = Total Rupiah yang dikeluarkan untuk membeli valas tersebut (untuk menghitung rata-rata kurs)
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
              <Button type="submit" className="btn-primary flex-1">Simpan Saldo</Button>
              <Button type="button" onClick={() => setShowBalanceDialog(false)} className="btn-secondary flex-1">Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Currency Dialog */}
      <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]">{editingItem ? 'Edit' : 'Tambah'} Mata Uang</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCurrencySubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kode</Label>
                <Input value={currencyForm.code} onChange={(e) => setCurrencyForm({...currencyForm, code: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" placeholder="USD" required />
              </div>
              <div>
                <Label>Simbol</Label>
                <Input value={currencyForm.symbol} onChange={(e) => setCurrencyForm({...currencyForm, symbol: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" placeholder="$" required />
              </div>
            </div>
            <div>
              <Label>Nama</Label>
              <Input value={currencyForm.name} onChange={(e) => setCurrencyForm({...currencyForm, name: e.target.value})} className="bg-black/20 border-white/10 text-[#FEF3C7]" placeholder="US Dollar" required />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="btn-primary flex-1">Simpan</Button>
              <Button type="button" onClick={() => { setShowCurrencyDialog(false); resetCurrencyForm(); }} className="btn-secondary flex-1">Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
