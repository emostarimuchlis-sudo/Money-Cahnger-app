import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Users, Building2, Coins, Plus, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'teller', branch_id: '' });
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '', is_headquarters: false });
  const [currencyForm, setCurrencyForm] = useState({ code: '', name: '', symbol: '' });

  useEffect(() => {
    fetchData();
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37] text-xl">Memuat...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Pengaturan
        </h1>
        <p className="text-[#D1FAE5] mt-2">Kelola pengguna, cabang, dan mata uang</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="glass-card p-1">
          <TabsTrigger value="users" data-testid="tab-users" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Users size={18} className="mr-2" /> Pengguna
          </TabsTrigger>
          <TabsTrigger value="branches" data-testid="tab-branches" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Building2 size={18} className="mr-2" /> Cabang
          </TabsTrigger>
          <TabsTrigger value="currencies" data-testid="tab-currencies" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Coins size={18} className="mr-2" /> Mata Uang
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                data-testid="add-user-button"
                onClick={() => { resetUserForm(); setShowUserDialog(true); }}
                className="btn-primary px-6 py-3 flex items-center gap-2"
              >
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
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                      <td className="py-4 px-4 text-[#FEF3C7] font-semibold">{user.name}</td>
                      <td className="py-4 px-4 text-[#FEF3C7]">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-300 p-2"
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

        {/* Branches Tab */}
        <TabsContent value="branches">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                data-testid="add-branch-button"
                onClick={() => { resetBranchForm(); setShowBranchDialog(true); }}
                className="btn-primary px-6 py-3 flex items-center gap-2"
              >
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
                    <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
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
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setEditingItem(branch); setBranchForm(branch); setShowBranchDialog(true); }}
                            className="text-[#D4AF37] hover:text-[#FCD34D] transition-colors duration-300 p-2"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-300 p-2"
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
              <Button
                data-testid="add-currency-button"
                onClick={() => { resetCurrencyForm(); setShowCurrencyDialog(true); }}
                className="btn-primary px-6 py-3 flex items-center gap-2"
              >
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
                    <tr key={currency.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                      <td className="py-4 px-4">
                        <span className="mono text-[#D4AF37] font-bold text-lg">{currency.code}</span>
                      </td>
                      <td className="py-4 px-4 text-[#FEF3C7] font-semibold">{currency.name}</td>
                      <td className="py-4 px-4 text-[#FEF3C7]">{currency.symbol}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setEditingItem(currency); setCurrencyForm(currency); setShowCurrencyDialog(true); }}
                            className="text-[#D4AF37] hover:text-[#FCD34D] transition-colors duration-300 p-2"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCurrency(currency.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-300 p-2"
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
              <Button type="submit" data-testid="branch-submit-button" className="btn-primary flex-1">Simpan</Button>
              <Button type="button" onClick={() => { setShowBranchDialog(false); resetBranchForm(); }} className="btn-secondary flex-1">Batal</Button>
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
              <Button type="submit" data-testid="currency-submit-button" className="btn-primary flex-1">Simpan</Button>
              <Button type="button" onClick={() => { setShowCurrencyDialog(false); resetCurrencyForm(); }} className="btn-secondary flex-1">Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;