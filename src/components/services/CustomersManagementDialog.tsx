import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomersContent } from "@/components/customers/CustomersContent";

interface CustomersManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomersManagementDialog = ({
  isOpen,
  onClose
}: CustomersManagementDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl md:max-w-6xl max-w-[95vw] h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Customer Management</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <CustomersContent inModal={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
};