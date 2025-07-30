import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { SideNavigation } from "@/components/layout/SideNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

export default function Tracking() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Неавторизован",
        description: "Вы вышли из системы. Выполняется повторный вход...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: elements, isLoading: elementsLoading } = useQuery({
    queryKey: ["/api/elements"],
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-industrial-blue mx-auto mb-4"></div>
          <p className="text-industrial-gray">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopNavigation />
      
      <div className="flex">
        <SideNavigation />
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Отслеживание элементов</h2>
            <p className="text-industrial-gray">
              Мониторинг перемещения металлоконструкций через контрольные точки
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Фильтры</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Поиск по коду</Label>
                  <Input placeholder="BM-2024-001547" className="h-12" />
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
                      <SelectItem value="ready_to_ship">Готов к отправке</SelectItem>
                      <SelectItem value="in_transit">В пути</SelectItem>
                      <SelectItem value="in_storage">На хранении</SelectItem>
                      <SelectItem value="in_assembly">В монтаже</SelectItem>
                      <SelectItem value="in_operation">В эксплуатации</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Тип</Label>
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
                    <i className="fas fa-search mr-2"></i>
                    Применить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Elements List */}
          <Card>
            <CardHeader>
              <CardTitle>Список элементов</CardTitle>
            </CardHeader>
            <CardContent>
              {elementsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-industrial-blue mx-auto mb-4"></div>
                  <p className="text-industrial-gray">Загрузка элементов...</p>
                </div>
              ) : elements && elements.length > 0 ? (
                <div className="space-y-4">
                  {elements.map((element: any) => (
                    <div key={element.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-industrial-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                                <i className="fas fa-cube text-industrial-blue"></i>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900">{element.code}</h3>
                                <StatusBadge status={element.status} />
                              </div>
                              <p className="text-sm text-gray-500">
                                {element.type === 'beam' ? 'Балка' :
                                 element.type === 'column' ? 'Колонна' :
                                 element.type === 'truss' ? 'Ферма' :
                                 element.type === 'connection' ? 'Связь' : element.type}
                                {element.weight && ` • ${element.weight} кг`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="h-10">
                            <i className="fas fa-route mr-1"></i>
                            История
                          </Button>
                          <Button variant="outline" size="sm" className="h-10">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            Локация
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <i className="fas fa-search text-2xl text-gray-400"></i>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Элементы не найдены</h3>
                  <p className="text-gray-500">
                    Измените параметры поиска или создайте новый элемент
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map View */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Карта перемещений</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-map text-4xl text-gray-400 mb-2"></i>
                  <p className="text-gray-500">Интерактивная карта контрольных точек</p>
                  <p className="text-sm text-gray-400">Будет реализована в следующей версии</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
