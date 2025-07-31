import { useQuery } from "@tanstack/react-query";
import { SideNavigation } from "@/components/layout/SideNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScannerModal } from "@/components/ScannerModal";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";

export default function Dashboard() {
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentMovements, isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-movements"],
  });



  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <SideNavigation />
        
        <main className="flex-1 p-6">
          {/* Dashboard Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Панель управления</h2>
                <p className="text-industrial-gray">
                  Обзор системы прослеживаемости металлоконструкций
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <Button className="bg-industrial-blue hover:bg-blue-700 text-white font-medium h-12 min-w-[48px]">
                  <i className="fas fa-plus"></i>
                  <span className="ml-2">Новая маркировка</span>
                </Button>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-industrial-blue bg-opacity-10 rounded-lg">
                      <i className="fas fa-cubes text-industrial-blue text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-industrial-gray">Всего элементов</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : stats?.totalElements || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-industrial-green bg-opacity-10 rounded-lg">
                      <i className="fas fa-check-circle text-industrial-green text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-industrial-gray">В эксплуатации</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : stats?.inOperation || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-industrial-orange bg-opacity-10 rounded-lg">
                      <i className="fas fa-truck text-industrial-orange text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-industrial-gray">В пути</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : stats?.inTransit || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-500 bg-opacity-10 rounded-lg">
                      <i className="fas fa-warehouse text-yellow-600 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-industrial-gray">На хранении</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : stats?.inStorage || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Фильтры</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Дата производства</Label>
                  <Input type="date" className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Статус</Label>
                  <Select>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="production">Производство</SelectItem>
                      <SelectItem value="in_transit">В пути</SelectItem>
                      <SelectItem value="in_storage">На хранении</SelectItem>
                      <SelectItem value="in_assembly">В монтаже</SelectItem>
                      <SelectItem value="in_operation">В эксплуатации</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Тип конструкции</Label>
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
                <div className="flex items-end">
                  <Button className="w-full bg-industrial-blue hover:bg-blue-700 text-white h-12">
                    <i className="fas fa-search"></i>
                    <span>Применить</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Последние события</h3>
                  </div>
                  <div className="space-y-4">
                    {movementsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-industrial-blue mx-auto"></div>
                      </div>
                    ) : recentMovements && Array.isArray(recentMovements) && recentMovements.length > 0 ? (
                      recentMovements.map((movement: any) => (
                        <div key={movement.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-industrial-green bg-opacity-10 rounded-lg flex items-center justify-center">
                              <i className="fas fa-check text-industrial-green"></i>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {movement.operation === 'reception' ? 'Принят' : 
                               movement.operation === 'shipping' ? 'Отправлен' : 'Инвентаризация'} элемент
                            </p>
                            <p className="text-sm text-industrial-gray">
                              {new Date(movement.timestamp).toLocaleString('ru-RU')}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <StatusBadge status="in_storage" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-industrial-gray">
                        Нет последних событий
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setScannerOpen(true)}
                      className="w-full bg-industrial-blue hover:bg-blue-700 text-white h-12"
                    >
                      <i className="fas fa-qr-reader"></i>
                      <span>Сканировать код</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-industrial-blue text-industrial-blue hover:bg-blue-50 h-12"
                    >
                      <i className="fas fa-plus"></i>
                      <span>Создать маркировку</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full h-12"
                    >
                      <i className="fas fa-file-pdf"></i>
                      <span>Создать отчет</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение по статусам</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-industrial-green rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700">В эксплуатации</span>
                      </div>
                      <span className="text-sm font-medium">
                        {stats?.totalElements ? ((stats?.inOperation || 0) / stats.totalElements * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700">На хранении</span>
                      </div>
                      <span className="text-sm font-medium">
                        {stats?.totalElements ? ((stats?.inStorage || 0) / stats.totalElements * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-industrial-orange rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700">В пути</span>
                      </div>
                      <span className="text-sm font-medium">
                        {stats?.totalElements ? ((stats?.inTransit || 0) / stats.totalElements * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <ScannerModal open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  );
}
