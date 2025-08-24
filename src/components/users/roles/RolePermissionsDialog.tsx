
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { rolesApi } from '@/services/roles-api';
import { permissionsApi } from '@/services/permissions-api';
import { toast } from 'sonner';
import { Role } from '@/types/database/roles';

interface RolePermissionsDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RolePermissionsDialog = ({ role, open, onOpenChange }: RolePermissionsDialogProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: permissionsApi.getAllPermissions
  });

  const { data: rolePermissions = [], isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['role-permissions', role?.id],
    queryFn: () => role ? rolesApi.getPermissions(role.id) : [],
    enabled: !!role
  });

  useEffect(() => {
    console.log('🔍 Role permissions effect triggered', {
      rolePermissionsLength: rolePermissions?.length,
      isLoadingPermissions,
      roleId: role?.id
    });

    if (!isLoadingPermissions && rolePermissions) {
      if (rolePermissions.length > 0) {
        console.log('Role permissions loaded:', rolePermissions);
        const grantedPermissions = new Set(
          rolePermissions
            .filter(rp => rp.granted)
            .map(rp => rp.permission_id)
        );
        setSelectedPermissions(grantedPermissions);
      } else {
        console.log('No role permissions found, setting empty set');
        setSelectedPermissions(new Set());
      }
    }
  }, [rolePermissions, isLoadingPermissions, role?.id]);

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      console.log('Updating permissions for role:', roleId, 'with permissions:', permissionIds);
      return rolesApi.setPermissions(roleId, permissionIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast.success('Role permissions updated successfully');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Error updating permissions:', error);
      toast.error(error.message || 'Failed to update permissions');
    }
  });

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions);
    if (checked) {
      newSelected.add(permissionId);
    } else {
      newSelected.delete(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSubmit = () => {
    updatePermissionsMutation.mutate({
      roleId: role.id,
      permissionIds: Array.from(selectedPermissions)
    });
  };

  // Group permissions by category
  const permissionsByCategory = (allPermissions as any[]).reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, any[]>);

  console.log('Dialog state:', {
    roleId: role?.id,
    allPermissionsCount: allPermissions.length,
    rolePermissionsCount: rolePermissions.length,
    selectedPermissionsCount: selectedPermissions.size,
    isLoadingPermissions,
    permissionsByCategory: Object.keys(permissionsByCategory)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions: {role?.name}</DialogTitle>
        </DialogHeader>

        {isLoadingPermissions ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground">Loading permissions...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(permissionsByCategory).map(([category, permissions]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  {category.replace('_', ' ')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(permissions as any[]).map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.has(permission.id)}
                        onCheckedChange={(checked) => 
                          handlePermissionToggle(permission.id, checked as boolean)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <p className="text-sm text-muted-foreground">
            {selectedPermissions.size} of {(allPermissions as any[]).length} permissions selected
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updatePermissionsMutation.isPending}
            >
              {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
