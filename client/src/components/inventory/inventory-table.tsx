import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product, Category, Supplier } from "@shared/schema";

export function InventoryTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const res = await apiRequest("POST", "/api/transactions", {
        productId: id,
        quantity,
        transactionType: "count",
        notes: "Manual stock update",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Stock updated",
        description: "Inventory has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId || !categories) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown";
  };

  const getSupplierName = (supplierId?: number) => {
    if (!supplierId || !suppliers) return "No supplier";
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier ? supplier.name : "Unknown";
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= 0) {
      return { label: "Out of Stock", variant: "destructive" };
    } else if (product.currentStock <= product.minStockLevel) {
      return { label: "Critical", variant: "destructive" };
    } else if (product.currentStock <= product.reorderPoint) {
      return { label: "Low", variant: "warning" };
    } else {
      return { label: "In Stock", variant: "success" };
    }
  };

  const filteredProducts = products?.filter((product) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchTermLower) ||
      product.barcode?.toLowerCase().includes(searchTermLower) ||
      product.sku?.toLowerCase().includes(searchTermLower) ||
      getCategoryName(product.categoryId).toLowerCase().includes(searchTermLower) ||
      getSupplierName(product.supplierId).toLowerCase().includes(searchTermLower)
    );
  });

  if (productsLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input
          type="text"
          placeholder="Search products by name, barcode, SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-light">
                <TableHead className="text-left font-medium text-neutral-dark">Product</TableHead>
                <TableHead className="text-left font-medium text-neutral-dark">SKU / Barcode</TableHead>
                <TableHead className="text-left font-medium text-neutral-dark">Category</TableHead>
                <TableHead className="text-left font-medium text-neutral-dark">Supplier</TableHead>
                <TableHead className="text-left font-medium text-neutral-dark">Current Stock</TableHead>
                <TableHead className="text-left font-medium text-neutral-dark">Status</TableHead>
                <TableHead className="text-left font-medium text-neutral-dark">Price</TableHead>
                <TableHead className="text-left font-medium text-neutral-dark">Location</TableHead>
                <TableHead className="text-right font-medium text-neutral-dark">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product) => {
                const stockStatus = getStockStatus(product);
                
                return (
                  <TableRow key={product.id} className="border-b hover:bg-neutral-light transition-colors duration-150">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <div>SKU: {product.sku || 'N/A'}</div>
                      <div className="text-xs opacity-70">Barcode: {product.barcode || 'N/A'}</div>
                    </TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{getSupplierName(product.supplierId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{product.currentStock} {product.unit}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => {
                            const newQuantity = window.prompt("Enter new stock quantity:", product.currentStock.toString());
                            if (newQuantity !== null) {
                              const quantity = parseFloat(newQuantity);
                              if (!isNaN(quantity)) {
                                updateStockMutation.mutate({ id: product.id, quantity });
                              }
                            }
                          }}
                        >
                          <span className="material-icons text-sm">edit</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant as any}>{stockStatus.label}</Badge>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.location || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <span className="material-icons">visibility</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-dark">
                        <span className="material-icons">more_vert</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default InventoryTable;
