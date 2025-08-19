import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock, AlertTriangle, CheckCircle, Package, User, Factory, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FactoryOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  factoryId?: string;
  status: string;
  priority: string;
  deadline?: number;
  totalAmount: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  items: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    specifications?: string;
    status: string;
    product: {
      id: string;
      name: string;
      category: string;
      specifications: string;
    };
  }[];
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  factory?: {
    id: string;
    name: string;
    location: string;
  };
}

export default function FactoryOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<FactoryOrder[]>({
    queryKey: ["/api/orders/factory", statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      
      const url = `/api/orders/factory${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/factory"] });
      toast({ description: "Статус заказа обновлен" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Ошибка обновления статуса" 
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "sent_to_factory":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "in_production":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Новый";
      case "sent_to_factory": return "Отправлен на завод";
      case "in_production": return "В производстве";
      case "completed": return "Выполнен";
      case "shipped": return "Отгружен";
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent": return "Срочный";
      case "high": return "Высокий";
      case "normal": return "Обычный";
      case "low": return "Низкий";
      default: return priority;
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка производственных заказов...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Производственные заказы</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Управление заказами на производстве металлоконструкций
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Статус:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="sent_to_factory">На заводе</SelectItem>
              <SelectItem value="in_production">В производстве</SelectItem>
              <SelectItem value="completed">Выполнены</SelectItem>
              <SelectItem value="shipped">Отгружены</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Приоритет:</label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              <SelectItem value="urgent">Срочный</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
              <SelectItem value="normal">Обычный</SelectItem>
              <SelectItem value="low">Низкий</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} data-testid={`card-order-${order.id}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Заказ #{order.orderNumber}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {order.customer.firstName} {order.customer.lastName}
                    </div>
                    {order.factory && (
                      <div className="flex items-center gap-1">
                        <Factory className="h-3 w-3" />
                        {order.factory.name}
                      </div>
                    )}
                    {order.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.deadline * 1000).toLocaleDateString("ru-RU")}
                      </div>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getPriorityColor(order.priority)}>
                    {getPriorityText(order.priority)}
                  </Badge>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Состав заказа:</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border rounded p-2">
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          Количество: {item.quantity} шт.
                        </div>
                        {item.specifications && (
                          <div className="text-xs text-gray-500">
                            {item.specifications}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-medium">Общая сумма:</span>
                <span className="text-lg font-bold">
                  {order.totalAmount.toLocaleString("ru-RU")} ₽
                </span>
              </div>

              {/* Status Change */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Создан: {new Date(order.createdAt * 1000).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Изменить статус:</label>
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Новый</SelectItem>
                      <SelectItem value="sent_to_factory">Отправлен на завод</SelectItem>
                      <SelectItem value="in_production">В производстве</SelectItem>
                      <SelectItem value="completed">Выполнен</SelectItem>
                      <SelectItem value="shipped">Отгружен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {order.notes && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <div className="text-sm font-medium mb-1">Примечания:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{order.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 dark:text-gray-400 mb-2">
            Производственные заказы не найдены
          </div>
          <div className="text-sm text-gray-400">
            Заказы появятся здесь после отправки их на завод
          </div>
        </div>
      )}
    </div>
  );
}