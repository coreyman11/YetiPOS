
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DiscountForm } from "./DiscountForm";

interface CreateDiscountDialogProps {
  onDiscountCreated: () => void;
}

export const CreateDiscountDialog = ({ onDiscountCreated }: CreateDiscountDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const handleDiscountCreated = () => {
    setOpen(false);
    onDiscountCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Discount
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Discount</DialogTitle>
        </DialogHeader>
        <DiscountForm onSuccess={handleDiscountCreated} />
      </DialogContent>
    </Dialog>
  );
};
