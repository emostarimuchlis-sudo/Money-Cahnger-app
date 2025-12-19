import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from './ui/button';

const MemberCard = ({ customer, companySettings = {}, onClose }) => {
  const isPerorangan = customer?.customer_type === 'perorangan';
  const memberName = isPerorangan ? customer?.name : customer?.entity_name;
  const nationality = customer?.nationality || 'INDONESIA';
  const memberSince = customer?.created_at ? new Date(customer.created_at).getFullYear() : new Date().getFullYear();
  
  // Determine tier based on transaction history (can be expanded)
  const getMemberTier = () => {
    return 'SILVER'; // Default tier, can be made dynamic based on transaction volume
  };

  const printMemberCard = () => {
    const printWindow = window.open('', '_blank');
    const tier = getMemberTier();
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Member Card - ${customer?.customer_code}</title>
        <style>
          @page { 
            size: 85.6mm 53.98mm; 
            margin: 0; 
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f0f0f0;
            padding: 20px;
          }
          .card-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-width: 400px;
            margin: 0 auto;
          }
          .card {
            width: 85.6mm;
            height: 53.98mm;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            position: relative;
          }
          
          /* FRONT CARD */
          .card-front {
            background: linear-gradient(135deg, #1a365d 0%, #0d1f3c 50%, #091428 100%);
            color: white;
            padding: 12px 15px;
          }
          .card-front::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100%;
            background: linear-gradient(180deg, rgba(212,175,55,0.1) 0%, transparent 100%);
          }
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .card-type {
            font-size: 8px;
            color: #a0aec0;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .card-type svg {
            width: 14px;
            height: 14px;
          }
          .chip {
            width: 35px;
            height: 28px;
            background: linear-gradient(135deg, #d4af37 0%, #f0d78c 50%, #d4af37 100%);
            border-radius: 4px;
          }
          .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #d4af37;
            margin: 10px 0 5px;
            letter-spacing: 1px;
          }
          .company-subtitle {
            font-size: 7px;
            color: #a0aec0;
            letter-spacing: 0.5px;
          }
          .member-info {
            margin-top: 12px;
          }
          .member-label {
            font-size: 6px;
            color: #718096;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .member-name {
            font-size: 11px;
            font-weight: 600;
            color: #d4af37;
            letter-spacing: 0.5px;
          }
          .member-row {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
          }
          .member-id {
            font-size: 10px;
            color: white;
            letter-spacing: 1px;
          }
          .member-since {
            font-size: 8px;
            color: #a0aec0;
          }
          .tier-badge {
            position: absolute;
            bottom: 12px;
            right: 15px;
            background: linear-gradient(135deg, #d4af37 0%, #f0d78c 100%);
            color: #1a365d;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .license-info {
            position: absolute;
            bottom: 12px;
            left: 15px;
            font-size: 6px;
            color: #718096;
          }
          
          /* BACK CARD */
          .card-back {
            background: linear-gradient(135deg, #1a365d 0%, #0d1f3c 100%);
            color: white;
            position: relative;
          }
          .magnetic-strip {
            width: 100%;
            height: 25px;
            background: #0a0a0a;
            margin-top: 10px;
          }
          .back-content {
            padding: 10px 15px;
          }
          .info-box {
            background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.1) 100%);
            border-radius: 4px;
            padding: 8px 10px;
            margin: 5px 0;
          }
          .info-label {
            font-size: 6px;
            color: #718096;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 9px;
            color: white;
            font-weight: 500;
          }
          .barcode-area {
            margin-top: 8px;
            text-align: center;
          }
          .barcode {
            font-family: 'Libre Barcode 39', monospace;
            font-size: 28px;
            letter-spacing: 2px;
            color: white;
          }
          .barcode-text {
            font-size: 7px;
            color: #718096;
            margin-top: 2px;
          }
          .footer-text {
            position: absolute;
            bottom: 8px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 6px;
            color: #4a5568;
          }
          
          .print-label {
            text-align: center;
            font-size: 11px;
            color: #666;
            margin-bottom: 5px;
          }
          
          @media print {
            body { 
              background: white; 
              padding: 0;
            }
            .card { 
              page-break-after: always;
              box-shadow: none;
              margin: 0;
            }
            .print-label { display: block; }
          }
        </style>
      </head>
      <body>
        <div class="card-container">
          <!-- FRONT -->
          <div>
            <p class="print-label">DEPAN (Front Side)</p>
            <div class="card card-front">
              <div class="card-header">
                <div class="card-type">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  MEMBER CARD
                </div>
                <div class="chip"></div>
              </div>
              
              <div class="company-name">MULIA BALI VALUTA</div>
              <div class="company-subtitle">Authorized Money Changer</div>
              
              <div class="member-info">
                <div class="member-label">MEMBER NAME</div>
                <div class="member-name">${memberName || '-'}</div>
              </div>
              
              <div class="member-row">
                <div>
                  <div class="member-label">MEMBER ID</div>
                  <div class="member-id">${customer?.customer_code || '-'}</div>
                </div>
                <div style="text-align: right;">
                  <div class="member-label">SINCE</div>
                  <div class="member-since">${memberSince}</div>
                </div>
              </div>
              
              <div class="license-info">
                License BI: ${companySettings.license_number || 'XXX/XXX/XXXX'}
              </div>
              
              <div class="tier-badge">${tier}</div>
            </div>
          </div>
          
          <!-- BACK -->
          <div>
            <p class="print-label">BELAKANG (Back Side)</p>
            <div class="card card-back">
              <div class="magnetic-strip"></div>
              
              <div class="back-content">
                <div class="info-box">
                  <div class="info-label">FULL NAME</div>
                  <div class="info-value">${memberName || '-'}</div>
                </div>
                
                <div class="info-box">
                  <div class="info-label">NATIONALITY</div>
                  <div class="info-value">${nationality}</div>
                </div>
                
                <div class="barcode-area">
                  <div class="barcode">||| ${customer?.customer_code || 'MBA000000'} |||</div>
                  <div class="barcode-text">${customer?.customer_code || '-'}</div>
                </div>
              </div>
              
              <div class="footer-text">
                ${companySettings.company_address || 'Bali, Indonesia'} | ${companySettings.company_phone || ''}
              </div>
            </div>
          </div>
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

  if (!customer) return null;

  return (
    <div className="space-y-6">
      {/* Preview Cards */}
      <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
        {/* FRONT CARD PREVIEW */}
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-2">Depan (Front)</p>
          <div 
            className="relative overflow-hidden rounded-lg shadow-2xl"
            style={{ 
              width: '323px', 
              height: '204px',
              background: 'linear-gradient(135deg, #1a365d 0%, #0d1f3c 50%, #091428 100%)'
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-b from-yellow-500/10 to-transparent" />
            <div className="p-4 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  MEMBER CARD
                </div>
                <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-500" />
              </div>
              
              <div>
                <h3 className="text-[#d4af37] font-bold text-lg tracking-wider">MULIA BALI VALUTA</h3>
                <p className="text-gray-400 text-[10px] tracking-wide">Authorized Money Changer</p>
              </div>
              
              <div>
                <p className="text-[8px] text-gray-500 mb-1">MEMBER NAME</p>
                <p className="text-[#d4af37] font-semibold">{memberName || '-'}</p>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] text-gray-500 mb-1">MEMBER ID</p>
                  <p className="text-white text-sm tracking-wider">{customer?.customer_code || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-gray-500 mb-1">SINCE</p>
                  <p className="text-gray-400 text-sm">{memberSince}</p>
                </div>
              </div>
              
              <div className="absolute bottom-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-300 text-blue-900 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider">
                {getMemberTier()}
              </div>
              
              <div className="absolute bottom-3 left-3 text-[8px] text-gray-500">
                License BI: {companySettings.license_number || 'XXX/XXX/XXXX'}
              </div>
            </div>
          </div>
        </div>

        {/* BACK CARD PREVIEW */}
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-2">Belakang (Back)</p>
          <div 
            className="relative overflow-hidden rounded-lg shadow-2xl"
            style={{ 
              width: '323px', 
              height: '204px',
              background: 'linear-gradient(135deg, #1a365d 0%, #0d1f3c 100%)'
            }}
          >
            <div className="w-full h-7 bg-black mt-3" />
            <div className="p-4">
              <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 rounded p-2 mb-2">
                <p className="text-[8px] text-gray-500 mb-1">FULL NAME</p>
                <p className="text-white text-sm">{memberName || '-'}</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 rounded p-2 mb-3">
                <p className="text-[8px] text-gray-500 mb-1">NATIONALITY</p>
                <p className="text-white text-sm">{nationality}</p>
              </div>
              <div className="text-center">
                <p className="text-white text-xl tracking-widest font-mono">||| {customer?.customer_code} |||</p>
                <p className="text-gray-500 text-[10px]">{customer?.customer_code}</p>
              </div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 text-center text-[8px] text-gray-600">
              {companySettings.company_address || 'Bali, Indonesia'}
            </div>
          </div>
        </div>
      </div>

      {/* Print Instructions */}
      <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4">
        <h4 className="text-[#d4af37] font-semibold mb-2">Petunjuk Cetak:</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Gunakan PVC Card Blank atau kertas glossy ukuran standar ATM (85.6mm x 53.98mm)</li>
          <li>• Pengaturan printer: Landscape, Full Color, Best Quality</li>
          <li>• Cetak depan, lalu balik kertas untuk mencetak belakang</li>
        </ul>
      </div>

      {/* Print Button */}
      <div className="flex justify-center">
        <Button onClick={printMemberCard} className="btn-primary flex items-center gap-2 px-8">
          <Printer size={18} />
          Cetak Member Card
        </Button>
      </div>
    </div>
  );
};

export default MemberCard;
