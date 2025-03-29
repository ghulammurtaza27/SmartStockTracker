import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PurchaseOrderList from "@/components/purchase-orders/purchase-order-list";
import CreateOrderForm from "@/components/purchase-orders/create-order-form";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

type PurchaseOrdersPageProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function PurchaseOrdersPage({ user, onLogout }: PurchaseOrdersPageProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  // Auto replenishment mutation
  const autoReplenishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auto-replenish", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Auto-replenishment complete",
        description: `Created ${data.orders.length} purchase orders for ${data.orders.length} products.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Auto-replenishment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle auto replenishment
  const handleAutoReplenish = () => {
    autoReplenishMutation.mutate();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <MobileSidebar user={user} />
      
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header 
          title="Purchase Orders" 
          subtitle="Manage and track your inventory replenishment"
          showAddButton
          addButtonLabel="New Order"
          onAddClick={() => setCreateOrderOpen(true)}
          user={user}
          onLogout={onLogout}
        />
        
        {/* Tab Navigation */}
        <div className="bg-white border-b px-4 md:px-6 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                All Orders
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="in_progress" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Completed
              </TabsTrigger>
              <TabsTrigger 
                value="draft" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Draft
              </TabsTrigger>
            </TabsList>
          
            <Button
              onClick={handleAutoReplenish}
              variant="outline"
              size="sm"
              className="ml-2 absolute right-4 top-2"
              disabled={autoReplenishMutation.isPending}
            >
              <span className="material-icons mr-1 text-sm">
                auto_awesome
              </span>
              <span className="hidden md:inline">
                {autoReplenishMutation.isPending ? "Creating..." : "Auto-Generate"}
              </span>
            </Button>
            
            <div className="p-4 md:p-6">
              <TabsContent value="all" className="mt-0">
                <PurchaseOrderList status={undefined} />
              </TabsContent>
              <TabsContent value="pending" className="mt-0">
                <PurchaseOrderList status="pending" />
              </TabsContent>
              <TabsContent value="in_progress" className="mt-0">
                <PurchaseOrderList status="in_progress" />
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                <PurchaseOrderList status="completed" />
              </TabsContent>
              <TabsContent value="draft" className="mt-0">
                <PurchaseOrderList status="draft" />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Create Order Modal */}
      {createOrderOpen && (
        <CreateOrderForm 
          open={createOrderOpen} 
          onClose={() => setCreateOrderOpen(false)} 
        />
      )}
    </div>
  );
}
