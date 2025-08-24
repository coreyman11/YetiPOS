import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, 
  Search, 
  Filter,
  Settings,
  ToggleLeft,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { featureTogglesApi } from '@/services/feature-toggles-api';
import { useFeatureDefinitions } from '@/hooks/useFeatureToggle';
import { toast } from 'sonner';

interface LocationWithFeatures {
  id: string;
  name: string;
  featureToggles: Array<{
    id: string;
    feature_id: string;
    is_enabled: boolean;
    feature_definition?: {
      name: string;
      description: string;
      category: string;
      is_core: boolean;
    };
  }>;
}

export const CustomerManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: featureDefinitions = [] } = useFeatureDefinitions();

  // Get all locations with their feature toggles
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['vendor-customer-locations'],
    queryFn: async (): Promise<LocationWithFeatures[]> => {
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (locationsError) throw locationsError;

      const locationsWithFeatures = await Promise.all(
        (locationsData || []).map(async (location) => {
          const featureToggles = await featureTogglesApi.getFeatureTogglesForLocation(location.id);
          return {
            ...location,
            featureToggles
          };
        })
      );

      return locationsWithFeatures;
    }
  });

  // Toggle feature mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ toggleId, isEnabled }: { toggleId: string; isEnabled: boolean }) => {
      return featureTogglesApi.updateFeatureToggle(toggleId, isEnabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-customer-locations'] });
      toast.success('Feature toggle updated successfully');
    },
    onError: (error) => {
      console.error('Error updating feature toggle:', error);
      toast.error('Failed to update feature toggle');
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ locationId, updates }: { 
      locationId: string; 
      updates: Array<{ featureId: string; isEnabled: boolean }> 
    }) => {
      return featureTogglesApi.bulkUpdateFeatureToggles(locationId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-customer-locations'] });
      toast.success('Bulk update completed successfully');
    },
    onError: (error) => {
      console.error('Error with bulk update:', error);
      toast.error('Failed to complete bulk update');
    }
  });

  // Filter locations based on search
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique categories
  const categories = ['all', ...new Set(featureDefinitions.map(fd => fd.category))];

  const handleFeatureToggle = (toggleId: string, currentState: boolean) => {
    toggleFeatureMutation.mutate({ toggleId, isEnabled: !currentState });
  };

  const handleBulkEnable = (locationId: string, category?: string) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;

    const updates = location.featureToggles
      .filter(toggle => {
        if (category && category !== 'all') {
          return toggle.feature_definition.category === category;
        }
        return true;
      })
      .map(toggle => ({
        featureId: toggle.feature_id,
        isEnabled: true
      }));

    bulkUpdateMutation.mutate({ locationId, updates });
  };

  const handleBulkDisable = (locationId: string, category?: string) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;

    const updates = location.featureToggles
      .filter(toggle => {
        // Don't disable core features
        if (toggle.feature_definition.is_core) return false;
        
        if (category && category !== 'all') {
          return toggle.feature_definition.category === category;
        }
        return true;
      })
      .map(toggle => ({
        featureId: toggle.feature_id,
        isEnabled: false
      }));

    bulkUpdateMutation.mutate({ locationId, updates });
  };

  if (isLoading) {
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
        <p className="text-muted-foreground">
          Manage feature access for customer locations.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Customers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Locations */}
      <div className="space-y-4">
        {filteredLocations.map((location) => {
          const featuresToShow = selectedCategory === 'all' 
            ? location.featureToggles 
            : location.featureToggles.filter(ft => ft.feature_definition.category === selectedCategory);

          const enabledCount = featuresToShow.filter(ft => ft.is_enabled).length;
          const totalCount = featuresToShow.length;
          const enabledPercentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;

          return (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>{location.name}</CardTitle>
                      <CardDescription>
                        {enabledCount} of {totalCount} features enabled ({enabledPercentage}%)
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkEnable(location.id, selectedCategory === 'all' ? undefined : selectedCategory)}
                      disabled={bulkUpdateMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enable All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkDisable(location.id, selectedCategory === 'all' ? undefined : selectedCategory)}
                      disabled={bulkUpdateMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Disable All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Feature Adoption</span>
                      <span>{enabledPercentage}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${enabledPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Feature Toggles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuresToShow.map((toggle) => (
                      <div 
                        key={toggle.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {toggle.feature_definition.name.replace(/_/g, ' ')}
                            </span>
                            {toggle.feature_definition.is_core && (
                              <Badge variant="secondary" className="text-xs">Core</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {toggle.feature_definition.description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {toggle.feature_definition.category}
                          </Badge>
                        </div>
                        <Switch
                          checked={toggle.is_enabled}
                          onCheckedChange={() => handleFeatureToggle(toggle.id, toggle.is_enabled)}
                          disabled={toggle.feature_definition.is_core || toggleFeatureMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>

                  {featuresToShow.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No features found for the selected category.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No customers found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No customer locations are configured yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerManagement;