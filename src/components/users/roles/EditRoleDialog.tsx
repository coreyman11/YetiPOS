import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { rolesApi } from '@/services/roles-api';
import { toast } from 'sonner';
import { Role } from '@/types/database/roles';

interface EditRoleDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditRoleDialog = ({ role, open, onOpenChange }: EditRoleDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
    }
  }, [role]);

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      rolesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error updating role:', error);
      if (error?.code === '403' || error?.status === 403) {
        toast.error('You do not have permission to edit roles. Please contact your administrator.');
      } else if (error?.code === '42501') {
        toast.error('You do not have permission to modify role permissions. Please contact your administrator.');
      } else {
        toast.error(error.message || 'Failed to update role');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }

    updateMutation.mutate({
      id: role.id,
      updates: {
        name: name.trim(),
        description: description.trim() || undefined
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Role: {role?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter role name"
              disabled={role?.is_system}
              required
            />
            {role?.is_system && (
              <p className="text-sm text-muted-foreground mt-1">
                System role names cannot be changed
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter role description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};