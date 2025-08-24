import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save,
  Database,
  Shield,
  Bell,
  Mail,
  Globe,
  Users,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface VendorSettings {
  id: string;
  company_name: string;
  company_description: string;
  contact_email: string;
  support_email: string;
  website_url: string;
  max_locations_per_customer: number;
  default_feature_set: string[];
  notification_settings: {
    email_notifications: boolean;
    audit_alerts: boolean;
    usage_reports: boolean;
    security_alerts: boolean;
  };
  security_settings: {
    require_2fa: boolean;
    session_timeout_minutes: number;
    password_policy: {
      min_length: number;
      require_uppercase: boolean;
      require_lowercase: boolean;
      require_numbers: boolean;
      require_symbols: boolean;
    };
  };
  billing_settings: {
    default_currency: string;
    payment_terms_days: number;
    auto_suspend_overdue: boolean;
    grace_period_days: number;
  };
  created_at: string;
  updated_at: string;
}

interface SystemStats {
  total_customers: number;
  total_locations: number;
  total_users: number;
  active_features: number;
  system_uptime: string;
  database_size: string;
}

export const VendorSettings: React.FC = () => {
  const [formData, setFormData] = useState<Partial<VendorSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Get vendor settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['vendor-settings'],
    queryFn: async (): Promise<VendorSettings | null> => {
      const { data, error } = await supabase
        .from('vendor_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Set form data when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Get system statistics
  const { data: stats } = useQuery({
    queryKey: ['vendor-system-stats'],
    queryFn: async (): Promise<SystemStats> => {
      const [customers, locations, users, features] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('locations').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('feature_definitions').select('id', { count: 'exact', head: true })
      ]);

      return {
        total_customers: customers.count || 0,
        total_locations: locations.count || 0,
        total_users: users.count || 0,
        active_features: features.count || 0,
        system_uptime: '99.9%', // This would come from monitoring
        database_size: '2.4 GB' // This would come from monitoring
      };
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<VendorSettings>) => {
      if (settings?.id) {
        const { data: result, error } = await supabase
          .from('vendor_settings')
          .update(data)
          .eq('id', settings.id)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('vendor_settings')
          .insert([data])
          .select()
          .single();
        
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-settings'] });
      toast.success('Settings saved successfully');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(formData);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const updateNestedFormData = (parentField: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField] as any,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Vendor Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences.
          </p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          disabled={!hasChanges || saveSettingsMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_customers || 0}</div>
            <p className="text-xs text-muted-foreground">Active customer accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_locations || 0}</div>
            <p className="text-xs text-muted-foreground">Customer locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.system_uptime || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.database_size || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Total storage used</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Company Information</span>
          </CardTitle>
          <CardDescription>
            Basic company details and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={formData.company_name || ''}
                onChange={(e) => updateFormData('company_name', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Website URL</label>
              <Input
                value={formData.website_url || ''}
                onChange={(e) => updateFormData('website_url', e.target.value)}
                placeholder="https://yourcompany.com"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Company Description</label>
            <Textarea
              value={formData.company_description || ''}
              onChange={(e) => updateFormData('company_description', e.target.value)}
              placeholder="Brief description of your company..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Contact Email</label>
              <Input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => updateFormData('contact_email', e.target.value)}
                placeholder="contact@yourcompany.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Support Email</label>
              <Input
                type="email"
                value={formData.support_email || ''}
                onChange={(e) => updateFormData('support_email', e.target.value)}
                placeholder="support@yourcompany.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Customer Limits</span>
          </CardTitle>
          <CardDescription>
            Configure default limits for customer accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Max Locations per Customer</label>
            <Input
              type="number"
              value={formData.max_locations_per_customer || 1}
              onChange={(e) => updateFormData('max_locations_per_customer', parseInt(e.target.value))}
              min="1"
              max="100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of locations a single customer can have
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
          <CardDescription>
            Configure when and how you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Email Notifications</label>
                <p className="text-xs text-muted-foreground">
                  Receive general notifications via email
                </p>
              </div>
              <Switch
                checked={formData.notification_settings?.email_notifications ?? true}
                onCheckedChange={(checked) => 
                  updateNestedFormData('notification_settings', 'email_notifications', checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Audit Alerts</label>
                <p className="text-xs text-muted-foreground">
                  Get alerted for important security events
                </p>
              </div>
              <Switch
                checked={formData.notification_settings?.audit_alerts ?? true}
                onCheckedChange={(checked) => 
                  updateNestedFormData('notification_settings', 'audit_alerts', checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Usage Reports</label>
                <p className="text-xs text-muted-foreground">
                  Receive weekly usage and analytics reports
                </p>
              </div>
              <Switch
                checked={formData.notification_settings?.usage_reports ?? false}
                onCheckedChange={(checked) => 
                  updateNestedFormData('notification_settings', 'usage_reports', checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Security Alerts</label>
                <p className="text-xs text-muted-foreground">
                  Immediate alerts for security incidents
                </p>
              </div>
              <Switch
                checked={formData.notification_settings?.security_alerts ?? true}
                onCheckedChange={(checked) => 
                  updateNestedFormData('notification_settings', 'security_alerts', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
          <CardDescription>
            Configure security policies and requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Require Two-Factor Authentication</label>
              <p className="text-xs text-muted-foreground">
                Enforce 2FA for all vendor admin accounts
              </p>
            </div>
            <Switch
              checked={formData.security_settings?.require_2fa ?? false}
              onCheckedChange={(checked) => 
                updateNestedFormData('security_settings', 'require_2fa', checked)
              }
            />
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium">Session Timeout (minutes)</label>
            <Input
              type="number"
              value={formData.security_settings?.session_timeout_minutes || 60}
              onChange={(e) => 
                updateNestedFormData('security_settings', 'session_timeout_minutes', parseInt(e.target.value))
              }
              min="15"
              max="480"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How long before idle sessions are automatically logged out
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Changes Button (Sticky) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm">You have unsaved changes</span>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saveSettingsMutation.isPending}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VendorSettings;