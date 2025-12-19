import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Printer, User, Building2, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
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
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [ytdSummary, setYtdSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerType, setCustomerType] = useState('perorangan');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
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
    setCustomerType(customer.customer_type || 'perorangan');
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
        toast.error(error.response?.data?.detail || 'Gagal menghapus nasabah');
      }
    }
  };

  const viewProfile = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const response = await api.get(`/customers/${customer.id}/transactions`);
      setCustomerTransactions(response.data.transactions || []);
      setYtdSummary(response.data.ytd_summary || null);
    } catch (error) {
      setCustomerTransactions([]);
      setYtdSummary(null);
    }
    setShowProfileDialog(true);
  };

  const printKYC = (customer) => {
    const branch = branches.find(b => b.id === customer.branch_id);
    const printWindow = window.open('', '_blank');
    
    const isPerorangan = customer.customer_type === 'perorangan';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KYC - ${customer.customer_code}</title>
        <style>
          @media print { body { margin: 20px; } }
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #064E3B; }
          .header h2 { margin: 10px 0 0; color: #D4AF37; }
          .section { margin-bottom: 20px; }
          .section h3 { background: #064E3B; color: #D4AF37; padding: 10px; margin: 0 0 10px; }
          .row { display: flex; border-bottom: 1px solid #ddd; padding: 8px 0; }
          .label { width: 200px; font-weight: bold; color: #333; }
          .value { flex: 1; }
          .member-card { border: 2px solid #D4AF37; border-radius: 10px; padding: 20px; margin-bottom: 20px; background: linear-gradient(135deg, #064E3B 0%, #022C22 100%); color: white; }
          .member-card h3 { color: #D4AF37; margin: 0 0 10px; }
          .member-card .code { font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-box { width: 200px; text-align: center; }
          .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MOZTEC</h1>
          <h2>Know Your Customer (KYC)</h2>
          <p>${branch?.name || 'Money Changer'} - ${branch?.address || ''}</p>
        </div>

        <div class="member-card">
          <h3>MEMBER CARD</h3>
          <div class="code">${customer.customer_code || '-'}</div>
          <p style="margin: 10px 0 0; font-size: 18px;">${isPerorangan ? customer.name : customer.entity_name}</p>
          <p style="margin: 5px 0 0; font-size: 12px;">${isPerorangan ? 'Nasabah Perorangan' : 'Nasabah Badan Usaha'}</p>
        </div>

        <div class="section">
          <h3>${isPerorangan ? 'Data Pribadi' : 'Data Perusahaan'}</h3>
          ${isPerorangan ? `
            <div class="row"><span class="label">Nama Lengkap</span><span class="value">${customer.name || '-'}</span></div>
            <div class="row"><span class="label">Jenis Kelamin</span><span class="value">${customer.gender === 'L' ? 'Laki-laki' : customer.gender === 'P' ? 'Perempuan' : '-'}</span></div>
            <div class="row"><span class="label">Jenis Identitas</span><span class="value">${customer.identity_type || '-'}</span></div>
            <div class="row"><span class="label">Nomor Identitas</span><span class="value">${customer.identity_number || '-'}</span></div>
            <div class="row"><span class="label">Tempat Lahir</span><span class="value">${customer.birth_place || '-'}</span></div>
            <div class="row"><span class="label">Tanggal Lahir</span><span class="value">${customer.birth_date || '-'}</span></div>
            <div class="row"><span class="label">Alamat Identitas</span><span class="value">${customer.identity_address || '-'}</span></div>
            <div class="row"><span class="label">Alamat Domisili</span><span class="value">${customer.domicile_address || '-'}</span></div>
            <div class="row"><span class="label">Telepon</span><span class="value">${customer.phone || '-'}</span></div>
            <div class="row"><span class="label">Pekerjaan</span><span class="value">${customer.occupation || '-'}</span></div>
            <div class="row"><span class="label">Sumber Dana</span><span class="value">${customer.fund_source || '-'}</span></div>
            <div class="row"><span class="label">PEP</span><span class="value">${customer.is_pep ? 'Ya - ' + (customer.pep_relation || '') : 'Tidak'}</span></div>
          ` : `
            <div class="row"><span class="label">Jenis Badan Usaha</span><span class="value">${customer.entity_type || '-'}</span></div>
            <div class="row"><span class="label">Nama Perusahaan</span><span class="value">${customer.entity_name || '-'}</span></div>
            <div class="row"><span class="label">Nomor Izin</span><span class="value">${customer.license_number || '-'}</span></div>
            <div class="row"><span class="label">NPWP</span><span class="value">${customer.npwp || '-'}</span></div>
            <div class="row"><span class="label">Tempat Penerbitan Izin</span><span class="value">${customer.license_issue_place || '-'}</span></div>
            <div class="row"><span class="label">Tanggal Penerbitan</span><span class="value">${customer.license_issue_date || '-'}</span></div>
            <div class="row"><span class="label">Alamat</span><span class="value">${customer.entity_address || '-'}</span></div>
            <div class="row"><span class="label">Nama PIC</span><span class="value">${customer.pic_name || '-'}</span></div>
            <div class="row"><span class="label">Telepon PIC</span><span class="value">${customer.pic_phone || '-'}</span></div>
            <div class="row"><span class="label">ID PIC</span><span class="value">${customer.pic_id_number || '-'}</span></div>
          `}
        </div>

        <div class="signature">
          <div class="signature-box">
            <div class="signature-line">Nasabah</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Petugas</div>
          </div>
        </div>

        <div class="footer">
          <p>Dokumen ini dicetak pada ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })}</p>
          <p>MOZTEC Money Changer - ${branch?.address || ''}</p>
        </div>

        <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
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
      (c.customer_code || '') +
      (c.npwp || '') +
      (c.phone || '') +
      (c.pic_phone || '')
    ).toLowerCase();
    
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesType = !filterType || c.customer_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getCustomerDisplayName = (customer) => {
    return customer.customer_type === 'perorangan' ? customer.name : customer.entity_name;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
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
          onClick={() => { resetForm(); setShowDialog(true); }}
          className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Tambah Nasabah</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6EE7B7]" size={20} />
            <Input
              type="text"
              placeholder="Cari berdasarkan nama, kode, nomor identitas, telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/20 border-white/10 text-[#FEF3C7] placeholder:text-[#6EE7B7]/50"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter size={18} />
            Filter
          </Button>
        </div>
        
        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
            <div className="w-48">
              <Label className="text-[#FEF3C7] text-sm">Jenis Nasabah</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-black/20 border-white/10 text-[#FEF3C7]">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent className="bg-[#064E3B] border-white/10">
                  <SelectItem value="" className="text-[#FEF3C7]">Semua Jenis</SelectItem>
                  <SelectItem value="perorangan" className="text-[#FEF3C7]">Perorangan</SelectItem>
                  <SelectItem value="badan_usaha" className="text-[#FEF3C7]">Badan Usaha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => { setFilterType(''); setSearchTerm(''); }} className="btn-secondary">
                Reset
              </Button>
            </div>
          </div>
        )}
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
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">JK</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">No. Identitas</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Telepon</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Pekerjaan</th>
                <th className="text-left py-4 px-4 text-[#D4AF37] font-semibold">Alamat</th>
                <th className="text-center py-4 px-4 text-[#D4AF37] font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => viewProfile(customer)}
                        className="mono text-[#D4AF37] font-bold hover:text-[#FCD34D] transition-colors cursor-pointer"
                      >
                        {customer.customer_code || '-'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        customer.customer_type === 'perorangan' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {customer.customer_type === 'perorangan' ? <User size={12} /> : <Building2 size={12} />}
                        {customer.customer_type === 'perorangan' ? 'Perorangan' : 'Badan Usaha'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7] font-semibold">{getCustomerDisplayName(customer)}</td>
                    <td className="py-4 px-4 text-[#FEF3C7]">
                      {customer.customer_type === 'perorangan' ? (
                        customer.gender === 'L' ? 'L' : customer.gender === 'P' ? 'P' : '-'
                      ) : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="mono text-[#6EE7B7] text-sm">{customer.identity_number || customer.npwp || '-'}</span>
                    </td>
                    <td className="py-4 px-4 text-[#FEF3C7] text-sm">{customer.phone || customer.pic_phone || '-'}</td>
                    <td className="py-4 px-4 text-[#FEF3C7] text-sm">{customer.occupation || customer.entity_type || '-'}</td>
                    <td className="py-4 px-4 text-[#FEF3C7] text-sm max-w-[200px] truncate" title={customer.domicile_address || customer.entity_address || '-'}>
                      {customer.domicile_address || customer.entity_address || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => viewProfile(customer)}
                          className="text-[#6EE7B7] hover:text-[#A7F3D0] transition-colors duration-300 p-1.5"
                          title="Lihat Profil"
                        >
                          <Eye size={16} />
                        </button>
                        {/* Print KYC - Admin & Kasir */}
                        {(user?.role === 'admin' || user?.role === 'kasir') && (
                          <button
                            onClick={() => printKYC(customer)}
                            className="text-[#D4AF37] hover:text-[#FCD34D] transition-colors duration-300 p-1.5"
                            title="Cetak KYC"
                          >
                            <Printer size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-300 p-1.5"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {/* Delete - Admin Only */}
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-300 p-1.5"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-[#6EE7B7]">
                    {searchTerm ? 'Tidak ada nasabah yang ditemukan' : 'Belum ada nasabah'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="glass-card border border-white/10 text-[#FEF3C7] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Profil Nasabah
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6 mt-4">
              {/* Member Card */}
              <div className="bg-gradient-to-r from-[#064E3B] to-[#022C22] rounded-xl p-6 border-2 border-[#D4AF37]">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-[#D4AF37]/20">
                    {selectedCustomer.customer_type === 'perorangan' ? (
                      <User className="text-[#D4AF37]" size={40} />
                    ) : (
                      <Building2 className="text-[#D4AF37]" size={40} />
                    )}
                  </div>
                  <div>
                    <p className="text-[#6EE7B7] text-sm">Member Code</p>
                    <p className="text-[#D4AF37] font-bold text-3xl mono">{selectedCustomer.customer_code || '-'}</p>
                    <p className="text-[#FEF3C7] text-xl mt-1">{getCustomerDisplayName(selectedCustomer)}</p>
                    <p className="text-[#6EE7B7] text-sm">
                      {selectedCustomer.customer_type === 'perorangan' ? 'Nasabah Perorangan' : 'Nasabah Badan Usaha'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCustomer.customer_type === 'perorangan' ? (
                  <>
                    <div><p className="text-[#6EE7B7] text-sm">Jenis Kelamin</p><p className="text-[#FEF3C7]">{selectedCustomer.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p></div>
                    <div><p className="text-[#6EE7B7] text-sm">No. Identitas ({selectedCustomer.identity_type})</p><p className="text-[#FEF3C7] mono">{selectedCustomer.identity_number || '-'}</p></div>
                    <div><p className="text-[#6EE7B7] text-sm">TTL</p><p className="text-[#FEF3C7]">{selectedCustomer.birth_place || '-'}, {selectedCustomer.birth_date || '-'}</p></div>
                    <div><p className="text-[#6EE7B7] text-sm">Telepon</p><p className="text-[#FEF3C7]">{selectedCustomer.phone || '-'}</p></div>
                    <div><p className="text-[#6EE7B7] text-sm">Pekerjaan</p><p className="text-[#FEF3C7]">{selectedCustomer.occupation || '-'}</p></div>
                    <div><p className="text-[#6EE7B7] text-sm">Sumber Dana</p><p className="text-[#FEF3C7]">{selectedCustomer.fund_source || '-'}</p></div>
                    <div className="md:col-span-2"><p className="text-[#6EE7B7] text-sm">Alamat Domisili</p><p className="text-[#FEF3C7]">{selectedCustomer.domicile_address || '-'}</p></div>
                  </>
                ) : (
                  <>
                    <div><p className="text-[#6EE7B7] text-sm">Jenis Badan Usaha</p><p className="text-[#FEF3C7]">{selectedCustomer.entity_type || '-'}</p></div>
                    <div><p className="text-[#6EE7B7] text-sm">NPWP</p><p className="text-[#FEF3C7] mono">{selectedCustomer.npwp || '-'}</p></div>
                    <div><p className="text-[#6EE7B7] text-sm">No. Izin</p><p className="text-[#FEF3C7]">{selectedCustomer.license_number || '-'}</p></div>
                    <div><p className="text-[#6EE7B7] text-sm">PIC</p><p className="text-[#FEF3C7]">{selectedCustomer.pic_name || '-'} ({selectedCustomer.pic_phone || '-'})</p></div>
                    <div className="md:col-span-2"><p className="text-[#6EE7B7] text-sm">Alamat</p><p className="text-[#FEF3C7]">{selectedCustomer.entity_address || '-'}</p></div>
                  </>
                )}
              </div>

              {/* YTD Summary */}
              {ytdSummary && (
                <div className="glass-card rounded-xl p-4">
                  <h3 className="text-[#D4AF37] font-semibold mb-4">Ringkasan Transaksi Tahun Ini (YTD)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-[#6EE7B7] text-sm">Total Transaksi</p>
                      <p className="text-[#FEF3C7] font-bold text-xl">{ytdSummary.total_transactions}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-[#6EE7B7] text-sm">Total Beli</p>
                      <p className="text-blue-400 font-bold">{formatCurrency(ytdSummary.total_buy_idr)}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-[#6EE7B7] text-sm">Total Jual</p>
                      <p className="text-emerald-400 font-bold">{formatCurrency(ytdSummary.total_sell_idr)}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-[#6EE7B7] text-sm">Net</p>
                      <p className={`font-bold ${ytdSummary.net_total_idr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(ytdSummary.net_total_idr)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div>
                <h3 className="text-[#D4AF37] font-semibold mb-4">Riwayat Transaksi</h3>
                {customerTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left py-2 px-3 text-[#D4AF37] text-sm">Tanggal</th>
                          <th className="text-left py-2 px-3 text-[#D4AF37] text-sm">No. Transaksi</th>
                          <th className="text-left py-2 px-3 text-[#D4AF37] text-sm">Tipe</th>
                          <th className="text-left py-2 px-3 text-[#D4AF37] text-sm">Mata Uang</th>
                          <th className="text-right py-2 px-3 text-[#D4AF37] text-sm">Jumlah</th>
                          <th className="text-right py-2 px-3 text-[#D4AF37] text-sm">Total IDR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerTransactions.slice(0, 10).map((t) => (
                          <tr key={t.id} className="border-b border-white/5">
                            <td className="py-2 px-3 text-[#FEF3C7] text-sm">
                              {format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: localeId })}
                            </td>
                            <td className="py-2 px-3 text-[#6EE7B7] text-xs mono">{t.transaction_number}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs ${t.transaction_type === 'beli' || t.transaction_type === 'buy' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                {t.transaction_type === 'beli' || t.transaction_type === 'buy' ? 'Beli' : 'Jual'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[#D4AF37] font-semibold">{t.currency_code}</td>
                            <td className="py-2 px-3 text-right text-[#FEF3C7] mono text-sm">{t.amount.toLocaleString('id-ID')}</td>
                            <td className="py-2 px-3 text-right text-[#D4AF37] font-semibold text-sm">{formatCurrency(t.total_idr)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {customerTransactions.length > 10 && (
                      <p className="text-center text-[#6EE7B7] text-sm py-2">
                        ... dan {customerTransactions.length - 10} transaksi lainnya
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-[#6EE7B7] py-4">Belum ada transaksi tahun ini</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                {(user?.role === 'admin' || user?.role === 'kasir') && (
                  <Button onClick={() => printKYC(selectedCustomer)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Printer size={18} />
                    Cetak KYC
                  </Button>
                )}
                <Button onClick={() => setShowProfileDialog(false)} className="btn-secondary flex-1">
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                    <User size={16} className="mr-2" /> Perorangan
                  </TabsTrigger>
                  <TabsTrigger value="badan_usaha" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                    <Building2 size={16} className="mr-2" /> Badan Usaha
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
              <Button type="submit" className="btn-primary flex-1">
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
