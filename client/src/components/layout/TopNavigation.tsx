import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logoPath from "@assets/CTS-white-1_1753870337487.png";

export function TopNavigation() {
  const { user, logout } = useAuth();

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
      
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left spacer */}
            <div className="w-1/4"></div>
            
            {/* Title in the center */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-gray-900">
                Система прослеживаемости металлоконструкции
              </h1>
            </div>
          
            {/* User info aligned to the right */}
            <div className="w-1/4 flex items-center justify-end space-x-4">
              {/* Offline/Online Status */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-industrial-green rounded-full"></div>
                <span className="text-sm text-industrial-gray">Онлайн</span>
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative min-w-[48px] min-h-[48px]">
                <i className="fas fa-bell text-lg"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-industrial-red rounded-full"></span>
              </Button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "Пользователь"}
                </span>
                <span className="text-xs bg-industrial-blue text-white px-2 py-1 rounded">
                  {user?.role === 'administrator' ? 'Администратор' :
                   user?.role === 'factory_operator' ? 'Оператор завода' :
                   user?.role === 'warehouse_keeper' ? 'Кладовщик' :
                   user?.role === 'site_master' ? 'Мастер участка' :
                   'Аудитор'}
                </span>
                <button 
                  className="logout-button bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs h-auto rounded"
                  onClick={logout}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}