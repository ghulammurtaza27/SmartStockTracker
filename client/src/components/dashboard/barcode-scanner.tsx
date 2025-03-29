import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function BarcodeScanner() {
  const { toast } = useToast();
  const [manualBarcode, setManualBarcode] = useState("");
  const { startScanning, stopScanning, isScanning, lastScannedCode } = useBarcodeScanner({
    onScan: (barcode) => {
      toast({
        title: "Barcode Scanned",
        description: `Product barcode: ${barcode}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Scanning Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      toast({
        title: "Barcode Entered",
        description: `Product barcode: ${manualBarcode}`,
      });
      setManualBarcode("");
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-base font-medium">Quick Barcode Scan</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col items-center">
        <div 
          className="w-full h-40 bg-neutral-light rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-neutral-medium mb-4 cursor-pointer"
          onClick={isScanning ? stopScanning : startScanning}
        >
          {isScanning ? (
            <>
              <span className="material-icons text-4xl text-primary animate-pulse">camera_alt</span>
              <p className="text-sm text-neutral-dark mt-2">Scanning... (click to stop)</p>
              {lastScannedCode && (
                <p className="text-xs text-primary font-medium mt-1">Last scanned: {lastScannedCode}</p>
              )}
            </>
          ) : (
            <>
              <span className="material-icons text-4xl text-neutral-dark opacity-40">qr_code_scanner</span>
              <p className="text-sm text-neutral-dark opacity-60 mt-2">Tap to scan product barcode</p>
            </>
          )}
        </div>
        
        <Button
          className="bg-primary hover:bg-primary-dark text-white w-full py-2 rounded-md transition-colors duration-150 flex items-center justify-center mb-3"
          onClick={isScanning ? stopScanning : startScanning}
        >
          <span className="material-icons mr-1">camera_alt</span>
          <span>{isScanning ? "Stop Scanning" : "Start Scanning"}</span>
        </Button>
        
        <form onSubmit={handleManualSubmit} className="w-full flex gap-2">
          <Input
            type="text"
            placeholder="Enter barcode manually"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default BarcodeScanner;
