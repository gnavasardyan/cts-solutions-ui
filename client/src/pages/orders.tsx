import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, User, FileText, ArrowLeft } from "lucide-react";

const ORDER_STATUS = {
  pending: { label: "В обработке", variant: "secondary" as const },
  confirmed: { label: "Подтвержден", variant: "default" as const },
  production: { label: "В производстве", variant: "outline" as const },
  ready: { label: "Готов к отгрузке", variant: "secondary" as const },
  shipped: { label: "Отгружен", variant: "default" as const },
  delivered: { label: "Доставлен", variant: "default" as const },
  cancelled: { label: "Отменен", variant: "destructive" as const },
};

export default function OrdersPage() {
  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    enabled: true,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/catalog'}
          data-testid="button-back-catalog"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          К каталогу
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Мои заказы</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            История заказов и текущий статус
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Заказов пока нет
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Оформите первый заказ в каталоге продукции
            </p>
            <Button onClick={() => window.location.href = '/catalog'} data-testid="button-go-catalog">
              Перейти в каталог
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow" data-testid={`order-${order.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Заказ #{order.id.slice(-8).toUpperCase()}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.variant || "secondary"}
                      className="mb-2"
                    >
                      {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label || order.status}
                    </Badge>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(order.totalAmount)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Состав заказа ({order.items.length} позиций)
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        data-testid={`order-item-${index}`}
                      >
                        <div>
                          <div className="font-medium text-sm">{item.product.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {item.product.gost} • {item.product.weight} кг
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {item.quantity} шт. × {formatPrice(item.price)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            = {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Комментарий
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {order.notes}
                    </p>
                  </div>
                )}

                {/* Order Timeline */}
                <div>
                  <h4 className="font-medium mb-2">Статус заказа</h4>
                  <div className="relative">
                    <div className="absolute left-2 top-3 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 z-10 relative"></div>
                        <div className="text-sm">
                          <div className="font-medium">Заказ создан</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      {order.status !== 'pending' && (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 z-10 relative"></div>
                          <div className="text-sm">
                            <div className="font-medium">
                              {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {formatDate(order.updatedAt)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {order.status === 'pending' && (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 z-10 relative"></div>
                          <div className="text-sm text-gray-500">
                            <div>Ожидает подтверждения</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}