import React from 'react';
import { FileText, FileSpreadsheet, Download, Book, Users, CreditCard, Wallet, BarChart3, Settings, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserManual = () => {
  const handleDownload = async (format) => {
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

  const chapters = [
    { icon: <Book className="w-6 h-6" />, title: 'Pendahuluan', desc: 'Tentang aplikasi, fitur utama, dan role pengguna' },
    { icon: <Users className="w-6 h-6" />, title: 'Login & Logout', desc: 'Cara masuk dan keluar dari aplikasi' },
    { icon: <BarChart3 className="w-6 h-6" />, title: 'Dashboard', desc: 'Ringkasan operasional harian' },
    { icon: <CreditCard className="w-6 h-6" />, title: 'Manajemen Transaksi', desc: 'Membuat transaksi jual/beli valas' },
    { icon: <Users className="w-6 h-6" />, title: 'Data Nasabah', desc: 'Mengelola data nasabah perorangan dan badan usaha' },
    { icon: <Wallet className="w-6 h-6" />, title: 'Buku Kas', desc: 'Mencatat aliran kas harian' },
    { icon: <BarChart3 className="w-6 h-6" />, title: 'Mutasi Valas', desc: 'Pergerakan stok mata uang asing' },
    { icon: <FileText className="w-6 h-6" />, title: 'Laporan', desc: 'Laporan SIPESAT dan pelaporan regulasi' },
    { icon: <Settings className="w-6 h-6" />, title: 'Pengaturan', desc: 'Konfigurasi sistem (khusus Admin)' },
    { icon: <Download className="w-6 h-6" />, title: 'Backup & Export', desc: 'Cara export dan backup data' },
    { icon: <HelpCircle className="w-6 h-6" />, title: 'FAQ & Troubleshooting', desc: 'Pertanyaan umum dan pemecahan masalah' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Petunjuk Teknis Penggunaan
        </h1>
        <p className="text-[#D1FAE5] mt-2">Panduan lengkap penggunaan Aplikasi MBA Money Changer</p>
      </div>

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
            onClick={() => handleDownload('docx')} 
            className="btn-primary flex items-center gap-3 px-6 py-4"
          >
            <FileSpreadsheet size={24} />
            <div className="text-left">
              <div className="font-bold">Download Word</div>
              <div className="text-xs opacity-80">Format .docx (Microsoft Word)</div>
            </div>
          </Button>
          
          <Button 
            onClick={() => handleDownload('pdf')} 
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
          {chapters.map((chapter, index) => (
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
          {/* Login */}
          <div className="border-l-4 border-[#D4AF37] pl-4">
            <h3 className="text-[#FEF3C7] font-bold mb-2">Cara Login</h3>
            <ol className="text-[#6EE7B7] text-sm space-y-1 list-decimal list-inside">
              <li>Buka aplikasi melalui browser</li>
              <li>Masukkan Email dan Password</li>
              <li>Klik tombol "Masuk"</li>
            </ol>
          </div>
          
          {/* Transaction */}
          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="text-[#FEF3C7] font-bold mb-2">Membuat Transaksi</h3>
            <ol className="text-[#6EE7B7] text-sm space-y-1 list-decimal list-inside">
              <li>Buka menu "Transaksi"</li>
              <li>Klik "+ Transaksi Baru"</li>
              <li>Pilih nasabah (atau tambah baru)</li>
              <li>Pilih tipe: Jual atau Beli</li>
              <li>Masukkan mata uang, jumlah, dan kurs</li>
              <li>Minta nasabah tanda tangan</li>
              <li>Klik "Cetak & Simpan"</li>
            </ol>
          </div>
          
          {/* Export */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-[#FEF3C7] font-bold mb-2">Export Data</h3>
            <ol className="text-[#6EE7B7] text-sm space-y-1 list-decimal list-inside">
              <li>Buka halaman yang ingin di-export</li>
              <li>Klik tombol "Excel" untuk format spreadsheet</li>
              <li>Klik tombol "PDF" untuk format cetak</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="glass-card rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Butuh Bantuan?
        </h2>
        <p className="text-[#FEF3C7]/70 mb-4">
          Hubungi tim dukungan teknis kami:
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-[#6EE7B7]">
          <span>📧 support@moztec.com</span>
          <span>📱 WhatsApp: +62 xxx-xxxx-xxxx</span>
        </div>
      </div>
    </div>
  );
};

export default UserManual;
