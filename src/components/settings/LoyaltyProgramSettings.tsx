
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { loyaltyProgramApi } from "@/services/loyalty-program-api";
import { Link } from "react-router-dom";

interface LoyaltyProgramSettingsProps {
  locationId: string;
}

export const LoyaltyProgramSettings: React.FC<LoyaltyProgramSettingsProps> = ({ locationId }) => {
  const queryClient = useQueryClient();
  const [newProgramName, setNewProgramName] = useState("");
  const [pointsPerDollar, setPointsPerDollar] = useState<number>(1);
  const [minimumPointsRedeem, setMinimumPointsRedeem] = useState<number>(100);
  const [pointsValueCents, setPointsValueCents] = useState<number>(1);
  
  // Fetch active loyalty programs
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['loyalty-programs'],
    queryFn: loyaltyProgramApi.getActivePrograms,
  });
  
  // Create mutation for creating a new loyalty program
  const createProgramMutation = useMutation({
    mutationFn: (program: Partial<any>) => loyaltyProgramApi.createProgram(program),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
      toast.success("Loyalty program created successfully");
      // Reset form fields
      setNewProgramName("");
      setPointsPerDollar(1);
      setMinimumPointsRedeem(100);
      setPointsValueCents(1);
    },
    onError: (error) => {
      toast.error("Failed to create loyalty program");
      console.error(error);
    }
  });

  const handleCreateProgram = () => {
    if (!newProgramName) {
      toast.error("Please enter a program name");
      return;
    }
    
    createProgramMutation.mutate({
      name: newProgramName,
      points_per_dollar: pointsPerDollar,
      minimum_points_redeem: minimumPointsRedeem,
      points_value_cents: pointsValueCents,
      is_active: true,
      location_id: locationId
    });
  };

  if (isLoading) {
    return <div>Loading loyalty program settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Programs */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Active Programs</h3>
        <Link to="/loyalty-program">
          <Button variant="outline">Advanced Loyalty Settings</Button>
        </Link>
      </div>
      
      <div className="grid gap-4">
        {programs.length > 0 ? (
          programs.map(program => (
            <Card key={program.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{program.name}</h4>
                    <Switch
                      id={`program-active-${program.id}`}
                      checked={program.is_active}
                      disabled={true} // Can only be toggled from loyalty program page
                    />
                  </div>
                  <p className="text-sm">Points per dollar: {program.points_per_dollar}</p>
                  <p className="text-sm">Minimum points to redeem: {program.minimum_points_redeem}</p>
                  <p className="text-sm">Value per point: {program.points_value_cents} cents</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center py-4">No active loyalty programs found.</p>
        )}
      </div>
      
      <Separator />
      
      {/* Create New Program */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Create New Program</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="program-name">Program Name</Label>
            <Input
              id="program-name"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              placeholder="Enter program name"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="points-per-dollar">Points Per Dollar</Label>
            <Input
              id="points-per-dollar"
              type="number"
              min="1"
              value={pointsPerDollar}
              onChange={(e) => setPointsPerDollar(Number(e.target.value))}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="minimum-points">Minimum Points to Redeem</Label>
            <Input
              id="minimum-points"
              type="number"
              min="1"
              value={minimumPointsRedeem}
              onChange={(e) => setMinimumPointsRedeem(Number(e.target.value))}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="points-value">Value Per Point (in cents)</Label>
            <Input
              id="points-value"
              type="number"
              min="1"
              value={pointsValueCents}
              onChange={(e) => setPointsValueCents(Number(e.target.value))}
            />
          </div>
          
          <Button 
            onClick={handleCreateProgram}
            disabled={createProgramMutation.isPending}
          >
            {createProgramMutation.isPending ? "Creating..." : "Create Program"}
          </Button>
        </div>
      </div>
    </div>
  );
};
