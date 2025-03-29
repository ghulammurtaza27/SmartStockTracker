import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";

type NavItem = {
  name: string;
  path: string;
  icon: string;
  roles?: string[];
};

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/", icon: "dashboard" },
  { name: "Inventory", path: "/inventory", icon: "inventory" },
  { name: "Forecasting", path: "/forecasting", icon: "trending_up" },
  { name: "Purchase Orders", path: "/purchase-orders", icon: "shopping_cart" },
  { name: "User Management", path: "/user-management", icon: "people", roles: ["admin"] },
  { name: "Settings", path: "/settings", icon: "settings" }
];

type MobileSidebarProps = {
  user?: User;
};

export function MobileSidebar({ user }: MobileSidebarProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      {/* Mobile navigation bar */}
      <div className="md:hidden bg-primary text-white w-full h-16 fixed top-0 left-0 z-10 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button 
            className="material-icons mr-3"
            onClick={() => setIsOpen(true)}
          >
            menu
          </button>
          <h1 className="text-xl font-medium">GroceryStock</h1>
        </div>
        <button className="material-icons">notifications</button>
      </div>
      
      {/* Mobile sidebar overlay */}
      <div 
        className={cn(
          "md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      >
        {/* Mobile sidebar content */}
        <div 
          className={cn(
            "bg-primary text-white w-64 h-full transform transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 flex items-center border-b border-primary-light">
            <span className="material-icons mr-3">inventory_2</span>
            <h1 className="text-xl font-medium">GroceryStock</h1>
          </div>
          
          {/* User Profile */}
          <div className="p-4 border-b border-primary-light flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
              <span className="material-icons text-white">person</span>
            </div>
            <div className="ml-3">
              <p className="font-medium text-sm">{user?.name || 'User'}</p>
              <p className="text-xs opacity-70">
                {user?.role === 'admin' ? 'Administrator' : 
                 user?.role === 'manager' ? 'Store Manager' : 'Stock Associate'}
              </p>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="py-2">
            <ul>
              {navItems.map((item) => {
                // Filter items by role
                if (item.roles && !item.roles.includes(user?.role || '')) {
                  return null;
                }
                
                return (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <a 
                        className={cn(
                          "px-4 py-2 hover:bg-primary-light cursor-pointer transition-colors duration-150 ease-in-out flex items-center",
                          location === item.path && "bg-primary-light"
                        )}
                      >
                        <span className="material-icons mr-3">{item.icon}</span>
                        <span>{item.name}</span>
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="absolute bottom-0 w-64 p-4 border-t border-primary-light">
            <div className="flex items-center cursor-pointer">
              <span className="material-icons mr-3">help_outline</span>
              <span>Help & Support</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileSidebar;
