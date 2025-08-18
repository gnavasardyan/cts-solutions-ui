import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Sidebar } from "@/components/layout/Sidebar";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Marking from "@/pages/marking";
import Scanning from "@/pages/scanning";
import Tracking from "@/pages/tracking";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Catalog from "@/pages/catalog";
import Cart from "@/pages/cart";
import Orders from "@/pages/orders";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface relative">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Загрузка...</div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'administrator';

  return (
    <div className="min-h-screen bg-surface relative">
      {!isAuthenticated ? (
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/" component={Login} />
          {/* <Route component={NotFound} /> */}
        </Switch>
      ) : (
        <div className="flex h-screen">
          {/* Sidebar for admin, top navigation for others */}
          {isAdmin ? (
            <>
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <div className="p-6">
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/marking" component={Marking} />
                    <Route path="/scanning" component={Scanning} />
                    <Route path="/tracking" component={Tracking} />
                    <Route path="/reports" component={Reports} />
                    <Route path="/settings" component={Settings} />
                    <Route path="/catalog" component={Catalog} />
                    <Route path="/cart" component={Cart} />
                    <Route path="/orders" component={Orders} />
                    {/* <Route component={NotFound} /> */}
                  </Switch>
                </div>
              </main>
            </>
          ) : (
            <>
              <TopNavigation />
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/marking" component={Marking} />
                <Route path="/scanning" component={Scanning} />
                <Route path="/tracking" component={Tracking} />
                <Route path="/reports" component={Reports} />
                <Route path="/settings" component={Settings} />
                <Route path="/catalog" component={Catalog} />
                <Route path="/cart" component={Cart} />
                <Route path="/orders" component={Orders} />
                {/* <Route component={NotFound} /> */}
              </Switch>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
