import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import StatsCard from "@/components/dashboard/stats-card";
import NotificationBanner from "@/components/dashboard/notification-banner";
import PurchaseOrdersTable from "@/components/dashboard/purchase-orders-table";
import AISuggestions from "@/components/dashboard/ai-suggestions";
import ReplenishmentStats from "@/components/dashboard/replenishment-stats";
import BarcodeScanner from "@/components/dashboard/barcode-scanner";
import { Product, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type DashboardProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [inventorySummary, setInventorySummary] = useState<any>(null);

  // Fetch inventory summary data
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/analytics/inventory-summary"],
  });
  
  // Update inventory summary when data changes
  useEffect(() => {
    if (summaryData) {
      setInventorySummary(summaryData);
    }
  }, [summaryData]);

  // Check for low stock products
  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });

  // Check to automatically show/hide the replenishment notification
  const [showNotification, setShowNotification] = useState(false);
  useEffect(() => {
    if (lowStockProducts && lowStockProducts.length > 0) {
      setShowNotification(true);
    }
  }, [lowStockProducts]);

  // Handle auto-replenishment action
  const handleReplenish = async () => {
    try {
      await apiRequest("POST", "/api/auto-replenish", {});
      setShowNotification(false);
    } catch (error) {
      console.error("Failed to auto-replenish:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <MobileSidebar user={user} />
      
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header 
          title="Dashboard" 
          subtitle="Overview of your inventory and operations"
          user={user}
          onLogout={onLogout}
        />
        
        <div className="p-4 md:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Auto-Generated Orders"
              value={inventorySummary?.automatedOrdersCount || 0}
              icon="shopping_cart"
              iconColor="primary"
              trend={{ value: 12, direction: "up" }}
              subtitle="This week"
            />
            
            <StatsCard
              title="Pending Approval"
              value={inventorySummary?.pendingOrdersCount || 0}
              icon="pending_actions"
              iconColor="warning"
              trend={{ value: 3, direction: "down" }}
              subtitle="This week"
            />
            
            <StatsCard
              title="Items Below Threshold"
              value={lowStockProducts?.length || 0}
              icon="warning"
              iconColor="error"
              trend={(lowStockProducts && Array.isArray(lowStockProducts) && lowStockProducts.length > 0) ? { value: 18, direction: "up" } : undefined}
              subtitle="Requiring attention"
            />
            
            <StatsCard
              title="Orders This Month"
              value={inventorySummary?.pendingOrdersCount + inventorySummary?.inProgressOrdersCount || 0}
              icon="calendar_today"
              iconColor="secondary"
              trend={{ value: 7, direction: "up" }}
              subtitle="vs. last month"
            />
          </div>
          
          {/* Notification Banner */}
          {showNotification && lowStockProducts && Array.isArray(lowStockProducts) && lowStockProducts.length > 0 && (
            <NotificationBanner
              title="Automated Replenishment Alert"
              message={`The system has detected ${lowStockProducts.length} items that need immediate reordering based on AI forecasting.`}
              type="warning"
              primaryAction={{
                label: "Review Now",
                onClick: handleReplenish,
              }}
              dismissable={true}
            />
          )}
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Purchase Orders Table */}
            <PurchaseOrdersTable limit={5} />
            
            {/* Sidebar Widgets */}
            <div className="w-full lg:w-80 space-y-6">
              <AISuggestions />
              <ReplenishmentStats />
              <BarcodeScanner />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
