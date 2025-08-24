
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import { Database } from "@/types/supabase";

type TaxConfiguration = Database['public']['Tables']['tax_configurations']['Row'];

interface TaxCardProps {
  tax: TaxConfiguration;
  onEdit: (tax: TaxConfiguration) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
}

export function TaxCard({ tax, onEdit, onDelete, onToggleActive }: TaxCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{tax.name}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(tax)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(tax.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-medium">{tax.rate}%</span>
          </div>
          {tax.description && (
            <div className="text-sm text-muted-foreground">
              {tax.description}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Switch
              checked={tax.is_active}
              onCheckedChange={(checked) => onToggleActive(tax.id, checked)}
            />
            <span className="text-sm">
              {tax.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
