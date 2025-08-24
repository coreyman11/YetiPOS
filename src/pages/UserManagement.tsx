
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/services/user-api";
import { toast } from "sonner";
import { Edit2, Plus, RefreshCw, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPermissionsMatrix } from "@/components/users/UserPermissionsMatrix";
import { RoleManagement } from "@/components/users/RoleManagement";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  role_id?: string | null;
  full_name: string | null;
  created_at: string;
  employee_code?: string | null;
  allowed_locations?: string[] | null;
}

interface Location {
  id: string;
  name: string;
}

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "employee",
    employee_code: "",
    allowed_locations: [] as string[]
  });
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "",
    employee_code: "",
    allowed_locations: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { userProfile, isAdmin } = useAuth();

  // Debug logging for permissions
  useEffect(() => {
    console.log('UserManagement - User Profile:', {
      id: userProfile?.id,
      email: userProfile?.email,
      role: userProfile?.role,
      role_name: userProfile?.role_name,
      isAdmin: isAdmin()
    });
  }, [userProfile, isAdmin]);

  const { 
    data: users = [], 
    refetch, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAllUsers,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: userApi.getLocations,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, role_scope')
        .order('name');
      if (error) throw error;
      console.log('Loaded roles:', data);
      // Filter out vendor admin roles from regular user management
      return data?.filter(role => role.role_scope !== 'vendor') || [];
    },
  });

  // Log users data for debugging
  useEffect(() => {
    if (users.length > 0) {
      console.log('Users loaded:', users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        role_type: typeof u.role
      })));
    }
  }, [users]);

  const handleEditClick = (user: UserProfile) => {
    // Clear any previous error messages
    setErrorMessage(null);
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || "",
      role: user.role,
      employee_code: user.employee_code || "",
      allowed_locations: user.allowed_locations || []
    });
  };

  const handleSave = async () => {
    if (!editingUser || isSubmitting) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      console.log("Saving user updates:", editingUser.id, editForm);
      await userApi.updateUser(editingUser.id, {
        full_name: editForm.full_name || null,
        role: editForm.role,
        employee_code: editForm.employee_code || null,
        allowed_locations: editForm.allowed_locations
      });
      await refetch();
      setEditingUser(null);
      toast.success("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      
      // Handle specific error messages
      const errorMsg = error.message || "Failed to update user";
      setErrorMessage(errorMsg);
      
      // Also show a toast for immediate feedback
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmployee = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      await userApi.createUser({
        email: newEmployee.email,
        password: newEmployee.password,
        full_name: newEmployee.full_name,
        role: newEmployee.role,
        employee_code: newEmployee.employee_code || undefined,
        allowed_locations: newEmployee.allowed_locations.length > 0 ? newEmployee.allowed_locations : undefined
      });
      await refetch();
      setIsAddingEmployee(false);
      setNewEmployee({
        email: "",
        full_name: "",
        password: "",
        role: "employee",
        employee_code: "",
        allowed_locations: []
      });
      toast.success("Employee added successfully");
    } catch (error) {
      console.error("Error adding employee:", error);
      
      // Handle specific error messages
      const errorMsg = error.message || "Failed to add employee";
      setErrorMessage(errorMsg);
      
      // Also show a toast for immediate feedback
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationToggle = (locationId: string, context: 'new' | 'edit') => {
    if (context === 'new') {
      setNewEmployee(prev => {
        const currentLocations = [...prev.allowed_locations];
        if (currentLocations.includes(locationId)) {
          return {
            ...prev,
            allowed_locations: currentLocations.filter(id => id !== locationId)
          };
        } else {
          return {
            ...prev,
            allowed_locations: [...currentLocations, locationId]
          };
        }
      });
    } else {
      setEditForm(prev => {
        const currentLocations = [...prev.allowed_locations];
        if (currentLocations.includes(locationId)) {
          return {
            ...prev,
            allowed_locations: currentLocations.filter(id => id !== locationId)
          };
        } else {
          return {
            ...prev,
            allowed_locations: [...currentLocations, locationId]
          };
        }
      });
    }
  };

  const getLocationNames = (locationIds: string[] | null | undefined) => {
    if (!locationIds || locationIds.length === 0) return "-";
    return locationIds
      .map(id => locations.find(loc => loc.id === id)?.name || "Unknown")
      .join(", ");
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(role => role.id === roleId);
    return role ? role.name : roleId; // Fallback to displaying the ID if role not found
  };

  // Allow both admins and vendor admins to access user management
  if (!isAdmin() && userProfile?.role !== 'Vendor Admin') {
    return (
      <div className="p-8">
        <div className="bg-destructive/15 p-6 rounded-lg">
          <h3 className="font-semibold text-destructive mb-2">Access Denied</h3>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access User Management.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Your current role: {userProfile?.role_name || userProfile?.role || 'Unknown'}</p>
            <p>Required role: Admin or Vendor Admin</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage user roles and permissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddingEmployee} onOpenChange={(open) => {
            setIsAddingEmployee(open);
            if (!open) setErrorMessage(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              {errorMessage && (
                <div className="bg-destructive/15 p-3 rounded-md text-destructive text-sm">
                  {errorMessage}
                </div>
              )}
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={newEmployee.full_name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={newEmployee.role}
                    onValueChange={(value) =>
                      setNewEmployee((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employee Code</Label>
                  <Input
                    value={newEmployee.employee_code}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, employee_code: e.target.value }))}
                    placeholder="Unique code for employee authentication"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allowed Locations</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-3">
                    {locations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No locations available</p>
                    ) : (
                      locations.map((location) => (
                        <div key={location.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`new-location-${location.id}`}
                            checked={newEmployee.allowed_locations.includes(location.id)}
                            onCheckedChange={() => handleLocationToggle(location.id, 'new')}
                          />
                          <label 
                            htmlFor={`new-location-${location.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {location.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddingEmployee(false);
                  setErrorMessage(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddEmployee} disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Employee"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Loading users...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="bg-destructive/15 p-6 rounded-lg text-center">
          <p className="text-destructive font-medium mb-2">Failed to load users</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-muted p-6 rounded-lg text-center">
          <p className="text-muted-foreground mb-2">No users found</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create an employee to get started.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setIsAddingEmployee(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Employee
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
            <div className="bg-card rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Allowed Locations</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{getRoleName(user.role)}</TableCell>
                      <TableCell>{user.employee_code || "-"}</TableCell>
                      <TableCell>{getLocationNames(user.allowed_locations)}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(user)}
                            title="Edit user details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedUser(user)}
                            title="Manage permissions"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-6">
            <RoleManagement />
          </TabsContent>
          
          <TabsContent value="permissions" className="space-y-6">
            {selectedUser ? (
              <UserPermissionsMatrix 
                userId={selectedUser.id}
                userName={selectedUser.full_name || selectedUser.email}
              />
            ) : (
              <div className="bg-muted p-6 rounded-lg text-center">
                <p className="text-muted-foreground mb-2">Select a user to manage permissions</p>
                <p className="text-sm text-muted-foreground">
                  Click the settings icon next to a user in the Users & Roles tab to get started.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog 
        open={!!editingUser} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
            setErrorMessage(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {errorMessage && (
            <div className="bg-destructive/15 p-3 rounded-md text-destructive text-sm">
              {errorMessage}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input
                value={editForm.employee_code}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, employee_code: e.target.value }))
                }
                placeholder="Unique code for employee authentication"
              />
            </div>
            <div className="space-y-2">
              <Label>Allowed Locations</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-3">
                {locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No locations available</p>
                ) : (
                  locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-location-${location.id}`}
                        checked={editForm.allowed_locations.includes(location.id)}
                        onCheckedChange={() => handleLocationToggle(location.id, 'edit')}
                      />
                      <label 
                        htmlFor={`edit-location-${location.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {location.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingUser(null);
                setErrorMessage(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Permissions Dialog */}
      <Dialog 
        open={!!selectedUser} 
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserPermissionsMatrix 
              userId={selectedUser.id}
              userName={selectedUser.full_name || selectedUser.email}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
