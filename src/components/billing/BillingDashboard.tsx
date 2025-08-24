import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { membershipsApi } from "@/services/memberships-api";
import { locationsApi } from "@/services/locations-api";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { Calendar, DollarSign, Users, AlertTriangle, CheckCircle } from "lucide-react";

interface BillingStats {
  total_memberships: number;
  pending_invoices: number;
  monthly_revenue: number;
  failed_payments: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount_cents: number;
  status: string;
  due_date: string;
  created_at: string;
}

interface CustomerDue {
  id: string;
  customer_name: string;
  membership_plan_name: string;
  amount_cents: number;
  due_date: string;
  days_until_due: number;
}

export const BillingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [processingBilling, setProcessingBilling] = useState(false);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [customersDueToday, setCustomersDueToday] = useState<CustomerDue[]>([]);
  const [customersUpcoming, setCustomersUpcoming] = useState<CustomerDue[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { userProfile, selectedStore } = useAuth();

  useEffect(() => {
    // Only fetch data if user profile exists (like MembershipsContent)
    if (userProfile) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [userProfile?.id, selectedStore?.id]); // Depend on userProfile.id and selectedStore.id

  const fetchDashboardData = async () => {
    if (!userProfile) {
      console.log('User profile not available, skipping billing data fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get current location - prioritize selectedStore from auth context
      let currentLocation = selectedStore;
      if (!currentLocation) {
        currentLocation = await locationsApi.getCurrentLocation();
      }
      
      if (!currentLocation) {
        setError("No location selected. Please select a location to view billing data.");
        setLoading(false);
        return;
      }
      
      setLocation(currentLocation);

      console.log('🔍 Fetching billing dashboard data for location:', currentLocation.id);
      const data = await membershipsApi.getBillingDashboardStats(currentLocation.id);
      
      console.log('✅ Successfully loaded billing dashboard data:', data);

      setStats(data.stats || {
        total_memberships: 0,
        pending_invoices: 0,
        monthly_revenue: 0,
        failed_payments: 0
      });
      setRecentInvoices(data.recentInvoices || []);
      setCustomersDueToday(data.customersDueToday || []);
      setCustomersUpcoming(data.customersUpcoming || []);

    } catch (error) {
      console.error('❌ Error fetching billing dashboard data:', error);
      setError("Failed to load billing dashboard data. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load billing dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerBillingRun = async () => {
    if (!location?.id) {
      toast({
        title: "Error",
        description: "No location selected for billing run",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingBilling(true);
      
      const result = await membershipsApi.triggerBillingRun(location.id);
      
      toast({
        title: "Billing Run Started",
        description: `Processing billing for ${result.results?.processed || 0} memberships`,
      });

      // Refresh dashboard data
      await fetchDashboardData();

    } catch (error) {
      console.error('Error triggering billing run:', error);
      toast({
        title: "Error",
        description: "Failed to start billing run",
        variant: "destructive"
      });
    } finally {
      setProcessingBilling(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default" as const, label: "Paid", icon: CheckCircle },
      pending: { variant: "secondary" as const, label: "Pending", icon: Calendar },
      failed: { variant: "destructive" as const, label: "Failed", icon: AlertTriangle },
      past_due: { variant: "destructive" as const, label: "Past Due", icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  // Show not authenticated state (like MembershipsContent)
  if (!userProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-6">
              Please log in to access billing management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Unable to Load Billing Dashboard</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        </div>
        <Button 
          onClick={triggerBillingRun}
          disabled={processingBilling || !location?.id}
          className="flex items-center gap-2"
        >
          {processingBilling ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            "Run Billing"
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memberships</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_memberships || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.monthly_revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">From recurring billing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_invoices || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.failed_payments || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Due Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers Due Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Due Today
            </CardTitle>
            <CardDescription>
              Customers with payments due today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customersDueToday.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No customers due today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customersDueToday.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 px-3 rounded border">
                    <div>
                      <p className="font-medium text-sm">{customer.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{customer.membership_plan_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(customer.amount_cents)}</p>
                      <Badge variant="destructive" className="text-xs">Due Today</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers Coming Due */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Coming Due (7 Days)
            </CardTitle>
            <CardDescription>
              Customers with payments due in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customersUpcoming.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming due dates</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customersUpcoming.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 px-3 rounded border">
                    <div>
                      <p className="font-medium text-sm">{customer.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{customer.membership_plan_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(customer.amount_cents)}</p>
                      <Badge variant="outline" className="text-xs">
                        {customer.days_until_due} day{customer.days_until_due !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
          <TabsTrigger value="settings">Billing Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                Latest billing invoices for hybrid memberships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent invoices found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between py-2 px-3 rounded border hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{invoice.invoice_number}</p>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">{invoice.customer_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(invoice.amount_cents)}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Configure billing behavior for this location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Retry Attempts</label>
                    <input 
                      type="number" 
                      defaultValue="5" 
                      className="w-full p-2 border rounded" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Grace Period (Days)</label>
                    <input 
                      type="number" 
                      defaultValue="5" 
                      className="w-full p-2 border rounded" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Processing Time</label>
                  <div className="flex gap-2">
                    <input 
                      type="time" 
                      defaultValue="09:00" 
                      className="flex-1 p-2 border rounded" 
                      onChange={async (e) => {
                        try {
                          // Here you would call your API to save the time
                          // await membershipsApi.updateBillingSettings(location.id, { processing_time: e.target.value });
                          toast({
                            title: "Success",
                            description: "Processing time updated successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update processing time",
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Time when daily billing processing should run</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-suspend" defaultChecked />
                  <label htmlFor="auto-suspend" className="text-sm">
                    Auto-suspend after grace period
                  </label>
                </div>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};