import { ReactNode } from "react";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings,
  Users,
  LogOut 
} from "lucide-react";
import { useLocation, Link } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => Promise<void>;
}

export default function AppLayout({ children, user, onLogout }: AppLayoutProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/",
      active: location === "/"
    },
    {
      name: "Inventory",
      icon: <Package className="h-5 w-5" />,
      href: "/inventory",
      active: location === "/inventory"
    },
    {
      name: "Purchase Orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      href: "/purchase-orders",
      active: location.startsWith("/purchase-orders")
    },
    {
      name: "Forecasting",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/forecasting",
      active: location === "/forecasting"
    }
  ];

  const settingsItems = [
    {
      name: "User Management",
      icon: <Users className="h-5 w-5" />,
      href: "/user-management",
      active: location === "/user-management",
      role: "admin"
    },
    {
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
      active: location === "/settings"
    }
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Inventory Manager
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigationItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
            >
              <a 
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                  item.active 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </a>
            </Link>
          ))}
        </nav>

        {/* Settings Links */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          {settingsItems
            .filter(item => !item.role || user.role === item.role)
            .map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
              >
                <a 
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                    item.active 
                      ? "bg-primary/10 text-primary" 
                      : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </a>
              </Link>
            ))}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <Avatar>
              <AvatarFallback>{user.name ? user.name.charAt(0) : user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.name || user.username}</p>
              <p className="text-xs text-muted-foreground">{user.role || "User"}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto" 
              onClick={onLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}