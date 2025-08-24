
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taxApi } from "@/services/tax-api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/types/supabase";
import { TaxCard } from "@/components/tax/TaxCard";
import { AddTaxDialog } from "@/components/tax/AddTaxDialog";
import { EditTaxDialog } from "@/components/tax/EditTaxDialog";

type TaxConfiguration = Database['public']['Tables']['tax_configurations']['Row'];

const TaxConfigurationPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<TaxConfiguration | null>(null);

  const queryClient = useQueryClient();

  const { data: taxes = [] } = useQuery({
    queryKey: ['taxes'],
    queryFn: taxApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: taxApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setIsAddDialogOpen(false);
      toast.success("Tax configuration created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create tax configuration");
      console.error('Create error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, tax }: { id: number; tax: Partial<TaxConfiguration> }) => 
      taxApi.update(id, tax),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setIsEditDialogOpen(false);
      setSelectedTax(null);
      toast.success("Tax configuration updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update tax configuration");
      console.error('Update error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taxApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success("Tax configuration deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete tax configuration");
      console.error('Delete error:', error);
    },
  });

  const handleCreate = (newTax: { name: string; rate: number; description: string; is_active: boolean }) => {
    createMutation.mutate(newTax);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTax) return;
    updateMutation.mutate({ id: selectedTax.id, tax: selectedTax });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this tax configuration?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8 p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tax Configuration</h2>
          <p className="text-muted-foreground">Manage your tax rates and settings.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Tax
        </Button>
      </div>

      <div className="grid gap-4">
        {taxes.map((tax) => (
          <TaxCard
            key={tax.id}
            tax={tax}
            onEdit={(tax) => {
              setSelectedTax(tax);
              setIsEditDialogOpen(true);
            }}
            onDelete={handleDelete}
            onToggleActive={(id, isActive) =>
              updateMutation.mutate({
                id,
                tax: { is_active: isActive },
              })
            }
          />
        ))}
      </div>

      <AddTaxDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleCreate}
      />

      <EditTaxDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        tax={selectedTax}
        onSubmit={handleUpdate}
        onTaxChange={setSelectedTax}
      />
    </div>
  );
};

export default TaxConfigurationPage;
