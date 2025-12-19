import React from 'react';
import { Printer, FileText } from 'lucide-react';
import { Button } from './ui/button';
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

  const formatAmount = (value) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const printTransactionBook = () => {
    const printWindow = window.open('', '_blank');
    
    const transactionRows = transactions.map(t => `
      <tr>
        <td>${t.transaction_date ? format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: localeId }) : '-'}</td>
        <td class="trx-number">${t.transaction_number || '-'}</td>
        <td>
          <span class="badge ${t.transaction_type === 'jual' || t.transaction_type === 'sell' ? 'badge-sell' : 'badge-buy'}">
            ${t.transaction_type === 'jual' || t.transaction_type === 'sell' ? 'JUAL' : 'BELI'}
          </span>
        </td>
        <td class="currency">${t.currency_code || '-'} ${formatAmount(t.amount)}</td>
        <td class="rate">${formatAmount(t.exchange_rate)}</td>
        <td class="amount">${formatCurrency(t.total_idr)}</td>
      </tr>
    `).join('');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Buku Transaksi - ${customer?.customer_code}</title>
        <style>
          @page { 
            size: A4; 
            margin: 15mm; 
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif;
            background: white;
            color: #333;
            font-size: 11px;
            line-height: 1.4;
          }
          
          /* Header */
          .header {
            background: linear-gradient(135deg, #1a365d 0%, #0d1f3c 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
          }
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            letter-spacing: 1px;
          }
          .header .subtitle {
            font-size: 12px;
            color: #a0aec0;
          }
          
          /* Member Info */
          .member-info {
            background: linear-gradient(135deg, #0d1f3c 0%, #1a365d 100%);
            color: white;
            padding: 15px 20px;
            border-bottom: 3px solid #d4af37;
          }
          .member-name {
            font-size: 16px;
            font-weight: bold;
            color: #d4af37;
          }
          .member-id {
            font-size: 11px;
            color: #a0aec0;
            margin-top: 2px;
          }
          
          /* Table */
          .table-container {
            margin: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead {
            background: #1a365d;
            color: #d4af37;
          }
          th {
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background: #f7fafc;
          }
          tr:hover {
            background: #edf2f7;
          }
          
          .trx-number {
            font-family: 'Consolas', monospace;
            font-size: 9px;
            color: #4a5568;
          }
          .currency {
            font-weight: 500;
          }
          .rate {
            color: #718096;
          }
          .amount {
            font-weight: 600;
            color: #2d3748;
            text-align: right;
          }
          
          /* Badges */
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .badge-sell {
            background: #c6f6d5;
            color: #22543d;
          }
          .badge-buy {
            background: #bee3f8;
            color: #2c5282;
          }
          
          /* Summary */
          .summary {
            border: 2px solid #1a365d;
            border-radius: 0 0 8px 8px;
            margin-top: 0;
            overflow: hidden;
          }
          .summary-header {
            background: #1a365d;
            color: #d4af37;
            padding: 10px 20px;
            font-weight: bold;
            font-size: 12px;
          }
          .summary-content {
            padding: 15px 20px;
            background: #f7fafc;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dashed #e2e8f0;
          }
          .summary-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 14px;
            padding-top: 10px;
            margin-top: 5px;
            border-top: 2px solid #1a365d;
          }
          .summary-label {
            color: #4a5568;
          }
          .summary-value {
            color: #1a365d;
            font-weight: 600;
          }
          .total-value {
            color: #d4af37;
            font-size: 16px;
          }
          .trx-count {
            text-align: center;
            padding: 10px;
            background: #edf2f7;
            color: #4a5568;
            font-size: 10px;
          }
          
          /* Footer */
          .footer {
            margin-top: 20px;
            padding: 15px 0;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 10px;
          }
          .footer .print-date {
            margin-bottom: 5px;
          }
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
          <h1>BUKU TRANSAKSI</h1>
          <div class="subtitle">${companySettings.company_name || 'Mulia Bali Valuta'} - Money Changer</div>
        </div>
        
        <div class="member-info">
          <div class="member-name">${memberName || '-'}</div>
          <div class="member-id">Member ID: ${customer?.customer_code || '-'}</div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 80px;">TANGGAL</th>
                <th style="width: 200px;">NO. TRANSAKSI</th>
                <th style="width: 60px;">JENIS</th>
                <th style="width: 120px;">MATA UANG</th>
                <th style="width: 80px;">KURS</th>
                <th style="width: 120px; text-align: right;">JUMLAH (IDR)</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRows || '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #a0aec0;">Belum ada transaksi</td></tr>'}
            </tbody>
          </table>
        </div>
        
        <div class="summary">
          <div class="summary-header">TOTAL TRANSAKSI:</div>
          <div class="summary-content">
            <div class="summary-row">
              <span class="summary-label">Total Pembelian (Beli)</span>
              <span class="summary-value">${formatCurrency(totalBuy)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Penjualan (Jual)</span>
              <span class="summary-value">${formatCurrency(totalSell)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">GRAND TOTAL</span>
              <span class="summary-value total-value">${formatCurrency(totalAll)}</span>
            </div>
          </div>
          <div class="trx-count">
            Total ${transactions.length} transaksi tercatat
          </div>
        </div>
        
        <div class="footer">
          <div class="print-date">Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })}</div>
          <div class="legal">Dokumen ini sah tanpa tanda tangan</div>
        </div>
        
        <script>
          window.onload = function() { 
            setTimeout(function() { 
              window.print(); 
            }, 500); 
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Transaction Table */}
      <div className="bg-emerald-900/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-emerald-900/50 sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Tanggal</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">No. Transaksi</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Jenis</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Mata Uang</th>
                <th className="text-left py-3 px-4 text-[#D4AF37] font-semibold text-sm">Kurs</th>
                <th className="text-right py-3 px-4 text-[#D4AF37] font-semibold text-sm">Jumlah (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((t, idx) => (
                  <tr key={t.id || idx} className="border-b border-emerald-800/30 hover:bg-emerald-900/30">
                    <td className="py-3 px-4 text-white text-sm">
                      {t.transaction_date ? format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: localeId }) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs font-mono">
                      {t.transaction_number || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        t.transaction_type === 'jual' || t.transaction_type === 'sell' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {t.transaction_type === 'jual' || t.transaction_type === 'sell' ? 'JUAL' : 'BELI'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {t.currency_code} {formatAmount(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {formatAmount(t.exchange_rate)}
                    </td>
                    <td className="py-3 px-4 text-white text-sm text-right font-semibold">
                      {formatCurrency(t.total_idr)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    Belum ada transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-900/30 rounded">
            <p className="text-gray-400 text-sm">Total Beli</p>
            <p className="text-blue-400 font-bold text-lg">{formatCurrency(totalBuy)}</p>
          </div>
          <div className="text-center p-3 bg-green-900/30 rounded">
            <p className="text-gray-400 text-sm">Total Jual</p>
            <p className="text-green-400 font-bold text-lg">{formatCurrency(totalSell)}</p>
          </div>
          <div className="text-center p-3 bg-yellow-900/30 rounded">
            <p className="text-gray-400 text-sm">Grand Total</p>
            <p className="text-[#D4AF37] font-bold text-lg">{formatCurrency(totalAll)}</p>
          </div>
        </div>
        <p className="text-center text-gray-500 text-sm mt-3">
          Total {transactions.length} transaksi tercatat
        </p>
      </div>

      {/* Print Button */}
      <div className="flex justify-center">
        <Button onClick={printTransactionBook} className="btn-primary flex items-center gap-2 px-8">
          <FileText size={18} />
          Cetak Buku Transaksi
        </Button>
      </div>
    </div>
  );
};

export default TransactionBook;
