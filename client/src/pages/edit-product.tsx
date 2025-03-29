import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { User, Product, Category, Supplier } from "@shared/schema";

type EditProductProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function EditProduct({ user, onLogout }: EditProductProps) {
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ id: string }>("/products/:id/edit");
  const { toast } = useToast();
  
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
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch suppliers
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    barcode: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    supplierId: z.string().nullable().optional(),
    unit: z.string().nullable().optional(),
    price: z.string().min(1, "Price is required"),
    currentStock: z.string().min(1, "Current stock is required"),
    minStockLevel: z.string().nullable().optional(),
    reorderPoint: z.string().nullable().optional(),
    reorderQuantity: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      categoryId: "",
      supplierId: "",
      unit: "",
      price: "",
      currentStock: "",
      minStockLevel: "",
      reorderPoint: "",
      reorderQuantity: "",
      location: "",
    },
  });
  
  // Set form values when product is loaded
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        categoryId: product.categoryId ? product.categoryId.toString() : "",
        supplierId: product.supplierId ? product.supplierId.toString() : "",
        unit: product.unit || "",
        price: product.price.toString(),
        currentStock: product.currentStock.toString(),
        minStockLevel: product.minStockLevel ? product.minStockLevel.toString() : "",
        reorderPoint: product.reorderPoint ? product.reorderPoint.toString() : "",
        reorderQuantity: product.reorderQuantity ? product.reorderQuantity.toString() : "",
        location: product.location || "",
      });
    }
  }, [product, form]);
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!productId) throw new Error("Product ID is required");
      
      // Transform string values to appropriate types
      const transformedData = {
        ...data,
        price: parseFloat(data.price),
        currentStock: parseFloat(data.currentStock),
        minStockLevel: data.minStockLevel ? parseFloat(data.minStockLevel) : null,
        reorderPoint: data.reorderPoint ? parseFloat(data.reorderPoint) : null,
        reorderQuantity: data.reorderQuantity ? parseFloat(data.reorderQuantity) : null,
        categoryId: data.categoryId && data.categoryId !== "null" ? parseInt(data.categoryId) : null,
        supplierId: data.supplierId && data.supplierId !== "null" ? parseInt(data.supplierId) : null,
      };
      
      const res = await apiRequest("PATCH", `/api/products/${productId}`, transformedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      toast({
        title: "Product updated",
        description: "Product information has been updated successfully",
      });
      navigate(`/products/${productId}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    updateProductMutation.mutate(data);
  };
  
  if (productLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <MobileSidebar user={user} />
        
        <div className="flex-1 overflow-auto md:pt-0 pt-16">
          <Header 
            title="Edit Product" 
            subtitle="Update product information"
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
            title="Edit Product" 
            subtitle="Update product information"
            user={user}
            onLogout={onLogout}
          />
          
          <div className="container mx-auto p-4 md:p-6">
            <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-4">
              <p>Product not found. The requested product may have been deleted or doesn't exist.</p>
            </div>
            
            <Button 
              onClick={() => navigate("/inventory")}
            >
              Back to Inventory
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <MobileSidebar user={user} />
      
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header 
          title={`Edit ${product.name}`} 
          subtitle="Update product information"
          user={user}
          onLogout={onLogout}
        />
        
        <div className="container mx-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Product</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Product name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              step="0.01" 
                              min="0" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Product description" 
                              className="min-h-[100px]" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="Stock keeping unit" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode</FormLabel>
                          <FormControl>
                            <Input placeholder="UPC/EAN" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">None</SelectItem>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">None</SelectItem>
                              {suppliers?.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Inventory Settings</h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="currentStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Stock*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  step="0.01" 
                                  min="0" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit of Measure</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. kg, lb, pcs" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Storage Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Aisle 5, Shelf B" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Reordering</h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="minStockLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Stock Level</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  step="0.01" 
                                  min="0" 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="reorderPoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reorder Point</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  step="0.01" 
                                  min="0"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="reorderQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reorder Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  step="0.01" 
                                  min="0"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <CardFooter className="flex justify-between px-0">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate(`/products/${productId}`)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateProductMutation.isPending}
                    >
                      {updateProductMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}