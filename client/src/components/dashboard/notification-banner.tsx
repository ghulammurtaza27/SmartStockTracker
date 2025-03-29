import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

type NotificationBannerProps = {
  title: string;
  message: string;
  icon?: string;
  type?: "warning" | "info" | "success" | "error";
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  dismissable?: boolean;
};

export function NotificationBanner({
  title,
  message,
  icon = "notifications_active",
  type = "warning",
  primaryAction,
  dismissable = true,
}: NotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const getBgColorClass = () => {
    switch (type) {
      case "warning":
        return "bg-[#FB8C00] bg-opacity-10 border-[#FB8C00]";
      case "info":
        return "bg-primary bg-opacity-10 border-primary";
      case "success":
        return "bg-[#4CAF50] bg-opacity-10 border-[#4CAF50]";
      case "error":
        return "bg-[#F44336] bg-opacity-10 border-[#F44336]";
      default:
        return "bg-[#FB8C00] bg-opacity-10 border-[#FB8C00]";
    }
  };

  const getIconColorClass = () => {
    switch (type) {
      case "warning":
        return "text-[#FB8C00]";
      case "info":
        return "text-primary";
      case "success":
        return "text-[#4CAF50]";
      case "error":
        return "text-[#F44336]";
      default:
        return "text-[#FB8C00]";
    }
  };

  const getButtonColorClass = () => {
    switch (type) {
      case "warning":
        return "bg-[#FB8C00] hover:bg-[#EF6C00] text-white";
      case "info":
        return "bg-primary hover:bg-primary-dark text-white";
      case "success":
        return "bg-[#4CAF50] hover:bg-[#388E3C] text-white";
      case "error":
        return "bg-[#F44336] hover:bg-[#D32F2F] text-white";
      default:
        return "bg-[#FB8C00] hover:bg-[#EF6C00] text-white";
    }
  };

  return (
    <Alert className={`mb-6 flex items-center justify-between ${getBgColorClass()}`}>
      <div className="flex items-center">
        <span className={`material-icons mr-3 ${getIconColorClass()}`}>{icon}</span>
        <div>
          <AlertTitle className="font-medium">{title}</AlertTitle>
          <AlertDescription className="text-sm">{message}</AlertDescription>
        </div>
      </div>
      <div className="flex space-x-2">
        {primaryAction && (
          <Button
            className={getButtonColorClass()}
            onClick={primaryAction.onClick}
            size="sm"
          >
            {primaryAction.label}
          </Button>
        )}
        {dismissable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-neutral-dark opacity-60 hover:opacity-100"
          >
            Dismiss
          </Button>
        )}
      </div>
    </Alert>
  );
}

export default NotificationBanner;
