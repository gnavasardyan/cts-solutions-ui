

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function Settings() {

  return (
    <div className="min-h-screen bg-surface">
      <div className="w-full p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Настройки системы</h2>
              <p className="text-industrial-gray">
                Конфигурация параметров системы прослеживаемости
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Общие настройки</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Язык интерфейса</Label>
                    <Select defaultValue="ru">
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Часовой пояс</Label>
                    <Select defaultValue="msk">
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="msk">MSK (Москва)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="local">Местное время</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">Автоматическая синхронизация</Label>
                      <p className="text-xs text-gray-500">Синхронизация данных при подключении к сети</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">Звуковые уведомления</Label>
                      <p className="text-xs text-gray-500">Звуковое подтверждение операций сканирования</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Scanner Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Настройки сканера</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Тип сканера</Label>
                    <Select defaultValue="camera">
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camera">Камера устройства</SelectItem>
                        <SelectItem value="external">Внешний сканер</SelectItem>
                        <SelectItem value="zebra">Zebra Scanner</SelectItem>
                        <SelectItem value="honeywell">Honeywell Scanner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Время ожидания сканирования (сек)</Label>
                    <Input type="number" defaultValue="10" className="h-12" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">Автоматический переход</Label>
                      <p className="text-xs text-gray-500">Переход к следующему элементу после сканирования</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">Подтверждение качества</Label>
                      <p className="text-xs text-gray-500">Проверка качества считывания кода</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Control Points */}
              <Card>
                <CardHeader>
                  <CardTitle>Контрольные точки</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Завод ММК</p>
                        <p className="text-sm text-gray-500">Производитель</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <i className="fas fa-edit mr-1"></i>
                        Изменить
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Склад "Центральный"</p>
                        <p className="text-sm text-gray-500">Хранение</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <i className="fas fa-edit mr-1"></i>
                        Изменить
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Стройплощадка №5</p>
                        <p className="text-sm text-gray-500">Использование</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <i className="fas fa-edit mr-1"></i>
                        Изменить
                      </Button>
                    </div>

                    <Button variant="outline" className="w-full h-12">
                      <i className="fas fa-plus mr-2"></i>
                      Добавить точку
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* User Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Управление пользователями</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Петров А.В.</p>
                        <p className="text-sm text-gray-500">Оператор завода</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <i className="fas fa-user-edit mr-1"></i>
                        Права
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Иванов С.П.</p>
                        <p className="text-sm text-gray-500">Кладовщик</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <i className="fas fa-user-edit mr-1"></i>
                        Права
                      </Button>
                    </div>

                    <Button variant="outline" className="w-full h-12">
                      <i className="fas fa-user-plus mr-2"></i>
                      Добавить пользователя
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Информация о системе</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Версия системы</p>
                      <p className="font-medium">v1.0.0</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Последнее обновление</p>
                      <p className="font-medium">25.01.2024</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Активных пользователей</p>
                      <p className="font-medium">24</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Статус сервера</p>
                      <p className="font-medium text-green-600">
                        <i className="fas fa-circle text-xs mr-1"></i>
                        Онлайн
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <Button className="bg-industrial-blue hover:bg-blue-700 text-white h-12">
                      <i className="fas fa-save mr-2"></i>
                      Сохранить настройки
                    </Button>
                    <Button variant="outline" className="h-12">
                      <i className="fas fa-download mr-2"></i>
                      Экспорт конфигурации
                    </Button>
                    <Button variant="outline" className="h-12">
                      <i className="fas fa-sync mr-2"></i>
                      Сброс к заводским
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}
