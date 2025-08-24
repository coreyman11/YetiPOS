
import { useState, useEffect } from "react";
import ServicesPage from "./services/ServicesPage";
import { EmployeeCodeDialog } from "@/components/services/EmployeeCodeDialog";
import { useLocation } from "react-router-dom";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { inventoryApi } from "@/services";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

const Services = () => {
  const [showEmployeeCodeDialog, setShowEmployeeCodeDialog] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<string>("");
  const location = useLocation();
  const { addToCart } = useCart();

  useEffect(() => {
    const hasVerified = sessionStorage.getItem("employee-verified") === "true";
    
    if (hasVerified) {
      const storedCashier = sessionStorage.getItem("selected-cashier");
      if (storedCashier) {
        setSelectedCashier(storedCashier);
        setIsVerified(true);
      } else {
        setShowEmployeeCodeDialog(true);
      }
    } else {
      setShowEmployeeCodeDialog(true);
    }
  }, [location.pathname]);

  // Handle barcode scanning even before authentication
  const handleBarcodeScanned = async (item) => {
    if (isVerified || !item) return;
    
    try {
      if (showEmployeeCodeDialog && item.barcode) {
        sessionStorage.setItem("pending-barcode", item.barcode);
      }
    } catch (error) {
      console.error('Error handling barcode scan:', error);
    }
  };

  const { resetScanner } = useBarcodeScanner({ 
    onScan: handleBarcodeScanned,
    enabled: !isVerified
  });

  const handleDialogClose = () => {
    setShowEmployeeCodeDialog(false);
  };

  const handleVerificationSuccess = (cashierId: string) => {
    setIsVerified(true);
    setSelectedCashier(cashierId);
    sessionStorage.setItem("employee-verified", "true");
    sessionStorage.setItem("selected-cashier", cashierId);
    
    const pendingBarcode = sessionStorage.getItem("pending-barcode");
    if (pendingBarcode) {
      console.log("Found pending barcode to process:", pendingBarcode);
    }
    
    inventoryApi.clearBarcodeCache();
    resetScanner();
  };

  if (!isVerified) {
    return (
      <EmployeeCodeDialog 
        isOpen={showEmployeeCodeDialog} 
        onClose={handleDialogClose}
        onSuccess={handleVerificationSuccess}
      />
    );
  }

  return <ServicesPage selectedCashier={selectedCashier} />;
};

export default Services;
