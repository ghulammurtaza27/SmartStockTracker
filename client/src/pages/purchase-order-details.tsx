import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, Truck, FileText, ArrowLeft, ShoppingCart, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { User, PurchaseOrder, PurchaseOrderItem, Supplier, Product } from "@shared/schema";

import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type OrderStatus = "draft" | "pending" | "approved" | "in_progress" | "completed" | "cancelled";

// Status badge color mapping
const statusColors: Record<OrderStatus, string> = {
  draft: "bg-gray-200 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

type PurchaseOrderDetailsProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function PurchaseOrderDetails({ user, onLogout }: PurchaseOrderDetailsProps) {
  const [, params] = useRoute<{ id: string }>("/purchase-orders/:id");
  const { toast } = useToast();
  const orderId = params?.id;
  
  // Fetch purchase order details
  const { data: order, isLoading: isOrderLoading, error: orderError } = useQuery<PurchaseOrder>({
    queryKey: ["/api/purchase-orders", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/purchase-orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      return res.json();
    },
    enabled: !!orderId,
  });
  
  // Fetch order items
  const { data: orderItems, isLoading: isItemsLoading } = useQuery<PurchaseOrderItem[]>({
    queryKey: ["/api/purchase-orders", orderId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/purchase-orders/${orderId}/items`);
      if (!res.ok) throw new Error("Failed to fetch order items");
      return res.json();
    },
    enabled: !!orderId,
  });
  
  // Fetch supplier details
  const { data: supplier, isLoading: isSupplierLoading } = useQuery<Supplier>({
    queryKey: ["/api/suppliers", order?.supplierId],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${order?.supplierId}`);
      if (!res.ok) throw new Error("Failed to fetch supplier details");
      return res.json();
    },
    enabled: !!order?.supplierId,
  });
  
  // Function to handle status update
  const updateOrderStatus = async (newStatus: OrderStatus) => {
    try {
      const res = await apiRequest("PATCH", `/api/purchase-orders/${orderId}`, { 
        status: newStatus 
      });
      
      if (res.ok) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders", orderId] });
        queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
        toast({
          title: "Order updated",
          description: `Order status changed to ${newStatus}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Update failed",
          description: "Could not update order status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "An error occurred while updating the order",
        variant: "destructive",
      });
    }
  };
  
  // Helper function to capitalize status display
  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Show loading state
  if (isOrderLoading || isItemsLoading || isSupplierLoading) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }
  
  // Show error state
  if (orderError || !order) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <div className="p-6">
          <Button variant="outline" asChild>
            <a href="/purchase-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </a>
          </Button>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Order Not Found</CardTitle>
              <CardDescription>
                The purchase order could not be found or you don't have permission to view it.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <a href="/purchase-orders">View All Orders</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" asChild>
            <a href="/purchase-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </a>
          </Button>
          <div className="flex space-x-3">
            {order.status !== "completed" && order.status !== "cancelled" && (
              <>
                {order.status === "draft" && (
                  <Button onClick={() => updateOrderStatus("pending")}>
                    Submit Order
                  </Button>
                )}
                {order.status === "pending" && (
                  <Button onClick={() => updateOrderStatus("approved")}>
                    Approve Order
                  </Button>
                )}
                {order.status === "approved" && (
                  <Button onClick={() => updateOrderStatus("in_progress")}>
                    Mark as In Progress
                  </Button>
                )}
                {order.status === "in_progress" && (
                  <Button onClick={() => updateOrderStatus("completed")}>
                    Mark as Completed
                  </Button>
                )}
                <Button variant="destructive" onClick={() => updateOrderStatus("cancelled")}>
                  Cancel Order
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <Card className="col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Purchase Order: {order.orderNumber}</CardTitle>
                  <CardDescription>Created on {order.orderDate ? format(new Date(order.orderDate), 'PPP') : 'Unknown date'}</CardDescription>
                </div>
                <Badge className={statusColors[(order.status || 'pending') as OrderStatus]}>
                  {formatStatus(order.status || 'pending')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Expected Delivery Date</h3>
                  <p className="flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    {order.expectedDeliveryDate 
                      ? format(new Date(order.expectedDeliveryDate), 'PPP') 
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Total Value</h3>
                  <p className="font-medium">${(order.totalValue || 0).toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Order Type</h3>
                  <p>{order.isAutomated ? 'Automated' : 'Manual'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Notes</h3>
                  <p>{order.notes || 'No notes'}</p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="font-medium mb-4">Order Items</h3>
                {orderItems && orderItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            Product #{item.productId}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption className="text-right font-medium">
                      Total: ${(order.totalValue || 0).toFixed(2)}
                    </TableCaption>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No items in this order</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent>
              {supplier ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Supplier Name</h3>
                    <p>{supplier.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Contact Person</h3>
                    <p>{supplier.contactName || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Contact Information</h3>
                    <p>Email: {supplier.contactEmail || 'Not specified'}</p>
                    <p>Phone: {supplier.contactPhone || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Shipping Address</h3>
                    <p>{supplier.address || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Lead Time</h3>
                    <p>{supplier.leadTime ? `${supplier.leadTime} days` : 'Not specified'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Supplier information not available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}