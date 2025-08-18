import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Minus, Plus, Package, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function CartPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderNotes, setOrderNotes] = useState("");

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['/api/cart'],
    enabled: true,
  });

  // Update cart item mutation
  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return apiRequest(`/api/cart/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить количество",
        variant: "destructive",
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/cart/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Товар удален",
        description: "Товар удален из корзины",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар",
        variant: "destructive",
      });
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const totalAmount = cartItems.reduce((total: number, item: any) => 
        total + (item.product.price * item.quantity), 0
      );
      
      return apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          totalAmount,
          notes: orderNotes,
          status: 'pending'
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Заказ оформлен",
        description: "Ваш заказ успешно отправлен в обработку",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      window.location.href = '/orders';
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось оформить заказ",
        variant: "destructive",
      });
    },
  });

  const handleUpdateQuantity = (id: string, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    updateCartMutation.mutate({ id, quantity: newQuantity });
  };

  const handleRemoveItem = (id: string) => {
    removeFromCartMutation.mutate(id);
  };

  const handleCreateOrder = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Корзина пуста",
        description: "Добавьте товары в корзину для оформления заказа",
        variant: "destructive",
      });
      return;
    }
    createOrderMutation.mutate();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalAmount = cartItems.reduce((total: number, item: any) => 
    total + (item.product.price * item.quantity), 0
  );

  const totalItems = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Корзина</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalItems > 0 ? `${totalItems} товаров на сумму ${formatPrice(totalAmount)}` : 'Корзина пуста'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cartItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Корзина пуста
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Добавьте товары из каталога, чтобы оформить заказ
            </p>
            <Button onClick={() => window.location.href = '/catalog'} data-testid="button-go-catalog">
              Перейти в каталог
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item: any) => (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.product.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.product.gost}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          <Package className="h-3 w-3 inline mr-1" />
                          {item.product.weight} кг
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(item.product.price)} за шт.
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          disabled={item.quantity <= 1 || updateCartMutation.isPending}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          disabled={updateCartMutation.isPending}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeFromCartMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Оформление заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Товаров:</span>
                    <span>{totalItems} шт.</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Итого:</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Комментарий к заказу (необязательно):
                  </label>
                  <Input
                    id="notes"
                    placeholder="Особые требования, пожелания..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    data-testid="input-order-notes"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateOrder}
                  disabled={createOrderMutation.isPending || cartItems.length === 0}
                  data-testid="button-create-order"
                >
                  {createOrderMutation.isPending ? "Оформление..." : "Оформить заказ"}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Нажимая "Оформить заказ", вы подтверждаете создание заявки на поставку товаров
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}