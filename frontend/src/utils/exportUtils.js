import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Export to Excel
export const exportToExcel = (data, columns, filename) => {
  const worksheetData = data.map(row => {
    const rowData = {};
    columns.forEach(col => {
      rowData[col.header] = col.accessor ? col.accessor(row) : row[col.key];
    });
    return rowData;
  });
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export to PDF
export const exportToPDF = (data, columns, filename, title, companyInfo = {}) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(6, 78, 59); // Emerald color
  doc.text(companyInfo.name || 'Mulia Bali Valuta (MBA Money Changer)', 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (companyInfo.address) doc.text(companyInfo.address, 14, 22);
  if (companyInfo.phone) doc.text(`Telp: ${companyInfo.phone}`, 14, 27);
  
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(title, 14, 38);
  
  doc.setFontSize(9);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 44);
  
  // Table data - sanitize to ensure no objects are passed
  const tableData = data.map(row => 
    columns.map(col => {
      try {
        let value = col.accessor ? col.accessor(row) : row[col.key];
        // Ensure value is a string or number, not an object
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      } catch (e) {
        return '-';
      }
    })
  );
  
  doc.autoTable({
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 50,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [6, 78, 59], textColor: [254, 243, 199] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { top: 50 }
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }
  
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Print table
export const printTable = (data, columns, title, companyInfo = {}) => {
  const printWindow = window.open('', '_blank');
  
  const tableRows = data.map(row => 
    `<tr>${columns.map(col => `<td>${col.accessor ? col.accessor(row) : row[col.key] || '-'}</td>`).join('')}</tr>`
  ).join('');
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @media print { body { margin: 10mm; } }
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #064E3B; padding-bottom: 15px; }
        .header h1 { margin: 0; color: #064E3B; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        .title { font-size: 18px; font-weight: bold; margin: 15px 0; color: #064E3B; }
        .meta { color: #666; font-size: 10px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #064E3B; color: #FEF3C7; padding: 8px; text-align: left; font-size: 11px; }
        td { border-bottom: 1px solid #ddd; padding: 6px 8px; font-size: 10px; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyInfo.name || 'Mulia Bali Valuta (MBA Money Changer)'}</h1>
        ${companyInfo.address ? `<p>${companyInfo.address}</p>` : ''}
        ${companyInfo.phone ? `<p>Telp: ${companyInfo.phone}</p>` : ''}
      </div>
      <div class="title">${title}</div>
      <div class="meta">Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
      <table>
        <thead>
          <tr>${columns.map(col => `<th>${col.header}</th>`).join('')}</tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">
        <p>${companyInfo.footer || 'Terima kasih'}</p>
        <p>${companyInfo.name || 'Mulia Bali Valuta'} - MBA Money Changer</p>
      </div>
      <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
};

// Format currency for export
export const formatCurrencyExport = (value) => {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(value || 0);
};

// Format date for export
export const formatDateExport = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID');
  } catch {
    return dateStr;
  }
};
