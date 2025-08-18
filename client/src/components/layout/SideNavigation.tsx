import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: "Панель управления", href: "/", icon: "fas fa-tachometer-alt" },
  
  // Customer operator specific items
  { name: "Каталог продукции", href: "/catalog", icon: "fas fa-box", roles: ["customer_operator"] },
  { name: "Корзина", href: "/cart", icon: "fas fa-shopping-cart", roles: ["customer_operator"] },
  { name: "Мои заказы", href: "/orders", icon: "fas fa-receipt", roles: ["customer_operator"] },
  
  // Production and logistics items
  { name: "Маркировка", href: "/marking", icon: "fas fa-qrcode", roles: ["administrator", "production_operator"] },
  { name: "Сканирование", href: "/scanning", icon: "fas fa-scanner", roles: ["administrator", "production_operator", "logistics_operator", "construction_operator"] },
  { name: "Отслеживание", href: "/tracking", icon: "fas fa-route", roles: ["administrator", "production_operator", "logistics_operator", "construction_operator"] },
  
  // Admin and reporting items
  { name: "Отчеты", href: "/reports", icon: "fas fa-chart-bar", roles: ["administrator"] },
  { name: "Настройки", href: "/settings", icon: "fas fa-cog" },
];

export function SideNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const visibleNavItems = navItems.filter(item => {
    if (!item.roles) return true; // Show items without role restrictions to everyone
    return item.roles.includes(user?.role || "");
  });

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 shadow-lg min-h-screen border-r border-gray-200 dark:border-gray-700">
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {visibleNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg font-medium min-h-[48px]",
                location === item.href
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              data-testid={`nav-${item.href.replace('/', '') || 'dashboard'}`}
            >
              <i className={`${item.icon} mr-3`}></i>
              {item.name}
            </a>
          ))}
        </div>
      </nav>
    </aside>
  );
}
