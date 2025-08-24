
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Settings, Users, Receipt } from "lucide-react";
import { ShiftManagementDialog } from "./ShiftManagementDialog";
import { CustomersManagementDialog } from "./CustomersManagementDialog";
import { TransactionsDialog } from "./TransactionsDialog";
import { Database } from "@/types/supabase";

type Shift = Database['public']['Tables']['shifts']['Row'];

interface RegisterManagementMenuProps {
  activeShift?: Shift | null;
  onCloseRegister?: () => void;
}

export const RegisterManagementMenu = ({
  activeShift,
  onCloseRegister
}: RegisterManagementMenuProps) => {
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showCustomersDialog, setShowCustomersDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);

  return (
    <>
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShiftDialog(true)}
            className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Clock className="h-4 w-4" />
            Shift Management
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomersDialog(true)}
            className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Users className="h-4 w-4" />
            Customers
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTransactionsDialog(true)}
            className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Receipt className="h-4 w-4" />
            Transactions
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onCloseRegister}
            className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
            Close Register
          </Button>
        </div>
      </div>

      <ShiftManagementDialog
        isOpen={showShiftDialog}
        onClose={() => setShowShiftDialog(false)}
        currentShift={activeShift}
      />

      <CustomersManagementDialog
        isOpen={showCustomersDialog}
        onClose={() => setShowCustomersDialog(false)}
      />

      <TransactionsDialog
        open={showTransactionsDialog}
        onOpenChange={setShowTransactionsDialog}
      />
    </>
  );
};
