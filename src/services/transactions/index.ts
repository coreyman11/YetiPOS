
import { supabase } from '@/lib/supabase';
import { getAll, create, getPage, getById, getRecent, getCount, createSplitPayments } from './transactions';
import { getDailyRevenue, getDailyTransactionCounts } from './revenue';
import { getDailyRefunds } from './refundsData';
import { getTopProducts } from './analytics';
import { createRefund, getRefundsByTransactionId, getAllRefunds } from './refunds';

// Define the return type for shift sales
export interface ShiftSalesByMethod {
  cash: number;
  credit: number;
  gift_card: number;
  other: number;
  refunds: number; // Add refunds to the interface
  [key: string]: number;
}

// Define the missing functions for shift-related transactions
const getByShiftId = async (shiftId: number) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (*),
        transaction_items (
          *,
          services (*),
          inventory (*)
        )
      `)
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching transactions for shift ${shiftId}:`, error);
    throw error;
  }
};

const getShiftSales = async (shiftId: number): Promise<ShiftSalesByMethod> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('payment_method, total_amount, id, is_split_payment, refunded_amount, tax_amount, subtotal')
      .eq('shift_id', shiftId)
      .eq('status', 'completed');
    
    if (error) throw error;
    
    const salesByMethod: ShiftSalesByMethod = {
      cash: 0,
      credit: 0,
      gift_card: 0,
      other: 0,
      refunds: 0 // Initialize refunds to 0
    };
    
    if (!data || data.length === 0) {
      return salesByMethod;
    }
    
    // Calculate total refunds for the shift
    const totalRefundAmount = data.reduce((sum, transaction) => {
      return sum + (Number(transaction.refunded_amount) || 0);
    }, 0);
    
    // Add total refund amount to the refunds field
    salesByMethod.refunds = totalRefundAmount;
    
    // Process regular non-split payments first
    const regularTransactions = data.filter(t => !t.is_split_payment);
    regularTransactions.forEach(transaction => {
      const method = transaction.payment_method?.toLowerCase() || 'other';
      
      // Use total_amount which includes taxes, then subtract refunds
      const netAmount = Number(transaction.total_amount) - Number(transaction.refunded_amount || 0);
      
      if (method in salesByMethod) {
        salesByMethod[method] += netAmount;
      } else {
        salesByMethod.other += netAmount;
      }
    });
    
    // Process split payments if any
    const splitTransactions = data.filter(t => t.is_split_payment);
    if (splitTransactions.length > 0) {
      const transactionIds = splitTransactions.map(t => t.id);
      
      const { data: splits, error: splitsError } = await supabase
        .from('payment_splits')
        .select('amount, payment_method, transaction_id')
        .in('transaction_id', transactionIds);
        
      if (!splitsError && splits) {
        // For split payments, we need to handle refunds proportionally
        // This is a simplified approach where we distribute refunds proportionally
        const splitRefunds = new Map<number, number>();
        
        splitTransactions.forEach(transaction => {
          if (transaction.refunded_amount && Number(transaction.refunded_amount) > 0) {
            splitRefunds.set(transaction.id, Number(transaction.refunded_amount));
          }
        });
        
        // Group splits by transaction
        const splitsByTransaction = splits.reduce((grouped, split) => {
          if (!grouped[split.transaction_id]) {
            grouped[split.transaction_id] = [];
          }
          grouped[split.transaction_id].push(split);
          return grouped;
        }, {} as Record<number, any[]>);
        
        // Process each split payment with proportional refund adjustment
        Object.entries(splitsByTransaction).forEach(([transactionId, transactionSplits]) => {
          const txId = Number(transactionId);
          const refundAmount = splitRefunds.get(txId) || 0;
          const totalSplitAmount = transactionSplits.reduce((sum, split) => sum + Number(split.amount), 0);
          
          transactionSplits.forEach(split => {
            const method = split.payment_method?.toLowerCase() || 'other';
            const splitAmount = Number(split.amount);
            
            // Calculate proportional refund for this split if there's a refund
            let adjustedAmount = splitAmount;
            if (refundAmount > 0 && totalSplitAmount > 0) {
              const refundProportion = splitAmount / totalSplitAmount;
              const splitRefundAmount = refundAmount * refundProportion;
              adjustedAmount = splitAmount - splitRefundAmount;
            }
            
            if (method in salesByMethod) {
              salesByMethod[method] += adjustedAmount;
            } else {
              salesByMethod.other += adjustedAmount;
            }
          });
        });
      }
    }
    
    return salesByMethod;
  } catch (error) {
    console.error(`Error fetching sales for shift ${shiftId}:`, error);
    return {
      cash: 0,
      credit: 0,
      gift_card: 0,
      other: 0,
      refunds: 0
    };
  }
};

export const transactionsApi = {
  getAll,
  create,
  createSplitPayments,
  getPage,
  getById,
  getRecent,
  getCount,
  getDailyRevenue,
  getDailyTransactionCounts,
  getDailyRefunds,
  getTopProducts,
  createRefund,
  getRefundsByTransactionId,
  getAllRefunds,
  getByShiftId,
  getShiftSales
};
