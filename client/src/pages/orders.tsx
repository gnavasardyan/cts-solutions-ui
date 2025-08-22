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

const CONSTRUCTION_DOCS = {
  "Здание": "https://docs.example.com/buildings",
  "Мост": "https://docs.example.com/bridges", 
  "Башня": "https://docs.example.com/towers",
  "Промышленная конструкция": "https://docs.example.com/industrial",
  "Склад": "https://docs.example.com/warehouses",
  "Жилой комплекс": "https://docs.example.com/residential",
  "Торговый центр": "https://docs.example.com/shopping",
  "Спортивное сооружение": "https://docs.example.com/sports",
  "Другое": "https://docs.example.com/other"
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

  // Check if user can edit order
  const canEditOrder = (order: any) => {
    if (!user) return false;
    return user.role === 'customer_operator' && (order.status === 'draft' || order.status === 'pending');
  };

  // Check if user can change order status
  const canChangeStatus = (order: any) => {
    if (!user) return false;
    if (user.role === 'customer_operator') {
      return order.status === 'draft'; // Customer can only submit draft orders
    }
    return false;
  };

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status: newStatus });
      
      toast({
        title: "Успешно",
        description: newStatus === 'pending' ? "Заказ отправлен в обработку" : "Статус заказа изменен",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус заказа",
        variant: "destructive",
      });
    }
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
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/orders", {
        status: data.status || "pending",
        priority: data.priority,
        factoryId: data.factoryId,
        deadline: data.deadline ? Math.floor(new Date(data.deadline).getTime() / 1000) : undefined,
        notes: [
          `${data.title}${data.description ? ` - ${data.description}` : ''}`,
          `Тип: ${data.constructionType}`,
          `Адрес: ${data.deliveryAddress}`,
          `Контакт: ${data.contactPerson} (${data.contactPhone})`,
          data.estimatedBudget ? `Бюджет: ${data.estimatedBudget}` : '',
          data.notes ? `Примечания: ${data.notes}` : ''
        ].filter(Boolean).join('\n'),
        totalAmount: data.totalAmount,
        items: data.items || [], // Добавляем товары
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

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, orderData }: { orderId: string, orderData: any }) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}`, orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsCreateOrderOpen(false);
      setEditingOrderId(null);
      createOrderForm.reset();
      setSelectedProducts({});
      toast({
        title: "Заказ обновлен",
        description: "Изменения успешно сохранены",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить заказ",
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
    
    if (editingOrderId) {
      // Edit existing order
      updateOrderMutation.mutate({ orderId: editingOrderId, orderData });
    } else {
      // Create new order
      createOrderMutation.mutate(orderData);
    }
  };





  const sendOrderToFactory = async (orderId: string) => {
    try {
      console.log('Sending order to factory directly:', orderId);
      await apiRequest("PATCH", `/api/orders/${orderId}/status`, { 
        status: "sent_to_factory"
      });
      
      toast({
        title: "Успешно",
        description: "Заказ отправлен на завод",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error) {
      console.error('Error sending to factory:', error);
      toast({
        title: "Ошибка", 
        description: "Не удалось отправить заказ на завод",
        variant: "destructive",
      });
    }
  };

  // Delete order function for admin
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успешно",
        description: "Заказ удален",
      });
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказ",
        variant: "destructive",
      });
    },
  });

  const handleDeleteOrder = (orderId: string) => {
    if (confirm("Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const openEditDialog = (order: any) => {
    setEditingOrderId(order.id);
    // Pre-fill the form with current factory data
    const currentFactory = (factories as any[]).find((f: any) => f.id === order.factoryId);
    form.reset({
      factoryId: order.factoryId || "",
      priority: order.priority || "normal",
      deadline: order.deadline ? new Date(order.deadline * 1000).toISOString().split('T')[0] : "",
      notes: order.notes || "",
    });
  };



  // Open order edit dialog for customers
  const openOrderEditDialog = (order: any) => {
    setEditingOrderId(order.id);
    
    // Parse order data from notes field (where it's stored)
    const notes = order.notes || "";
    const lines = notes.split('\n').filter((line: string) => line.trim());
    
    // Extract title (first line, before " - ")
    const firstLine = lines[0] || "";
    const titleMatch = firstLine.match(/^([^-]+)(?:\s-\s(.+))?$/);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const description = titleMatch && titleMatch[2] ? titleMatch[2].trim() : "";
    
    // Extract other fields
    const typeMatch = notes.match(/Тип:\s*([^\n]+)/);
    const addressMatch = notes.match(/Адрес:\s*([^\n]+)/);
    const contactMatch = notes.match(/Контакт:\s*([^(]+)\s*\(([^)]+)\)/);
    const budgetMatch = notes.match(/Бюджет:\s*([^\n]+)/);
    const notesMatch = notes.match(/Примечания:\s*([\s\S]+?)$/);
    
    console.log('Editing order:', { order, notes, title, description, typeMatch, addressMatch, contactMatch });
    
    createOrderForm.reset({
      title: title,
      description: description,
      constructionType: typeMatch ? typeMatch[1].trim() : "",
      factoryId: order.factoryId || "",
      deliveryAddress: addressMatch ? addressMatch[1].trim() : "",
      contactPerson: contactMatch ? contactMatch[1].trim() : "",
      contactPhone: contactMatch ? contactMatch[2].trim() : "",
      estimatedBudget: budgetMatch ? budgetMatch[1].trim() : "",
      priority: order.priority || "normal",
      deadline: order.deadline ? new Date(order.deadline * 1000).toISOString().split('T')[0] : "",
      notes: notesMatch ? notesMatch[1].trim() : "",
      status: order.status || "draft",
      totalAmount: order.totalAmount || 0
    });
    
    // Load existing order items into selectedProducts
    if (order.items && order.items.length > 0) {
      const selectedItems: Record<string, number> = {};
      order.items.forEach((item: any) => {
        selectedItems[item.productId] = item.quantity;
      });
      setSelectedProducts(selectedItems);
    } else {
      setSelectedProducts({});
    }
    
    setIsCreateOrderOpen(true);
  };

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
                      className=""
                    >
                      {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label || order.status}
                    </Badge>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {(canEditOrder(order) || canChangeStatus(order)) && (
                      <div className="flex gap-1 mt-2">

                        {canChangeStatus(order) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(order.id, "pending")}
                            className="h-6 px-2 text-xs text-blue-600"
                            data-testid={`button-submit-order-${order.id}`}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Отправить
                          </Button>
                        )}
                        {/* Send to Factory Button for customers */}
                        {user?.role === 'customer_operator' && (order.status === 'pending' || order.status === 'confirmed' || order.status === 'draft') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendOrderToFactory(order.id)}
                            className="h-6 px-2 text-xs text-green-600"
                            data-testid={`button-send-to-factory-${order.id}`}
                          >
                            <Factory className="h-3 w-3 mr-1" />
                            На завод
                          </Button>
                        )}
                      </div>
                    )}
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
                    {order.items && order.items.length > 0 ? order.items.map((item: any, index: number) => (
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
                            {item.quantity} шт
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Состав заказа не указан
                      </div>
                    )}
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

                {/* Admin can send orders to factory directly via status change button */}
                {user?.role === 'administrator' && order.status === 'confirmed' && !order.factoryId && (
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={() => sendOrderToFactory(order.id)}
                      data-testid={`button-admin-send-to-factory-${order.id}`}
                    >
                      <Factory className="h-4 w-4 mr-2" />
                      Отправить на завод
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrderId 
                ? "Редактирование заказа" 
                : "Создание заказа"
              }
            </DialogTitle>
            <DialogDescription>
              {editingOrderId 
                ? "Внесите изменения в информацию о заказе" 
                : "Заполните информацию о заказе металлоконструкций"
              }
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
                          {Object.keys(CONSTRUCTION_DOCS).map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Документация по выбранному типу конструкции */}
                {createOrderForm.watch("constructionType") && CONSTRUCTION_DOCS[createOrderForm.watch("constructionType") as keyof typeof CONSTRUCTION_DOCS] && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-800 dark:text-blue-200">Документация по типу конструкции:</span>
                      <a 
                        href={CONSTRUCTION_DOCS[createOrderForm.watch("constructionType") as keyof typeof CONSTRUCTION_DOCS]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                        data-testid={`link-construction-docs-${createOrderForm.watch("constructionType")}`}
                      >
                        {createOrderForm.watch("constructionType")} - Техническая документация
                      </a>
                    </div>
                  </div>
                )}

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
                            </div>
                          ) : null;
                        })}
                        <div className="border-t pt-1 mt-2 font-medium flex justify-between">
                          <span>Общая сумма:</span>
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
                    disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
                    data-testid="button-submit-order"
                  >
                    {editingOrderId ? 
                      (updateOrderMutation.isPending ? "Сохранение..." : "Сохранить изменения") : 
                      (createOrderMutation.isPending ? "Создание..." : "Создать заказ")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );

  // Интерфейс заказчика
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

        {/* Customer Orders View - Cards Layout */}
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
        ) : (orders as any[])?.filter((order: any) => order.customerId === user.id).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Заказов пока нет
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Создайте первый заказ используя кнопку "Создать заказ"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(orders as any[])?.filter((order: any) => order.customerId === user.id).map((order: any) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow" data-testid={`order-${order.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {order.title || `Заказ #${order.id.slice(-8).toUpperCase()}`}
                      </CardTitle>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.variant || "outline"}>
                        {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label || order.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items - всегда показываем раздел */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        Состав заказа
                      </h4>
                      <div className="space-y-2">
                        {order.items && order.items.length > 0 ? order.items.map((item: any, index: number) => (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            data-testid={`order-item-${index}`}
                          >
                            <div>
                              <div className="font-medium text-sm">{item.product.name}</div>
                              {item.product.description && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {item.product.description}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {item.quantity} шт
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            {order.status === 'draft' ? 
                              'Состав заказа будет добавлен при оформлении' : 
                              'Состав заказа не указан'
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {order.constructionType && (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Тип:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{order.constructionType}</span>
                            {CONSTRUCTION_DOCS[order.constructionType as keyof typeof CONSTRUCTION_DOCS] && (
                              <a 
                                href={CONSTRUCTION_DOCS[order.constructionType as keyof typeof CONSTRUCTION_DOCS]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                                data-testid={`link-docs-${order.constructionType}`}
                              >
                                документация
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      {order.deliveryAddress && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Адрес:</span>
                          <span className="font-medium">{order.deliveryAddress}</span>
                        </div>
                      )}
                      {order.contactPerson && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Контакт:</span>
                          <span className="font-medium">{order.contactPerson}</span>
                        </div>
                      )}
                      {order.deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Срок:</span>
                          <span className="font-medium">{formatDate(order.deadline)}</span>
                        </div>
                      )}
                    </div>

                    {order.description && (
                      <div className="pt-2 border-t">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Описание:</div>
                            <div className="text-sm">{order.description}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {order.factoryId && (
                      <div className="pt-2 border-t">
                        {(() => {
                          const factory = (factories as any[])?.find((f: any) => f.id === order.factoryId);
                          return (
                            <div className="flex items-center gap-2 text-sm">
                              <Factory className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">Завод:</span>
                              <div className="font-medium">
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
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Action buttons for customer */}
                    <div className="flex justify-end gap-2 pt-4">
                      {canEditOrder(order) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openOrderEditDialog(order)}
                          data-testid={`button-edit-${order.id}`}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Редактировать
                        </Button>
                      )}
                      
                      {(order.status === 'confirmed' || order.status === 'draft') && order.status !== 'sent_to_factory' && (
                        <Button
                          onClick={() => sendOrderToFactory(order.id)}
                          data-testid={`button-send-factory-${order.id}`}
                        >
                          <Factory className="h-4 w-4 mr-2" />
                          Отправить на завод
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Order Dialog для заказчиков с каталогом */}
        <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOrderId 
                  ? "Редактирование заказа" 
                  : "Создание нового заказа"
                }
              </DialogTitle>
              <DialogDescription>
                {editingOrderId 
                  ? "Внесите изменения в информацию о заказе" 
                  : "Заполните информацию о заказе металлоконструкций"
                }
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
                          {Object.keys(CONSTRUCTION_DOCS).map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Документация по выбранному типу конструкции */}
                {createOrderForm.watch("constructionType") && CONSTRUCTION_DOCS[createOrderForm.watch("constructionType") as keyof typeof CONSTRUCTION_DOCS] && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-800 dark:text-blue-200">Документация по типу конструкции:</span>
                      <a 
                        href={CONSTRUCTION_DOCS[createOrderForm.watch("constructionType") as keyof typeof CONSTRUCTION_DOCS]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                        data-testid={`link-construction-docs-${createOrderForm.watch("constructionType")}`}
                      >
                        {createOrderForm.watch("constructionType")} - Техническая документация
                      </a>
                    </div>
                  </div>
                )}

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
                            </div>
                          ) : null;
                        })}
                        <div className="border-t pt-1 mt-2 font-medium flex justify-between">
                          <span>Общая сумма:</span>
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
                    {createOrderMutation.isPending 
                      ? "Создание..." 
                      : editingOrderId 
                        ? "Сохранить изменения" 
                        : "Создать заказ"
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

  // Интерфейс администратора (оригинальный)
  if (user?.role === 'administrator') {
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
        <div className="flex-1">
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
        <Button 
          onClick={() => setIsCreateOrderOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-admin-create-order"
        >
          <Plus className="h-4 w-4 mr-2" />
          Создать заказ
        </Button>
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
                      className=""
                    >
                      {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label || order.status}
                    </Badge>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
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
                    {order.items && order.items.length > 0 ? order.items.map((item: any, index: number) => (
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
                            {item.quantity} шт
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Состав заказа не указан
                      </div>
                    )}
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

                {/* Send to Factory Button for customers */}
                {user?.role === 'customer_operator' && (order.status === 'pending' || order.status === 'confirmed' || order.status === 'draft') && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => sendOrderToFactory(order.id)}
                      className="w-full"
                      data-testid={`button-send-to-factory-full-${order.id}`}
                    >
                      <Factory className="h-4 w-4 mr-2" />
                      Отправить на завод
                    </Button>
                  </div>
                )}

                {/* Admin actions */}
                {user?.role === 'administrator' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Заказчик: ID {order.customerId.slice(-8).toUpperCase()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openOrderEditDialog(order)}
                          data-testid={`button-admin-edit-${order.id}`}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Редактировать
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deleteOrderMutation.isPending}
                          data-testid={`button-admin-delete-${order.id}`}
                        >
                          {deleteOrderMutation.isPending ? "Удаление..." : "Удалить"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создание заказа (Администратор)</DialogTitle>
            <DialogDescription>
              Выберите завод и укажите параметры для производства
            </DialogDescription>
          </DialogHeader>
          <Form {...createOrderForm}>
            <form onSubmit={createOrderForm.handleSubmit(handleCreateOrder)} className="space-y-4">
              <FormField
                control={createOrderForm.control}
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
                  {createOrderMutation.isPending 
                    ? "Создание..." 
                    : editingOrderId 
                      ? "Сохранить изменения" 
                      : "Создать заказ"
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

  // Default fallback for other roles
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
        <p className="text-gray-600 dark:text-gray-400">У вас нет прав для просмотра этой страницы.</p>
      </div>
    </div>
  );
}