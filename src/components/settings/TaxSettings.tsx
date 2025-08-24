
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { taxApi } from "@/services/tax-api";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface TaxSettingsProps {
  locationId: string;
}

export const TaxSettings: React.FC<TaxSettingsProps> = ({ locationId }) => {
  const queryClient = useQueryClient();
  
  // Fetch tax configurations
  const { data: taxConfigurations = [], isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: taxApi.getAll,
  });
  
  // Create mutation for updating tax configurations
  const updateTaxMutation = useMutation({
    mutationFn: (data: { id: number, tax: any }) => 
      taxApi.update(data.id, data.tax),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success("Tax settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update tax settings");
      console.error(error);
    }
  });
  
  // Handle toggle for tax configuration
  const handleToggleTax = (id: number, isActive: boolean) => {
    if (isActive) {
      // If enabling this tax, disable all other taxes first
      taxConfigurations.forEach(tax => {
        if (tax.id !== id && tax.is_active) {
          updateTaxMutation.mutate({
            id: tax.id,
            tax: { is_active: false, location_id: locationId }
          });
        }
      });
    }
    
    // Update the selected tax
    updateTaxMutation.mutate({
      id,
      tax: { is_active: isActive, location_id: locationId }
    });
  };

  if (isLoading) {
    return <div>Loading tax settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tax Configurations</h3>
        <Link to="/configuration/tax">
          <Button variant="outline">Advanced Tax Settings</Button>
        </Link>
      </div>
      
      <div className="grid gap-4">
        {taxConfigurations.length > 0 ? (
          taxConfigurations.map(tax => (
            <Card key={tax.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{tax.name}</h4>
                    <p className="text-sm text-muted-foreground">Rate: {tax.rate}%</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`tax-active-${tax.id}`}
                      checked={tax.is_active}
                      onCheckedChange={(checked) => handleToggleTax(tax.id, checked)}
                    />
                    <Label htmlFor={`tax-active-${tax.id}`}>
                      {tax.is_active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-4">
            <p>No tax configurations found.</p>
            <Link to="/configuration/tax">
              <Button className="mt-2">
                Set Up Tax Configuration
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
