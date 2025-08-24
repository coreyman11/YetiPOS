
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ShiftsApi } from "@/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";

interface ShiftStartDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftStartDialog = ({ isOpen, onClose }: ShiftStartDialogProps) => {
  const [shiftName, setShiftName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { userProfile, selectedStore } = useAuth();

  const handleStartShift = async () => {
    if (!shiftName.trim()) {
      toast.error("Please enter a shift name");
      return;
    }

    if (!openingBalance.trim() || isNaN(Number(openingBalance))) {
      toast.error("Please enter a valid opening balance");
      return;
    }

    setIsLoading(true);
    try {
      const result = await ShiftsApi.startShift({
        name: shiftName,
        opening_balance: Number(openingBalance),
        assigned_user_id: userProfile?.id || null,
        location_id: selectedStore?.id || userProfile?.allowed_locations?.[0] || null,
      });

      if (result) {
        toast.success("Shift started successfully");
        queryClient.invalidateQueries({ queryKey: ['active-shift'] });
        onClose();
      }
    } catch (error) {
      console.error("Error starting shift:", error);
      toast.error("Failed to start shift");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Shift</DialogTitle>
          <DialogDescription>
            Enter shift details to begin a new register session
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shift-name" className="text-right">
              Shift Name
            </Label>
            <Input
              id="shift-name"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              className="col-span-3"
              placeholder="Morning Shift"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="opening-balance" className="text-right">
              Opening Balance
            </Label>
            <Input
              id="opening-balance"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="col-span-3"
              placeholder="100.00"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStartShift} disabled={isLoading}>
            {isLoading ? "Starting..." : "Start Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
