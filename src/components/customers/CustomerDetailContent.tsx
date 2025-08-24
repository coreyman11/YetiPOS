
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loyaltyProgramApi, customersApi } from "@/services";
import { Database } from "@/types/supabase";
import { PersonalInformation } from "./details/PersonalInformation";
import { ContactInformation } from "./details/ContactInformation";
import { TransactionHistory } from "./details/TransactionHistory";
import { CustomerMembershipTab } from "./details/CustomerMembershipTab";
import { PaymentMethodsTab } from "./details/PaymentMethodsTab";

type Customer = Database['public']['Tables']['customers']['Row'];
type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];

// Define TransactionItem to match existing structure
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

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: TransactionItem[];
};

interface CustomerDetailContentProps {
  customerId: string;
}

export const CustomerDetailContent = ({ customerId }: CustomerDetailContentProps) => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Fetch customer details using the API which handles RLS properly
      const customers = await customersApi.getAll();
      const customerData = customers.find((c: Customer) => c.id === parseInt(customerId));

      if (!customerData) {
        console.error('Customer not found or access denied');
        toast.error('Customer not found or you do not have permission to view this customer');
        navigate('/customers');
        return;
      }

      setCustomer(customerData);

      // Fetch loyalty transactions using the API to ensure proper location filtering
      try {
        const loyaltyData = await loyaltyProgramApi.getTransactions(parseInt(customerId));

        setLoyaltyTransactions(loyaltyData || []);
      } catch (loyaltyError) {
        console.error('Error fetching loyalty transactions:', loyaltyError);
        toast.error('Failed to load loyalty transactions');
        setLoyaltyTransactions([]);
      }

      // Fetch transaction history using the proper API that handles location filtering
      try {
        const transactionData = await customersApi.getCustomerTransactions(parseInt(customerId));
        setTransactions(transactionData || []);
      } catch (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        toast.error('Failed to load transaction history');
        setTransactions([]);
      }

    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
  };

  const handleUpdate = (updatedCustomer: Customer) => {
    setEditingCustomer(updatedCustomer);
  };

  const handleSave = async () => {
    if (!editingCustomer) return;

    try {
      console.log('Saving customer updates:', editingCustomer);
      
      // Build a safe update payload (no sensitive fields)
      const safeUpdate = {
        name: editingCustomer.name,
        email: editingCustomer.email,
        phone: editingCustomer.phone,
        first_name: editingCustomer.first_name,
        last_name: editingCustomer.last_name,
        mobile: editingCustomer.mobile,
        address_line1: editingCustomer.address_line1,
        city: editingCustomer.city,
        state: editingCustomer.state,
        zip: editingCustomer.zip,
      };

      await customersApi.update(editingCustomer.id, safeUpdate as Partial<Customer>);

      // Merge locally to avoid refetch and preserve any hidden fields
      setCustomer(prev => prev ? ({ ...prev, ...safeUpdate } as Customer) : prev);
      setEditingCustomer(null);
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    }
  };

  const handleCancel = () => {
    setEditingCustomer(null);
  };

  const handleSendAccountInvitation = async () => {
    if (!customer) return;
    
    setSendingEmail(true);
    try {
      await customersApi.sendAccountInvitation(customer.id);
      toast.success("Account invitation sent successfully!");
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error("Failed to send account invitation");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!customer) return;
    
    setSendingEmail(true);
    try {
      await customersApi.sendPasswordReset(customer.id);
      toast.success("Password reset email sent successfully!");
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error("Failed to send password reset email");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the most recent loyalty points balance from transactions
  const getLatestLoyaltyPoints = () => {
    if (loyaltyTransactions.length === 0) {
      return customer.loyalty_points;
    }
    // Sort by created_at descending and get the most recent points_balance
    const sortedTransactions = [...loyaltyTransactions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sortedTransactions[0].points_balance;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {getLatestLoyaltyPoints()} loyalty points
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {editingCustomer && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
          {!editingCustomer && activeTab === "details" && (
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
              <Button variant="outline" onClick={() => handleEdit(customer)}>
                Edit Customer
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto justify-start sm:grid sm:grid-cols-4 sm:justify-center">
          <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="details">Details</TabsTrigger>
          <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="membership">Membership</TabsTrigger>
          <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger className="whitespace-nowrap flex-shrink-0" value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-6">
            <PersonalInformation
              selectedCustomer={customer}
              editingCustomer={editingCustomer}
              onUpdate={handleUpdate}
            />
            <ContactInformation
              selectedCustomer={customer}
              editingCustomer={editingCustomer}
              onUpdate={handleUpdate}
            />
          </div>
        </TabsContent>

        <TabsContent value="membership" className="mt-6">
          <CustomerMembershipTab customerId={customer.id} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentMethodsTab customerId={customer.id} customerEmail={customer.email} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionHistory 
            transactions={transactions} 
            customerId={customer.id}
            loyaltyTransactions={loyaltyTransactions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
