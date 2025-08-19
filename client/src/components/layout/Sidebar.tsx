import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Tag, 
  Scan, 
  MapPin, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import logoPath from "@assets/CTS-white-1_1753870337487.png";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Панель управления", icon: LayoutDashboard, roles: ["administrator", "customer_operator", "factory_operator", "warehouse_keeper", "site_master"] },
    { path: "/catalog", label: "Каталог", icon: Package, roles: ["administrator", "customer_operator"] },
    { path: "/cart", label: "Корзина", icon: ShoppingCart, roles: ["administrator", "customer_operator"] },
    { path: "/orders", label: "Заказы", icon: FileText, roles: ["administrator", "customer_operator"] },
    { path: "/factory-orders", label: "Производство", icon: FileText, roles: ["administrator", "factory_operator"] },
    { path: "/factories", label: "Заводы", icon: Package, roles: ["administrator"] },
    { path: "/marking", label: "Маркировка", icon: Tag, roles: ["administrator", "factory_operator"] },
    { path: "/scanning", label: "Сканирование", icon: Scan, roles: ["administrator", "warehouse_keeper", "site_master"] },
    { path: "/tracking", label: "Отслеживание", icon: MapPin, roles: ["administrator", "warehouse_keeper", "site_master"] },
    { path: "/reports", label: "Отчеты", icon: BarChart3, roles: ["administrator"] },
    { path: "/settings", label: "Настройки", icon: Settings, roles: ["administrator"] },
  ];

  const availableItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white dark:bg-gray-900 shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
        flex flex-col flex-shrink-0 z-50
        lg:relative lg:translate-x-0
        fixed left-0 top-0 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <img 
          src={logoPath} 
          alt="CTS Logo" 
          className="h-12 w-auto mx-auto"
        />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mt-2">
          CTS System
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {availableItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
        {/* User Info */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email || "Пользователь"}
          </div>
          <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded mt-1 inline-block">
            {user?.role === 'administrator' ? 'Администратор' :
             user?.role === 'customer_operator' ? 'Оператор заказчика' :
             user?.role === 'factory_operator' ? 'Оператор производства' :
             user?.role === 'warehouse_keeper' ? 'Оператор логистики' :
             user?.role === 'site_master' ? 'Оператор стройки' :
             'Оператор'}
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </Button>
        </div>
      </div>
    </>
  );
}