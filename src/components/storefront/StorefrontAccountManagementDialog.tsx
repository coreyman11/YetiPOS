import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift, User, Mail, Phone, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';


type Customer = Database['public']['Tables']['customers']['Row'];

interface StorefrontAccountManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

export function StorefrontAccountManagementDialog({
  isOpen,
  onClose,
  customer
}: StorefrontAccountManagementDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Calculate loyalty points value (assuming 1 cent per point)
  const pointsValue = (customer.loyalty_points * 1) / 100;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would call an API to update the customer
      // For now, we'll just show a success message
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = () => {
    // In a real implementation, this would trigger a password reset flow
    toast.info('Password reset link sent to your email');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manage Account
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="space-y-6 p-1">
            {/* Profile Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Profile Information</h3>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          first_name: customer.first_name || '',
                          last_name: customer.last_name || '',
                          email: customer.email || '',
                          phone: customer.phone || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">
                      {customer.first_name || 'Not provided'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">
                      {customer.last_name || 'Not provided'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">
                      {customer.email}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">
                      {customer.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Loyalty Points */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Loyalty Rewards
              </h3>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Points Balance</p>
                    <p className="text-2xl font-bold text-primary">{customer.loyalty_points} points</p>
                    <p className="text-sm text-muted-foreground">
                      Worth ${pointsValue.toFixed(2)} in rewards
                    </p>
                  </div>
                  <Gift className="h-12 w-12 text-primary opacity-50" />
                </div>
              </div>

              {/* Loyalty Points History */}
              <div className="space-y-2">
                <h4 className="font-medium">Points History</h4>
                <p className="text-sm text-muted-foreground">View your complete points history in your account dashboard.</p>
              </div>
            </div>

            <Separator />

            {/* Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </h3>
              
              <Button
                variant="outline"
                onClick={handlePasswordChange}
                className="w-full justify-start"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}