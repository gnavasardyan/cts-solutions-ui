import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Package, Search, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = {
  all: "Все категории",
  beam: "Балки и профили",
  column: "Колонны", 
  truss: "Фермы и связи",
  connection: "Соединения и крепеж",
  slab: "Плиты перекрытий"
};

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products', { category: selectedCategory !== 'all' ? selectedCategory : undefined, search: searchTerm }],
    enabled: true,
  });

  // Fetch cart items
  const { data: cartItems = [] } = useQuery({
    queryKey: ['/api/cart'],
    enabled: true,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Товар добавлен",
        description: "Товар успешно добавлен в корзину",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatWeight = (weight: number) => {
    return `${weight} кг`;
  };

  const parseDimensions = (dimensions: string) => {
    try {
      const parsed = JSON.parse(dimensions);
      const parts = [];
      if (parsed.length) parts.push(`Д: ${parsed.length}мм`);
      if (parsed.width) parts.push(`Ш: ${parsed.width}мм`);
      if (parsed.height) parts.push(`В: ${parsed.height}мм`);
      if (parsed.diameter) parts.push(`⌀: ${parsed.diameter}мм`);
      if (parsed.thickness) parts.push(`Т: ${parsed.thickness}мм`);
      return parts.join(', ');
    } catch {
      return dimensions;
    }
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartItemCount = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Каталог продукции</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Металлоконструкции и строительные материалы
          </p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/cart'}
          data-testid="button-cart"
        >
          <ShoppingCart className="h-4 w-4" />
          Корзина {cartItemCount > 0 && `(${cartItemCount})`}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по названию или описанию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow" data-testid={`card-product-${product.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORIES[product.category as keyof typeof CATEGORIES] || product.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {product.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">ГОСТ:</span>
                    <br />
                    <span className="text-gray-600 dark:text-gray-400">{product.gost}</span>
                  </div>
                  <div>
                    <span className="font-medium">Вес:</span>
                    <br />
                    <span className="text-gray-600 dark:text-gray-400">{formatWeight(product.weight)}</span>
                  </div>
                </div>

                {product.dimensions && (
                  <div className="text-sm">
                    <span className="font-medium">Размеры:</span>
                    <br />
                    <span className="text-gray-600 dark:text-gray-400">
                      {parseDimensions(product.dimensions)}
                    </span>
                  </div>
                )}

                {product.specifications && (
                  <div className="text-sm">
                    <span className="font-medium">Характеристики:</span>
                    <br />
                    <span className="text-gray-600 dark:text-gray-400">
                      {product.specifications}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs text-gray-500">
                      <Package className="h-3 w-3 inline mr-1" />
                      В наличии: {product.inStock} шт.
                    </span>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={addToCartMutation.isPending || product.inStock === 0}
                    size="sm"
                    data-testid={`button-add-cart-${product.id}`}
                  >
                    {addToCartMutation.isPending ? "..." : "В корзину"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Товары не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Попробуйте изменить параметры поиска или выбрать другую категорию
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}