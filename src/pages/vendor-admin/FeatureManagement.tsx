import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ToggleLeft, 
  Search, 
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Building2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  is_core: boolean;
  is_visible: boolean;
  created_at: string;
}

interface FeatureToggleStats {
  feature_id: string;
  enabled_count: number;
  total_count: number;
  locations: Array<{
    id: string;
    name: string;
    is_enabled: boolean;
  }>;
}

export const FeatureManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureDefinition | null>(null);
  const queryClient = useQueryClient();

  // Form state for creating/editing features
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    is_core: false,
    is_visible: true
  });

  // Get all feature definitions
  const { data: features = [], isLoading } = useQuery({
    queryKey: ['vendor-feature-definitions'],
    queryFn: async (): Promise<FeatureDefinition[]> => {
      const { data, error } = await supabase
        .from('feature_definitions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get feature toggle statistics
  const { data: featureStats = [] } = useQuery({
    queryKey: ['vendor-feature-stats'],
    queryFn: async (): Promise<FeatureToggleStats[]> => {
      const { data: togglesData, error } = await supabase
        .from('feature_toggles')
        .select(`
          feature_id,
          is_enabled,
          location_id
        `);
      
      if (error) throw error;
      
      // Get locations separately to avoid join issues
      const { data: locationsData, error: locError } = await supabase
        .from('locations')
        .select('id, name');
        
      if (locError) throw locError;

      // Create locations lookup
      const locationsMap = new Map(locationsData?.map(loc => [loc.id, loc.name]) || []);
      
      // Group by feature_id and calculate stats
      const statsMap = new Map<string, FeatureToggleStats>();
      
      (togglesData || []).forEach((toggle: any) => {
        if (!statsMap.has(toggle.feature_id)) {
          statsMap.set(toggle.feature_id, {
            feature_id: toggle.feature_id,
            enabled_count: 0,
            total_count: 0,
            locations: []
          });
        }
        
        const stats = statsMap.get(toggle.feature_id)!;
        stats.total_count++;
        if (toggle.is_enabled) {
          stats.enabled_count++;
        }
        
        stats.locations.push({
          id: toggle.location_id,
          name: locationsMap.get(toggle.location_id) || 'Unknown Location',
          is_enabled: toggle.is_enabled
        });
      });

      return Array.from(statsMap.values());
    }
  });

  // Create feature mutation
  const createFeatureMutation = useMutation({
    mutationFn: async (data: Omit<FeatureDefinition, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('feature_definitions')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-feature-definitions'] });
      toast.success('Feature created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating feature:', error);
      toast.error('Failed to create feature');
    }
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FeatureDefinition>) => {
      const { data: result, error } = await supabase
        .from('feature_definitions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-feature-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['feature-toggle'] }); // Invalidate all feature toggles
      queryClient.invalidateQueries({ queryKey: ['feature-toggles'] }); // Invalidate location toggles
      toast.success('Feature updated successfully');
      setEditingFeature(null);
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating feature:', error);
      toast.error('Failed to update feature');
    }
  });

  // Delete feature mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feature_definitions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-feature-definitions'] });
      toast.success('Feature deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting feature:', error);
      toast.error('Failed to delete feature');
    }
  });

  // Global toggle mutation (enable/disable feature for all locations)
  const globalToggleMutation = useMutation({
    mutationFn: async ({ featureId, enabled }: { featureId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_toggles')
        .update({ is_enabled: enabled })
        .eq('feature_id', featureId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-feature-stats'] });
      queryClient.invalidateQueries({ queryKey: ['feature-toggle'] });
      queryClient.invalidateQueries({ queryKey: ['feature-toggles'] });
      queryClient.invalidateQueries({ queryKey: ['all-feature-toggles'] });
      toast.success('Global feature toggle updated');
    },
    onError: (error) => {
      console.error('Error updating global toggle:', error);
      toast.error('Failed to update global toggle');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      is_core: false,
      is_visible: true
    });
  };

  const handleCreateFeature = () => {
    createFeatureMutation.mutate(formData);
  };

  const handleUpdateFeature = () => {
    if (!editingFeature) return;
    updateFeatureMutation.mutate({ ...editingFeature, ...formData });
  };

  const handleDeleteFeature = (id: string, isCore: boolean) => {
    if (isCore) {
      toast.error('Cannot delete core features');
      return;
    }
    
    if (confirm('Are you sure you want to delete this feature? This will remove it from all customer locations.')) {
      deleteFeatureMutation.mutate(id);
    }
  };

  const handleEditFeature = (feature: FeatureDefinition) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description,
      category: feature.category,
      is_core: feature.is_core,
      is_visible: feature.is_visible ?? true
    });
  };

  const handleGlobalToggle = (featureId: string, enabled: boolean) => {
    globalToggleMutation.mutate({ featureId, enabled });
  };

  // Location-specific toggle mutation
  const locationToggleMutation = useMutation({
    mutationFn: async ({ featureId, locationId, enabled }: { featureId: string; locationId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_toggles')
        .update({ is_enabled: enabled })
        .eq('feature_id', featureId)
        .eq('location_id', locationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-feature-stats'] });
      queryClient.invalidateQueries({ queryKey: ['feature-toggle'] });
      queryClient.invalidateQueries({ queryKey: ['feature-toggles'] });
      queryClient.invalidateQueries({ queryKey: ['all-feature-toggles'] });
      toast.success('Feature toggle updated');
    },
    onError: (error) => {
      console.error('Error updating feature toggle:', error);
      toast.error('Failed to update feature toggle');
    }
  });

  const handleLocationToggle = (featureId: string, locationId: string, enabled: boolean) => {
    locationToggleMutation.mutate({ featureId, locationId, enabled });
  };

  // Filter features
  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(features.map(f => f.category))];

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
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Feature Management</h1>
          <p className="text-muted-foreground">
            Manage system features and their availability across customer locations.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Feature</DialogTitle>
              <DialogDescription>
                Add a new feature that can be toggled for customer locations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Feature Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., inventory_management"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this feature does..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="customer_management">Customer Management</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_visible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                />
                <label className="text-sm font-medium">Visible to Customers</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_core}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_core: checked })}
                />
                <label className="text-sm font-medium">Core Feature (cannot be disabled)</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFeature}
                disabled={createFeatureMutation.isPending || !formData.name.trim()}
              >
                Create Feature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filter Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
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
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <div className="space-y-4">
        {filteredFeatures.map((feature) => {
          const stats = featureStats.find(s => s.feature_id === feature.id);
          const enabledPercentage = stats?.total_count ? Math.round((stats.enabled_count / stats.total_count) * 100) : 0;
          
          return (
            <Card key={feature.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">
                        {feature.name.replace(/_/g, ' ')}
                      </CardTitle>
                      <Badge variant={feature.is_core ? "secondary" : "outline"}>
                        {feature.is_core ? 'Core' : feature.category}
                      </Badge>
                      {!feature.is_visible && (
                        <Badge variant="destructive">Hidden</Badge>
                      )}
                    </div>
                    <CardDescription>{feature.description}</CardDescription>
                    {stats && (
                      <div className="text-sm text-muted-foreground">
                        {stats.enabled_count} of {stats.total_count} locations enabled ({enabledPercentage}%)
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Visibility Toggle */}
                    <div className="flex items-center space-x-2 mr-4">
                      <Switch
                        checked={feature.is_visible ?? true}
                        onCheckedChange={(checked) => {
                          updateFeatureMutation.mutate({ 
                            id: feature.id, 
                            is_visible: checked 
                          });
                        }}
                        disabled={updateFeatureMutation.isPending}
                      />
                      <span className="text-xs text-muted-foreground">{feature.is_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                    {!feature.is_core && stats && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGlobalToggle(feature.id, true)}
                          disabled={globalToggleMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Enable All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGlobalToggle(feature.id, false)}
                          disabled={globalToggleMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Disable All
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFeature(feature)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!feature.is_core && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeature(feature.id, feature.is_core)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {stats && stats.locations.length > 0 && (
                <CardContent>
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-secondary h-2 rounded-full">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${enabledPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Location Status Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {stats.locations.map((location) => (
                        <div 
                          key={location.id}
                          className="flex items-center justify-between p-2 border border-border rounded text-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{location.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!feature.is_core && (
                              <Switch
                                checked={location.is_enabled}
                                onCheckedChange={(checked) => handleLocationToggle(feature.id, location.id, checked)}
                                disabled={locationToggleMutation.isPending}
                              />
                            )}
                            <Badge variant={location.is_enabled ? "secondary" : "outline"} className="text-xs">
                              {location.is_enabled ? 'On' : 'Off'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit Feature Dialog */}
      <Dialog open={!!editingFeature} onOpenChange={(open) => !open && setEditingFeature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
            <DialogDescription>
              Update the feature configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Feature Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., inventory_management"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this feature does..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="reporting">Reporting</SelectItem>
                  <SelectItem value="customer_management">Customer Management</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_core}
                onCheckedChange={(checked) => setFormData({ ...formData, is_core: checked })}
              />
              <label className="text-sm font-medium">Core Feature (cannot be disabled)</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFeature(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateFeature}
              disabled={updateFeatureMutation.isPending || !formData.name.trim()}
            >
              Update Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredFeatures.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ToggleLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No features found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'Create your first feature to get started.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeatureManagement;