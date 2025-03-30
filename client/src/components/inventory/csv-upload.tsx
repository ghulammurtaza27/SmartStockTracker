
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function CSVUpload() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await fetch("/api/products/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `${data.message}`,
        });
        // Refresh the page to show new products
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload CSV file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with the following columns: name, description, barcode, sku, categoryId, 
            supplierId, unit, price, currentStock, minStockLevel, maxStockLevel, reorderPoint, 
            reorderQuantity, location
          </p>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {uploading && <span>Uploading...</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
