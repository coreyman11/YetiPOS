import { Save, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";
import { customersApi } from "@/services/customers-api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PersonalInformation } from "./details/PersonalInformation";
import { ContactInformation } from "./details/ContactInformation";
import { TransactionHistory } from "./details/TransactionHistory";
import { useState } from "react";

type Customer = Database['public']['Tables']['customers']['Row'];
type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];

// Define TransactionItem to match the one in TransactionHistory
type TransactionItem = {
  service_id: number | null;
  services: {
    id?: number;
    name: string;
    price?: number;
    created_at?: string;
  } | null;
  inventory_id: number | null;
  inventory: {
    id?: number;
    name: string;
    description?: string;
    quantity?: number;
  } | null;
  quantity: number;
  price: number;
};

// Match the Transaction type used in TransactionHistory
type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: TransactionItem[];
};

interface CustomerDetailsProps {
  selectedCustomer: Customer | null;
  editingCustomer: Customer | null;
  loyaltyTransactions: LoyaltyTransaction[];
  transactions: Transaction[];
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onUpdate: (customer: Customer) => void;
  onSave: () => void;
}

export const CustomerDetails = ({
  selectedCustomer,
  editingCustomer,
  loyaltyTransactions,
  transactions,
  onClose,
  onEdit,
  onUpdate,
  onSave,
}: CustomerDetailsProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendAccountInvitation = async () => {
    if (!selectedCustomer) return;
    
    setSendingEmail(true);
    try {
      await customersApi.sendAccountInvitation(selectedCustomer.id);
      toast.success("Account invitation sent successfully!");
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error("Failed to send account invitation");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!selectedCustomer) return;
    
    setSendingEmail(true);
    try {
      await customersApi.sendPasswordReset(selectedCustomer.id);
      toast.success("Password reset email sent successfully!");
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error("Failed to send password reset email");
    } finally {
      setSendingEmail(false);
    }
  };

  if (!selectedCustomer) return null;

  return (
    <Dialog 
      open={!!selectedCustomer} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-row items-center justify-between">
            <DialogTitle>Customer Details</DialogTitle>
            <div className="flex items-center gap-2">
              {selectedCustomer && !editingCustomer && activeTab === "details" && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleSendAccountInvitation}
                    disabled={sendingEmail}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Account Invite
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSendPasswordReset}
                    disabled={sendingEmail}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Password Reset
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => onEdit(selectedCustomer)}
                  >
                    Edit
                  </Button>
                </>
              )}
              {editingCustomer && activeTab === "details" && (
                <Button onClick={onSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs: mobile becomes horizontally scrollable; desktop keeps grid layout */}
        <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto justify-start sm:grid sm:grid-cols-2 sm:justify-center">
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="details">Customer Details</TabsTrigger>
            <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="transactions">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-6">
            <div className="space-y-4">
              <PersonalInformation
                selectedCustomer={selectedCustomer}
                editingCustomer={editingCustomer}
                onUpdate={onUpdate}
              />
              <ContactInformation
                selectedCustomer={selectedCustomer}
                editingCustomer={editingCustomer}
                onUpdate={onUpdate}
              />
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <TransactionHistory 
              transactions={transactions} 
              customerId={selectedCustomer.id}
              loyaltyTransactions={loyaltyTransactions}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
