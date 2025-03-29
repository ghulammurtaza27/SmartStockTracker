import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PurchaseOrder, Supplier } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

type PurchaseOrderListProps = {
  status?: string;
};

export default function PurchaseOrderList({ status }: PurchaseOrderListProps) {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  
  // Fetch purchase orders
  const { data: orders, isLoading: ordersLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders", status],
    queryFn: async ({ queryKey }) => {
      const statusParam = queryKey[1] ? `?status=${queryKey[1]}` : "";
      const res = await fetch(`/api/purchase-orders${statusParam}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });
  
  // Fetch suppliers for reference
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/purchase-orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Status updated",
        description: `Order status has been updated to ${newStatus}`,
      });
      setStatusDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Status badge styling
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#4CAF50] bg-opacity-10 text-[#4CAF50]";
      case "in_progress":
        return "bg-primary bg-opacity-10 text-primary";
      case "pending":
        return "bg-[#FB8C00] bg-opacity-10 text-[#FB8C00]";
      case "draft":
        return "bg-neutral-medium text-neutral-dark";
      case "cancelled":
        return "bg-[#F44336] bg-opacity-10 text-[#F44336]";
      default:
        return "bg-neutral-medium text-neutral-dark";
    }
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Get supplier name by ID
  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers?.find(s => s.id === supplierId);
    return supplier ? supplier.name : `Supplier #${supplierId}`;
  };
  
  // Handle status change
  const handleStatusChange = (order: PurchaseOrder, status: string) => {
    setSelectedOrder(order);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };
  
  // Confirm status change
  const confirmStatusChange = () => {
    if (selectedOrder && newStatus) {
      updateOrderStatusMutation.mutate({
        id: selectedOrder.id,
        status: newStatus,
      });
    }
  };
  
  // Status options based on current status
  const getStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case "draft":
        return ["pending", "cancelled"];
      case "pending":
        return ["in_progress", "cancelled"];
      case "in_progress":
        return ["completed", "cancelled"];
      case "completed":
        return [];
      case "cancelled":
        return ["draft"];
      default:
        return [];
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            {status 
              ? `${formatStatus(status)} Purchase Orders` 
              : "All Purchase Orders"
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-primary">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>{getSupplierName(order.supplierId)}</TableCell>
                      <TableCell>{format(new Date(order.orderDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        {order.expectedDeliveryDate 
                          ? format(new Date(order.expectedDeliveryDate), "MMM dd, yyyy")
                          : "Not specified"
                        }
                      </TableCell>
                      <TableCell>${order.totalValue.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeVariant(order.status)}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.isAutomated ? (
                          <Badge variant="outline" className="bg-primary-light bg-opacity-10">
                            <span className="material-icons text-xs mr-1">auto_awesome</span>
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline">Manual</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" className="h-8 w-8">
                            <span className="material-icons text-primary">visibility</span>
                          </Button>
                          
                          {getStatusOptions(order.status).length > 0 && (
                            <div className="relative">
                              <Button variant="ghost" size="sm" className="h-8">
                                <span className="material-icons">more_vert</span>
                              </Button>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                                <div className="py-1">
                                  {getStatusOptions(order.status).map((statusOption) => (
                                    <button
                                      key={statusOption}
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                      onClick={() => handleStatusChange(order, statusOption)}
                                    >
                                      Mark as {formatStatus(statusOption)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="material-icons text-4xl mb-2">shopping_cart</span>
              <p>No purchase orders found</p>
              {status && (
                <p className="text-sm mt-1">
                  There are no orders with {formatStatus(status)} status
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of order{" "}
              <span className="font-medium">{selectedOrder?.orderNumber}</span> from{" "}
              <span className="font-medium">{selectedOrder && formatStatus(selectedOrder.status)}</span> to{" "}
              <span className="font-medium">{formatStatus(newStatus)}</span>?
              
              {newStatus === "completed" && (
                <p className="mt-2 text-[#4CAF50]">
                  This will update inventory levels for all items in this purchase order.
                </p>
              )}
              
              {newStatus === "cancelled" && (
                <p className="mt-2 text-[#F44336]">
                  This action cannot be undone directly.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              disabled={updateOrderStatusMutation.isPending}
            >
              {updateOrderStatusMutation.isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
