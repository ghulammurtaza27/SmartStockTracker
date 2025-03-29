import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: string;
  iconColor: "primary" | "secondary" | "warning" | "error" | "success";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  subtitle?: string;
};

export function StatsCard({
  title,
  value,
  icon,
  iconColor,
  trend,
  subtitle,
}: StatsCardProps) {
  const getIconColorClass = () => {
    switch (iconColor) {
      case "primary":
        return "text-primary bg-primary bg-opacity-10";
      case "secondary":
        return "text-[#26A69A] bg-[#26A69A] bg-opacity-10";
      case "warning":
        return "text-[#FB8C00] bg-[#FB8C00] bg-opacity-10";
      case "error":
        return "text-[#F44336] bg-[#F44336] bg-opacity-10";
      case "success":
        return "text-[#4CAF50] bg-[#4CAF50] bg-opacity-10";
      default:
        return "text-primary bg-primary bg-opacity-10";
    }
  };

  const getTrendColorClass = () => {
    if (!trend) return "";
    return trend.direction === "up" ? "text-[#4CAF50]" : "text-[#F44336]";
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-neutral-dark opacity-60 text-sm">{title}</span>
          <span className={cn("material-icons rounded-full p-1", getIconColorClass())}>
            {icon}
          </span>
        </div>
        <div className="flex items-end">
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className={cn("text-sm ml-2 flex items-center", getTrendColorClass())}>
              <span className="material-icons text-sm">
                {trend.direction === "up" ? "arrow_upward" : "arrow_downward"}
              </span>
              {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <p className="text-xs text-neutral-dark opacity-60 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default StatsCard;
