import { supabase } from "@/lib/supabase";
import { CartItem } from "@/hooks/useCart";
import { SplitPayment } from "@/pages/services/hooks/payment/types";
import { decrementInventory, validateInventoryAvailability } from "./inventoryUtils";
import { toast } from "sonner";
import { loyaltyProgramApi } from "@/services";

export const handleLoyaltyPointsOnlyPayment = async (
  cart: CartItem[],
  customerId: number,
  loyaltyProgramId: number | null,
  cashierId?: string,
  shiftId?: number | null,
  taxRate: number = 0,
  discountId?: string,
  discountAmount: number = 0,
  onSuccess?: (transactionId: number) => void
) => {
  try {
    console.log("Processing loyalty points only payment (zero dollar transaction)");
    
    // Validate inventory availability before finalizing payment
    await validateInventoryAvailability(cart);
    
    // Get the current location
    const { data: locationData } = await supabase
      .from('locations')
      .select('id')
      .limit(1)
      .single();
      
    const locationId = locationData?.id;
    
    // Calculate totals
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const totalAmount = afterDiscount + taxAmount;
    
    console.log(`Loyalty only payment - subtotal: ${subtotal}, discount: ${discountAmount}, tax: ${taxAmount}, total: ${totalAmount}`);

    // Create a transaction record for the zero-dollar transaction
    const transactionData = {
      payment_method: 'loyalty_points',
      customer_id: customerId,
      status: 'completed',
      total_amount: totalAmount,
      subtotal: subtotal,
      tax_amount: taxAmount,
      tax_rate: taxRate,
      use_loyalty_points: true,
      assigned_user_id: cashierId,
      shift_id: shiftId,
      location_id: locationId,
      discount_total: discountAmount || 0,
      loyalty_program_id: loyaltyProgramId,
      notes: 'app_handled_loyalty' // Marker to prevent trigger conflicts
    };

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error("Error creating loyalty transaction:", error);
      toast.error("Failed to complete transaction: " + error.message);
      throw error;
    }

    console.log("Created transaction for loyalty points payment:", transaction.id);

    // Create transaction items
    await Promise.all(
      cart.map(async (item) => {
        // Create transaction item
        const { error: itemError } = await supabase
          .from('transaction_items')
          .insert([{
            transaction_id: transaction.id,
            [item.type === 'service' ? 'service_id' : 'inventory_id']: item.id,
            quantity: item.quantity,
            price: item.price,
            location_id: locationId
          }]);

        if (itemError) {
          console.error("Error creating transaction item:", itemError);
          throw itemError;
        }

        // Decrement inventory if needed
        if (item.type === 'inventory') {
          await decrementInventory(item.id, item.quantity);
        }
      })
    );

    // If we have a discount, record it
    if (discountId && discountAmount > 0) {
      const { error: discountError } = await supabase
        .from('transaction_discounts')
        .insert([{
          transaction_id: transaction.id,
          discount_id: discountId,
          discount_amount: discountAmount,
          location_id: locationId
        }]);

      if (discountError) {
        console.error("Error recording discount:", discountError);
      }
    }

    // Handle loyalty points redemption - this is the critical part that was missing
    try {
      console.log("Redeeming loyalty points for transaction:", transaction.id);
      await loyaltyProgramApi.redeemPoints(
        customerId, 
        totalAmount, 
        transaction.id,
        loyaltyProgramId
      );
      console.log("Successfully redeemed loyalty points");
    } catch (loyaltyError) {
      console.error("Error processing loyalty points redemption:", loyaltyError);
      toast.error("Error processing loyalty points redemption: " + loyaltyError.message);
      throw loyaltyError;
    }

    // Create a receipt for the transaction
    try {
      console.log("Creating receipt for loyalty points transaction:", transaction.id);
      const { data: receiptSettings } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();
      
      const defaultTemplate = `
        <div class="receipt">
          <h3>Transaction Receipt</h3>
          <p>Transaction ID: {{transactionId}}</p>
          <p>Date: {{date}}</p>
          <p>Total: ${{totalAmount}}</p>
          <p>Paid with Loyalty Points</p>
        </div>
      `;

      const receiptData = {
        transaction_id: transaction.id,
        template: receiptSettings?.template_id || defaultTemplate,
        location_id: locationId,
        status: 'pending'
      };

      const { error: receiptError } = await supabase
        .from('receipts')
        .insert([receiptData]);

      if (receiptError) {
        console.error("Error creating receipt:", receiptError);
        // Don't throw here, just log the error so the transaction still completes
      } else {
        console.log("Receipt created successfully for loyalty points transaction:", transaction.id);
      }
    } catch (receiptError) {
      console.error("Exception creating receipt:", receiptError);
      // Don't throw here, just log the error so the transaction still completes
    }

    if (onSuccess) {
      onSuccess(transaction.id);
    }

    toast.success("Payment completed using loyalty points!");
    return transaction;
  } catch (error) {
    console.error("Failed to process loyalty points payment:", error);
    toast.error("Payment failed: " + (error.message || "Unknown error"));
    throw error;
  }
};