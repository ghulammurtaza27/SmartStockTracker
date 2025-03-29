import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { User } from "@shared/schema";
import { apiRequest } from "./lib/queryClient";

import Dashboard from "./pages/dashboard";
import Inventory from "./pages/inventory";
import PurchaseOrders from "./pages/purchase-orders";
import PurchaseOrderDetails from "./pages/purchase-order-details";
import ProductDetails from "./pages/product-details";
import EditProduct from "./pages/edit-product";
import Forecasting from "./pages/forecasting";
import UserManagement from "./pages/user-management";
import Settings from "./pages/settings";
import LoginPage from "./pages/login";
import NotFound from "./pages/not-found";

// Parent component to handle authentication across the app
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  
  // Fetch the current user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
  }, []);
  
  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/login", { username, password });
      const userData = await res.json();
      setUser(userData);
      navigate("/");
      return true;
    } catch (error) {
      return false;
    }
  };
  
  const handleRegister = async (data: any) => {
    try {
      const res = await apiRequest("POST", "/api/register", data);
      const userData = await res.json();
      setUser(userData);
      navigate("/");
      return true;
    } catch (error) {
      return false;
    }
  };
  
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  
  // Check if user is authorized for a specific role
  const isAuthorized = (requiredRole?: string) => {
    if (!user) return false;
    if (!requiredRole) return true;
    return user.role === requiredRole;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <>
      <Switch>
        <Route path="/login">
          {user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/">
          {user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/inventory">
          {user ? (
            <Inventory user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/purchase-orders">
          {user ? (
            <PurchaseOrders user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/purchase-orders/:id">
          {user ? (
            <PurchaseOrderDetails user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/products/:id">
          {user ? (
            <ProductDetails user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/products/:id/edit">
          {user ? (
            <EditProduct user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/forecasting">
          {user ? (
            <Forecasting user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/user-management">
          {user && isAuthorized("admin") ? (
            <UserManagement user={user} onLogout={handleLogout} />
          ) : user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route path="/settings">
          {user ? (
            <Settings user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
          )}
        </Route>
        
        <Route>
          <NotFound />
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
