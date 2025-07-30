import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanResult?: (code: string) => void;
}

export function ScannerModal({ open, onOpenChange, onScanResult }: ScannerModalProps) {
  const [manualCode, setManualCode] = useState("");

  const handleManualSubmit = () => {
    if (manualCode.trim() && onScanResult) {
      onScanResult(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Сканирование кода</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Camera view placeholder */}
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-camera text-4xl text-gray-400 mb-2"></i>
              <p className="text-gray-500">Наведите камеру на код</p>
              <div className="mt-4 w-32 h-32 border-2 border-industrial-blue rounded-lg mx-auto relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-industrial-blue"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-industrial-blue"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-industrial-blue"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-industrial-blue"></div>
              </div>
            </div>
          </div>
          
          {/* Manual input fallback */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">
                Или введите код вручную
              </Label>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="BM-2024-001547"
                className="h-12"
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
            </div>
            <div className="flex space-x-4">
              <Button 
                onClick={handleManualSubmit}
                className="flex-1 bg-industrial-blue hover:bg-blue-700 text-white h-12"
              >
                Найти элемент
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="h-12 px-4"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
