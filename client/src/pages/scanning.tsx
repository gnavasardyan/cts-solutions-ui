import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { SideNavigation } from "@/components/layout/SideNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScannerModal } from "@/components/ScannerModal";
import { StatusBadge } from "@/components/StatusBadge";

export default function Scanning() {
  const { toast } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannedElement, setScannedElement] = useState<any>(null);



  const handleManualSearch = async () => {
    if (!manualCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите код элемента",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/elements/code/${manualCode.trim()}`);
      if (response.ok) {
        const element = await response.json();
        setScannedElement(element);
        toast({
          title: "Элемент найден",
          description: `Код: ${element.code}`,
        });
      } else {
        toast({
          title: "Элемент не найден",
          description: "Проверьте правильность введенного кода",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось найти элемент",
        variant: "destructive",
      });
    }
  };

  const handleScanResult = (code: string) => {
    setManualCode(code);
    setScannerOpen(false);
    handleManualSearch();
  };



  return (
    <div className="min-h-screen bg-surface">
      <TopNavigation />
      
      <div className="flex">
        <SideNavigation />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Сканирование кодов</h2>
              <p className="text-industrial-gray">
                Считывание DataMatrix кодов для отслеживания элементов
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scanner Interface */}
              <Card>
                <CardHeader>
                  <CardTitle>Сканер кодов</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Camera Scanner */}
                  <div className="text-center">
                    <Button
                      onClick={() => setScannerOpen(true)}
                      className="w-full bg-industrial-blue hover:bg-blue-700 text-white h-16 text-lg"
                    >
                      <i className="fas fa-camera text-2xl mr-3"></i>
                      Включить камеру
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Наведите камеру на DataMatrix код
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">или</span>
                    </div>
                  </div>

                  {/* Manual Input */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">
                        Введите код вручную
                      </Label>
                      <Input
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="BM-2024-001547"
                        className="h-12"
                        onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                      />
                    </div>
                    <Button
                      onClick={handleManualSearch}
                      variant="outline"
                      className="w-full h-12"
                    >
                      <i className="fas fa-search mr-2"></i>
                      Найти элемент
                    </Button>
                  </div>

                  {/* Quick Actions */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Быстрые действия</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-12 text-sm">
                        <i className="fas fa-truck mr-2"></i>
                        Отправка
                      </Button>
                      <Button variant="outline" className="h-12 text-sm">
                        <i className="fas fa-inbox mr-2"></i>
                        Приемка
                      </Button>
                      <Button variant="outline" className="h-12 text-sm">
                        <i className="fas fa-clipboard-list mr-2"></i>
                        Инвентаризация
                      </Button>
                      <Button variant="outline" className="h-12 text-sm">
                        <i className="fas fa-tools mr-2"></i>
                        Монтаж
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scanned Element Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Информация об элементе</CardTitle>
                </CardHeader>
                <CardContent>
                  {scannedElement ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <i className="fas fa-check-circle text-green-600 mr-2"></i>
                          <span className="font-medium text-green-800">Элемент найден</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Код:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {scannedElement.code}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Тип:</span>
                          <span>
                            {scannedElement.type === 'beam' ? 'Балка' :
                             scannedElement.type === 'column' ? 'Колонна' :
                             scannedElement.type === 'truss' ? 'Ферма' :
                             scannedElement.type === 'connection' ? 'Связь' : scannedElement.type}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Статус:</span>
                          <StatusBadge status={scannedElement.status} />
                        </div>

                        {scannedElement.drawing && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Чертеж:</span>
                            <span>{scannedElement.drawing}</span>
                          </div>
                        )}

                        {scannedElement.weight && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Вес:</span>
                            <span>{scannedElement.weight} кг</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Создан:</span>
                          <span>{new Date(scannedElement.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Доступные операции</h4>
                        <div className="space-y-2">
                          <Button className="w-full bg-industrial-green hover:bg-green-700 text-white h-12">
                            <i className="fas fa-check mr-2"></i>
                            Отметить как принятый
                          </Button>
                          <Button variant="outline" className="w-full h-12">
                            <i className="fas fa-route mr-2"></i>
                            Показать историю перемещений
                          </Button>
                          <Button variant="outline" className="w-full h-12">
                            <i className="fas fa-camera mr-2"></i>
                            Добавить фото
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <i className="fas fa-barcode text-2xl text-gray-400"></i>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Элемент не выбран</h3>
                      <p className="text-gray-500 text-sm">
                        Отсканируйте код или введите его вручную для получения информации
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Scans */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Последние сканирования</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-history text-2xl mb-2"></i>
                  <p>История сканирований будет отображаться здесь</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <ScannerModal open={scannerOpen} onOpenChange={setScannerOpen} onScanResult={handleScanResult} />
    </div>
  );
}
