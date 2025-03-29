import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

type Stat = {
  label: string;
  value: string;
  percentage: number;
  color: string;
};

export function ReplenishmentStats() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/inventory-summary"],
  });

  // Sample stats - in a real app, these would come from the API
  const stats: Stat[] = [
    {
      label: "Average Lead Time",
      value: "3.2 days",
      percentage: 65,
      color: "bg-[#26A69A]",
    },
    {
      label: "Auto-Order Accuracy",
      value: "92%",
      percentage: 92,
      color: "bg-[#4CAF50]",
    },
    {
      label: "Stock Optimization",
      value: "78%",
      percentage: 78,
      color: "bg-primary",
    },
  ];

  return (
    <Card>
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-base font-medium">Replenishment Stats</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-full bg-neutral-light rounded-full h-2"></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-full bg-neutral-light rounded-full h-2"></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-full bg-neutral-light rounded-full h-2"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">{stat.label}</span>
                  <span className="text-sm font-medium">{stat.value}</span>
                </div>
                <Progress
                  value={stat.percentage}
                  className="h-2 bg-neutral-light"
                  indicatorClassName={stat.color}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReplenishmentStats;
