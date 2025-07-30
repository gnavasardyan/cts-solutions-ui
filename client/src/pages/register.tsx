import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoPath from "@assets/photo_2025-07-30_11-09-11_1753863090708.jpg";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "auditor",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Ошибка валидации",
        description: "Пароли не совпадают. Проверьте правильность ввода",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Слабый пароль",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Заполните обязательные поля",
        description: "Укажите ваше имя и фамилию",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      
      // Store token in localStorage
      localStorage.setItem("authToken", response.token);
      
      // Set user data directly in cache to avoid delay
      queryClient.setQueryData(["/api/auth/user"], response.user);
      
      toast({
        title: "Регистрация успешна",
        description: "Добро пожаловать в систему!",
      });

      // Force redirect immediately
      setLocation("/");
    } catch (error: any) {
      const errorMessage = error.message || "Проверьте правильность введенных данных и попробуйте снова";
      
      toast({
        title: "Ошибка регистрации",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={logoPath} 
            alt="CTS Center Trace Solutions" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Система прослеживаемости
          </h1>
          <p className="text-industrial-gray">
            Металлоконструкции
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Регистрация</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="h-12"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Роль</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auditor">Аудитор</SelectItem>
                    <SelectItem value="factory_operator">Оператор завода</SelectItem>
                    <SelectItem value="warehouse_keeper">Кладовщик</SelectItem>
                    <SelectItem value="site_master">Мастер участка</SelectItem>
                    <SelectItem value="administrator">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="h-12"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="h-12"
                  required
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-industrial-blue hover:bg-blue-700 text-white h-12"
                disabled={isLoading}
              >
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setLocation("/login")}
                  className="text-industrial-blue"
                >
                  Уже есть аккаунт? Войти
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}