

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Reports() {

  return (
    <div className="min-h-screen bg-surface">
      <div className="w-full p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Отчеты</h2>
            <p className="text-industrial-gray">
              Формирование отчетов и аналитика по системе прослеживаемости
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Types */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Типы отчетов</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Movement Report */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-industrial-blue bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                          <i className="fas fa-route text-industrial-blue"></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Сводка по перемещениям</h3>
                          <p className="text-sm text-gray-500">Отчет о движении элементов между точками</p>
                        </div>
                      </div>
                      <Button variant="outline" className="h-10">
                        <i className="fas fa-download"></i>
                        <span>Создать</span>
                      </Button>
                    </div>
                  </div>

                  {/* Delay Report */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-industrial-orange bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                          <i className="fas fa-clock text-industrial-orange"></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Отчет по задержкам</h3>
                          <p className="text-sm text-gray-500">Анализ просроченных поставок и перемещений</p>
                        </div>
                      </div>
                      <Button variant="outline" className="h-10">
                        <i className="fas fa-download"></i>
                        <span>Создать</span>
                      </Button>
                    </div>
                  </div>

                  {/* Transfer Act */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-industrial-green bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                          <i className="fas fa-file-contract text-industrial-green"></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Акт приема-передачи</h3>
                          <p className="text-sm text-gray-500">Официальный документ о передаче элементов</p>
                        </div>
                      </div>
                      <Button variant="outline" className="h-10">
                        <i className="fas fa-download"></i>
                        <span>Создать</span>
                      </Button>
                    </div>
                  </div>

                  {/* Inventory Report */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <i className="fas fa-clipboard-list text-purple-600"></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Инвентаризационная ведомость</h3>
                          <p className="text-sm text-gray-500">Полный список элементов на складе</p>
                        </div>
                      </div>
                      <Button variant="outline" className="h-10">
                        <i className="fas fa-download"></i>
                        <span>Создать</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Report */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Настраиваемый отчет</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Период с</Label>
                      <Input type="date" className="h-12" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Период по</Label>
                      <Input type="date" className="h-12" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Тип элементов</Label>
                      <Select>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Все типы" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все типы</SelectItem>
                          <SelectItem value="beam">Балки</SelectItem>
                          <SelectItem value="column">Колонны</SelectItem>
                          <SelectItem value="truss">Фермы</SelectItem>
                          <SelectItem value="connection">Связи</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Формат</Label>
                      <Select>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Выберите формат" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full bg-industrial-blue hover:bg-blue-700 text-white h-12 mt-4">
                    <i className="fas fa-chart-bar"></i>
                    <span>Сформировать отчет</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats & Export */}
            <div className="space-y-6">
              {/* Quick Export */}
              <Card>
                <CardHeader>
                  <CardTitle>Быстрый экспорт</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full h-12">
                    <i className="fas fa-file-excel text-green-600"></i>
                    <span>Экспорт в Excel</span>
                  </Button>
                  <Button variant="outline" className="w-full h-12">
                    <i className="fas fa-file-pdf text-red-600"></i>
                    <span>Экспорт в PDF</span>
                  </Button>
                  <Button variant="outline" className="w-full h-12">
                    <i className="fas fa-file-csv text-blue-600"></i>
                    <span>Экспорт в CSV</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Report History */}
              <Card>
                <CardHeader>
                  <CardTitle>История отчетов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Сводка по перемещениям</p>
                        <p className="text-xs text-gray-500">25.01.2024 14:30</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <i className="fas fa-download"></i>
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Акт приема-передачи</p>
                        <p className="text-xs text-gray-500">24.01.2024 16:45</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <i className="fas fa-download"></i>
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Отчет по задержкам</p>
                        <p className="text-xs text-gray-500">23.01.2024 09:15</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <i className="fas fa-download"></i>
                      </Button>
                    </div>
                  </div>
                  
                  <Button variant="ghost" className="w-full mt-3 text-industrial-blue">
                    Показать все
                  </Button>
                </CardContent>
              </Card>

              {/* Analytics Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Аналитика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">87.5%</div>
                      <div className="text-sm text-gray-500">Своевременные поставки</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-industrial-orange">2.3 дня</div>
                      <div className="text-sm text-gray-500">Среднее время в пути</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-industrial-green">99.1%</div>
                      <div className="text-sm text-gray-500">Точность отслеживания</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}
