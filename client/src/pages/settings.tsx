import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";

type SettingsPageProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function SettingsPage({ user, onLogout }: SettingsPageProps) {
  const { toast } = useToast();
  
  // State for demo settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoReplenishment, setAutoReplenishment] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(20);
  const [criticalStockThreshold, setCriticalStockThreshold] = useState(10);
  const [defaultLeadTime, setDefaultLeadTime] = useState(3);
  
  // Handle save settings (simulated)
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully",
    });
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header 
          title="Settings" 
          subtitle="Configure your application preferences"
          user={user}
          onLogout={onLogout}
        />
        
        <div className="p-4 md:p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Manage general application settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications" className="text-base">Notifications</Label>
                      <p className="text-sm text-gray-500">Receive alerts for inventory events</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-replenishment" className="text-base">Auto Replenishment</Label>
                      <p className="text-sm text-gray-500">Automatically create purchase orders for low stock</p>
                    </div>
                    <Switch
                      id="auto-replenishment"
                      checked={autoReplenishment}
                      onCheckedChange={setAutoReplenishment}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      placeholder="Enter your company name"
                      defaultValue="GroceryMart"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="store-location">Store Location</Label>
                    <Input
                      id="store-location"
                      placeholder="Enter store location"
                      defaultValue="123 Main St, Anytown, USA"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Inventory Settings */}
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Settings</CardTitle>
                  <CardDescription>
                    Configure inventory thresholds and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="low-stock">Low Stock Threshold (%)</Label>
                    <Input
                      id="low-stock"
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">
                      Products below this percentage of max stock will be marked as low stock
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="critical-stock">Critical Stock Threshold (%)</Label>
                    <Input
                      id="critical-stock"
                      type="number"
                      value={criticalStockThreshold}
                      onChange={(e) => setCriticalStockThreshold(parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">
                      Products below this percentage of max stock will be marked as critical
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lead-time">Default Lead Time (days)</Label>
                    <Input
                      id="lead-time"
                      type="number"
                      value={defaultLeadTime}
                      onChange={(e) => setDefaultLeadTime(parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">
                      Default supplier lead time for delivery in days
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="barcode-scanning" className="text-base">Barcode Scanning</Label>
                      <p className="text-sm text-gray-500">Enable barcode scanning for inventory updates</p>
                    </div>
                    <Switch id="barcode-scanning" defaultChecked />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Integration Settings */}
            <TabsContent value="integrations">
              <Card>
                <CardHeader>
                  <CardTitle>ERP Integrations</CardTitle>
                  <CardDescription>
                    Configure connections with external systems
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">SAP Integration</h3>
                        <p className="text-sm text-gray-500">Connect with SAP for enterprise data</p>
                      </div>
                      <Switch id="sap-integration" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">Oracle Integration</h3>
                        <p className="text-sm text-gray-500">Connect with Oracle ERP</p>
                      </div>
                      <Switch id="oracle-integration" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">NetSuite Integration</h3>
                        <p className="text-sm text-gray-500">Connect with NetSuite ERP</p>
                      </div>
                      <Switch id="netsuite-integration" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex mt-2">
                      <Input
                        id="api-key"
                        type="password"
                        value="●●●●●●●●●●●●●●●●●●●●"
                        readOnly
                        className="flex-1 mr-2"
                      />
                      <Button variant="outline">Regenerate</Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Used for external system authentication
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Account Settings */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
                      <span className="material-icons text-white text-2xl">person</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{user?.name}</h3>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <p className="text-xs bg-primary text-white px-2 py-0.5 rounded-full inline-block mt-1">
                        {user?.role === "admin" 
                          ? "Administrator" 
                          : user?.role === "manager" 
                            ? "Store Manager" 
                            : "Stock Associate"
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Name</Label>
                    <Input
                      id="account-name"
                      defaultValue={user?.name}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account-email">Email</Label>
                    <Input
                      id="account-email"
                      type="email"
                      defaultValue={user?.email}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Change Password</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="destructive"
                    onClick={onLogout}
                  >
                    Sign Out
                  </Button>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
