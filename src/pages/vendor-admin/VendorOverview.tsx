import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  ToggleLeft, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAllFeatureToggles, useVendorAdminAuditLogs } from '@/hooks/useFeatureToggle';

export const VendorOverview: React.FC = () => {
  const { data: featureToggles = [] } = useAllFeatureToggles();
  const { data: recentAuditLogs = [] } = useVendorAdminAuditLogs(undefined, undefined, 10);

  // Get customer locations count
  const { data: locationsData } = useQuery({
    queryKey: ['vendor-overview-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate statistics
  const totalLocations = locationsData?.length || 0;
  const featuresPerLocation = featureToggles.reduce((acc, toggle) => {
    if (!acc[toggle.location_id]) {
      acc[toggle.location_id] = { enabled: 0, disabled: 0 };
    }
    if (toggle.is_enabled) {
      acc[toggle.location_id].enabled++;
    } else {
      acc[toggle.location_id].disabled++;
    }
    return acc;
  }, {} as Record<string, { enabled: number; disabled: number }>);

  const totalFeatureToggles = featureToggles.length;
  const enabledFeatures = featureToggles.filter(ft => ft.is_enabled).length;
  const disabledFeatures = totalFeatureToggles - enabledFeatures;

  const statCards = [
    {
      title: 'Customer Locations',
      value: totalLocations,
      description: 'Active customer locations',
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      title: 'Feature Toggles',
      value: totalFeatureToggles,
      description: 'Total feature configurations',
      icon: ToggleLeft,
      color: 'text-green-600',
    },
    {
      title: 'Enabled Features',
      value: enabledFeatures,
      description: 'Currently active features',
      icon: CheckCircle,
      color: 'text-emerald-600',
    },
    {
      title: 'Disabled Features',
      value: disabledFeatures,
      description: 'Currently inactive features',
      icon: AlertCircle,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Vendor Admin Overview</h1>
        <p className="text-muted-foreground">
          Manage customer features, monitor usage, and control system-wide settings.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Customer Management</span>
            </CardTitle>
            <CardDescription>
              Manage customer accounts and their feature access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {totalLocations} active customer locations
              </p>
              <div className="flex space-x-2">
                <Link to="/vendor-admin/customers" className="flex-1">
                  <Button className="w-full">View Customers</Button>
                </Link>
                <Link to="/vendor-admin/features">
                  <Button variant="outline">Feature Matrix</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ToggleLeft className="h-5 w-5" />
              <span>Feature Management</span>
            </CardTitle>
            <CardDescription>
              Control feature availability across all customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Enabled</span>
                <Badge variant="secondary">{enabledFeatures}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Disabled</span>
                <Badge variant="outline">{disabledFeatures}</Badge>
              </div>
              <Link to="/vendor-admin/features" className="block">
                <Button className="w-full">Manage Features</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest vendor admin actions and changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAuditLogs.length > 0 ? (
              <div className="space-y-3">
                {recentAuditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-foreground">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                <Link to="/vendor-admin/audit">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Logs
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Location Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Location Overview</span>
            </CardTitle>
            <CardDescription>
              Feature adoption across customer locations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {locationsData && locationsData.length > 0 ? (
              <div className="space-y-3">
                {locationsData.slice(0, 5).map((location) => {
                  const stats = featuresPerLocation[location.id] || { enabled: 0, disabled: 0 };
                  const total = stats.enabled + stats.disabled;
                  const enabledPercentage = total > 0 ? Math.round((stats.enabled / total) * 100) : 0;
                  
                  return (
                    <div key={location.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">
                          {location.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {enabledPercentage}% enabled
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${enabledPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {locationsData.length > 5 && (
                  <Link to="/vendor-admin/customers">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Locations
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No customer locations found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorOverview;