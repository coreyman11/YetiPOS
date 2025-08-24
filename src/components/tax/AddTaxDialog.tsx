
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface AddTaxDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tax: { name: string; rate: number; description: string; is_active: boolean }) => void;
}

export function AddTaxDialog({ isOpen, onOpenChange, onSubmit }: AddTaxDialogProps) {
  const [newTax, setNewTax] = useState({
    name: "",
    rate: 0,
    description: "",
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newTax);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tax Configuration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newTax.name}
              onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Rate (%)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={newTax.rate}
              onChange={(e) =>
                setNewTax({ ...newTax, rate: parseFloat(e.target.value) })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newTax.description}
              onChange={(e) =>
                setNewTax({ ...newTax, description: e.target.value })
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={newTax.is_active}
              onCheckedChange={(checked) =>
                setNewTax({ ...newTax, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <Button type="submit" className="w-full">
            Create Tax Configuration
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
