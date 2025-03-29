import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { User, Product, Category, Supplier, Transaction } from "@shared/schema";

type ProductDetailsProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function ProductDetails({ user, onLogout }: ProductDetailsProps) {
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ id: string }>("/products/:id");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const productId = params?.id ? parseInt(params.id) : 0;
  
  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    queryFn: async ({ queryKey }) => {
      if (!productId) throw new Error("Product ID is required");
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!productId,
  });
  
  // Fetch transactions for the product
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", productId],
    queryFn: async ({ queryKey }) => {
      if (!productId) throw new Error("Product ID is required");
      const res = await fetch(`/api/transactions?productId=${productId}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!productId,
  });
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch suppliers
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ quantity }: { quantity: number }) => {
      const res = await apiRequest("POST", "/api/transactions", {
        productId,
        quantity,
        transactionType: "count",
        notes: "Manual stock update",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", productId] });
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
  
  // Create purchase order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Product not available");
      if (!product.supplierId) throw new Error("Product has no supplier");
      
      const res = await apiRequest("POST", "/api/purchase-orders", {
        supplierId: product.supplierId,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "draft",
        notes: `Reorder for ${product.name}`,
        items: [
          {
            productId: product.id,
            quantity: product.reorderQuantity || 10,
            unitPrice: product.price,
          },
        ],
      });
      return await res.json();
    },
    onSuccess: (data) => {
      navigate(`/purchase-orders/${data.id}`);
      toast({
        title: "Purchase order created",
        description: `Purchase order ${data.orderNumber} has been created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create purchase order",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId || !categories) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown";
  };
  
  const getSupplierName = (supplierId?: number | null) => {
    if (!supplierId || !suppliers) return "No supplier";
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier ? supplier.name : "Unknown";
  };
  
  const getStockStatus = (product: Product) => {
    if (product.currentStock <= 0) {
      return { label: "Out of Stock", variant: "destructive" };
    } else if (product.currentStock <= (product.minStockLevel || 0)) {
      return { label: "Critical", variant: "destructive" };
    } else if (product.currentStock <= (product.reorderPoint || 0)) {
      return { label: "Low", variant: "warning" };
    } else {
      return { label: "In Stock", variant: "success" };
    }
  };
  
  // Handle update stock
  const handleUpdateStock = () => {
    if (!product) return;
    
    const newQuantity = window.prompt("Enter new stock quantity:", product.currentStock.toString());
    if (newQuantity === null) return;
    
    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity)) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }
    
    updateStockMutation.mutate({ quantity });
  };
  
  // Handle create order
  const handleCreateOrder = () => {
    createOrderMutation.mutate();
  };
  
  if (productLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <MobileSidebar user={user} />
        
        <div className="flex-1 overflow-auto md:pt-0 pt-16">
          <Header 
            title="Product Details" 
            subtitle="View and manage product information"
            user={user}
            onLogout={onLogout}
          />
          
          <div className="flex justify-center items-center h-[calc(100vh-80px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <MobileSidebar user={user} />
        
        <div className="flex-1 overflow-auto md:pt-0 pt-16">
          <Header 
            title="Product Details" 
            subtitle="View and manage product information"
            user={user}
            onLogout={onLogout}
          />
          
          <div className="container mx-auto p-4 md:p-6">
            <Alert variant="destructive">
              <AlertDescription>
                Product not found. The requested product may have been deleted or doesn't exist.
              </AlertDescription>
            </Alert>
            
            <Button 
              className="mt-4"
              onClick={() => navigate("/inventory")}
            >
              Back to Inventory
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Get stock status
  const stockStatus = getStockStatus(product);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <MobileSidebar user={user} />
      
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header 
          title={product.name} 
          subtitle="Product details and transaction history"
          user={user}
          onLogout={onLogout}
        />
        
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row mb-6 gap-4 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                <Badge variant={stockStatus.variant as any}>{stockStatus.label}</Badge>
              </div>
              <p className="text-gray-500 mb-4">{product.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <Button onClick={handleUpdateStock}>
                  Update Stock
                </Button>
                
                {product.currentStock <= (product.reorderPoint || 0) && (
                  <Button 
                    variant="outline" 
                    onClick={handleCreateOrder}
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>Create Purchase Order</>
                    )}
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/products/${product.id}/edit`)}
                >
                  Edit Product
                </Button>
              </div>
            </div>
            
            <Card className="md:w-80 w-full">
              <CardHeader className="pb-3">
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">SKU:</span>
                    <span className="font-medium">{product.sku || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Barcode:</span>
                    <span className="font-medium">{product.barcode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Stock:</span>
                    <span className="font-medium">{product.currentStock} {product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reorder Point:</span>
                    <span className="font-medium">{product.reorderPoint || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium">{getCategoryName(product.categoryId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier:</span>
                    <span className="font-medium">{getSupplierName(product.supplierId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium">{product.location || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p>{product.description || 'No description available.'}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="font-medium mb-2">Inventory Settings</h3>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Min Stock Level:</span>
                            <span>{product.minStockLevel || 'Not set'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Reorder Point:</span>
                            <span>{product.reorderPoint || 'Not set'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Reorder Quantity:</span>
                            <span>{product.reorderQuantity || 'Not set'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Unit of Measure:</span>
                            <span>{product.unit || 'Not set'}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Supply Chain</h3>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Supplier:</span>
                            <span>{getSupplierName(product.supplierId)}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Lead Time (days):</span>
                            <span>{'Not available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Last Ordered:</span>
                            <span>{'Not available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Last Received:</span>
                            <span>{'Not available'}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 font-medium">Date</th>
                            <th className="text-left py-3 font-medium">Type</th>
                            <th className="text-left py-3 font-medium">Quantity</th>
                            <th className="text-left py-3 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b">
                              <td className="py-3">
                                {format(new Date(transaction.transactionDate || new Date()), "MMM dd, yyyy HH:mm")}
                              </td>
                              <td className="py-3 capitalize">
                                {transaction.transactionType.replace('_', ' ')}
                              </td>
                              <td className="py-3">
                                {transaction.quantity > 0 ? (
                                  <span className="text-green-600">+{transaction.quantity}</span>
                                ) : (
                                  <span className="text-red-600">{transaction.quantity}</span>
                                )}
                                {' '}{product.unit}
                              </td>
                              <td className="py-3">{transaction.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No transaction history available for this product.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}