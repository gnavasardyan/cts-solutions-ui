import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SideNavigation } from "@/components/layout/SideNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

export default function Marking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: "",
    type: "",
    drawing: "",
    batch: "",
    gost: "",
    length: "",
    width: "", 
    height: "",
    weight: "",
  });



  const createElementMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/elements", data);
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Маркировка создана успешно",
      });
      setFormData({
        code: "",
        type: "",
        drawing: "",
        batch: "",
        gost: "",
        length: "",
        width: "",
        height: "",
        weight: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/elements"] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать маркировку",
        variant: "destructive",
      });
    },
  });

  const generateCode = () => {
    const prefix = "BM";
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    const code = `${prefix}-${year}-${random}`;
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.type) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля",
        variant: "destructive",
      });
      return;
    }

    createElementMutation.mutate({
      ...formData,
      length: formData.length ? parseFloat(formData.length) : null,
      width: formData.width ? parseFloat(formData.width) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
    });
  };



  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <SideNavigation />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Маркировка металлоконструкций</h2>
              <p className="text-industrial-gray">
                Создание уникального кода для отслеживания элемента
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Данные элемента</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Code Generation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Уникальный код *
                          </Label>
                          <div className="flex space-x-2">
                            <Input
                              value={formData.code}
                              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                              placeholder="BM-2024-001547"
                              className="h-12"
                              required
                            />
                            <Button
                              type="button"
                              onClick={generateCode}
                              variant="outline"
                              className="h-12 px-4"
                            >
                              <i className="fas fa-magic"></i>
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Тип конструкции *
                          </Label>
                          <Select 
                            value={formData.type} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Выберите тип" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beam">Балка</SelectItem>
                              <SelectItem value="column">Колонна</SelectItem>
                              <SelectItem value="truss">Ферма</SelectItem>
                              <SelectItem value="connection">Связь</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Technical Data */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Чертеж
                          </Label>
                          <Input
                            value={formData.drawing}
                            onChange={(e) => setFormData(prev => ({ ...prev, drawing: e.target.value }))}
                            placeholder="Номер чертежа"
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Партия
                          </Label>
                          <Input
                            value={formData.batch}
                            onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                            placeholder="Номер партии"
                            className="h-12"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2">
                          ГОСТ
                        </Label>
                        <Input
                          value={formData.gost}
                          onChange={(e) => setFormData(prev => ({ ...prev, gost: e.target.value }))}
                          placeholder="ГОСТ стандарт"
                          className="h-12"
                        />
                      </div>

                      {/* Dimensions */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Длина (мм)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.length}
                            onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                            placeholder="0.00"
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Ширина (мм)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.width}
                            onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                            placeholder="0.00"
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Высота (мм)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.height}
                            onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                            placeholder="0.00"
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Вес (кг)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.weight}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                            placeholder="0.00"
                            className="h-12"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Button
                          type="submit"
                          disabled={createElementMutation.isPending}
                          className="bg-industrial-blue hover:bg-blue-700 text-white h-12 min-w-[120px]"
                        >
                          {createElementMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Создание...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save"></i>
                              <span className="ml-2">Создать маркировку</span>
                            </>
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12"
                          onClick={() => setFormData({
                            code: "",
                            type: "",
                            drawing: "",
                            batch: "",
                            gost: "",
                            length: "",
                            width: "",
                            height: "",
                            weight: "",
                          })}
                        >
                          Очистить
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Preview */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Предварительный просмотр</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center">
                        {formData.code ? (
                          <div className="text-center">
                            <i className="fas fa-qrcode text-4xl text-gray-400 mb-2"></i>
                            <p className="text-xs text-gray-500 break-all px-2">{formData.code}</p>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">DataMatrix код</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Тип:</span>
                        <span className="font-medium">
                          {formData.type === 'beam' ? 'Балка' :
                           formData.type === 'column' ? 'Колонна' :
                           formData.type === 'truss' ? 'Ферма' :
                           formData.type === 'connection' ? 'Связь' : '-'}
                        </span>
                      </div>
                      {formData.drawing && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Чертеж:</span>
                          <span className="font-medium">{formData.drawing}</span>
                        </div>
                      )}
                      {formData.weight && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Вес:</span>
                          <span className="font-medium">{formData.weight} кг</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Следующие шаги</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Печать DataMatrix кода</li>
                      <li>• Нанесение на изделие</li>
                      <li>• Контроль качества</li>
                      <li>• Фотофиксация</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
