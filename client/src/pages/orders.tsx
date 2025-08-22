import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Package, Calendar, User, FileText, ArrowLeft, Send, Factory, Edit2, Plus, ShoppingCart, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const ORDER_STATUS = {
  draft: { label: "Черновик", variant: "outline" as const },
  pending: { label: "В обработке", variant: "secondary" as const },
  confirmed: { label: "Подтвержден", variant: "default" as const },
  sent_to_factory: { label: "Отправлен на завод", variant: "outline" as const },
  production: { label: "В производстве", variant: "outline" as const },
  ready: { label: "Готов к отгрузке", variant: "secondary" as const },
  shipped: { label: "Отгружен", variant: "default" as const },
  delivered: { label: "Доставлен", variant: "default" as const },
  cancelled: { label: "Отменен", variant: "destructive" as const },
};

const sendToFactorySchema = z.object({
  factoryId: z.string().min(1, "Выберите завод"),
  priority: z.string().default("normal"),
  deadline: z.string().optional(),
  notes: z.string().optional(),
});

type SendToFactoryData = z.infer<typeof sendToFactorySchema>;

const createOrderSchema = z.object({
  title: z.string().min(1, "Введите название заказа"),
  description: z.string().optional(),
  constructionType: z.string().min(1, "Выберите тип конструкции"),
  factoryId: z.string().min(1, "Выберите завод").refine(val => val !== "none", "Выберите завод"),
  deliveryAddress: z.string().min(1, "Укажите адрес доставки"),
  contactPerson: z.string().min(1, "Укажите контактное лицо"),
  contactPhone: z.string().min(1, "Укажите контактный телефон"),
  estimatedBudget: z.string().optional(),
  status: z.string().default("draft"),
  priority: z.string().default("normal"),
  deadline: z.string().optional(),
  notes: z.string().optional(),
  totalAmount: z.number().default(0),
});

type CreateOrderData = z.infer<typeof createOrderSchema>;

export default function OrdersPage() {
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check if user can edit factory (admin only, customer operators cannot edit)
  const canEditFactory = (order: any) => {
    if (!user) return false;
    // Customer operators cannot edit factory information
    if (user.role === 'customer_operator') return false;
    return user.role === 'administrator' || order.customerId === user.id || order.userId === user.id;
  };

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    enabled: true,
  });

  // Fetch factories for sending orders
  const { data: factories = [] } = useQuery({
    queryKey: ['/api/factories'],
    enabled: true,
  });

  // Fetch products for catalog in order creation
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    enabled: true,
  });

  const form = useForm<SendToFactoryData>({
    resolver: zodResolver(sendToFactorySchema),
    defaultValues: {
      factoryId: "",
      priority: "normal",
      deadline: "",
      notes: "",
    },
  });

  const createOrderForm = useForm<CreateOrderData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      constructionType: "",
      factoryId: "",
      deliveryAddress: "",
      contactPerson: "",
      contactPhone: "",
      estimatedBudget: "",
      status: "draft",
      priority: "normal",
      deadline: "",
      notes: "",
      totalAmount: 0,
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      return await apiRequest("POST", "/api/orders", {
        status: data.status || "pending",
        priority: data.priority,
        factoryId: data.factoryId,
        deadline: data.deadline ? Math.floor(new Date(data.deadline).getTime() / 1000) : undefined,
        notes: `${data.title}${data.description ? ` - ${data.description}` : ''}
Тип: ${data.constructionType}
Адрес: ${data.deliveryAddress}
Контакт: ${data.contactPerson} (${data.contactPhone})
${data.estimatedBudget ? `Бюджет: ${data.estimatedBudget}` : ''}
${data.notes ? `Примечания: ${data.notes}` : ''}`,
        totalAmount: data.totalAmount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsCreateOrderOpen(false);
      createOrderForm.reset();
      setSelectedProducts({}); // Clear selected products
      toast({
        title: "Заказ создан",
        description: "Новый заказ успешно создан",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать заказ",
        variant: "destructive",
      });
    },
  });

  const sendToFactoryMutation = useMutation({
    mutationFn: async (data: { orderId: string; formData: SendToFactoryData }) => {
      return await apiRequest("POST", `/api/orders/${data.orderId}/send-to-factory`, data.formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSendingOrderId(null);
      setEditingOrderId(null);
      form.reset();
      toast({ description: editingOrderId ? "Завод изменён" : "Заказ отправлен на завод" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: editingOrderId ? "Ошибка изменения завода" : "Ошибка отправки заказа на завод",
      });
    },
  });

  // Functions for product selection in catalog
  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedProducts };
      delete newSelected[productId];
      setSelectedProducts(newSelected);
    } else {
      setSelectedProducts(prev => ({ ...prev, [productId]: quantity }));
    }
  };

  const calculateOrderTotal = () => {
    return Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
      const product = (products as any[]).find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const handleCreateOrder = (data: CreateOrderData) => {
    // Include selected products in the order
    const orderItems = Object.entries(selectedProducts).map(([productId, quantity]) => {
      const product = (products as any[]).find(p => p.id === productId);
      return {
        productId,
        quantity,
        price: product?.price || 0
      };
    });
    
    const orderData = {
      ...data,
      totalAmount: calculateOrderTotal(),
      items: orderItems
    };
    
    createOrderMutation.mutate(orderData);
  };

  const handleSendToFactory = (data: SendToFactoryData) => {
    const orderId = sendingOrderId || editingOrderId;
    if (orderId) {
      sendToFactoryMutation.mutate({ orderId, formData: data });
    }
  };

  const openSendDialog = (orderId: string) => {
    setSendingOrderId(orderId);
    setEditingOrderId(null);
    form.reset();
  };

  const openEditDialog = (order: any) => {
    setEditingOrderId(order.id);
    setSendingOrderId(null);
    // Pre-fill the form with current factory data
    const currentFactory = (factories as any[]).find((f: any) => f.id === order.factoryId);
    form.reset({
      factoryId: order.factoryId || "",
      priority: order.priority || "normal",
      deadline: order.deadline ? new Date(order.deadline * 1000).toISOString().split('T')[0] : "",
      notes: order.notes || "",
    });
  };

  const closeSendDialog = () => {
    setSendingOrderId(null);
    setEditingOrderId(null);
    form.reset();
  };

  const formatPrice = (price: number) => {
    return "0 ₽"; // Always show 0 ₽ as requested
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



  // Полная таблица заказов
  const OrdersTableView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Все заказы</h2>
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
      ) : (orders as any[]).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Заказов пока нет
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Создайте первый заказ используя форму заказа
            </p>
            <Button onClick={() => window.location.href = '/catalog'} data-testid="button-go-catalog">
              Создать заказ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(orders as any[]).map((order: any) => (
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
                      0 ₽
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Состав заказа
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
                            {item.quantity} шт.
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Factory Information */}
                {order.factoryId && (
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        Завод
                        {user?.role === 'administrator' && (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                            Администратор
                          </span>
                        )}
                      </h4>
                      {canEditFactory(order) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(order)}
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          data-testid={`button-edit-factory-${order.id}`}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Изменить
                        </Button>
                      )}
                    </div>
                    {(() => {
                      const factory = (factories as any[]).find((f: any) => f.id === order.factoryId);
                      return (
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="font-medium text-sm">
                            {factory ? factory.name : 'Завод не найден'}
                          </div>
                          {factory && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {factory.location}
                              {order.priority && order.priority !== 'normal' && (
                                <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded text-xs">
                                  {order.priority === 'urgent' ? 'Срочный' : 
                                   order.priority === 'high' ? 'Высокий' : 
                                   order.priority === 'low' ? 'Низкий' : 'Обычный'}
                                </span>
                              )}
                            </div>
                          )}
                          {order.deadline && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Срок: {formatDate(order.deadline)}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Send to Factory Actions */}
                {order.status === 'confirmed' && !order.factoryId && canEditFactory(order) && (
                  <div className="flex justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => openSendDialog(order.id)}
                          data-testid={`button-send-to-factory-${order.id}`}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Отправить на завод
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Отправить заказ на завод</DialogTitle>
                          <DialogDescription>
                            Выберите завод для производства заказа #{order.id.slice(-8).toUpperCase()}
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleSendToFactory)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="factoryId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Завод</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-factory">
                                        <SelectValue placeholder="Выберите завод" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {(factories as any[]).map((factory: any) => (
                                        <SelectItem key={factory.id} value={factory.id}>
                                          {factory.name} - {factory.location}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="priority"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Приоритет</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="low">Низкий</SelectItem>
                                      <SelectItem value="normal">Обычный</SelectItem>
                                      <SelectItem value="high">Высокий</SelectItem>
                                      <SelectItem value="urgent">Срочный</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="deadline"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Срок выполнения</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Примечания</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Дополнительные требования к заказу" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button type="button" variant="outline" onClick={closeSendDialog}>
                                Отмена
                              </Button>
                              <Button type="submit" disabled={sendToFactoryMutation.isPending}>
                                {sendToFactoryMutation.isPending ? "Отправка..." : "Отправить"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Основной интерфейс заказчика
  if (user?.role === 'customer_operator') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Заказы
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление заказами и создание новых заявок
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateOrderOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-create-order"
          >
            <Plus className="h-4 w-4 mr-2" />
            Создать заказ
          </Button>
        </div>

        <OrdersTableView />

        {/* Create Order Dialog */}
        <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать новый заказ</DialogTitle>
              <DialogDescription>
                Заполните информацию о заказе металлоконструкций
              </DialogDescription>
            </DialogHeader>
            <Form {...createOrderForm}>
              <form onSubmit={createOrderForm.handleSubmit(handleCreateOrder)} className="space-y-4">
                <FormField
                  control={createOrderForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название заказа *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введите название заказа" 
                          {...field} 
                          data-testid="input-order-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createOrderForm.control}
                  name="constructionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип конструкции *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-construction-type">
                            <SelectValue placeholder="Выберите тип конструкции" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Здание">Здание</SelectItem>
                          <SelectItem value="Мост">Мост</SelectItem>
                          <SelectItem value="Башня">Башня</SelectItem>
                          <SelectItem value="Промышленная конструкция">Промышленная конструкция</SelectItem>
                          <SelectItem value="Склад">Склад</SelectItem>
                          <SelectItem value="Жилой комплекс">Жилой комплекс</SelectItem>
                          <SelectItem value="Торговый центр">Торговый центр</SelectItem>
                          <SelectItem value="Спортивное сооружение">Спортивное сооружение</SelectItem>
                          <SelectItem value="Другое">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createOrderForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание проекта (необязательно)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Краткое описание проекта и особенности" 
                          {...field} 
                          data-testid="textarea-order-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Catalog Section */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Выбор продукции
                  </h3>
                  
                  {Array.isArray(products) && products.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {products.map((product: any) => (
                        <Card key={product.id} className="p-3" data-testid={`product-card-${product.id}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {product.gost} • {product.weight} кг • 0 ₽
                              </div>
                              {product.description && (
                                <div className="text-xs text-gray-500 mt-1">{product.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateProductQuantity(product.id, (selectedProducts[product.id] || 0) - 1)}
                                disabled={!selectedProducts[product.id]}
                                data-testid={`button-decrease-${product.id}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="min-w-[2rem] text-center text-sm">
                                {selectedProducts[product.id] || 0}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateProductQuantity(product.id, (selectedProducts[product.id] || 0) + 1)}
                                data-testid={`button-increase-${product.id}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Каталог продукции загружается...
                    </div>
                  )}
                  
                  {/* Order Summary */}
                  {Object.keys(selectedProducts).length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Выбранные товары:</h4>
                      <div className="space-y-1 text-xs">
                        {Object.entries(selectedProducts).map(([productId, quantity]) => {
                          const product = (products as any[]).find((p: any) => p.id === productId);
                          return product ? (
                            <div key={productId} className="flex justify-between">
                              <span>{product.name} × {quantity}</span>
                              <span>0 ₽</span>
                            </div>
                          ) : null;
                        })}
                        <div className="border-t pt-1 mt-2 font-medium flex justify-between">
                          <span>Общая сумма:</span>
                          <span>0 ₽</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={createOrderForm.control}
                  name="factoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Завод *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-factory">
                            <SelectValue placeholder="Выберите завод для заказа" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(factories) && factories.map((factory: any) => (
                            <SelectItem key={factory.id} value={factory.id}>
                              {factory.name} - {factory.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createOrderForm.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Адрес доставки *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Укажите адрес доставки" 
                            {...field} 
                            data-testid="input-delivery-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createOrderForm.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Контактное лицо *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ФИО ответственного" 
                            {...field} 
                            data-testid="input-contact-person"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createOrderForm.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Контактный телефон *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+7 (___) ___-__-__" 
                            {...field} 
                            data-testid="input-contact-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createOrderForm.control}
                    name="estimatedBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Предполагаемый бюджет (необязательно)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="например: 1 000 000 руб." 
                            {...field} 
                            data-testid="input-estimated-budget"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createOrderForm.control}
                    name="priority"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Приоритет</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-order-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Низкий</SelectItem>
                          <SelectItem value="normal">Обычный</SelectItem>
                          <SelectItem value="high">Высокий</SelectItem>
                          <SelectItem value="urgent">Срочный</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                  
                  <FormField
                    control={createOrderForm.control}
                    name="deadline"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Срок выполнения (необязательно)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-order-deadline"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <FormField
                  control={createOrderForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примечания (необязательно)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Дополнительные требования или комментарии" 
                          {...field} 
                          data-testid="textarea-order-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOrderOpen(false)}
                    data-testid="button-cancel-order"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    data-testid="button-submit-order"
                  >
                    {createOrderMutation.isPending ? "Создание..." : "Создать заказ"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Интерфейс администратора (оригинальный)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Все заказы
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
            Управление всеми заказами системы
            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded">
              Режим администратора
            </span>
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
      ) : (orders as any[]).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Заказов пока нет
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Создайте первый заказ используя форму заказа
            </p>
            <Button onClick={() => window.location.href = '/catalog'} data-testid="button-go-catalog">
              Создать заказ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(orders as any[]).map((order: any) => (
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
                      0 ₽
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Состав заказа
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
                            {item.quantity} шт.
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Factory Information */}
                {order.factoryId && (
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        Завод
                        {user?.role === 'administrator' && (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                            Администратор
                          </span>
                        )}
                      </h4>
                      {canEditFactory(order) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(order)}
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          data-testid={`button-edit-factory-${order.id}`}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Изменить
                        </Button>
                      )}
                    </div>
                    {(() => {
                      const factory = (factories as any[]).find((f: any) => f.id === order.factoryId);
                      return (
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="font-medium text-sm">
                            {factory ? factory.name : 'Завод не найден'}
                          </div>
                          {factory && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {factory.location}
                              {order.priority && order.priority !== 'normal' && (
                                <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded text-xs">
                                  {order.priority === 'urgent' ? 'Срочный' : 
                                   order.priority === 'high' ? 'Высокий' : 
                                   order.priority === 'low' ? 'Низкий' : 'Обычный'}
                                </span>
                              )}
                              {order.deadline && (
                                <span className="ml-2 text-xs">
                                  до {new Date(order.deadline * 1000).toLocaleDateString('ru-RU')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

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

                {/* Send to Factory Button */}
                {(order.status === "pending" || order.status === "confirmed") && canEditFactory(order) && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => openSendDialog(order.id)}
                      className="w-full"
                      data-testid={`button-send-to-factory-${order.id}`}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Отправить на завод
                    </Button>
                  </div>
                )}

                {/* Admin info */}
                {user?.role === 'administrator' && order.customerId !== user.id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Заказчик: ID {order.customerId.slice(-8).toUpperCase()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Send to Factory Dialog */}
      <Dialog open={sendingOrderId !== null || editingOrderId !== null} onOpenChange={closeSendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOrderId ? "Изменить завод" : "Отправить заказ на завод"}
            </DialogTitle>
            <DialogDescription>
              {editingOrderId 
                ? "Измените завод и параметры производства"
                : "Выберите завод и укажите параметры для производства"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendToFactory)} className="space-y-4">
              <FormField
                control={form.control}
                name="factoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Завод</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-factory">
                          <SelectValue placeholder="Выберите завод" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(factories as any[]).map((factory: any) => (
                          <SelectItem key={factory.id} value={factory.id}>
                            <div className="flex items-center gap-2">
                              <Factory className="h-3 w-3" />
                              <div>
                                <div className="font-medium">{factory.name}</div>
                                <div className="text-xs text-gray-500">{factory.location}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Приоритет</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Низкий</SelectItem>
                        <SelectItem value="normal">Обычный</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                        <SelectItem value="urgent">Срочный</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок выполнения (необязательно)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-deadline"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примечания (необязательно)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Дополнительные требования к производству..."
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={closeSendDialog}>
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={sendToFactoryMutation.isPending}
                  data-testid="button-submit-send-to-factory"
                >
                  {sendToFactoryMutation.isPending 
                    ? (editingOrderId ? "Сохранение..." : "Отправка...") 
                    : (editingOrderId ? "Сохранить изменения" : "Отправить")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}