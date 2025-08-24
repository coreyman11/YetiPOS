
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationsApi } from "@/services";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LocationsConfiguration() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string } | null>(null);
  const [locationName, setLocationName] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: locationsApi.getAll,
  });

  // Create location mutation
  const createMutation = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location created successfully");
      setIsAddDialogOpen(false);
      setLocationName("");
    },
    onError: (error) => {
      toast.error(`Failed to create location: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  // Update location mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string }) => locationsApi.update(data.id, data.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location updated successfully");
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
    },
    onError: (error) => {
      toast.error(`Failed to update location: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  const handleAddLocation = () => {
    if (!locationName.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    
    createMutation.mutate(locationName);
  };

  const handleEditLocation = () => {
    if (!selectedLocation) return;
    if (!locationName.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    
    updateMutation.mutate({ id: selectedLocation.id, name: locationName });
  };

  const openEditDialog = (location: { id: string; name: string }) => {
    setSelectedLocation(location);
    setLocationName(location.name);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Locations</h1>
          <p className="text-muted-foreground">Manage your business locations</p>
        </div>
        <Button onClick={() => {
          setLocationName("");
          setIsAddDialogOpen(true);
        }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Separator />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-gray-100 rounded-t"></CardHeader>
              <CardContent className="p-4">
                <div className="h-4 w-3/4 bg-gray-100 rounded mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : locations?.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">No locations found</h3>
          <p className="text-muted-foreground mt-1">Add your first location to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations?.map((location) => (
            <Card key={location.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>{location.name}</CardTitle>
                <CardDescription>Created: {new Date(location.created_at || "").toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(location)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Location Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Enter the details of your new business location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Main Store"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLocation} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the details of your business location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Location Name</Label>
              <Input
                id="edit-name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditLocation} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
