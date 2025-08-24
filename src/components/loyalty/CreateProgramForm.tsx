
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loyaltyProgramApi } from "@/services/loyalty-program-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

const CreateProgramForm = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_per_dollar: 1,
    minimum_points_redeem: 100,
    points_value_cents: 1,
  });

  const createProgramMutation = useMutation({
    mutationFn: loyaltyProgramApi.createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
      toast.success("New loyalty program created successfully");
      // Reset form
      setFormData({
        name: '',
        description: '',
        points_per_dollar: 1,
        minimum_points_redeem: 100,
        points_value_cents: 1,
      });
    },
    onError: (error) => {
      toast.error("Failed to create loyalty program");
      console.error('Error creating program:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProgramMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Program</CardTitle>
          <CardDescription>
            Configure a new loyalty program with custom point values and redemption rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Program Name</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Points per Dollar</label>
            <Input
              type="number"
              min="0"
              value={formData.points_per_dollar}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                points_per_dollar: parseInt(e.target.value)
              }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Minimum Points to Redeem</label>
            <Input
              type="number"
              min="0"
              value={formData.minimum_points_redeem}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                minimum_points_redeem: parseInt(e.target.value)
              }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Points Value (in cents)</label>
            <Input
              type="number"
              min="0"
              value={formData.points_value_cents}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                points_value_cents: parseInt(e.target.value)
              }))}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full mt-4"
            disabled={createProgramMutation.isPending}
          >
            {createProgramMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Program
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default CreateProgramForm;
