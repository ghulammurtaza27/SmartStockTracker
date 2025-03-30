
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

export function ExpiryAlerts() {
  const { data: nearExpiryProducts } = useQuery({
    queryKey: ["/api/products/near-expiry"],
    queryFn: async () => {
      const res = await fetch("/api/products/near-expiry?days=30");
      if (!res.ok) throw new Error("Failed to fetch near expiry products");
      return res.json();
    },
  });

  if (!nearExpiryProducts?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiry Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {nearExpiryProducts.map((product) => (
            <Alert key={product.id} variant="warning">
              <AlertTitle>{product.name}</AlertTitle>
              <AlertDescription>
                Expires on {format(new Date(product.expiryDate), "PPP")}
                {product.discountPercentage > 0 && (
                  <span className="ml-2 text-green-600">
                    ({product.discountPercentage}% discount applied)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
