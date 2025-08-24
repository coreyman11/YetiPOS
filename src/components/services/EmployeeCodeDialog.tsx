
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { userApi } from "@/services/user-api";
import { StaffSelector } from "./payment-sheet/StaffSelector";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { locationsApi } from "@/services/locations-api";
import { supabase } from "@/lib/supabase";

interface EmployeeCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cashierId: string) => void;
  forcedFullScreen?: boolean;
}

export const EmployeeCodeDialog = ({ isOpen, onClose, onSuccess, forcedFullScreen = false }: EmployeeCodeDialogProps) => {
  const [employeeCode, setEmployeeCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { userProfile } = useAuth();
  
  // Reset employee code when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEmployeeCode("");
    }
  }, [isOpen]);

  function handleNumberClick(number: number) {
    setEmployeeCode(prev => prev + number);
  }

  function handleClear() {
    setEmployeeCode("");
  }

  function handleBackspace() {
    setEmployeeCode(prev => prev.slice(0, -1));
  }

  async function validateEmployeeCode() {
    if (!employeeCode.trim()) {
      toast.error("Please enter an employee code");
      return;
    }

    try {
      setIsValidating(true);
      
      // Validate employee code and get user info in one call
      const validationResult = await userApi.validateEmployeeCode(employeeCode);
      
      if (validationResult.valid && validationResult.user) {
        toast.success(`Welcome, ${validationResult.user.full_name || validationResult.user.email}`);
        if (onSuccess) {
          onSuccess(validationResult.user.id);
        }
        onClose();
      } else {
        toast.error("Invalid employee code");
      }
    } catch (error) {
      console.error("Error validating employee code:", error);
      toast.error("Failed to validate employee code");
    } finally {
      setIsValidating(false);
      setEmployeeCode("");
    }
  }

  const { data: logoSettings } = useQuery({
    queryKey: ['logo-settings', userProfile?.allowed_locations?.[0]],
    queryFn: async () => {
      const currentLocationId = userProfile?.allowed_locations?.[0];
      if (!currentLocationId) return null;
      
      const { data, error } = await supabase
        .from('logo_settings')
        .select('*')
        .eq('location_id', currentLocationId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!userProfile?.allowed_locations?.[0],
  });

  return (
    <Dialog open={isOpen} onOpenChange={forcedFullScreen ? undefined : onClose}>
      <DialogContent className="max-w-6xl w-full h-[80vh]" onPointerDownOutside={forcedFullScreen ? (e) => e.preventDefault() : undefined} onEscapeKeyDown={forcedFullScreen ? (e) => e.preventDefault() : undefined}>
        <div className="flex h-full">
          {/* Left side - Logo area */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg mr-6">
            {logoSettings?.logo_url ? (
              <img
                src={logoSettings.logo_url}
                alt="Company logo"
                className="max-h-64 max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏢</span>
                </div>
                <p>Company Logo</p>
                <p className="text-sm">Configure in Settings</p>
              </div>
            )}
          </div>
          
          {/* Right side - Keypad */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <Input 
              type="password" 
              value={employeeCode} 
              onChange={(e) => setEmployeeCode(e.target.value)}
              className="text-center text-3xl h-16 text-lg font-mono tracking-widest"
              placeholder="••••••"
              autoFocus
            />
            
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button 
                  key={num} 
                  variant="outline" 
                  className="h-16 text-2xl font-semibold"
                  onClick={() => handleNumberClick(num)}
                >
                  {num}
                </Button>
              ))}
              <Button 
                variant="outline" 
                className="h-16 text-lg"
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button 
                variant="outline" 
                className="h-16 text-2xl font-semibold"
                onClick={() => handleNumberClick(0)}
              >
                0
              </Button>
              <Button 
                variant="outline" 
                className="h-16 text-2xl"
                onClick={handleBackspace}
              >
                ←
              </Button>
            </div>
            
            <Button 
              disabled={isValidating || !employeeCode} 
              onClick={validateEmployeeCode}
              className="w-full max-w-sm h-14 text-lg"
            >
              {isValidating ? "Validating..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
