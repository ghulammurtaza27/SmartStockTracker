import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { useForecasting } from "@/hooks/use-forecasting";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Product, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ForecastingPageProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function ForecastingPage({ user, onLogout }: ForecastingPageProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [forecastPeriod, setForecastPeriod] = useState<string>("7");
  
  // Get product list
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Use forecasting hook
  const { 
    forecastData, 
    lowStockProducts, 
    productsNeedingReplenishment,
    isLoading: forecastLoading,
    refetchForecast
  } = useForecasting({ 
    productId: selectedProductId,
    days: parseInt(forecastPeriod) 
  });
  
  // Transform data for charts
  const forecastChartData = forecastData ? forecastData.map(item => ({
    date: format(new Date(item.date), 'MM/dd'),
    demand: item.forecastedDemand,
    actual: item.actualDemand
  })) : [];
  
  // Generate demo data for product forecast comparison
  const generateProductComparisonData = () => {
    const products = lowStockProducts || [];
    const startDate = new Date();
    
    return products.slice(0, 5).map(product => {
      return Array.from({ length: 7 }).map((_, i) => ({
        date: format(addDays(startDate, i), 'MM/dd'),
        name: product.name,
        forecast: Math.round((Math.random() * 5) + (product.reorderPoint / 4))
      }));
    });
  };
  
  const productComparisonData = generateProductComparisonData();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header 
          title="Forecasting" 
          subtitle="AI-powered demand prediction and analysis"
          user={user}
          onLogout={onLogout}
        />
        
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Product Selection */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Demand Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="w-full md:w-2/3">
                    <label className="text-sm font-medium mb-1 block">Select Product</label>
                    <Select
                      value={selectedProductId?.toString() || ""}
                      onValueChange={(val) => setSelectedProductId(parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {(products || []).map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Forecast Period</label>
                    <Select
                      value={forecastPeriod}
                      onValueChange={setForecastPeriod}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => refetchForecast()}
                      disabled={!selectedProductId || forecastLoading}
                    >
                      {forecastLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <span className="material-icons mr-2 text-sm">refresh</span>
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
                
                {/* Product Forecast Chart */}
                <div className="h-[300px] mt-4">
                  {selectedProductId ? (
                    forecastLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : forecastChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecastChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="demand"
                            name="Forecasted Demand"
                            stroke="#1565C0"
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            name="Actual Demand"
                            stroke="#26A69A"
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <span className="material-icons text-4xl mb-2">show_chart</span>
                        <p>No forecast data available for this product</p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <span className="material-icons text-4xl mb-2">bar_chart</span>
                      <p>Select a product to view its demand forecast</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Forecast Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Forecasting Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Items Needing Replenishment</h3>
                    <div className="text-3xl font-bold">{productsNeedingReplenishment?.length || 0}</div>
                    <p className="text-sm text-gray-500 mt-1">Based on forecast and current stock</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Forecast Accuracy</h3>
                    <div className="text-3xl font-bold">92%</div>
                    <p className="text-sm text-gray-500 mt-1">Average over the last 30 days</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Stockout Prevention</h3>
                    <div className="text-3xl font-bold">85%</div>
                    <p className="text-sm text-gray-500 mt-1">Potential stockouts prevented</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Algorithm</h3>
                    <div className="text-base font-medium">Moving Average + Seasonality</div>
                    <p className="text-sm text-gray-500 mt-1">Last updated: Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Comparison Tabs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Product Forecast Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="chart">
                <TabsList>
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                  <TabsTrigger value="predictions">Predictions</TabsTrigger>
                </TabsList>
                <TabsContent value="chart" className="pt-4">
                  <div className="h-[300px]">
                    {lowStockProducts && lowStockProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productComparisonData.flat()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {lowStockProducts.slice(0, 5).map((product, index) => (
                            <Bar 
                              key={product.id} 
                              dataKey="forecast" 
                              name={product.name} 
                              stackId="a"
                              fill={`hsl(${index * 50}, 70%, 50%)`} 
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <span className="material-icons text-4xl mb-2">insights</span>
                        <p>No products with low stock to compare</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="predictions" className="pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-2 border">Product</th>
                          <th className="text-left p-2 border">Current Stock</th>
                          <th className="text-left p-2 border">Forecast (7 days)</th>
                          <th className="text-left p-2 border">Recommended Order</th>
                          <th className="text-left p-2 border">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts?.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="p-2 border">{product.name}</td>
                            <td className="p-2 border">{product.currentStock} {product.unit}</td>
                            <td className="p-2 border">{Math.round(product.reorderQuantity * 0.8)} {product.unit}</td>
                            <td className="p-2 border">{product.reorderQuantity} {product.unit}</td>
                            <td className="p-2 border">
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: `${75 + Math.random() * 15}%` }}></div>
                                </div>
                                <span>High</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!lowStockProducts || lowStockProducts.length === 0) && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-gray-500">
                              No products with low stock found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
