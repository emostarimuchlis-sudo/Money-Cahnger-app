import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const MemberCard = ({ customer, companySettings = {} }) => {
  const isPerorangan = customer?.customer_type === 'perorangan';
  const memberName = isPerorangan ? customer?.name : customer?.entity_name;
  const nationality = customer?.nationality || 'INDONESIA';
  const memberSince = customer?.created_at ? new Date(customer.created_at).getFullYear() : new Date().getFullYear();
  
  const getMemberTier = () => 'SILVER';

  const printMemberCard = () => {
    if (!customer || !customer.customer_code) {
      toast.error('Data nasabah tidak lengkap untuk dicetak');
      return;
    }

    const tier = getMemberTier();
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error('Popup blocked! Izinkan popup untuk mencetak.');
      return;
    }
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Member Card - ${customer.customer_code}</title>
  <style>
    @page { size: 85.6mm 53.98mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #e0e0e0;
      padding: 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 25px;
    }
    .print-info {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .card-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .card-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .card {
      width: 324px;
      height: 204px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      position: relative;
    }
    
    /* === FRONT CARD === */
    .card-front {
      background: linear-gradient(145deg, #1e3a5f 0%, #152238 40%, #0d1829 100%);
      color: white;
      padding: 16px 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .card-front::before {
      content: '';
      position: absolute;
      top: -50px;
      right: -30px;
      width: 180px;
      height: 180px;
      background: radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    .front-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .card-type {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      color: #8ba4c7;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .card-icon {
      width: 16px;
      height: 12px;
      border: 1.5px solid #8ba4c7;
      border-radius: 2px;
      position: relative;
    }
    .card-icon::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 0;
      right: 0;
      height: 1.5px;
      background: #8ba4c7;
    }
    .chip {
      width: 40px;
      height: 30px;
      background: linear-gradient(135deg, #d4af37 0%, #f5e6a3 30%, #d4af37 50%, #b8962e 100%);
      border-radius: 5px;
      position: relative;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .chip::before {
      content: '';
      position: absolute;
      top: 8px;
      left: 4px;
      right: 4px;
      height: 14px;
      border: 1px solid rgba(0,0,0,0.2);
      border-radius: 2px;
    }
    .chip::after {
      content: '';
      position: absolute;
      top: 13px;
      left: 8px;
      right: 8px;
      height: 4px;
      background: rgba(0,0,0,0.15);
    }
    .company-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .company-logo {
      font-size: 18px;
      font-weight: 700;
      color: #d4af37;
      letter-spacing: 2px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .company-subtitle {
      font-size: 8px;
      color: #8ba4c7;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .member-section {
      margin-top: auto;
    }
    .member-label {
      font-size: 7px;
      color: #6b8299;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .member-name {
      font-size: 14px;
      font-weight: 600;
      color: #d4af37;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .member-info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .member-id-section {}
    .member-id {
      font-size: 13px;
      font-weight: 500;
      color: white;
      letter-spacing: 1.5px;
      font-family: 'Consolas', 'Courier New', monospace;
    }
    .since-section {
      text-align: right;
    }
    .since-value {
      font-size: 11px;
      color: #8ba4c7;
    }
    .tier-badge {
      position: absolute;
      bottom: 16px;
      right: 20px;
      background: linear-gradient(135deg, #d4af37 0%, #f5e6a3 50%, #d4af37 100%);
      color: #1e3a5f;
      padding: 4px 14px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      box-shadow: 0 2px 6px rgba(212,175,55,0.4);
    }
    .license-info {
      position: absolute;
      bottom: 16px;
      left: 20px;
      font-size: 7px;
      color: #4a6a8a;
      line-height: 1.4;
    }
    
    /* === BACK CARD === */
    .card-back {
      background: linear-gradient(145deg, #1e3a5f 0%, #152238 100%);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .magnetic-strip {
      width: 100%;
      height: 32px;
      background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
      margin-top: 14px;
    }
    .back-content {
      padding: 12px 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .info-row {
      background: linear-gradient(90deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%);
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
    .info-label {
      font-size: 7px;
      color: #6b8299;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 11px;
      color: white;
      font-weight: 500;
    }
    .barcode-section {
      margin-top: auto;
      text-align: center;
      padding-bottom: 5px;
    }
    .barcode {
      font-family: 'Libre Barcode 39', 'IDAutomationHC39M', monospace;
      font-size: 32px;
      color: white;
      letter-spacing: 3px;
    }
    .barcode-fallback {
      display: flex;
      justify-content: center;
      gap: 1px;
      margin-bottom: 4px;
    }
    .bar { background: white; }
    .bar.thin { width: 1px; height: 28px; }
    .bar.medium { width: 2px; height: 28px; }
    .bar.thick { width: 3px; height: 28px; }
    .bar.space { width: 2px; height: 28px; background: transparent; }
    .barcode-text {
      font-size: 9px;
      color: #6b8299;
      letter-spacing: 2px;
      font-family: 'Consolas', monospace;
    }
    .back-footer {
      text-align: center;
      font-size: 7px;
      color: #4a6a8a;
      padding: 8px 0;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    @media print {
      body { background: white; padding: 0; }
      .print-info { display: none; }
      .card { 
        box-shadow: none; 
        page-break-after: always;
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <div class="print-info">
    <strong>PETUNJUK CETAK:</strong> Gunakan PVC Card / Kertas Glossy ukuran 85.6mm x 53.98mm<br>
    Pengaturan: Landscape, Full Color, Best Quality
  </div>

  <!-- FRONT CARD -->
  <div class="card-wrapper">
    <div class="card-label">▼ SISI DEPAN (FRONT)</div>
    <div class="card card-front">
      <div class="front-header">
        <div class="card-type">
          <div class="card-icon"></div>
          MEMBER CARD
        </div>
        <div class="chip"></div>
      </div>
      
      <div class="company-section">
        <div class="company-logo">MULIA BALI VALUTA</div>
        <div class="company-subtitle">Authorized Money Changer</div>
      </div>
      
      <div class="member-section">
        <div class="member-label">Member Name</div>
        <div class="member-name">${memberName || '-'}</div>
        
        <div class="member-info-row">
          <div class="member-id-section">
            <div class="member-label">Member ID</div>
            <div class="member-id">${customer?.customer_code || '-'}</div>
          </div>
          <div class="since-section">
            <div class="member-label">Since</div>
            <div class="since-value">${memberSince}</div>
          </div>
        </div>
      </div>
      
      <div class="license-info">
        Authorized Money Changer<br>
        License BI: ${companySettings.license_number || 'XXX/XXX/XXXX'}
      </div>
      
      <div class="tier-badge">${tier}</div>
    </div>
  </div>
  
  <!-- BACK CARD -->
  <div class="card-wrapper">
    <div class="card-label">▼ SISI BELAKANG (BACK)</div>
    <div class="card card-back">
      <div class="magnetic-strip"></div>
      
      <div class="back-content">
        <div class="info-row">
          <div class="info-label">Full Name</div>
          <div class="info-value">${memberName || '-'}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Nationality</div>
          <div class="info-value">${nationality}</div>
        </div>
        
        <div class="barcode-section">
          <div class="barcode-fallback">
            <div class="bar thick"></div>
            <div class="bar space"></div>
            <div class="bar thin"></div>
            <div class="bar space"></div>
            <div class="bar medium"></div>
            <div class="bar space"></div>
            <div class="bar thin"></div>
            <div class="bar space"></div>
            <div class="bar thick"></div>
            <div class="bar space"></div>
            <div class="bar thin"></div>
            <div class="bar space"></div>
            <div class="bar medium"></div>
            <div class="bar space"></div>
            <div class="bar thick"></div>
            <div class="bar space"></div>
            <div class="bar thin"></div>
            <div class="bar space"></div>
            <div class="bar medium"></div>
            <div class="bar space"></div>
            <div class="bar thin"></div>
            <div class="bar space"></div>
            <div class="bar thick"></div>
            <div class="bar space"></div>
            <div class="bar medium"></div>
            <div class="bar space"></div>
            <div class="bar thin"></div>
            <div class="bar space"></div>
            <div class="bar thick"></div>
          </div>
          <div class="barcode-text">${customer?.customer_code || '-'}</div>
        </div>
      </div>
      
      <div class="back-footer">
        ${companySettings.company_address || 'Bali, Indonesia'} | ${companySettings.company_phone || 'www.mbamoneychange.com'}
      </div>
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
    toast.success('Membuka halaman cetak Member Card...');
  };

  if (!customer) return null;

  return (
    <div className="space-y-6">
      {/* Preview Cards */}
      <div className="flex flex-col lg:flex-row gap-8 justify-center items-center">
        {/* FRONT CARD PREVIEW */}
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-3 font-medium">▼ SISI DEPAN (FRONT)</p>
          <div 
            className="relative overflow-hidden rounded-xl shadow-2xl"
            style={{ 
              width: '324px', 
              height: '204px',
              background: 'linear-gradient(145deg, #1e3a5f 0%, #152238 40%, #0d1829 100%)'
            }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-12 -right-8 w-44 h-44 bg-yellow-500/10 rounded-full blur-xl" />
            
            <div className="p-4 h-full flex flex-col relative z-10">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] tracking-widest">
                  <div className="w-4 h-3 border border-gray-400 rounded-sm relative">
                    <div className="absolute top-1 left-0 right-0 h-px bg-gray-400" />
                  </div>
                  MEMBER CARD
                </div>
                {/* Chip */}
                <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-500 shadow-md relative">
                  <div className="absolute top-1.5 left-1 right-1 h-4 border border-black/20 rounded-sm" />
                  <div className="absolute top-3 left-2 right-2 h-1 bg-black/10" />
                </div>
              </div>
              
              {/* Company */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-[#d4af37] font-bold text-lg tracking-wider drop-shadow">MULIA BALI VALUTA</h3>
                <p className="text-gray-400 text-[9px] tracking-wide">Authorized Money Changer</p>
              </div>
              
              {/* Member Info */}
              <div>
                <p className="text-[7px] text-gray-500 tracking-wider uppercase mb-0.5">Member Name</p>
                <p className="text-[#d4af37] font-semibold text-sm mb-2">{memberName || '-'}</p>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[7px] text-gray-500 tracking-wider uppercase mb-0.5">Member ID</p>
                    <p className="text-white text-sm tracking-wider font-mono">{customer?.customer_code || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] text-gray-500 tracking-wider uppercase mb-0.5">Since</p>
                    <p className="text-gray-400 text-sm">{memberSince}</p>
                  </div>
                </div>
              </div>
              
              {/* Badge & License */}
              <div className="absolute bottom-3 right-4 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-blue-900 px-3 py-1 rounded-full text-[9px] font-bold tracking-wider shadow-lg">
                {getMemberTier()}
              </div>
              
              <div className="absolute bottom-3 left-4 text-[7px] text-gray-500 leading-relaxed">
                Authorized Money Changer<br/>
                License BI: {companySettings.license_number || 'XXX/XXX/XXXX'}
              </div>
            </div>
          </div>
        </div>

        {/* BACK CARD PREVIEW */}
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-3 font-medium">▼ SISI BELAKANG (BACK)</p>
          <div 
            className="relative overflow-hidden rounded-xl shadow-2xl"
            style={{ 
              width: '324px', 
              height: '204px',
              background: 'linear-gradient(145deg, #1e3a5f 0%, #152238 100%)'
            }}
          >
            {/* Magnetic Strip */}
            <div className="w-full h-8 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 mt-3" />
            
            <div className="p-4 flex flex-col h-[calc(100%-44px)]">
              {/* Info Boxes */}
              <div className="bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 rounded p-2 mb-2">
                <p className="text-[7px] text-gray-500 tracking-wider uppercase mb-0.5">Full Name</p>
                <p className="text-white text-sm font-medium">{memberName || '-'}</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 rounded p-2 mb-3">
                <p className="text-[7px] text-gray-500 tracking-wider uppercase mb-0.5">Nationality</p>
                <p className="text-white text-sm font-medium">{nationality}</p>
              </div>
              
              {/* Barcode */}
              <div className="mt-auto text-center">
                <div className="flex justify-center gap-[2px] mb-1">
                  {[3,1,2,1,3,1,2,1,3,1,2,1,3,1,2,1,3].map((w, i) => (
                    <div key={i} className="bg-white" style={{ width: `${w}px`, height: '24px' }} />
                  ))}
                </div>
                <p className="text-gray-500 text-[9px] tracking-widest font-mono">{customer?.customer_code}</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 text-center text-[7px] text-gray-600 py-2 border-t border-white/10">
              {companySettings.company_address || 'Bali, Indonesia'}
            </div>
          </div>
        </div>
      </div>

      {/* Print Instructions */}
      <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4">
        <h4 className="text-[#d4af37] font-semibold mb-2 flex items-center gap-2">
          <Printer size={18} />
          Petunjuk Cetak Member Card:
        </h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong>Bahan:</strong> PVC Card Blank atau kertas glossy tebal</li>
          <li>• <strong>Ukuran:</strong> Standar kartu ATM (85.6mm x 53.98mm)</li>
          <li>• <strong>Pengaturan Printer:</strong> Landscape, Full Color, Best Quality</li>
          <li>• <strong>Cara:</strong> Cetak sisi depan, tunggu kering, balik kertas, cetak sisi belakang</li>
        </ul>
      </div>

      {/* Print Button */}
      <div className="flex justify-center">
        <Button onClick={printMemberCard} className="btn-primary flex items-center gap-2 px-8 py-3 text-lg">
          <Printer size={20} />
          Cetak Member Card
        </Button>
      </div>
    </div>
  );
};

export default MemberCard;
