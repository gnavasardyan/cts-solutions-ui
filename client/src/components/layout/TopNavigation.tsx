import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link, useLocation } from "wouter";
import logoPath from "@assets/CTS-white-1_1753870337487.png";

export function TopNavigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Панель управления", roles: ["administrator", "factory_operator", "warehouse_keeper", "site_master", "auditor"] },
    { path: "/catalog", label: "Каталог", roles: ["administrator", "customer_operator"] },
    { path: "/cart", label: "Корзина", roles: ["administrator", "customer_operator"] },
    { path: "/orders", label: "Заказы", roles: ["administrator", "customer_operator"] },
    { path: "/factory-orders", label: "Заказы завода", roles: ["administrator", "factory_operator"] },
    { path: "/marking", label: "Маркировка", roles: ["administrator", "factory_operator"] },
    { path: "/scanning", label: "Сканирование", roles: ["administrator", "warehouse_keeper", "site_master"] },
    { path: "/tracking", label: "Отслеживание", roles: ["administrator", "warehouse_keeper", "site_master"] },
    { path: "/reports", label: "Отчеты", roles: ["administrator", "auditor"] },
    { path: "/settings", label: "Настройки", roles: ["administrator"] },
  ];

  const availableItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Logo positioned at top-left corner as independent element */}
      <div className="absolute top-4 left-4 z-50">
        <img 
          src={logoPath} 
          alt="CTS Logo" 
          className="h-12 w-auto"
        />
      </div>
      
      <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left spacer for logo */}
            <div className="w-16"></div>
            
            {/* Navigation Menu */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex space-x-1">
                {availableItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.path
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          
            {/* User info aligned to the right */}
            <div className="flex items-center justify-end space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "Пользователь"}
                </span>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  {user?.role === 'administrator' ? 'Администратор' :
                   user?.role === 'customer_operator' ? 'Клиент' :
                   user?.role === 'factory_operator' ? 'Оператор завода' :
                   user?.role === 'warehouse_keeper' ? 'Кладовщик' :
                   user?.role === 'site_master' ? 'Мастер участка' :
                   'Аудитор'}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={logout}
                  className="min-h-[32px] px-3"
                >
                  Выйти
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}