import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, MapPin, Phone, Mail, Users, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const factorySchema = z.object({
  name: z.string().min(1, "Название завода обязательно"),
  location: z.string().min(1, "Город обязателен"),
  address: z.string().min(1, "Адрес обязателен"),
  contactEmail: z.string().email("Неверный формат email"),
  contactPhone: z.string().min(1, "Телефон обязателен"),
  capacity: z.number().min(1, "Мощность должна быть больше 0"),
  specializations: z.string().min(1, "Специализация обязательна"),
});

type FactoryFormData = z.infer<typeof factorySchema>;

interface Factory {
  id: string;
  name: string;
  location: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  capacity: number;
  specializations: string;
  isActive: string;
  createdAt: number;
}

export default function Factories() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: factories = [], isLoading } = useQuery<Factory[]>({
    queryKey: ["/api/factories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FactoryFormData) => {
      const response = await fetch("/api/factories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          specializations: data.specializations.split(",").map(s => s.trim()).filter(s => s.length > 0)
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка создания завода');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factories"] });
      setIsCreateOpen(false);
      toast({ description: "Завод успешно создан" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Ошибка создания завода" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FactoryFormData }) => {
      const response = await fetch(`/api/factories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          specializations: data.specializations.split(",").map(s => s.trim()).filter(s => s.length > 0)
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка обновления завода');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factories"] });
      setEditingFactory(null);
      toast({ description: "Завод успешно обновлен" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Ошибка обновления завода" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/factories/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка удаления завода');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factories"] });
      toast({ description: "Завод успешно удален" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Ошибка удаления завода" 
      });
    },
  });

  const form = useForm<FactoryFormData>({
    resolver: zodResolver(factorySchema),
    defaultValues: {
      name: "",
      location: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
      capacity: 100,
      specializations: "",
    },
  });

  const onSubmit = (data: FactoryFormData) => {
    if (editingFactory) {
      updateMutation.mutate({ id: editingFactory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (factory: Factory) => {
    setEditingFactory(factory);
    
    let specializations = "";
    try {
      const parsed = JSON.parse(factory.specializations || "[]");
      specializations = Array.isArray(parsed) ? parsed.join(", ") : factory.specializations;
    } catch {
      specializations = factory.specializations || "";
    }
    
    form.reset({
      name: factory.name,
      location: factory.location,
      address: factory.address,
      contactEmail: factory.contactEmail,
      contactPhone: factory.contactPhone,
      capacity: factory.capacity,
      specializations,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этот завод?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    form.reset();
    setEditingFactory(null);
    setIsCreateOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка заводов...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Управление заводами</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создание и управление производственными заводами
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-factory">
          <Plus className="mr-2 h-4 w-4" />
          Добавить завод
        </Button>

        <Dialog open={isCreateOpen || editingFactory !== null} onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFactory ? "Редактировать завод" : "Создать новый завод"}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о заводе для производства металлоконструкций
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название завода</FormLabel>
                      <FormControl>
                        <Input placeholder="МеталлСтрой Завод №1" {...field} data-testid="input-factory-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Город</FormLabel>
                      <FormControl>
                        <Input placeholder="Москва" {...field} data-testid="input-factory-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес</FormLabel>
                      <FormControl>
                        <Input placeholder="ул. Промышленная, д. 25" {...field} data-testid="input-factory-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="factory@company.ru" {...field} data-testid="input-factory-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input placeholder="+7 (495) 123-45-67" {...field} data-testid="input-factory-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Мощность (тонн/месяц)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-factory-capacity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specializations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Специализация (через запятую)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="beam, column, truss, connection" 
                          {...field} 
                          data-testid="input-factory-specializations"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Отмена
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-factory"
                  >
                    {editingFactory ? "Обновить" : "Создать"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {factories.map((factory) => {
          let specializations = [];
          try {
            specializations = JSON.parse(factory.specializations || "[]");
          } catch {
            specializations = [factory.specializations];
          }
          
          return (
            <Card key={factory.id} data-testid={`card-factory-${factory.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{factory.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {factory.location}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(factory)}
                    data-testid={`button-edit-${factory.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(factory.id)}
                    data-testid={`button-delete-${factory.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{factory.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{factory.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{factory.contactPhone}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">{factory.capacity}</span>
                  <span className="text-gray-500">т/мес</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  factory.isActive === "true" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                }`}>
                  {factory.isActive === "true" ? "Активен" : "Неактивен"}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Package className="h-3 w-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Специализация:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {JSON.parse(factory.specializations).map((spec: string, index: number) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {factories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            Заводы не найдены
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать первый завод
          </Button>
        </div>
      )}
    </div>
  );
}