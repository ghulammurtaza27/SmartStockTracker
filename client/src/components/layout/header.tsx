import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { User } from '@shared/schema';
import { LogOut, User as UserIcon } from 'lucide-react';

type HeaderProps = {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  user?: User;
  onLogout?: () => void;
};

export function Header({
  title,
  subtitle,
  showSearch = true,
  showAddButton = false,
  addButtonLabel = 'Add New',
  onAddClick,
  user,
  onLogout
}: HeaderProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  let pageTitle = title;
  if (!pageTitle) {
    // Derive title from location if not provided
    switch(location) {
      case '/':
        pageTitle = 'Dashboard';
        break;
      case '/inventory':
        pageTitle = 'Inventory';
        break;
      case '/purchase-orders':
        pageTitle = 'Purchase Orders';
        break;
      case '/forecasting':
        pageTitle = 'Forecasting';
        break;
      case '/user-management':
        pageTitle = 'User Management';
        break;
      case '/settings':
        pageTitle = 'Settings';
        break;
      default:
        pageTitle = 'GroceryStock';
    }
  }

  return (
    <header className="bg-white border-b p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-medium text-neutral-dark">{pageTitle}</h1>
        {subtitle && (
          <p className="text-neutral-dark opacity-60">{subtitle}</p>
        )}
      </div>
      <div className="flex mt-4 md:mt-0 space-x-3 w-full md:w-auto">
        {showSearch && (
          <div className="relative flex-1 md:flex-none">
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-64"
            />
            <span className="material-icons absolute left-3 top-2 text-neutral-dark opacity-60">search</span>
          </div>
        )}
        {showAddButton && (
          <Button 
            className="flex items-center"
            onClick={onAddClick}
          >
            <span className="material-icons mr-1">add</span>
            <span>{addButtonLabel}</span>
          </Button>
        )}
        <Button 
          variant="outline" 
          size="icon"
          className="border border-neutral-medium bg-white hover:bg-neutral-light text-neutral-dark hidden md:flex"
        >
          <span className="material-icons">tune</span>
        </Button>
        
        {/* User Menu and Logout */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-gray-500">{user.role}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-neutral-dark hover:bg-neutral-light"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
