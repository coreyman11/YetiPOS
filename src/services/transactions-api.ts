
import { supabase } from '@/lib/supabase';

export const getShiftSales = async (shiftId: number) => {
  try {
    const { data, error } = await supabase.functions.invoke('secure-transactions-api', {
      body: { 
        action: 'get_shift_sales',
        shiftId
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting shift sales:', error);
    throw error;
  }
};
