// Generate unique order numbers
export const generateOrderNumber = (): string => {
  const prefix = "PO";
  const year = new Date().getFullYear();
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}-${year}-${randomPart}`;
};

// Calculate time difference in days
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneDay);
};

// Validate barcode format
export const isValidBarcode = (barcode: string): boolean => {
  // Basic validation: most barcodes are numeric only
  return /^\d+$/.test(barcode);
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Calculate reorder quantity based on lead time, daily usage, and safety stock
export const calculateReorderQuantity = (
  dailyUsage: number,
  leadTime: number,
  safetyStock: number = 0
): number => {
  return dailyUsage * leadTime + safetyStock;
};

// Check if a product needs reordering
export const needsReordering = (
  currentStock: number,
  reorderPoint: number
): boolean => {
  return currentStock <= reorderPoint;
};

// Calculate order value
export const calculateOrderValue = (
  quantity: number,
  unitPrice: number
): number => {
  return quantity * unitPrice;
};

// Generate placeholder tracking number for orders
export const generateTrackingNumber = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
