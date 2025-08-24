import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import { toast } from "sonner";
import { inventoryApi } from "@/services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageCategoriesDialog = ({ open, onOpenChange }: ManageCategoriesDialogProps) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#4f46e5"); // Default indigo color
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("");
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  }, [open, queryClient]);
  
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => await inventoryApi.getAllCategories(),
    refetchOnMount: true,
    staleTime: 0,
  });
  
  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string, color?: string }) => {
      return await inventoryApi.createCategory(name, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategoryName("");
      toast.success("Category created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: number, name: string, color?: string }) => {
      return await inventoryApi.updateCategory(id, name, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditCategoryId(null);
      setEditCategoryName("");
      setEditCategoryColor("");
      toast.success("Category updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await inventoryApi.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Category deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    createMutation.mutate({ 
      name: newCategoryName,
      color: newCategoryColor
    });
  };
  
  const handleEditCategory = (id: number, name: string, color?: string) => {
    setEditCategoryId(id);
    setEditCategoryName(name);
    setEditCategoryColor(color || "");
  };
  
  const handleSaveEdit = () => {
    if (!editCategoryName.trim() || !editCategoryId) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    updateMutation.mutate({
      id: editCategoryId,
      name: editCategoryName,
      color: editCategoryColor
    });
  };
  
  const handleCancelEdit = () => {
    setEditCategoryId(null);
    setEditCategoryName("");
    setEditCategoryColor("");
  };
  
  const handleDeleteCategory = (id: number) => {
    if (window.confirm("Are you sure you want to delete this category? All inventory items in this category will have their category set to null.")) {
      deleteMutation.mutate(id);
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="newCategory">Add New Category</Label>
            <div className="flex space-x-2">
              <Input
                id="newCategory"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <div className="flex items-center">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-10 h-10 p-0 border rounded cursor-pointer"
                />
              </div>
              <Button
                size="icon"
                onClick={handleAddCategory}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Existing Categories</Label>
            {isLoading ? (
              <div className="text-center py-2">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-2 text-muted-foreground">No categories found</div>
            ) : (
              <div className="border rounded-md divide-y">
                {categories.map((category: any) => (
                  <div key={category.id} className="p-2 flex items-center justify-between">
                    {editCategoryId === category.id ? (
                      <div className="flex items-center space-x-2 flex-grow">
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="flex-grow"
                        />
                        <input
                          type="color"
                          value={editCategoryColor}
                          onChange={(e) => setEditCategoryColor(e.target.value)}
                          className="w-8 h-8 p-0 border rounded cursor-pointer"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          {category.color && (
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color }} 
                            />
                          )}
                          <span>{category.name}</span>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditCategory(category.id, category.name, category.color)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
