import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodsTabProps {
  customerId: number;
  customerEmail: string;
}

export const PaymentMethodsTab = ({ customerId, customerEmail }: PaymentMethodsTabProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: ''
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [customerId]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-payment-methods', {
        body: { 
          action: 'list',
          customer_id: customerId 
        }
      });

      if (error) {
        console.error('Error fetching payment methods:', error);
        toast.error('Failed to load payment methods');
        return;
      }

      setPaymentMethods(data.payment_methods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!cardData.number || !cardData.exp_month || !cardData.exp_year || !cardData.cvc) {
      toast.error('Please fill in all card details');
      return;
    }

    try {
      setAddingCard(true);
      const { data, error } = await supabase.functions.invoke('customer-payment-methods', {
        body: {
          action: 'add',
          customer_id: customerId,
          customer_email: customerEmail,
          card: {
            number: cardData.number.replace(/\s/g, ''),
            exp_month: parseInt(cardData.exp_month),
            exp_year: parseInt(cardData.exp_year),
            cvc: cardData.cvc
          }
        }
      });

      if (error) {
        console.error('Error adding payment method:', error);
        toast.error('Failed to add payment method');
        return;
      }

      toast.success('Payment method added successfully');
      setShowAddCard(false);
      setCardData({ number: '', exp_month: '', exp_year: '', cvc: '' });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    } finally {
      setAddingCard(false);
    }
  };

  const handleDeleteCard = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('customer-payment-methods', {
        body: {
          action: 'delete',
          customer_id: customerId,
          payment_method_id: paymentMethodId
        }
      });

      if (error) {
        console.error('Error deleting payment method:', error);
        toast.error('Failed to delete payment method');
        return;
      }

      toast.success('Payment method deleted successfully');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp-month">Month</Label>
                    <Input
                      id="exp-month"
                      placeholder="MM"
                      value={cardData.exp_month}
                      onChange={(e) => setCardData({ ...cardData, exp_month: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-year">Year</Label>
                    <Input
                      id="exp-year"
                      placeholder="YYYY"
                      value={cardData.exp_year}
                      onChange={(e) => setCardData({ ...cardData, exp_year: e.target.value })}
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      value={cardData.cvc}
                      onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddCard(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCard} disabled={addingCard}>
                    {addingCard ? 'Adding...' : 'Add Card'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment methods on file</p>
            <p className="text-sm">Add a payment method to enable billing</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {method.brand.toUpperCase()} ending in {method.last4}
                      </span>
                      {method.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCard(method.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};