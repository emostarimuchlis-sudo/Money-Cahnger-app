import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const TransactionBook = ({ customer, transactions = [], companySettings = {} }) => {
  const isPerorangan = customer?.customer_type === 'perorangan';
  const memberName = isPerorangan ? customer?.name : customer?.entity_name;
  
  // Calculate totals
  const totalBuy = transactions.filter(t => t.transaction_type === 'beli' || t.transaction_type === 'buy')
    .reduce((sum, t) => sum + (t.total_idr || 0), 0);
  const totalSell = transactions.filter(t => t.transaction_type === 'jual' || t.transaction_type === 'sell')
    .reduce((sum, t) => sum + (t.total_idr || 0), 0);
  const totalAll = totalBuy + totalSell;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatAmount = (value, decimals = 2) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value || 0);
  };

  const printTransactionBook = () => {
    if (!customer || !customer.customer_code) {
      toast.error('Data nasabah tidak lengkap untuk dicetak');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error('Popup blocked! Izinkan popup untuk mencetak.');
      return;
    }
    
    const transactionRows = transactions.length > 0 ? transactions.map(t => `
      <tr>
        <td class="date">${t.transaction_date ? format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: localeId }) : '-'}</td>
        <td class="trx-num">${t.transaction_number || '-'}</td>
        <td class="type">
          <span class="badge ${t.transaction_type === 'jual' || t.transaction_type === 'sell' ? 'badge-sell' : 'badge-buy'}">
            ${t.transaction_type === 'jual' || t.transaction_type === 'sell' ? 'JUAL' : 'BELI'}
          </span>
        </td>
        <td class="currency">${t.currency_code || '-'} ${formatAmount(t.amount)}</td>
        <td class="rate">${formatAmount(t.exchange_rate, 0)}</td>
        <td class="amount">${formatCurrency(t.total_idr)}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="6" class="empty-row">Belum ada transaksi tercatat</td>
      </tr>
    `;
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Buku Transaksi - ${customer.customer_code}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif;
      background: white;
      color: #333;
      font-size: 11px;
      line-height: 1.5;
    }
    
    /* === HEADER === */
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #152238 100%);
      color: white;
      padding: 20px 25px;
      border-radius: 8px 8px 0 0;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 3px;
    }
    .header .subtitle {
      font-size: 11px;
      color: #8ba4c7;
    }
    .header-logo {
      text-align: right;
    }
    .header-logo .company {
      font-size: 14px;
      font-weight: 600;
      color: #d4af37;
    }
    .header-logo .tagline {
      font-size: 9px;
      color: #8ba4c7;
    }
    
    /* === MEMBER INFO === */
    .member-info {
      background: linear-gradient(90deg, #152238 0%, #1e3a5f 100%);
      color: white;
      padding: 15px 25px;
      border-bottom: 3px solid #d4af37;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .member-name {
      font-size: 16px;
      font-weight: 600;
      color: #d4af37;
    }
    .member-id {
      font-size: 11px;
      color: #8ba4c7;
      margin-top: 2px;
    }
    .member-meta {
      text-align: right;
      font-size: 10px;
      color: #8ba4c7;
    }
    
    /* === TABLE === */
    .table-container {
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead {
      background: #1e3a5f;
      color: white;
    }
    th {
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #d4af37;
    }
    th.center { text-align: center; }
    th.right { text-align: right; }
    td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10px;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    tr:hover {
      background: #eef2f7;
    }
    .date { width: 80px; color: #4a5568; }
    .trx-num { 
      width: 180px;
      font-family: 'Consolas', monospace;
      font-size: 9px;
      color: #64748b;
    }
    .type { width: 70px; text-align: center; }
    .currency { width: 120px; font-weight: 500; }
    .rate { width: 80px; text-align: right; color: #64748b; }
    .amount { width: 130px; text-align: right; font-weight: 600; color: #1e3a5f; }
    .empty-row {
      text-align: center;
      padding: 40px;
      color: #94a3b8;
      font-style: italic;
    }
    
    /* === BADGES === */
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .badge-sell {
      background: #dcfce7;
      color: #166534;
    }
    .badge-buy {
      background: #dbeafe;
      color: #1e40af;
    }
    
    /* === SUMMARY === */
    .summary {
      border: 2px solid #1e3a5f;
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }
    .summary-header {
      background: #1e3a5f;
      color: white;
      padding: 12px 25px;
      font-weight: 700;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .summary-header .title {
      color: #d4af37;
    }
    .summary-content {
      padding: 15px 25px;
      background: #f8fafc;
    }
    .summary-grid {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }
    .summary-item {
      flex: 1;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .summary-item.buy { border-left: 3px solid #3b82f6; }
    .summary-item.sell { border-left: 3px solid #22c55e; }
    .summary-item.total { border-left: 3px solid #d4af37; background: #fefce8; }
    .summary-label {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a5f;
    }
    .summary-value.buy { color: #3b82f6; }
    .summary-value.sell { color: #22c55e; }
    .summary-value.total { color: #d4af37; font-size: 16px; }
    .trx-count {
      text-align: center;
      padding: 10px;
      background: #e2e8f0;
      color: #64748b;
      font-size: 10px;
      border-radius: 4px;
    }
    
    /* === FOOTER === */
    .footer {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #94a3b8;
      font-size: 9px;
    }
    .footer .print-date {}
    .footer .legal {
      font-style: italic;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <div>
        <h1>BUKU TRANSAKSI</h1>
        <div class="subtitle">Riwayat Transaksi Nasabah</div>
      </div>
      <div class="header-logo">
        <div class="company">${companySettings.company_name || 'Mulia Bali Valuta'}</div>
        <div class="tagline">Money Changer</div>
      </div>
    </div>
  </div>
  
  <div class="member-info">
    <div>
      <div class="member-name">${memberName || '-'}</div>
      <div class="member-id">Member ID: ${customer?.customer_code || '-'}</div>
    </div>
    <div class="member-meta">
      Periode: Semua Transaksi<br>
      Jumlah: ${transactions.length} transaksi
    </div>
  </div>
  
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>No. Transaksi</th>
          <th class="center">Jenis</th>
          <th>Mata Uang</th>
          <th class="right">Kurs</th>
          <th class="right">Jumlah (IDR)</th>
        </tr>
      </thead>
      <tbody>
        ${transactionRows}
      </tbody>
    </table>
  </div>
  
  <div class="summary">
    <div class="summary-header">
      <span class="title">RINGKASAN TRANSAKSI</span>
    </div>
    <div class="summary-content">
      <div class="summary-grid">
        <div class="summary-item buy">
          <div class="summary-label">Total Pembelian (Beli)</div>
          <div class="summary-value buy">${formatCurrency(totalBuy)}</div>
        </div>
        <div class="summary-item sell">
          <div class="summary-label">Total Penjualan (Jual)</div>
          <div class="summary-value sell">${formatCurrency(totalSell)}</div>
        </div>
        <div class="summary-item total">
          <div class="summary-label">Grand Total</div>
          <div class="summary-value total">${formatCurrency(totalAll)}</div>
        </div>
      </div>
      <div class="trx-count">
        Total <strong>${transactions.length}</strong> transaksi tercatat dalam sistem
      </div>
    </div>
  </div>
  
  <div class="footer">
    <div class="print-date">
      Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })} WITA
    </div>
    <div class="legal">
      Dokumen ini sah tanpa tanda tangan
    </div>
  </div>
  
  <script>
    window.onload = function() { 
      setTimeout(function() { 
        window.print(); 
      }, 800); 
    }
  </script>
</body>
</html>`;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    toast.success('Membuka halaman cetak Buku Transaksi...');
  };

  return (
    <div className="space-y-4">
      {/* Transaction Table */}
      <div className="bg-emerald-900/20 rounded-lg overflow-hidden border border-emerald-800/30">
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-emerald-900/50 sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Tanggal</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">No. Transaksi</th>
                <th className="text-center py-3 px-4 text-[#D4AF37] font-semibold text-sm">Jenis</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Mata Uang</th>
                <th className="text-right py-3 px-4 text-[#D4AF37] font-semibold text-sm">Kurs</th>
                <th className="text-right py-3 px-4 text-[#D4AF37] font-semibold text-sm">Jumlah (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((t, idx) => (
                  <tr key={t.id || idx} className="border-b border-emerald-800/30 hover:bg-emerald-900/30 transition-colors">
                    <td className="py-3 px-4 text-white text-sm">
                      {t.transaction_date ? format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: localeId }) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs font-mono">
                      {t.transaction_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                        t.transaction_type === 'jual' || t.transaction_type === 'sell' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {t.transaction_type === 'jual' || t.transaction_type === 'sell' ? 'JUAL' : 'BELI'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white text-sm font-medium">
                      {t.currency_code} {formatAmount(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm text-right">
                      {formatAmount(t.exchange_rate, 0)}
                    </td>
                    <td className="py-3 px-4 text-[#D4AF37] text-sm text-right font-bold">
                      {formatCurrency(t.total_idr)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-lg">Belum ada transaksi tercatat</p>
                    <p className="text-sm text-gray-600 mt-1">Transaksi nasabah akan tampil di sini</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Total Beli</p>
          <p className="text-blue-400 font-bold text-xl">{formatCurrency(totalBuy)}</p>
        </div>
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Total Jual</p>
          <p className="text-green-400 font-bold text-xl">{formatCurrency(totalSell)}</p>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Grand Total</p>
          <p className="text-[#D4AF37] font-bold text-xl">{formatCurrency(totalAll)}</p>
        </div>
      </div>
      
      <p className="text-center text-gray-500 text-sm">
        Total <span className="font-bold text-white">{transactions.length}</span> transaksi tercatat
      </p>

      {/* Print Button */}
      <div className="flex justify-center pt-2">
        <Button onClick={printTransactionBook} className="btn-primary flex items-center gap-2 px-8 py-3 text-lg">
          <FileText size={20} />
          Cetak Buku Transaksi
        </Button>
      </div>
    </div>
  );
};

export default TransactionBook;
