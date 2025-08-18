import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoPath from "@assets/CTS-white-1_1753870337487.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Submitting login form with:", formData);
      const response = await apiRequest("POST", "/api/auth/login", formData);
      console.log("Login response:", response);
      
      // Store token in localStorage
      localStorage.setItem("authToken", response.token);
      
      // Set user data directly in cache to avoid delay
      queryClient.setQueryData(["/api/auth/user"], response.user);
      
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в систему!",
      });

      // Force redirect immediately
      setLocation("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Проверьте email и пароль",
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
            <CardTitle className="text-center">Вход в систему</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12"
                  placeholder="customer@example.com"
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="h-12"
                  placeholder="operator123"
                  required
                  data-testid="input-password"
                />
              </div>

              {/* Test credentials info */}
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p className="font-medium">Тестовые аккаунты:</p>
                <p>customer@example.com / operator123 (клиент)</p>
                <p>admin@example.com / admin123 (админ)</p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-industrial-blue hover:bg-blue-700 text-white h-12"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Вход..." : "Войти"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setLocation("/register")}
                  className="text-industrial-blue"
                >
                  Нет аккаунта? Зарегистрироваться
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}