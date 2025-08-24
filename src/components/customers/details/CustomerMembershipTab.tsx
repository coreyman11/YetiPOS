
import { useState, useEffect } from "react";
import { Plus, CreditCard, Calendar, AlertCircle, Check, Edit3, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { membershipsApi } from "@/services";

// Define types manually until database types are updated
type CustomerMembership = {
  id: string;
  customer_id: number;
  membership_plan_id: string;
  status: string;
  billing_status?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  next_billing_date?: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  location_id?: string;
  created_at: string;
  updated_at: string;
};

type MembershipPlan = {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  billing_interval: string;
  billing_interval_count: number;
  stripe_price_id?: string;
  location_id?: string;
  is_active: boolean;
  max_members?: number;
  created_at: string;
  updated_at: string;
};

type MembershipBenefit = {
  id: string;
  membership_plan_id: string;
  benefit_type: string;
  benefit_value?: number;
  description: string;
  is_active: boolean;
  location_id?: string;
  created_at: string;
};

interface CustomerMembershipTabProps {
  customerId: number;
}

export const CustomerMembershipTab = ({ customerId }: CustomerMembershipTabProps) => {
  const [memberships, setMemberships] = useState<(CustomerMembership & { membership_plans: MembershipPlan | null })[]>([]);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlan[]>([]);
  const [benefits, setBenefits] = useState<MembershipBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingBillingDate, setEditingBillingDate] = useState<string | null>(null);
  const [newBillingDate, setNewBillingDate] = useState<string>("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [editingMembership, setEditingMembership] = useState<CustomerMembership | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [newBillingStatus, setNewBillingStatus] = useState<string>("");

  useEffect(() => {
    fetchMembershipData();
  }, [customerId]);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);

      // Fetch customer memberships using secure API
      try {
        const membershipData = await membershipsApi.getCustomerMemberships(customerId);
        console.log('Fetched memberships:', membershipData);
        setMemberships(membershipData || []);
      } catch (membershipError) {
        console.error('Error fetching memberships:', membershipError);
        toast.error('Failed to load customer memberships');
      }

      // Use the secure API for membership plans
      try {
        const plansData = await membershipsApi.getAll();
        setAvailablePlans(plansData.filter((plan: MembershipPlan) => plan.is_active) || []);
      } catch (plansError) {
        console.error('Error fetching plans:', plansError);
        toast.error('Failed to load membership plans');
      }

      // Use the secure API for membership benefits
      try {
        const benefitsData = await membershipsApi.getAllBenefits();
        setBenefits(benefitsData.filter((benefit: MembershipBenefit) => benefit.is_active) || []);
      } catch (benefitsError) {
        console.error('Error fetching benefits:', benefitsError);
        toast.error('Failed to load membership benefits');
      }

    } catch (error) {
      console.error('Error fetching membership data:', error);
      toast.error('Failed to load membership data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembership = async () => {
    if (!selectedPlanId) {
      toast.error('Please select a membership plan');
      return;
    }

    try {
      setIsProcessing(true);
      
      await membershipsApi.addCustomerMembership(customerId, selectedPlanId);
      
      toast.success('Membership added successfully');
      setShowAddDialog(false);
      setSelectedPlanId("");
      fetchMembershipData();
    } catch (error) {
      console.error('Error adding membership:', error);
      toast.error('Failed to add membership');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelMembership = async (membershipId: string) => {
    try {
      setIsProcessing(true);
      
      await membershipsApi.cancelCustomerMembership(membershipId);
      
      toast.success('Membership cancelled successfully');
      fetchMembershipData();
    } catch (error) {
      console.error('Error cancelling membership:', error);
      toast.error('Failed to cancel membership');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateBillingDate = async (membershipId: string, newDate: string) => {
    try {
      setIsProcessing(true);
      // Format the date properly as UTC start of day to avoid timezone issues
      const formattedDate = `${newDate}T00:00:00Z`;
      await membershipsApi.updateCustomerMembership(membershipId, { next_billing_date: formattedDate });
      toast.success('Next billing date updated successfully');
      setEditingBillingDate(null);
      setNewBillingDate("");
      fetchMembershipData();
    } catch (error) {
      console.error('Error updating billing date:', error);
      toast.error('Failed to update billing date');
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditingBillingDate = (membershipId: string, currentDate: string | null) => {
    setEditingBillingDate(membershipId);
    setNewBillingDate(currentDate ? currentDate.split('T')[0] : "");
  };

  const cancelEditingBillingDate = () => {
    setEditingBillingDate(null);
    setNewBillingDate("");
  };

  const handleUpdateStatus = async () => {
    if (!editingMembership) return;

    try {
      setIsProcessing(true);
      const updateData: any = {};
      
      if (newStatus !== editingMembership.status) {
        updateData.status = newStatus;
      }
      
      if (newBillingStatus !== editingMembership.billing_status) {
        updateData.billing_status = newBillingStatus;
      }

      // Add timestamp for cancelled status
      if (newStatus === 'cancelled' && editingMembership.status !== 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      await membershipsApi.updateCustomerMembership(editingMembership.id, updateData);
      toast.success('Membership status updated successfully');
      setShowStatusDialog(false);
      setEditingMembership(null);
      fetchMembershipData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update membership status');
    } finally {
      setIsProcessing(false);
    }
  };

  const openStatusDialog = (membership: CustomerMembership) => {
    setEditingMembership(membership);
    setNewStatus(membership.status);
    setNewBillingStatus(membership.billing_status || 'active');
    setShowStatusDialog(true);
  };

  const getStatusBadge = (status: string, billingStatus?: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      cancelled: { label: 'Cancelled', variant: 'secondary' as const },
      expired: { label: 'Expired', variant: 'outline' as const },
      past_due: { label: 'Past Due', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expired;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getBillingStatusBadge = (billingStatus: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      trial: { label: 'Trial', variant: 'secondary' as const },
      past_due: { label: 'Past Due', variant: 'destructive' as const },
      suspended: { label: 'Suspended', variant: 'destructive' as const },
      cancelled: { label: 'Cancelled', variant: 'outline' as const }
    };

    const config = statusConfig[billingStatus as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const getPlanBenefits = (planId: string) => {
    return benefits.filter(benefit => benefit.membership_plan_id === planId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Membership Status</h3>
          <p className="text-muted-foreground">Manage customer membership subscriptions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button disabled={isProcessing}>
              <Plus className="mr-2 h-4 w-4" />
              Add Membership
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Membership Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Plan</label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a membership plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {formatPrice(plan.price_cents)}/{plan.billing_interval}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMembership} disabled={isProcessing}>
                  {isProcessing ? 'Adding...' : 'Add Membership'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Memberships</h3>
            <p className="text-muted-foreground mb-4">
              This customer doesn't have any membership subscriptions yet.
            </p>
            <Button onClick={() => setShowAddDialog(true)} disabled={isProcessing}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Membership
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {memberships.map((membership) => (
            <Card key={membership.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {membership.membership_plans?.name || 'Unknown Plan'}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {membership.membership_plans?.description}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2 justify-end">
                      {getStatusBadge(membership.status, membership.billing_status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openStatusDialog(membership)}
                        disabled={isProcessing}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {membership.membership_plans && formatPrice(membership.membership_plans.price_cents)}/{membership.membership_plans?.billing_interval}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Started: {membership.created_at ? new Date(membership.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Next billing: </span>
                      {editingBillingDate === membership.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={newBillingDate}
                            onChange={(e) => setNewBillingDate(e.target.value)}
                            className="h-7 w-32 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateBillingDate(membership.id, newBillingDate)}
                            disabled={isProcessing}
                            className="h-7 w-7 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditingBillingDate}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {membership.next_billing_date 
                              ? new Date(membership.next_billing_date).toLocaleDateString()
                              : 'Not set'
                            }
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingBillingDate(membership.id, membership.next_billing_date)}
                            disabled={isProcessing}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {membership.stripe_subscription_id && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Stripe ID: {membership.stripe_subscription_id}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Benefits</h4>
                    <div className="space-y-1">
                      {getPlanBenefits(membership.membership_plan_id).map((benefit) => (
                        <div key={benefit.id} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-600" />
                          <span>{benefit.description}</span>
                          {benefit.benefit_value && (
                            <Badge variant="outline" className="text-xs">
                              {benefit.benefit_type === 'discount_percentage' ? `${benefit.benefit_value}%` : 
                               benefit.benefit_type === 'discount_fixed' ? formatPrice(Number(benefit.benefit_value)) : 
                               benefit.benefit_value}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {membership.status === 'active' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelMembership(membership.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Cancelling...' : 'Cancel Membership'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Membership Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">General Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="billing-status">Billing Status</Label>
              <Select value={newBillingStatus} onValueChange={setNewBillingStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select billing status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus} disabled={isProcessing}>
                {isProcessing ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
