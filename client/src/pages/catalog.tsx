import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Package, Search, Filter, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'administrator';

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: "beam",
    price: "",
    weight: "",
    dimensions: "",
    gost: "",
    specifications: "",
    inStock: "",
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
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
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
      }
      
      return response.json();
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

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return apiRequest("POST", "/api/products", {
        ...productData,
        price: parseFloat(productData.price),
        weight: productData.weight ? parseFloat(productData.weight) : null,
        inStock: parseInt(productData.inStock),
      });
    },
    onSuccess: () => {
      toast({
        title: "Товар создан",
        description: "Новый товар успешно добавлен в каталог",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать товар",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: any) => {
      return apiRequest("PATCH", `/api/products/${id}`, {
        ...productData,
        price: parseFloat(productData.price),
        weight: productData.weight ? parseFloat(productData.weight) : null,
        inStock: parseInt(productData.inStock),
      });
    },
    onSuccess: () => {
      toast({
        title: "Товар обновлен",
        description: "Информация о товаре успешно обновлена",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditingProduct(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить товар",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Товар удален",
        description: "Товар успешно удален из каталога",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      category: "beam",
      price: "",
      weight: "",
      dimensions: "",
      gost: "",
      specifications: "",
      inStock: "",
    });
  };

  const handleEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      description: product.description || "",
      category: product.category,
      price: product.price.toString(),
      weight: product.weight?.toString() ?? "",
      dimensions: product.dimensions ?? "",
      gost: product.gost || "",
      specifications: product.specifications ?? "",
      inStock: product.inStock.toString(),
    });
    setEditingProduct(product);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productForm });
    } else {
      createProductMutation.mutate(productForm);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatWeight = (weight: number | null) => {
    if (!weight) return 'Не указан';
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

  const filteredProducts = (products as Product[]).filter((product: Product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const cartItemCount = (cartItems as any[]).reduce((total: number, item: any) => total + item.quantity, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Каталог продукции</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Металлоконструкции и строительные материалы
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-add-product">
                  <Plus className="h-4 w-4" />
                  Добавить товар
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Добавить новый товар</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о товаре для добавления в каталог
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Название товара *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        data-testid="input-product-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Категория *</Label>
                      <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beam">Балки и профили</SelectItem>
                          <SelectItem value="column">Колонны</SelectItem>
                          <SelectItem value="truss">Фермы и связи</SelectItem>
                          <SelectItem value="connection">Соединения и крепеж</SelectItem>
                          <SelectItem value="slab">Плиты перекрытий</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      data-testid="input-product-description"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Цена (руб.) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                        required
                        data-testid="input-product-price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Вес (кг)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={productForm.weight}
                        onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                        data-testid="input-product-weight"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inStock">В наличии (шт.) *</Label>
                      <Input
                        id="inStock"
                        type="number"
                        value={productForm.inStock}
                        onChange={(e) => setProductForm(prev => ({ ...prev, inStock: e.target.value }))}
                        required
                        data-testid="input-product-stock"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gost">ГОСТ *</Label>
                      <Input
                        id="gost"
                        value={productForm.gost}
                        onChange={(e) => setProductForm(prev => ({ ...prev, gost: e.target.value }))}
                        required
                        placeholder="например: ГОСТ 26020-83"
                        data-testid="input-product-gost"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Размеры</Label>
                      <Input
                        id="dimensions"
                        value={productForm.dimensions}
                        onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
                        placeholder='{"length": 6000, "width": 200, "height": 400}'
                        data-testid="input-product-dimensions"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specifications">Технические характеристики</Label>
                    <Textarea
                      id="specifications"
                      value={productForm.specifications}
                      onChange={(e) => setProductForm(prev => ({ ...prev, specifications: e.target.value }))}
                      placeholder="Марка стали, класс прочности, дополнительные параметры..."
                      data-testid="input-product-specifications"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={createProductMutation.isPending}>
                      {createProductMutation.isPending ? "Создание..." : "Создать товар"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
          
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
                  <div className="flex gap-2">
                    {isAdmin && (
                      <>
                        <Button
                          onClick={() => handleEditProduct(product)}
                          size="sm"
                          variant="outline"
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          disabled={deleteProductMutation.isPending}
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addToCartMutation.isPending || product.inStock === 0}
                      size="sm"
                      data-testid={`button-add-cart-${product.id}`}
                    >
                      {addToCartMutation.isPending ? "..." : "В корзину"}
                    </Button>
                  </div>
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

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редактировать товар</DialogTitle>
              <DialogDescription>
                Измените информацию о товаре "{editingProduct.name}"
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Название товара *</Label>
                  <Input
                    id="edit-name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    data-testid="input-edit-product-name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Категория *</Label>
                  <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger data-testid="select-edit-product-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beam">Балки и профили</SelectItem>
                      <SelectItem value="column">Колонны</SelectItem>
                      <SelectItem value="truss">Фермы и связи</SelectItem>
                      <SelectItem value="connection">Соединения и крепеж</SelectItem>
                      <SelectItem value="slab">Плиты перекрытий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Описание</Label>
                <Textarea
                  id="edit-description"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-edit-product-description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price">Цена (руб.) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    required
                    data-testid="input-edit-product-price"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weight">Вес (кг)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={productForm.weight}
                    onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                    data-testid="input-edit-product-weight"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-inStock">В наличии (шт.) *</Label>
                  <Input
                    id="edit-inStock"
                    type="number"
                    value={productForm.inStock}
                    onChange={(e) => setProductForm(prev => ({ ...prev, inStock: e.target.value }))}
                    required
                    data-testid="input-edit-product-stock"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-gost">ГОСТ *</Label>
                  <Input
                    id="edit-gost"
                    value={productForm.gost}
                    onChange={(e) => setProductForm(prev => ({ ...prev, gost: e.target.value }))}
                    required
                    data-testid="input-edit-product-gost"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dimensions">Размеры</Label>
                  <Input
                    id="edit-dimensions"
                    value={productForm.dimensions}
                    onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
                    data-testid="input-edit-product-dimensions"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-specifications">Технические характеристики</Label>
                <Textarea
                  id="edit-specifications"
                  value={productForm.specifications}
                  onChange={(e) => setProductForm(prev => ({ ...prev, specifications: e.target.value }))}
                  data-testid="input-edit-product-specifications"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={updateProductMutation.isPending}>
                  {updateProductMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}