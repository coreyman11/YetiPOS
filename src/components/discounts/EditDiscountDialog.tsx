
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { DiscountForm } from "./DiscountForm";
import { Database } from "@/types/supabase";

type Discount = Database['public']['Tables']['discounts']['Row'];

interface EditDiscountDialogProps {
  discount: Discount;
  onDiscountUpdated: () => void;
}

export const EditDiscountDialog = ({ discount, onDiscountUpdated }: EditDiscountDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const handleDiscountUpdated = () => {
    setOpen(false);
    onDiscountUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Discount</DialogTitle>
        </DialogHeader>
        <DiscountForm discount={discount} onSuccess={handleDiscountUpdated} />
      </DialogContent>
    </Dialog>
  );
};
