
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Database } from "@/types/supabase";

type TaxConfiguration = Database['public']['Tables']['tax_configurations']['Row'];

interface EditTaxDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tax: TaxConfiguration | null;
  onSubmit: (e: React.FormEvent) => void;
  onTaxChange: (tax: TaxConfiguration) => void;
}

export function EditTaxDialog({ isOpen, onOpenChange, tax, onSubmit, onTaxChange }: EditTaxDialogProps) {
  if (!tax) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tax Configuration</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={tax.name}
              onChange={(e) =>
                onTaxChange({ ...tax, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-rate">Rate (%)</Label>
            <Input
              id="edit-rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={tax.rate}
              onChange={(e) =>
                onTaxChange({
                  ...tax,
                  rate: parseFloat(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={tax.description || ""}
              onChange={(e) =>
                onTaxChange({
                  ...tax,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-is_active"
              checked={tax.is_active}
              onCheckedChange={(checked) =>
                onTaxChange({ ...tax, is_active: checked })
              }
            />
            <Label htmlFor="edit-is_active">Active</Label>
          </div>
          <Button type="submit" className="w-full">
            Update Tax Configuration
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
