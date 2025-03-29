import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { PurchaseOrder } from "@shared/schema";

type PurchaseOrdersTableProps = {
  limit?: number;
};

export function PurchaseOrdersTable({ limit }: PurchaseOrdersTableProps) {
  const { data: orders, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const displayOrders = limit && orders ? orders.slice(0, limit) : orders;

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
      default:
        return "bg-neutral-medium text-neutral-dark";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow flex-1 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow flex-1">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-medium">Recent Purchase Orders</h2>
        <Link href="/purchase-orders">
          <Button variant="link" className="text-primary text-sm flex items-center">
            <span>View All</span>
            <span className="material-icons text-sm ml-1">chevron_right</span>
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-light">
              <TableHead className="text-left p-4 text-sm font-medium text-neutral-dark">Order #</TableHead>
              <TableHead className="text-left p-4 text-sm font-medium text-neutral-dark">Supplier</TableHead>
              <TableHead className="text-left p-4 text-sm font-medium text-neutral-dark">Items</TableHead>
              <TableHead className="text-left p-4 text-sm font-medium text-neutral-dark">Value</TableHead>
              <TableHead className="text-left p-4 text-sm font-medium text-neutral-dark">Status</TableHead>
              <TableHead className="text-left p-4 text-sm font-medium text-neutral-dark">Created Date</TableHead>
              <TableHead className="text-right p-4 text-sm font-medium text-neutral-dark">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayOrders?.map((order) => (
              <TableRow key={order.id} className="border-b hover:bg-neutral-light transition-colors duration-150">
                <TableCell className="p-4 text-sm">
                  <span className="text-primary">{order.orderNumber}</span>
                </TableCell>
                <TableCell className="p-4 text-sm">{order.supplierId}</TableCell>
                <TableCell className="p-4 text-sm">-</TableCell>
                <TableCell className="p-4 text-sm">${order.totalValue.toFixed(2)}</TableCell>
                <TableCell className="p-4 text-sm">
                  <Badge 
                    variant="outline"
                    className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeVariant(order.status)}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="p-4 text-sm">
                  {format(new Date(order.orderDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="p-4 text-sm text-right">
                  <Link href={`/purchase-orders/${order.id}`}>
                    <Button variant="ghost" size="icon" className="text-primary hover:text-primary-dark">
                      <span className="material-icons">visibility</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="text-neutral-dark hover:text-neutral-dark">
                    <span className="material-icons">more_vert</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default PurchaseOrdersTable;
