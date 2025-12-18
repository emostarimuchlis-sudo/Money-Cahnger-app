import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    identity_number: '',
    phone: '',
    email: '',
    address: '',
    branch_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, branchesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/branches')
      ]);
      setCustomers(customersRes.data);
      setBranches(branchesRes.data);
      
      if (user?.branch_id && !formData.branch_id) {
        setFormData(prev => ({ ...prev, branch_id: user.branch_id }));
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Nasabah berhasil diperbarui');
      } else {
        await api.post('/customers', formData);
        toast.success('Nasabah berhasil ditambahkan');
      }
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan data');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      identity_number: customer.identity_number,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      branch_id: customer.branch_id
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus nasabah ini?')) {
      try {
        await api.delete(`/customers/${id}`);
        toast.success('Nasabah berhasil dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus nasabah');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      identity_number: '',
      phone: '',
      email: '',
      address: '',
      branch_id: user?.branch_id || ''
    });
    setEditingCustomer(null);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.identity_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37] text-xl">Memuat...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Data Nasabah
          </h1>
          <p className="text-[#D1FAE5] mt-2">Kelola data nasabah money changer</p>
        </div>
        <Button
          data-testid="create-customer-button"
          onClick={() => { resetForm(); setShowDialog(true); }}
          className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Tambah Nasabah</span>
        </Button>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6EE7B7]" size={20} />
          <Input
            data-testid="search-customer-input"
            type="text"
            placeholder="Cari berdasarkan nama atau nomor identitas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/20 border-white/10 text-[#FEF3C7] placeholder:text-[#6EE7B7]/50"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Nama</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">No. Identitas</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Telepon</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Email</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Alamat</th>
                <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                    <td className="py-4 px-4 text-[#FEF3C7] font-semibold">{customer.name}</td>
                    <td className="py-4 px-4">
                      <span className="mono text-[#6EE7B7]">{customer.identity_number}</span>
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7]">{customer.phone}</td>
                    <td className="py-4 px-4 text-[#FEF3C7]">{customer.email || '-'}</td>
                    <td className="py-4 px-4 text-[#FEF3C7]">{customer.address || '-'}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          data-testid={`edit-customer-${customer.id}`}
                          onClick={() => handleEdit(customer)}
                          className="text-[#D4AF37] hover:text-[#FCD34D] transition-colors duration-300 p-2"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          data-testid={`delete-customer-${customer.id}`}
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-300 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[#6EE7B7]">
                    {searchTerm ? 'Tidak ada nasabah yang ditemukan' : 'Belum ada nasabah'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              {editingCustomer ? 'Edit Nasabah' : 'Tambah Nasabah'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-[#FEF3C7]">Nama Lengkap *</Label>
                <Input
                  data-testid="customer-name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-black/20 border-white/10 text-[#FEF3C7]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="identity_number" className="text-[#FEF3C7]">No. Identitas (KTP/Passport) *</Label>
                <Input
                  data-testid="customer-identity-input"
                  type="text"
                  value={formData.identity_number}
                  onChange={(e) => setFormData({ ...formData, identity_number: e.target.value })}
                  className="bg-black/20 border-white/10 text-[#FEF3C7]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-[#FEF3C7]">Nomor Telepon *</Label>
                <Input
                  data-testid="customer-phone-input"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-black/20 border-white/10 text-[#FEF3C7]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-[#FEF3C7]">Email</Label>
                <Input
                  data-testid="customer-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black/20 border-white/10 text-[#FEF3C7]"
                />
              </div>

              {user?.role === 'admin' && (
                <div>
                  <Label htmlFor="branch" className="text-[#FEF3C7]">Cabang *</Label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  >
                    <SelectTrigger data-testid="customer-branch-select" className="bg-black/20 border-white/10 text-[#FEF3C7]">
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
              <Label htmlFor="address" className="text-[#FEF3C7]">Alamat</Label>
              <Input
                data-testid="customer-address-input"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-black/20 border-white/10 text-[#FEF3C7]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" data-testid="customer-submit-button" className="btn-primary flex-1">
                {editingCustomer ? 'Perbarui' : 'Simpan'}
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

export default Customers;