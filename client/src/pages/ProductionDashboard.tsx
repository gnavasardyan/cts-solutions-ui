import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  User, 
  Factory, 
  Calendar,
  QrCode,
  Printer,
  Truck,
  FileText,
  Play,
  Pause,
  Archive,
  Send
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ProductionOrder {
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
    markings?: {
      id: string;
      markingCode: string;
      markingType: string;
      markedAt: number;
      printerModel?: string;
    }[];
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

interface MarkingReport {
  orderItemId: string;
  markingCode: string;
  markingType: "data_matrix" | "gs1_128_sscc";
  printerModel: string;
}

const markingSchema = z.object({
  orderItemId: z.string().min(1, "Выберите элемент для маркировки"),
  markingType: z.enum(["data_matrix", "gs1_128_sscc"]),
  printerModel: z.string().min(1, "Выберите модель принтера"),
  quantity: z.number().min(1, "Количество должно быть больше 0"),
});

const shipmentSchema = z.object({
  transportType: z.enum(["truck", "rail", "sea"]),
  transportUnit: z.string().min(1, "Укажите транспортную единицу"),
  weight: z.number().positive("Вес должен быть положительным"),
  dimensions: z.string().min(1, "Укажите габариты"),
  orderIds: z.array(z.string()).min(1, "Выберите хотя бы один заказ"),
});

export default function ProductionDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [markingDialogOpen, setMarkingDialogOpen] = useState(false);
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/factory/orders", statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      
      const url = `/api/factory/orders${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const markingForm = useForm<z.infer<typeof markingSchema>>({
    resolver: zodResolver(markingSchema),
    defaultValues: {
      markingType: "data_matrix",
      printerModel: "Zebra ZT410",
      quantity: 1,
    },
  });

  const shipmentForm = useForm<z.infer<typeof shipmentSchema>>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      transportType: "truck",
      orderIds: [],
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

  const createMarkingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof markingSchema>) => {
      const markings = Array.from({ length: data.quantity }, (_, i) => ({
        orderItemId: data.orderItemId,
        markingCode: `DM${Date.now()}${i.toString().padStart(3, '0')}`,
        markingType: data.markingType,
        printerModel: data.printerModel,
      }));
      
      const response = await fetch('/api/production/markings', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markings })
      });
      if (!response.ok) throw new Error('Failed to create markings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/factory"] });
      toast({ description: "Маркировка создана успешно" });
      setMarkingDialogOpen(false);
      markingForm.reset();
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Ошибка создания маркировки" 
      });
    },
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shipmentSchema>) => {
      const response = await fetch('/api/production/shipments', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create shipment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/factory"] });
      toast({ description: "Отгрузка создана успешно" });
      setShipmentDialogOpen(false);
      shipmentForm.reset();
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Ошибка создания отгрузки" 
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent_to_factory":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "accepted":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300";
      case "in_production":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "ready_for_marking":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "packed":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "shipped":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
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
      case "sent_to_factory": return "Отправлен на завод";
      case "accepted": return "Принят";
      case "in_production": return "В производстве";
      case "ready_for_marking": return "Готов к маркировке";
      case "packed": return "Упакован";
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

  const getNextStatus = (currentStatus: string) => {
    const workflow = [
      "sent_to_factory",
      "accepted", 
      "in_production", 
      "ready_for_marking", 
      "packed", 
      "shipped"
    ];
    const currentIndex = workflow.indexOf(currentStatus);
    return currentIndex < workflow.length - 1 ? workflow[currentIndex + 1] : null;
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleMarkingSubmit = (data: z.infer<typeof markingSchema>) => {
    createMarkingMutation.mutate(data);
  };

  const handleShipmentSubmit = (data: z.infer<typeof shipmentSchema>) => {
    createShipmentMutation.mutate(data);
  };

  const openMarkingDialog = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setMarkingDialogOpen(true);
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
        <h1 className="text-3xl font-bold">Производство металлоконструкций</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Управление производственными заказами от принятия до отгрузки
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-shipment">
              <Truck className="h-4 w-4 mr-2" />
              Создать отгрузку
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Создание отгрузки</DialogTitle>
              <DialogDescription>
                Сформируйте груз для отправки заказчику
              </DialogDescription>
            </DialogHeader>
            <Form {...shipmentForm}>
              <form onSubmit={shipmentForm.handleSubmit(handleShipmentSubmit)} className="space-y-4">
                <FormField
                  control={shipmentForm.control}
                  name="transportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип транспорта</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="truck">Автомобильный</SelectItem>
                          <SelectItem value="rail">Железнодорожный</SelectItem>
                          <SelectItem value="sea">Морской</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shipmentForm.control}
                  name="transportUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер транспортной единицы</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Номер фуры/вагона" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shipmentForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Вес (кг)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          placeholder="Общий вес груза" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shipmentForm.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Габариты</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Длина x Ширина x Высота" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createShipmentMutation.isPending}>
                  {createShipmentMutation.isPending ? "Создание..." : "Создать отгрузку"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Статус:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="sent_to_factory">Отправлен на завод</SelectItem>
              <SelectItem value="accepted">Принят</SelectItem>
              <SelectItem value="in_production">В производстве</SelectItem>
              <SelectItem value="ready_for_marking">Готов к маркировке</SelectItem>
              <SelectItem value="packed">Упакован</SelectItem>
              <SelectItem value="shipped">Отгружен</SelectItem>
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
                    <div key={item.id} className="border rounded p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Количество: {item.quantity} шт. • Статус: {getStatusText(item.status)}
                          </div>
                          {item.specifications && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.specifications}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                          </div>
                          {item.status === "ready_for_marking" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="mt-1"
                              onClick={() => openMarkingDialog(order)}
                              data-testid={`button-mark-${item.id}`}
                            >
                              <QrCode className="h-3 w-3 mr-1" />
                              Маркировать
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Show markings if available */}
                      {item.markings && item.markings.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                          <div className="font-medium mb-1">Маркировка:</div>
                          {item.markings.map((marking) => (
                            <div key={marking.id} className="flex justify-between">
                              <span>{marking.markingCode}</span>
                              <span>{marking.markingType}</span>
                            </div>
                          ))}
                        </div>
                      )}
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

              {/* Production Actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Создан: {new Date(order.createdAt * 1000).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getNextStatus(order.status) && (
                    <Button 
                      onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-next-status-${order.id}`}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {getStatusText(getNextStatus(order.status)!)}
                    </Button>
                  )}
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sent_to_factory">Отправлен на завод</SelectItem>
                      <SelectItem value="accepted">Принят</SelectItem>
                      <SelectItem value="in_production">В производстве</SelectItem>
                      <SelectItem value="ready_for_marking">Готов к маркировке</SelectItem>
                      <SelectItem value="packed">Упакован</SelectItem>
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

      {/* Marking Dialog */}
      <Dialog open={markingDialogOpen} onOpenChange={setMarkingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создание маркировки</DialogTitle>
            <DialogDescription>
              Создайте уникальные коды для отслеживания элементов
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <Form {...markingForm}>
              <form onSubmit={markingForm.handleSubmit(handleMarkingSubmit)} className="space-y-4">
                <FormField
                  control={markingForm.control}
                  name="orderItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Элемент для маркировки</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите элемент" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedOrder.items
                            .filter(item => item.status === "ready_for_marking")
                            .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.product.name} ({item.quantity} шт.)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={markingForm.control}
                  name="markingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип маркировки</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="data_matrix">Data Matrix (продукция)</SelectItem>
                          <SelectItem value="gs1_128_sscc">GS1-128 SSCC (логистика)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={markingForm.control}
                  name="printerModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Модель принтера</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Zebra ZT410">Zebra ZT410</SelectItem>
                          <SelectItem value="Honeywell PM43">Honeywell PM43</SelectItem>
                          <SelectItem value="Cognex">Cognex</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={markingForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество кодов</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createMarkingMutation.isPending}>
                  <Printer className="h-4 w-4 mr-2" />
                  {createMarkingMutation.isPending ? "Создание..." : "Создать маркировку"}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}