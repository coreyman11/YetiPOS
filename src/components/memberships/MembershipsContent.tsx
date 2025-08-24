import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users, DollarSign, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { membershipsApi } from "@/services";

// Define types manually until database types are updated
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

// Force cache invalidation - v3.0
export const MembershipsContent = () => {
  const { userProfile, isAdmin, session } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [benefits, setBenefits] = useState<MembershipBenefit[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLocationsDialog, setShowLocationsDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [selectedPlanLocations, setSelectedPlanLocations] = useState<string[]>([]);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price_cents: 0,
    billing_interval: 'monthly',
    billing_interval_count: 1,
    max_members: undefined as number | undefined
  });
  const [editPlan, setEditPlan] = useState({
    name: '',
    description: '',
    price_cents: 0,
    billing_interval: 'monthly',
    billing_interval_count: 1,
    max_members: undefined as number | undefined
  });

  // Single useEffect for auth checks and data fetching
  useEffect(() => {
    // Only fetch data if user profile exists
    if (userProfile) {
      console.log('🔍 Memberships Debug - User Profile:', {
        id: userProfile?.id,
        email: userProfile?.email,
        role: userProfile?.role,
        role_name: userProfile?.role_name,
        isAdmin: isAdmin()
      });
      
      console.log('🔍 Fetching membership data for user:', userProfile.id);
      fetchMembershipData();
    } else {
      setLoading(false);
    }
  }, [userProfile?.id]); // Only depend on userProfile.id to avoid unnecessary re-runs

  const fetchMembershipData = async () => {
    if (!userProfile) {
      console.log('User profile not available, skipping membership data fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching membership data for user:', userProfile.id);

      // Fetch membership plans using the new API
      const plansData = await membershipsApi.getAll();
      console.log('✅ Successfully loaded', plansData?.length || 0, 'membership plans');
      setPlans(plansData as MembershipPlan[] || []);

      // Fetch membership benefits using the new API
      const benefitsData = await membershipsApi.getAllBenefits();
      console.log('✅ Successfully loaded', benefitsData?.length || 0, 'membership benefits');
      setBenefits(benefitsData as MembershipBenefit[] || []);

      // Fetch all locations for admin users
      if (isAdmin()) {
        const locationsData = await membershipsApi.getAllLocations();
        console.log('✅ Successfully loaded', locationsData?.length || 0, 'locations');
        setLocations(locationsData || []);
      }

    } catch (error) {
      console.error('❌ Error fetching membership data:', error);
      toast.error('Failed to load membership data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name.trim()) {
      toast.error('Plan name is required');
      return;
    }

    // Check session first
    if (!session?.user) {
      toast.error('You must be logged in to create membership plans');
      return;
    }

    if (!userProfile?.id) {
      toast.error('User profile not loaded. Please refresh the page.');
      return;
    }

    if (!isAdmin()) {
      toast.error('You must be an admin to create membership plans');
      return;
    }

    console.log('🔍 Session check passed:', {
      sessionUserId: session.user.id,
      userProfileId: userProfile.id,
      userRole: userProfile.role,
      isAdmin: isAdmin()
    });

    try {
      console.log('🔍 Creating membership plan...');
      
      const planData = {
        ...newPlan,
        price_cents: Math.round(newPlan.price_cents * 100), // Convert dollars to cents
      };

      console.log('📊 Plan data:', planData);
      
      const data = await membershipsApi.createPlan(planData);

      console.log('✅ Plan created successfully:', data);
      toast.success('Membership plan created successfully');
      setShowCreateDialog(false);
      setNewPlan({
        name: '',
        description: '',
        price_cents: 0,
        billing_interval: 'monthly',
        billing_interval_count: 1,
        max_members: undefined
      });
      fetchMembershipData();
    } catch (error) {
      console.error('❌ Error creating plan:', error);
      toast.error(`Failed to create membership plan: ${error.message}`);
    }
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setEditPlan({
      name: plan.name,
      description: plan.description || '',
      price_cents: plan.price_cents / 100, // Convert cents to dollars for display
      billing_interval: plan.billing_interval,
      billing_interval_count: plan.billing_interval_count,
      max_members: plan.max_members
    });
    setShowEditDialog(true);
  };

  const handleUpdatePlan = async () => {
    if (!editPlan.name.trim()) {
      toast.error('Plan name is required');
      return;
    }

    if (!selectedPlan) {
      toast.error('No plan selected for editing');
      return;
    }

    if (!isAdmin()) {
      toast.error('You must be an admin to update membership plans');
      return;
    }

    try {
      console.log('🔍 Updating membership plan...');
      
      const planData = {
        ...editPlan,
        price_cents: Math.round(editPlan.price_cents * 100), // Convert dollars to cents
      };

      console.log('📊 Plan update data:', planData);
      
      const data = await membershipsApi.updatePlan(selectedPlan.id, planData);

      console.log('✅ Plan updated successfully:', data);
      toast.success('Membership plan updated successfully');
      setShowEditDialog(false);
      setSelectedPlan(null);
      setEditPlan({
        name: '',
        description: '',
        price_cents: 0,
        billing_interval: 'monthly',
        billing_interval_count: 1,
        max_members: undefined
      });
      fetchMembershipData();
    } catch (error) {
      console.error('❌ Error updating plan:', error);
      toast.error(`Failed to update membership plan: ${error.message}`);
    }
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

  const handleManageLocations = async (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    try {
      const planLocations = await membershipsApi.getPlanLocations(plan.id);
      setSelectedPlanLocations(planLocations.map(loc => loc.location_id));
      setShowLocationsDialog(true);
    } catch (error) {
      console.error('Error fetching plan locations:', error);
      toast.error('Failed to load plan locations');
    }
  };

  const handleSaveLocations = async () => {
    if (!selectedPlan) return;
    
    try {
      await membershipsApi.addPlanLocations(selectedPlan.id, selectedPlanLocations);
      toast.success('Plan locations updated successfully');
      setShowLocationsDialog(false);
      fetchMembershipData(); // Refresh data
    } catch (error) {
      console.error('Error updating plan locations:', error);
      toast.error('Failed to update plan locations');
    }
  };

  const getPlanLocationNames = (plan: any) => {
    if (!plan.membership_plan_locations) return [];
    return plan.membership_plan_locations
      .map(loc => locations.find(l => l.id === loc.location_id)?.name)
      .filter(Boolean);
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show not authenticated state
  if (!userProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-6">
              Please log in to access membership management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Membership Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    placeholder="e.g., Premium Membership"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newPlan.price_cents}
                    onChange={(e) => setNewPlan({ ...newPlan, price_cents: parseFloat(e.target.value) || 0 })}
                    placeholder="29.99"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  placeholder="Describe the benefits and features of this plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billing_interval">Billing Interval</Label>
                  <Select 
                    value={newPlan.billing_interval} 
                    onValueChange={(value) => setNewPlan({ ...newPlan, billing_interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max_members">Max Members (optional)</Label>
                  <Input
                    id="max_members"
                    type="number"
                    value={newPlan.max_members || ''}
                    onChange={(e) => setNewPlan({ 
                      ...newPlan, 
                      max_members: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan}>
                  Create Plan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Membership Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Plan Name</Label>
                  <Input
                    id="edit-name"
                    value={editPlan.name}
                    onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                    placeholder="e.g., Premium Membership"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Price (USD)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editPlan.price_cents}
                    onChange={(e) => setEditPlan({ ...editPlan, price_cents: parseFloat(e.target.value) || 0 })}
                    placeholder="29.99"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editPlan.description}
                  onChange={(e) => setEditPlan({ ...editPlan, description: e.target.value })}
                  placeholder="Describe the benefits and features of this plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-billing_interval">Billing Interval</Label>
                  <Select 
                    value={editPlan.billing_interval} 
                    onValueChange={(value) => setEditPlan({ ...editPlan, billing_interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-max_members">Max Members (optional)</Label>
                  <Input
                    id="edit-max_members"
                    type="number"
                    value={editPlan.max_members || ''}
                    onChange={(e) => setEditPlan({ 
                      ...editPlan, 
                      max_members: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePlan}>
                  Update Plan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Store Locations Dialog */}
        <Dialog open={showLocationsDialog} onOpenChange={setShowLocationsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Store Locations</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select which stores this plan should be available in:
              </p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={location.id}
                      checked={selectedPlanLocations.includes(location.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPlanLocations([...selectedPlanLocations, location.id]);
                        } else {
                          setSelectedPlanLocations(selectedPlanLocations.filter(id => id !== location.id));
                        }
                      }}
                    />
                    <Label htmlFor={location.id} className="text-sm font-normal">
                      {location.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowLocationsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveLocations}>
                  Save Locations
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>


      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Membership Plans</h3>
            <p className="text-muted-foreground mb-6">
              Create your first membership plan to start offering subscriptions to your customers.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active Stores</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-muted-foreground">
                            {plan.description}
                          </div>
                        )}
                        {plan.max_members && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Max {plan.max_members} members
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {formatPrice(plan.price_cents)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{plan.billing_interval}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getPlanLocationNames(plan).map((locationName, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {locationName}
                          </Badge>
                        ))}
                        {getPlanLocationNames(plan).length === 0 && (
                          <span className="text-muted-foreground text-sm">No stores assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getPlanBenefits(plan.id).length > 0 ? (
                          <>
                            {getPlanBenefits(plan.id).slice(0, 2).map((benefit) => (
                              <div key={benefit.id} className="text-sm text-muted-foreground">
                                • {benefit.description}
                                {benefit.benefit_value && (
                                  <span className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">
                                    {benefit.benefit_type === 'discount_percentage' 
                                      ? `${benefit.benefit_value}%` 
                                      : formatPrice(Number(benefit.benefit_value))}
                                  </span>
                                )}
                              </div>
                            ))}
                            {getPlanBenefits(plan.id).length > 2 && (
                              <div className="text-sm text-muted-foreground">
                                +{getPlanBenefits(plan.id).length - 2} more
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            No benefits defined
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end items-center">
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleEditPlan(plan);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {isAdmin() && (
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleManageLocations(plan);
                          }}>
                            <MapPin className="w-4 h-4" />
                          </Button>
                        )}
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
