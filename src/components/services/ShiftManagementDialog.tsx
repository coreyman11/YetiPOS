
import { useState } from "react";
import { Clock, DollarSign, Users, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { ShiftsApi } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import { ShiftStartDialog } from "./ShiftStartDialog";
import { format } from "date-fns";
import { toast } from "sonner";

interface ShiftManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentShift?: any;
}

export const ShiftManagementDialog = ({ 
  isOpen, 
  onClose, 
  currentShift 
}: ShiftManagementDialogProps) => {
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { userProfile } = useAuth();

  const { data: recentShifts = [] } = useQuery({
    queryKey: ['recent-shifts', userProfile?.id],
    queryFn: () => ShiftsApi.getRecentShifts(5, userProfile?.id),
    enabled: isOpen && !!userProfile?.id,
  });

  const [showCloseShiftDialog, setShowCloseShiftDialog] = useState(false);
  const [closingBalance, setClosingBalance] = useState<string>('0.00');

  const handleCloseShift = async () => {
    if (!currentShift) return;

    try {
      const numericBalance = parseFloat(closingBalance);
      if (isNaN(numericBalance)) {
        toast.error("Please enter a valid closing balance");
        return;
      }

      setIsClosing(true);
      await ShiftsApi.closeShift(currentShift.id, numericBalance);
      toast.success("Shift closed successfully");
      setShowCloseShiftDialog(false);
      onClose();
    } catch (error) {
      console.error("Error closing shift:", error);
      toast.error("Failed to close shift");
    } finally {
      setIsClosing(false);
    }
  };

  const handlePauseShift = async () => {
    if (!currentShift) return;
    
    try {
      await ShiftsApi.pauseShift(currentShift.id);
      toast.success("Shift paused");
    } catch (error) {
      console.error("Error pausing shift:", error);
      toast.error("Failed to pause shift");
    }
  };

  const handleResumeShift = async () => {
    if (!currentShift) return;
    
    try {
      await ShiftsApi.resumeShift(currentShift.id);
      toast.success("Shift resumed");
    } catch (error) {
      console.error("Error resuming shift:", error);
      toast.error("Failed to resume shift");
    }
  };

  const getShiftStatusBadge = (status: string) => {
    const statusColors = {
      active: "bg-green-500",
      paused: "bg-yellow-500",
      closed: "bg-gray-500",
      completed: "bg-blue-500"
    };
    
    return (
      <Badge className={`${statusColors[status] || "bg-gray-500"} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl md:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Shift Management
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Shift Status */}
            {currentShift ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Current Shift</span>
                    {getShiftStatusBadge(currentShift.status)}
                  </CardTitle>
                  <CardDescription>
                    Started {format(new Date(currentShift.start_time), "MMM dd, yyyy 'at' h:mm a")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Opening Balance</p>
                        <p className="font-medium">${(currentShift.opening_balance || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="font-medium">${(currentShift.total_sales || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cashier</p>
                        <p className="font-medium">
                          {currentShift.user_profile?.full_name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2 flex-wrap">
                    {currentShift.status === 'active' && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handlePauseShift}
                          className="flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          Pause Shift
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => setShowCloseShiftDialog(true)}
                          disabled={isClosing}
                          className="flex items-center gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          Close Shift
                        </Button>
                      </>
                    )}
                    
                    {currentShift.status === 'paused' && (
                      <Button 
                        onClick={handleResumeShift}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Resume Shift
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Shift</CardTitle>
                  <CardDescription>
                    Start a new shift to begin processing transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowStartDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Start New Shift
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Shifts */}
            {recentShifts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Shifts</CardTitle>
                  <CardDescription>Your recent shift history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentShifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{shift.name}</span>
                            {getShiftStatusBadge(shift.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(shift.start_time), "MMM dd, yyyy 'at' h:mm a")}
                            {shift.end_time && ` - ${format(new Date(shift.end_time), "h:mm a")}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(shift.total_sales || 0).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Total Sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ShiftStartDialog 
        isOpen={showStartDialog}
        onClose={() => setShowStartDialog(false)}
      />

      <Dialog open={showCloseShiftDialog} onOpenChange={setShowCloseShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Shift</DialogTitle>
            <DialogDescription>
              Enter the closing cash drawer balance to complete this shift.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Opening Balance</h4>
                <p className="text-lg font-bold">${(currentShift?.opening_balance || 0).toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Sales</h4>
                <p className="text-lg font-bold">${(currentShift?.total_sales || 0).toFixed(2)}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Expected Cash Drawer Amount</h4>
              <p className="text-xl font-bold">${((currentShift?.opening_balance || 0) + (currentShift?.total_sales || 0)).toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingBalance">Actual Closing Balance</Label>
              <Input
                id="closingBalance"
                type="number"
                step="0.01"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="Enter actual closing balance"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseShiftDialog(false)}>Cancel</Button>
            <Button onClick={handleCloseShift} disabled={isClosing}>
              {isClosing ? "Closing..." : "Confirm & Close Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
