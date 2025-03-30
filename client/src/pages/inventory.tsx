import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import InventoryTable from "@/components/inventory/inventory-table";
import AddInventoryForm from "@/components/inventory/add-inventory-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

import CSVUpload from '@/components/inventory/csv-upload';

type InventoryPageProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function InventoryPage({ user, onLogout }: InventoryPageProps) {
  const { toast } = useToast();
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Define types for inventory summary
  interface InventorySummary {
    totalProducts: number;
    healthyStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryValue: number;
    pendingOrdersCount: number;
    inProgressOrdersCount: number;
    automatedOrdersCount: number;
  }

  // Define Product type (add departmentId)
  interface Product {
    id: number;
    name: string;
    departmentId: number; // Added department ID
    // ... other product properties
  }

  // Get analytics summary
  const { data: inventorySummary } = useQuery<InventorySummary>({
    queryKey: ["/api/analytics/inventory-summary"],
  });

  // Setup barcode scanner
  const { startScanning, stopScanning, isScanning } = useBarcodeScanner({
    onScan: (barcode) => {
      toast({
        title: "Product scanned",
        description: `Barcode: ${barcode}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Scanning error",
        description: error,
        variant: "destructive",
      });
    },
  });

  const renderCSVUpload = () => {
    return <CSVUpload />;
  };

  // Fetch products with role-based filtering
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", user.role, user.departmentId],
    queryFn: () => fetch(`/api/products`).then(res => res.json()),
    select: (data) => {
      if (user.role === 'admin') {
        return data;
      } else if (user.role === 'departmentHead') {
        return data.filter(p => p.departmentId === user.departmentId);
      } else { // Assuming 'departmentAssociate' or other roles
        // More complex filtering logic might be needed here based on specific permissions.  
        //  This requires a more detailed specification of associate permissions.
        return data.filter(p => p.departmentId === user.departmentId);
      }
    },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <MobileSidebar user={user} />

      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header 
          title="Inventory" 
          subtitle="Manage your product inventory"
          showAddButton
          addButtonLabel="Add Product"
          onAddClick={() => setAddProductOpen(true)}
          user={user}
          onLogout={onLogout}
        />

        {/* Quick Actions Bar */}
        <div className="bg-white border-b px-4 md:px-6 py-2 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value="low">Low Stock</TabsTrigger>
              <TabsTrigger value="critical">Critical Stock</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={isScanning ? stopScanning : startScanning}
            variant={isScanning ? "destructive" : "outline"}
            size="sm"
            className="ml-2"
          >
            <span className="material-icons mr-1 text-sm">
              {isScanning ? "stop" : "qr_code_scanner"}
            </span>
            <span className="hidden md:inline">
              {isScanning ? "Stop Scanning" : "Scan Barcode"}
            </span>
          </Button>
        </div>

        <div className="p-6">
          {renderCSVUpload()}
          <div className="flex justify-between items-center mb-6">
          </div>
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <h3 className="text-2xl font-bold">{inventorySummary?.totalProducts || 0}</h3>
                </div>
                <span className="material-icons text-primary bg-primary bg-opacity-10 p-2 rounded-full">inventory</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">In Stock</p>
                  <h3 className="text-2xl font-bold">{inventorySummary?.healthyStockCount || 0}</h3>
                </div>
                <span className="material-icons text-[#4CAF50] bg-[#4CAF50] bg-opacity-10 p-2 rounded-full">check_circle</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Low Stock</p>
                  <h3 className="text-2xl font-bold">{inventorySummary?.lowStockCount || 0}</h3>
                </div>
                <span className="material-icons text-[#FB8C00] bg-[#FB8C00] bg-opacity-10 p-2 rounded-full">warning</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Out of Stock</p>
                  <h3 className="text-2xl font-bold">{inventorySummary?.outOfStockCount || 0}</h3>
                </div>
                <span className="material-icons text-[#F44336] bg-[#F44336] bg-opacity-10 p-2 rounded-full">error</span>
              </div>
            </Card>
          </div>

          {/* Inventory Table */}
          <InventoryTable products={products} isLoading={isLoading} /> {/* Pass products to InventoryTable */}
        </div>
      </div>

      {/* Add Product Modal */}
      {addProductOpen && (
        <AddInventoryForm 
          open={addProductOpen} 
          onClose={() => setAddProductOpen(false)} 
        />
      )}
    </div>
  );
}