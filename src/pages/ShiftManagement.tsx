import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShiftsApi, transactionsApi, locationsApi } from "@/services";
import { ShiftSalesByMethod } from "@/services/transactions/index";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Play, Pause, DoorClosed, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useRealtime } from "@/contexts/realtime-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

const ShiftManagement = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const { networkStatus } = useRealtime();
  const [isStartShiftDialogOpen, setIsStartShiftDialogOpen] = useState(false);
  const [isCloseShiftDialogOpen, setIsCloseShiftDialogOpen] = useState(false);
  const [isForceCloseDialogOpen, setIsForceCloseDialogOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<string>('0.00');
  const [closingBalance, setClosingBalance] = useState<string>('0.00');
  const [shiftName, setShiftName] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'manage'>('current');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      const location = await locationsApi.getCurrentLocation();
      setSelectedLocationId(location?.id || null);
    };
    getCurrentLocation();
  }, []);
  const [selectedShiftToForceClose, setSelectedShiftToForceClose] = useState<number | null>(null);

  const { data: activeShift, isLoading: isLoadingActiveShift, refetch: refetchActiveShift } = useQuery({
    queryKey: ['activeShift', userProfile?.id],
    queryFn: () => ShiftsApi.getActiveShift(userProfile?.id),
    enabled: !!userProfile?.id && networkStatus.online,
    refetchInterval: 5000,
    staleTime: 0,
  });

  useEffect(() => {
    if (activeTab === 'current') {
      refetchActiveShift();
    }
  }, [activeTab, refetchActiveShift]);

  const { data: allShifts = [], isLoading: isLoadingAllShifts, refetch: refetchAllShifts } = useQuery({
    queryKey: ['allShifts', selectedLocationId],
    queryFn: () => ShiftsApi.getAll(selectedLocationId),
    enabled: activeTab === 'history' && networkStatus.online && !!selectedLocationId,
    staleTime: 0,
  });

  useEffect(() => {
    if (activeTab === 'history') {
      refetchAllShifts();
    }
  }, [activeTab, refetchAllShifts]);

  const { data: shiftTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['shiftTransactions', activeShift?.id],
    queryFn: () => {
      if (!activeShift?.id) return [];
      return ShiftsApi.getShiftTransactions(activeShift.id);
    },
    enabled: !!activeShift?.id && networkStatus.online,
  });

  const { data: allActiveShifts = [], isLoading: isLoadingAllActiveShifts, refetch: refetchAllActiveShifts } = useQuery({
    queryKey: ['allActiveShifts', selectedLocationId],
    queryFn: () => ShiftsApi.getAllActiveShifts(selectedLocationId),
    enabled: activeTab === 'manage' && networkStatus.online && !!selectedLocationId,
    staleTime: 0,
  });

  useEffect(() => {
    if (activeTab === 'manage') {
      refetchAllActiveShifts();
    }
  }, [activeTab, refetchAllActiveShifts]);

  const { data: shiftSalesByMethod = {
    cash: 0,
    credit: 0,
    gift_card: 0,
    other: 0,
    refunds: 0
  } as ShiftSalesByMethod, isLoading: isLoadingShiftSales } = useQuery({
    queryKey: ['shiftSalesByMethod', activeShift?.id],
    queryFn: () => transactionsApi.getShiftSales(activeShift?.id as number),
    enabled: !!activeShift?.id && networkStatus.online,
  });

  useEffect(() => {
    if (!networkStatus.online || !userProfile?.id) return;

    const channel = supabase
      .channel('shifts-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'shifts'
        },
        (payload) => {
          console.log("Real-time shift update received:", payload);
          refetchActiveShift();
          refetchAllShifts();
          refetchAllActiveShifts();
        }
      )
      .subscribe((status) => {
        console.log(`Real-time shifts subscription status: ${status}`);
      });

    const transactionsChannel = supabase
      .channel('shift-transactions-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
          filter: activeShift?.id ? `shift_id=eq.${activeShift.id}` : undefined
        },
        (payload) => {
          console.log("Real-time transaction update received:", payload);
          queryClient.invalidateQueries({ queryKey: ['shiftTransactions'] });
          queryClient.invalidateQueries({ queryKey: ['shiftSalesByMethod'] });
          if (activeShift?.id) {
            queryClient.invalidateQueries({ queryKey: ['activeShift'] });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Real-time transactions subscription status: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [networkStatus.online, userProfile?.id, activeShift?.id, queryClient, refetchActiveShift, refetchAllShifts, refetchAllActiveShifts]);

  const calculateExpectedCashDrawer = () => {
    if (!activeShift) return 0;
    
    // Cash sales already account for refunds (they're subtracted in getShiftSales)
    const cashSales = shiftSalesByMethod.cash || 0;
    
    // Subtract cash refunds from expected cash drawer since refunds reduce the cash in drawer
    const cashRefunds = shiftSalesByMethod.refunds || 0;
    
    return (activeShift.opening_balance || 0) + cashSales - cashRefunds;
  };

  const handleStartShift = async () => {
    if (!userProfile?.id) {
      toast.error("You must be logged in to start a shift");
      return;
    }

    try {
      const numericBalance = parseFloat(openingBalance);
      if (isNaN(numericBalance)) {
        toast.error("Please enter a valid opening balance");
        return;
      }

      if (!shiftName.trim()) {
        toast.error("Please enter a shift name");
        return;
      }

      const currentLocation = await locationsApi.getCurrentLocation();
      if (!currentLocation) {
        toast.error("No location selected. Please select a location first.");
        return;
      }

      await ShiftsApi.startShift({
        name: shiftName,
        assigned_user_id: userProfile.id,
        opening_balance: numericBalance,
        location_id: currentLocation.id
      });

      toast.success("Shift started successfully");
      setIsStartShiftDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error(error instanceof Error ? error.message : "Failed to start shift");
    }
  };

  const handlePauseShift = async () => {
    if (!activeShift?.id) return;

    try {
      await ShiftsApi.pauseShift(activeShift.id as number);
      toast.success("Shift paused");
      refetchActiveShift();
    } catch (error) {
      console.error('Error pausing shift:', error);
      toast.error("Failed to pause shift");
    }
  };

  const handleResumeShift = async () => {
    if (!activeShift?.id) return;

    try {
      await ShiftsApi.resumeShift(activeShift.id as number);
      toast.success("Shift resumed");
      refetchActiveShift();
    } catch (error) {
      console.error('Error resuming shift:', error);
      toast.error("Failed to resume shift");
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift?.id) return;

    try {
      const numericBalance = parseFloat(closingBalance);
      if (isNaN(numericBalance)) {
        toast.error("Please enter a valid closing balance");
        return;
      }

      await ShiftsApi.closeShift(activeShift.id as number, numericBalance);
      toast.success("Shift closed successfully");
      setIsCloseShiftDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      queryClient.invalidateQueries({ queryKey: ['allShifts'] });
    } catch (error) {
      console.error('Error closing shift:', error);
      toast.error("Failed to close shift");
    }
  };

  const handleForceCloseShift = async (shiftId: number) => {
    try {
      await ShiftsApi.forceCloseShift(shiftId);
      toast.success("Shift closed successfully");
      setIsForceCloseDialogOpen(false);
      setSelectedShiftToForceClose(null);
      
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      queryClient.invalidateQueries({ queryKey: ['allShifts'] });
      queryClient.invalidateQueries({ queryKey: ['allActiveShifts'] });
    } catch (error) {
      console.error('Error force closing shift:', error);
      toast.error("Failed to close shift");
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  };

  if (isLoadingActiveShift && activeTab === 'current') {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Shift Management</h2>
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const expectedCashDrawer = calculateExpectedCashDrawer();

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Shift Management</h2>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => {
            refetchActiveShift();
            refetchAllShifts();
            refetchAllActiveShifts();
            toast.success("Data refreshed");
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="current" value={activeTab} onValueChange={(value) => setActiveTab(value as 'current' | 'history' | 'manage')}>
        <TabsList>
          <TabsTrigger value="current">Current Shift</TabsTrigger>
          <TabsTrigger value="history">Shift History</TabsTrigger>
          <TabsTrigger value="manage">Manage All Shifts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-4">
          {activeShift ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>{activeShift.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      activeShift.status === 'active' ? 'bg-green-100 text-green-800' :
                      activeShift.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activeShift.status.toUpperCase()}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Started at {formatDateTime(activeShift.start_time)}
                    {activeShift.user_profile && 
                      ` by ${activeShift.user_profile.full_name || activeShift.user_profile.email || 'Unknown user'}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="text-sm font-medium text-gray-500">Opening Balance</h4>
                      <p className="text-2xl font-bold">{formatCurrency(activeShift.opening_balance)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="text-sm font-medium text-gray-500">Total Sales (Net of Refunds)</h4>
                      <p className="text-2xl font-bold">{formatCurrency((shiftSalesByMethod.cash || 0) + (shiftSalesByMethod.credit || 0) + (shiftSalesByMethod.gift_card || 0) + (shiftSalesByMethod.other || 0))}</p>
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Cash:</span>
                          <span>{formatCurrency(shiftSalesByMethod.cash || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Credit:</span>
                          <span>{formatCurrency(shiftSalesByMethod.credit || 0)}</span>
                        </div>
                        {shiftSalesByMethod.gift_card > 0 && (
                          <div className="flex justify-between">
                            <span>Gift Card:</span>
                            <span>{formatCurrency(shiftSalesByMethod.gift_card || 0)}</span>
                          </div>
                        )}
                        {shiftSalesByMethod.other > 0 && (
                          <div className="flex justify-between">
                            <span>Other:</span>
                            <span>{formatCurrency(shiftSalesByMethod.other || 0)}</span>
                          </div>
                        )}
                        {shiftSalesByMethod.refunds > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Refunds:</span>
                            <span>-{formatCurrency(shiftSalesByMethod.refunds || 0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="text-sm font-medium text-gray-500">Expected Cash Drawer</h4>
                      <p className="text-2xl font-bold">{formatCurrency(expectedCashDrawer)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        (Opening balance + cash sales - cash refunds)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Shift Transactions</h3>
                    {isLoadingTransactions ? (
                      <Skeleton className="h-[200px] w-full" />
                    ) : shiftTransactions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shiftTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{transaction.id}</TableCell>
                              <TableCell>{formatDateTime(transaction.created_at)}</TableCell>
                              <TableCell>{formatCurrency(transaction.total_amount)}</TableCell>
                              <TableCell>{transaction.payment_method}</TableCell>
                              <TableCell>{transaction.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No transactions yet in this shift</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  {activeShift.status === 'active' ? (
                    <Button variant="outline" onClick={handlePauseShift}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Shift
                    </Button>
                  ) : activeShift.status === 'paused' ? (
                    <Button variant="outline" onClick={handleResumeShift}>
                      <Play className="h-4 w-4 mr-2" />
                      Resume Shift
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      Shift Closed
                    </Button>
                  )}
                  
                  {activeShift.status !== 'closed' && (
                    <Button
                      variant="destructive"
                      onClick={() => setIsCloseShiftDialogOpen(true)}
                    >
                      <DoorClosed className="h-4 w-4 mr-2" />
                      Close Shift
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              <Dialog open={isCloseShiftDialogOpen} onOpenChange={setIsCloseShiftDialogOpen}>
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
                        <p className="text-lg font-bold">{formatCurrency(activeShift.opening_balance)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Cash Sales</h4>
                        <p className="text-lg font-bold">{formatCurrency(shiftSalesByMethod.cash || 0)}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Expected Cash Drawer Amount</h4>
                      <p className="text-xl font-bold">{formatCurrency(expectedCashDrawer)}</p>
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
                    <Button variant="outline" onClick={() => setIsCloseShiftDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCloseShift}>Confirm & Close Shift</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Shift</CardTitle>
                <CardDescription>
                  Start a new shift to begin tracking transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Button
                  size="lg"
                  onClick={() => setIsStartShiftDialogOpen(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start New Shift
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Dialog open={isStartShiftDialogOpen} onOpenChange={setIsStartShiftDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Shift</DialogTitle>
                <DialogDescription>
                  Enter the opening cash drawer balance to start a new shift.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="shiftName">Shift Name</Label>
                  <Input
                    id="shiftName"
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    placeholder="Morning Shift"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openingBalance">Opening Cash Balance</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="Enter opening balance"
                  />
                </div>
                <div>
                  <Label>Cashier</Label>
                  <p className="text-sm font-medium mt-1">
                    {userProfile?.full_name || userProfile?.email || 'Unknown'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStartShiftDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStartShift}>Start Shift</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {isLoadingAllShifts ? (
            <Skeleton className="h-[400px] w-full" />
          ) : allShifts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Shift History</CardTitle>
                <CardDescription>
                  View past shifts and their details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shift</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Ended</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Discrepancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.name}</TableCell>
                        <TableCell>{formatDateTime(shift.start_time)}</TableCell>
                        <TableCell>{shift.end_time ? formatDateTime(shift.end_time) : 'Active'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            shift.status === 'active' ? 'bg-green-100 text-green-800' :
                            shift.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            shift.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shift.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(shift.total_sales)}</TableCell>
                        <TableCell>
                          {shift.cash_discrepancy !== null ? (
                            <span className={shift.cash_discrepancy < 0 ? 'text-red-600' : 'text-green-600'}>
                              {formatCurrency(shift.cash_discrepancy)}
                            </span>
                          ) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Shifts Found</CardTitle>
                <CardDescription>
                  There are no shifts in the history yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Start a new shift to begin tracking transactions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                All Active Shifts
              </CardTitle>
              <CardDescription>
                View and manage all active shifts in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAllActiveShifts ? (
                <Skeleton className="h-[200px] w-full" />
              ) : allActiveShifts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Shift Name</TableHead>
                      <TableHead>Cashier</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Opening Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allActiveShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.id}</TableCell>
                        <TableCell>{shift.name}</TableCell>
                        <TableCell>
                          {shift.user_profiles?.full_name || 
                           shift.user_profile?.full_name || 
                           (shift.assigned_user_id ? shift.assigned_user_id.substring(0, 8) + '...' : 'Unassigned')}
                        </TableCell>
                        <TableCell>{formatDateTime(shift.start_time)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            {shift.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(shift.opening_balance)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setSelectedShiftToForceClose(shift.id);
                              setIsForceCloseDialogOpen(true);
                            }}
                          >
                            Force Close
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active shifts found in the system</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isForceCloseDialogOpen} onOpenChange={setIsForceCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Close Shift</DialogTitle>
            <DialogDescription>
              Are you sure you want to force close this shift? The system will automatically 
              balance the cash drawer to have zero discrepancy.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 pb-2 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
            <p className="font-medium text-red-600">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsForceCloseDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => selectedShiftToForceClose && handleForceCloseShift(selectedShiftToForceClose)}
            >
              Force Close Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftManagement;
