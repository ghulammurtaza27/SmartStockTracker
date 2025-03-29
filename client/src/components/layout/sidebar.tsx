import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

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

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="bg-primary text-white w-64 flex-shrink-0 hidden md:flex flex-col h-screen">
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
      <nav className="py-2 flex-1">
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
      
      <div className="p-4 border-t border-primary-light">
        <div className="flex items-center cursor-pointer">
          <span className="material-icons mr-3">help_outline</span>
          <span>Help & Support</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
