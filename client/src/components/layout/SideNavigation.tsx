import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import logoPath from "@assets/photo_2025-07-30_11-09-11_1753863090708.jpg";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Панель управления", href: "/", icon: "fas fa-tachometer-alt" },
  { name: "Маркировка", href: "/marking", icon: "fas fa-qrcode" },
  { name: "Сканирование", href: "/scanning", icon: "fas fa-scanner" },
  { name: "Отслеживание", href: "/tracking", icon: "fas fa-route" },
  { name: "Отчеты", href: "/reports", icon: "fas fa-chart-bar" },
  { name: "Настройки", href: "/settings", icon: "fas fa-cog" },
];

export function SideNavigation() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen border-r border-gray-200">
      {/* Logo section */}
      <div className="flex items-center justify-center py-6 border-b border-gray-200">
        <img 
          src={logoPath} 
          alt="CTS Center Trace Solutions" 
          className="h-16 w-auto"
        />
      </div>
      
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg font-medium min-h-[48px]",
                location === item.href
                  ? "bg-industrial-blue text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
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
