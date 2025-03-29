import { useQuery } from "@tanstack/react-query";
import { ForecastData, Product } from "@shared/schema";

interface UseForecastingProps {
  productId?: number;
  days?: number;
}

export function useForecasting({ productId, days = 7 }: UseForecastingProps = {}) {
  // Get all products for forecasting overview
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !productId, // Only fetch all products if no specific product is selected
  });

  // Get forecast data for a specific product
  const {
    data: forecastData,
    isLoading: forecastLoading,
    isError: forecastError,
    refetch: refetchForecast,
  } = useQuery<ForecastData[]>({
    queryKey: [`/api/forecast/${productId}`],
    enabled: !!productId, // Only fetch if productId is provided
  });

  // Get low stock products (which likely need forecasting attention)
  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery<
    Product[]
  >({
    queryKey: ["/api/products/low-stock"],
  });

  // Calculate accuracy metrics for forecasting if we have data
  const accuracyMetrics = forecastData
    ? {
        meanAccuracy:
          forecastData.reduce(
            (sum, item) => sum + (item.accuracy || 0),
            0
          ) / forecastData.length,
        forecastItems: forecastData.length,
        daysAhead: days,
      }
    : null;

  // Identify products that will need replenishment soon
  const productsNeedingReplenishment = lowStockProducts
    ? lowStockProducts.filter(
        (product) => product.currentStock <= product.reorderPoint
      )
    : [];

  return {
    // Data
    forecastData,
    products,
    lowStockProducts,
    productsNeedingReplenishment,
    
    // Status
    isLoading: productsLoading || forecastLoading || lowStockLoading,
    isError: forecastError,
    
    // Actions
    refetchForecast,
    
    // Metrics
    accuracyMetrics,
  };
}
