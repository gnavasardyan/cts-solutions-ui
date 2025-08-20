import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

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
import Catalog from "@/pages/catalog.tsx";
import Cart from "@/pages/cart";
import Orders from "@/pages/orders";
import Factories from "@/pages/Factories";
import FactoryOrders from "@/pages/FactoryOrders";
import ProductionDashboard from "@/pages/ProductionDashboard";

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
        <div className="h-screen overflow-hidden">
          {/* Desktop: side-by-side layout, Mobile: sidebar overlay */}
          <div className="lg:grid lg:grid-cols-[256px_1fr] h-full">
            {/* Sidebar for all authenticated users */}
            <Sidebar />
            <main className="overflow-auto w-full lg:ml-0">
              <div className="p-4 sm:p-6 w-full mobile-padding lg:p-6">
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
                  <Route path="/factories" component={Factories} />
                  <Route path="/factory-orders" component={FactoryOrders} />
                  <Route path="/production" component={ProductionDashboard} />
                  {/* <Route component={NotFound} /> */}
                </Switch>
              </div>
            </main>
          </div>
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
