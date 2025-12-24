import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './ui/button';
import { Eraser, Check, X } from 'lucide-react';

const SignaturePad = ({ onSave, onCancel }) => {
  const sigCanvas = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current.clear();
    setIsEmpty(true);
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
      return;
    }
    const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    onSave(dataURL);
  };

  const handleEnd = () => {
    setIsEmpty(sigCanvas.current.isEmpty());
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-[#D4AF37]/50 rounded-lg bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: 'w-full h-40 rounded-lg',
            style: { width: '100%', height: '160px' }
          }}
          onEnd={handleEnd}
        />
      </div>
      
      <p className="text-center text-sm text-gray-400">
        Tanda tangani di area di atas menggunakan mouse atau jari (touchscreen)
      </p>
      
      <div className="flex gap-3">
        <Button 
          type="button" 
          onClick={clear} 
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <Eraser size={18} /> Hapus
        </Button>
        <Button 
          type="button" 
          onClick={save} 
          disabled={isEmpty}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Check size={18} /> Simpan Tanda Tangan
        </Button>
        {onCancel && (
          <Button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary flex items-center justify-center gap-2 px-4"
          >
            <X size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;
