import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { permissionsApi } from '@/services/permissions-api';
import { userApi } from '@/services/user-api';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UserPermissionsMatrixProps {
  userId: string;
  userName: string;
}

export function UserPermissionsMatrix({ userId, userName }: UserPermissionsMatrixProps) {
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: permissionsApi.getAllPermissions,
  });

  const { data: userPermissions = [] } = useQuery({
    queryKey: ['user-permissions-admin', userId],
    queryFn: () => permissionsApi.getUserPermissions(userId),
    enabled: !!userId,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (changes: Record<string, boolean>) => {
      const updates = Object.entries(changes).map(([permissionId, granted]) => ({
        permissionId,
        granted,
      }));
      await permissionsApi.updateMultiplePermissions(userId, updates);
    },
    onSuccess: () => {
      toast.success('Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-permissions-admin', userId] });
      setPendingChanges({});
    },
    onError: (error) => {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: (roleId: string) => permissionsApi.assignRolePermissions(userId, roleId),
    onSuccess: () => {
      toast.success('Role permissions assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['user-permissions-admin', userId] });
      setPendingChanges({});
    },
    onError: (error) => {
      console.error('Error assigning role permissions:', error);
      toast.error('Failed to assign role permissions');
    },
  });

  // Create a map of current user permissions
  const userPermissionMap = (userPermissions || []).reduce((acc: Record<string, boolean>, up: any) => {
    acc[up.permission_id] = up.granted;
    return acc;
  }, {} as Record<string, boolean>);

  // Group permissions by category
  const permissionsByCategory = (allPermissions || []).reduce((acc: Record<string, any[]>, permission: any) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, any[]>);

  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    setPendingChanges(prev => ({
      ...prev,
      [permissionId]: granted,
    }));
  };

  const getPermissionState = (permissionId: string) => {
    return pendingChanges.hasOwnProperty(permissionId) 
      ? pendingChanges[permissionId]
      : userPermissionMap[permissionId] || false;
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const saveChanges = () => {
    if (hasChanges) {
      updatePermissionsMutation.mutate(pendingChanges);
    }
  };

  const cancelChanges = () => {
    setPendingChanges({});
  };

  const assignRolePermissions = (roleId: string) => {
    assignRoleMutation.mutate(roleId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions for {userName}</CardTitle>
        <CardDescription>
          Manage individual permissions or assign role-based permission sets
        </CardDescription>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {roles.map((role) => (
            <Button
              key={role.id}
              variant="outline"
              size="sm"
              onClick={() => assignRolePermissions(role.id)}
              disabled={assignRoleMutation.isPending}
            >
              Assign {role.name} Permissions
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {Object.entries(permissionsByCategory).map(([category, permissions]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {category.replace('_', ' ')}
              </Badge>
              <Separator className="flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(permissions as any[]).map((permission) => {
                const isGranted = getPermissionState(permission.id);
                const hasChange = pendingChanges.hasOwnProperty(permission.id);
                
                return (
                  <div
                    key={permission.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      hasChange ? 'bg-muted/50 border-primary/50' : 'bg-background'
                    }`}
                  >
                    <Checkbox
                      id={permission.id}
                      checked={isGranted}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(permission.id, !!checked)
                      }
                    />
                    <div className="space-y-1 flex-1">
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permission.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      {permission.description && (
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {hasChanges && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-primary/50">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {Object.keys(pendingChanges).length} change(s) pending
              </Badge>
              <span className="text-sm text-muted-foreground">
                Click Save to apply changes
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelChanges}
                disabled={updatePermissionsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}