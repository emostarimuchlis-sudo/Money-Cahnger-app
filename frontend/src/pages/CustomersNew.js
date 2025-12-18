import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';

const CustomersNew = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerType, setCustomerType] = useState('perorangan');
  
  const [formData, setFormData] = useState({
    customer_type: 'perorangan',
    branch_id: '',
    // Perorangan
    name: '',
    gender: 'L',
    identity_type: 'KTP',
    identity_number: '',
    birth_place: '',
    birth_date: '',
    identity_address: '',
    domicile_address: '',
    phone: '',
    occupation: '',
    fund_source: '',
    transaction_purpose: '',
    is_pep: false,
    pep_relation: '',
    beneficial_owner_name: '',
    beneficial_owner_id: '',
    // Badan Usaha
    entity_type: 'PT',
    entity_name: '',
    license_number: '',
    npwp: '',
    license_issue_place: '',
    license_issue_date: '',
    entity_address: '',
    pic_name: '',
    pic_phone: '',
    pic_id_number: ''
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
    setCustomerType(customer.customer_type);
    setFormData(customer);
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
      customer_type: 'perorangan',
      branch_id: user?.branch_id || '',
      name: '',
      gender: 'L',
      identity_type: 'KTP',
      identity_number: '',
      birth_place: '',
      birth_date: '',
      identity_address: '',
      domicile_address: '',
      phone: '',
      occupation: '',
      fund_source: '',
      transaction_purpose: '',
      is_pep: false,
      pep_relation: '',
      beneficial_owner_name: '',
      beneficial_owner_id: '',
      entity_type: 'PT',
      entity_name: '',
      license_number: '',
      npwp: '',
      license_issue_place: '',
      license_issue_date: '',
      entity_address: '',
      pic_name: '',
      pic_phone: '',
      pic_id_number: ''
    });
    setCustomerType('perorangan');
    setEditingCustomer(null);
  };

  const filteredCustomers = customers.filter(c => {
    const searchableText = (
      (c.name || '') + 
      (c.entity_name || '') + 
      (c.identity_number || '') + 
      (c.npwp || '')
    ).toLowerCase();
    return searchableText.includes(searchTerm.toLowerCase());
  });

  const getCustomerDisplayName = (customer) => {
    return customer.customer_type === 'perorangan' ? customer.name : customer.entity_name;
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
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Kode</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Jenis</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Nama</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">No. Identitas</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Telepon</th>
                <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        customer.customer_type === 'perorangan' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {customer.customer_type === 'perorangan' ? 'Perorangan' : 'Badan Usaha'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7] font-semibold">{getCustomerDisplayName(customer)}</td>
                    <td className="py-4 px-4">
                      <span className="mono text-[#6EE7B7]">{customer.identity_number || customer.npwp || '-'}</span>
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7]">{customer.phone || customer.pic_phone || '-'}</td>
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
                  <td colSpan="5" className="text-center py-12 text-[#6EE7B7]">
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
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              {editingCustomer ? 'Edit Nasabah' : 'Tambah Nasabah'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Customer Type Selection */}
            <div>
              <Label className="text-[#FEF3C7] text-lg font-semibold">Jenis Nasabah *</Label>
              <Tabs 
                value={customerType} 
                onValueChange={(value) => {
                  setCustomerType(value);
                  setFormData({ ...formData, customer_type: value });
                }}
                className="mt-2"
              >
                <TabsList className="glass-card">
                  <TabsTrigger value="perorangan" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                    Perorangan
                  </TabsTrigger>
                  <TabsTrigger value="badan_usaha" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                    Badan Usaha
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Perorangan Form */}
            {customerType === 'perorangan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#FEF3C7]">Nama Lengkap *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Jenis Kelamin *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#064E3B] border-white/10">
                        <SelectItem value="L" className="text-[#FEF3C7]">Laki-laki</SelectItem>
                        <SelectItem value="P" className="text-[#FEF3C7]">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Jenis Identitas *</Label>
                    <Select value={formData.identity_type} onValueChange={(value) => setFormData({ ...formData, identity_type: value })}>
                      <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#064E3B] border-white/10">
                        <SelectItem value="KTP" className="text-[#FEF3C7]">KTP</SelectItem>
                        <SelectItem value="SIM" className="text-[#FEF3C7]">SIM</SelectItem>
                        <SelectItem value="Passport" className="text-[#FEF3C7]">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Nomor Identitas *</Label>
                    <Input
                      value={formData.identity_number}
                      onChange={(e) => setFormData({ ...formData, identity_number: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Tempat Lahir</Label>
                    <Input
                      value={formData.birth_place}
                      onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Tanggal Lahir</Label>
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[#FEF3C7]">Alamat Sesuai Identitas</Label>
                    <Input
                      value={formData.identity_address}
                      onChange={(e) => setFormData({ ...formData, identity_address: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[#FEF3C7]">Alamat Domisili</Label>
                    <Input
                      value={formData.domicile_address}
                      onChange={(e) => setFormData({ ...formData, domicile_address: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Nomor Telepon *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Pekerjaan</Label>
                    <Input
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Sumber Dana</Label>
                    <Input
                      value={formData.fund_source}
                      onChange={(e) => setFormData({ ...formData, fund_source: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                      placeholder="Contoh: Gaji, Usaha, dll"
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Tujuan Transaksi</Label>
                    <Input
                      value={formData.transaction_purpose}
                      onChange={(e) => setFormData({ ...formData, transaction_purpose: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                      placeholder="Contoh: Traveling, Bisnis, dll"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.is_pep}
                        onChange={(e) => setFormData({ ...formData, is_pep: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <Label className="text-[#FEF3C7]">Politically Exposed Person (PEP)</Label>
                    </div>
                    {formData.is_pep && (
                      <Input
                        value={formData.pep_relation}
                        onChange={(e) => setFormData({ ...formData, pep_relation: e.target.value })}
                        className="bg-black/20 border-white/10 text-[#FEF3C7] mt-2"
                        placeholder="Hubungan dengan PEP"
                      />
                    )}
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Nama Beneficial Owner</Label>
                    <Input
                      value={formData.beneficial_owner_name}
                      onChange={(e) => setFormData({ ...formData, beneficial_owner_name: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">ID Beneficial Owner</Label>
                    <Input
                      value={formData.beneficial_owner_id}
                      onChange={(e) => setFormData({ ...formData, beneficial_owner_id: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Badan Usaha Form */}
            {customerType === 'badan_usaha' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#FEF3C7]">Jenis Badan Usaha *</Label>
                    <Select value={formData.entity_type} onValueChange={(value) => setFormData({ ...formData, entity_type: value })}>
                      <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#064E3B] border-white/10">
                        <SelectItem value="PT" className="text-[#FEF3C7]">PT</SelectItem>
                        <SelectItem value="CV" className="text-[#FEF3C7]">CV</SelectItem>
                        <SelectItem value="UD" className="text-[#FEF3C7]">UD</SelectItem>
                        <SelectItem value="Firma" className="text-[#FEF3C7]">Firma</SelectItem>
                        <SelectItem value="Koperasi" className="text-[#FEF3C7]">Koperasi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Nama Badan Usaha *</Label>
                    <Input
                      value={formData.entity_name}
                      onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Nomor Izin *</Label>
                    <Input
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">NPWP *</Label>
                    <Input
                      value={formData.npwp}
                      onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Tempat Penerbitan Izin</Label>
                    <Input
                      value={formData.license_issue_place}
                      onChange={(e) => setFormData({ ...formData, license_issue_place: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Tanggal Penerbitan Izin</Label>
                    <Input
                      type="date"
                      value={formData.license_issue_date}
                      onChange={(e) => setFormData({ ...formData, license_issue_date: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[#FEF3C7]">Alamat Lengkap Badan Usaha</Label>
                    <Input
                      value={formData.entity_address}
                      onChange={(e) => setFormData({ ...formData, entity_address: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-white/10">
                    <h3 className="text-[#D4AF37] font-semibold mb-3">Data Person In Charge (PIC)</h3>
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Nama PIC</Label>
                    <Input
                      value={formData.pic_name}
                      onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Telepon PIC</Label>
                    <Input
                      value={formData.pic_phone}
                      onChange={(e) => setFormData({ ...formData, pic_phone: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#FEF3C7]">Nomor Identitas PIC</Label>
                    <Input
                      value={formData.pic_id_number}
                      onChange={(e) => setFormData({ ...formData, pic_id_number: e.target.value })}
                      className="bg-black/20 border-white/10 text-[#FEF3C7]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Branch Selection (Admin Only) */}
            {user?.role === 'admin' && (
              <div>
                <Label className="text-[#FEF3C7]">Cabang *</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
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

            {/* Action Buttons */}
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

export default CustomersNew;
