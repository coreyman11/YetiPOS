import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Settings } from 'lucide-react';
import { rolesApi } from '@/services/roles-api';
import { toast } from 'sonner';
import { CreateRoleDialog } from './roles/CreateRoleDialog';
import { EditRoleDialog } from './roles/EditRoleDialog';
import { RolePermissionsDialog } from './roles/RolePermissionsDialog';
import { Role } from '@/types/database/roles';

export const RoleManagement = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll
  });

  const deleteRoleMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete role');
    }
  });

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setEditDialogOpen(true);
  };

  const handlePermissions = (role: Role) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  if (isLoading) {
    return <div>Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Role Management</h2>
          <p className="text-muted-foreground">
            Create and manage user roles and their permissions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{role.name}</CardTitle>
                {role.is_system && (
                  <Badge variant="secondary">System</Badge>
                )}
              </div>
              {role.description && (
                <CardDescription>{role.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePermissions(role)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  {!role.is_system && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(role)}
                      disabled={deleteRoleMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  Users
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedRole && (
        <>
          <EditRoleDialog
            role={selectedRole}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <RolePermissionsDialog
            role={selectedRole}
            open={permissionsDialogOpen}
            onOpenChange={setPermissionsDialogOpen}
          />
        </>
      )}
    </div>
  );
};