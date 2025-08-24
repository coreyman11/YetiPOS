
import { useState, useEffect } from "react";
import RegisterPage from "./services/RegisterPage";
import { EmployeeCodeDialog } from "@/components/services/EmployeeCodeDialog";
import { useLocation } from "react-router-dom";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { inventoryApi } from "@/services";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { setupSecureLogging } from "@/utils/secure-logging";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";

const SIDEBAR_STATE_KEY = "register-sidebar-collapsed";

const Register = () => {
  const [showEmployeeCodeDialog, setShowEmployeeCodeDialog] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const location = useLocation();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  const { session, switchToUser, resetToOriginalUser } = useAuth();

  useEffect(() => {
    setupSecureLogging();
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState) {
      setSidebarCollapsed(savedState === "true");
    }
  }, []);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);

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

  const handleVerificationSuccess = async (cashierId: string) => {
    setIsVerified(true);
    setSelectedCashier(cashierId);
    sessionStorage.setItem("employee-verified", "true");
    sessionStorage.setItem("selected-cashier", cashierId);
    
    // Switch authentication context to the cashier
    try {
      await switchToUser(cashierId);
      toast.success("Cashier verified successfully");
    } catch (error) {
      console.error('Error switching to cashier context:', error);
      toast.error("Failed to switch to cashier context");
    }
    
    const pendingBarcode = sessionStorage.getItem("pending-barcode");
    if (pendingBarcode) {
      console.log("Found pending barcode to process:", pendingBarcode);
    }
    
    inventoryApi.clearBarcodeCache();
    resetScanner();
    
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
  };

  const handleToggleSidebar = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_STATE_KEY, String(collapsed));
  };

  const handleCloseRegister = () => {
    // Reset authentication context back to original user
    resetToOriginalUser();
    
    // Clear all cached data and reset verification status
    setIsVerified(false);
    sessionStorage.clear();
    localStorage.removeItem(SIDEBAR_STATE_KEY);
    inventoryApi.clearBarcodeCache();
    queryClient.clear();
    setShowEmployeeCodeDialog(true);
    toast.info("Register closed. Please verify to continue.");
  };

  if (!isVerified) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <EmployeeCodeDialog 
          isOpen={true} 
          onClose={() => {}} // Prevent closing when not verified
          onSuccess={handleVerificationSuccess}
          forcedFullScreen={true}
        />
      </div>
    );
  }

  return (
    <>
      <RegisterPage 
        selectedCashier={selectedCashier} 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseRegister={handleCloseRegister}
      />
    </>
  );
};

export default Register;
