import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define the available barcode scanner interfaces
type BarcodeScanner = {
  start: () => void;
  stop: () => void;
};

interface UseBarcodeScanner {
  startScanning: () => void;
  stopScanning: () => void;
  isScanning: boolean;
  lastScannedCode: string | null;
  onScan?: (barcode: string) => void;
  onError?: (error: string) => void;
}

// Simulate barcode scanning capabilities
const createBarcodeScanner = (): BarcodeScanner => {
  let active = false;
  let keyBuffer = "";
  let lastKeyTime = 0;
  const MAX_SCAN_GAP = 20; // ms between keystrokes

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!active) return;

    // Only process if we are in an input-like context
    if (
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA")
    ) {
      return;
    }

    const currentTime = new Date().getTime();

    // If there was a significant delay, reset the buffer
    if (currentTime - lastKeyTime > MAX_SCAN_GAP && keyBuffer.length > 0) {
      keyBuffer = "";
    }

    // Update for next comparison
    lastKeyTime = currentTime;

    // Handle special keys
    if (e.key === "Enter") {
      if (keyBuffer.length > 5) {
        // Typical barcode is longer than 5 chars
        document.dispatchEvent(
          new CustomEvent("barcodeScan", { detail: keyBuffer })
        );
        keyBuffer = "";
      }
    } else if (e.key.length === 1) {
      // Only add printable characters
      keyBuffer += e.key;
    }
  };

  return {
    start: () => {
      if (!active) {
        active = true;
        document.addEventListener("keydown", handleKeyDown);
      }
    },
    stop: () => {
      active = false;
      document.removeEventListener("keydown", handleKeyDown);
    },
  };
};

export function useBarcodeScanner({
  onScan,
  onError,
}: {
  onScan?: (barcode: string) => void;
  onError?: (error: string) => void;
} = {}): UseBarcodeScanner {
  const [scanner, setScanner] = useState<BarcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle camera access permissions for real scanners
  const requestCameraPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      return true;
    } catch (error) {
      onError?.("Camera permission denied");
      toast({
        title: "Camera access denied",
        description:
          "Please allow camera access to use the barcode scanner feature",
        variant: "destructive",
      });
      return false;
    }
  }, [onError, toast]);

  useEffect(() => {
    // Create the scanner instance
    const newScanner = createBarcodeScanner();
    setScanner(newScanner);

    // Set up event listener
    const handleBarcodeScan = (event: Event) => {
      const { detail: barcode } = event as CustomEvent;
      setLastScannedCode(barcode);
      
      // Look up the product by barcode
      apiRequest("GET", `/api/scan/${barcode}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Product not found");
          }
          return response.json();
        })
        .then(product => {
          onScan?.(barcode);
        })
        .catch(error => {
          onError?.(error.message);
          toast({
            title: "Product not found",
            description: `No product found with barcode ${barcode}`,
            variant: "destructive",
          });
        });
    };

    // Register the event handler
    document.addEventListener("barcodeScan", handleBarcodeScan);

    // Clean up
    return () => {
      if (newScanner) {
        newScanner.stop();
      }
      document.removeEventListener("barcodeScan", handleBarcodeScan);
    };
    // Only run this effect once on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = useCallback(async () => {
    if (scanner) {
      // For real scanner implementations, we'd check camera permission
      const hasPermission = await requestCameraPermission();
      if (hasPermission) {
        scanner.start();
        setIsScanning(true);
        toast({
          title: "Scanner activated",
          description: "Ready to scan product barcodes",
        });
      }
    }
  }, [scanner, requestCameraPermission, toast]);

  const stopScanning = useCallback(() => {
    if (scanner) {
      scanner.stop();
      setIsScanning(false);
      toast({
        title: "Scanner deactivated",
      });
    }
  }, [scanner, toast]);

  return {
    startScanning,
    stopScanning,
    isScanning,
    lastScannedCode,
  };
}
