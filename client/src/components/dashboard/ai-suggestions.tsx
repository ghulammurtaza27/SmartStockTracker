import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function AISuggestions() {
  const { toast } = useToast();
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });
  
  const [creatingOrder, setCreatingOrder] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async (productId: number) => {
      // This would typically create an order for a specific product,
      // but we're simplifying by just using the auto-replenish endpoint
      const res = await apiRequest("POST", "/api/auto-replenish", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      toast({
        title: "Order created",
        description: "Purchase order has been created successfully",
      });
      setCreatingOrder(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create order",
        description: error.message,
        variant: "destructive",
      });
      setCreatingOrder(false);
    },
  });

  const handleCreateOrder = (productId: number) => {
    setCreatingOrder(true);
    createOrderMutation.mutate(productId);
  };

  return (
    <Card>
      <CardHeader className="p-4 border-b flex justify-between items-center">
        <CardTitle className="text-base font-medium">AI-Suggested Replenishment</CardTitle>
        <span className="text-xs bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full">New</span>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-neutral-light rounded"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-neutral-light rounded"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-4">
            {products.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-neutral-light rounded flex items-center justify-center mr-3">
                    <span className="material-icons text-primary">shopping_basket</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-neutral-dark opacity-60">
                      Current stock: {product.currentStock} {product.unit} 
                      {product.currentStock === 0 ? ' (Out of Stock)' :
                       product.currentStock <= product.minStockLevel ? ' (Critical)' : ' (Low)'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="link" 
                  className="text-primary text-sm hover:underline"
                  onClick={() => handleCreateOrder(product.id)}
                  disabled={creatingOrder || createOrderMutation.isPending}
                >
                  {creatingOrder || createOrderMutation.isPending ? 'Ordering...' : 'Order'}
                </Button>
              </div>
            ))}
            <Link href="/inventory">
              <Button variant="link" className="w-full mt-4 text-center text-primary text-sm hover:underline flex items-center justify-center">
                <span>View all suggestions</span>
                <span className="material-icons text-sm ml-1">chevron_right</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-dark opacity-60">No low stock items detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AISuggestions;
