import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type Shift = Database['public']['Tables']['shifts']['Row'];
type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];

// Extended shift type with user profile information
interface ShiftWithUserProfile extends Shift {
  user_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  user_profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

const ShiftsApi = {
  getActiveShift: async (userId?: string): Promise<ShiftWithUserProfile | null> => {
    // If userId is provided, fetch a shift specifically assigned to that user
    // Otherwise, fetch any active shift
    let query = supabase
      .from('shifts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (userId) {
      query = query.eq('assigned_user_id', userId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) {
      console.error('Error fetching active shift:', error);
      // Continue instead of throwing to allow fallback to any active shift
      if (userId) {
        return ShiftsApi.getActiveShift(); // Retry without user filter
      }
      return null;
    }
    
    // If we found a shift and it has an assigned user, fetch that user's profile separately
    if (data && data.assigned_user_id) {
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', data.assigned_user_id)
        .single();
      
      if (!userError && userProfile) {
        return {
          ...data,
          user_profile: userProfile
        };
      }
    }
    
    return data || null;
  },
  
  startShift: async (shiftData: Partial<ShiftInsert>): Promise<Shift | null> => {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        name: shiftData.name || 'New Shift',
        status: 'active',
        start_time: new Date().toISOString(),
        assigned_user_id: shiftData.assigned_user_id || null,
        opening_balance: shiftData.opening_balance || 0,
        total_sales: 0, // Initialize to 0, trigger will update as transactions are added
        location_id: shiftData.location_id || null,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error starting shift:', error);
      throw error;
    }
    
    return data;
  },
  
  endShift: async (shiftId: number, closingData: {
    closing_balance: number;
    cash_discrepancy?: number;
  }): Promise<Shift | null> => {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        closing_balance: closingData.closing_balance,
        cash_discrepancy: closingData.cash_discrepancy,
      })
      .eq('id', shiftId)
      .select()
      .single();
    
    if (error) {
      console.error('Error ending shift:', error);
      throw error;
    }
    
    return data;
  },

  getAll: async (locationId?: string | null): Promise<ShiftWithUserProfile[]> => {
    let query = supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching all shifts:', error);
      throw error;
    }
    
    // Fetch user profiles for shifts with assigned users
    const shiftsWithProfiles = await Promise.all(
      (data || []).map(async (shift) => {
        if (shift.assigned_user_id) {
          const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .eq('id', shift.assigned_user_id)
            .single();
          
          if (!userError && userProfile) {
            return {
              ...shift,
              user_profile: userProfile
            };
          }
        }
        return shift;
      })
    );
    
    return shiftsWithProfiles;
  },

  getAllActiveShifts: async (locationId?: string | null): Promise<ShiftWithUserProfile[]> => {
    let query = supabase
      .from('shifts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching active shifts:', error);
      throw error;
    }
    
    // Fetch user profiles for shifts with assigned users
    const shiftsWithProfiles = await Promise.all(
      (data || []).map(async (shift) => {
        if (shift.assigned_user_id) {
          const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .eq('id', shift.assigned_user_id)
            .single();
          
          if (!userError && userProfile) {
            return {
              ...shift,
              user_profiles: userProfile
            };
          }
        }
        return shift;
      })
    );
    
    return shiftsWithProfiles;
  },

  getShiftById: async (shiftId: number): Promise<ShiftWithUserProfile | null> => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single();
    
    if (error) {
      console.error(`Error fetching shift with ID ${shiftId}:`, error);
      throw error;
    }
    
    // If the shift has an assigned user, fetch their profile
    if (data && data.assigned_user_id) {
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', data.assigned_user_id)
        .single();
      
      if (!userError && userProfile) {
        return {
          ...data,
          user_profile: userProfile
        };
      }
    }
    
    return data;
  },

  getShiftTransactions: async (shiftId: number) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (
          name
        )
      `)
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching shift transactions:', error);
      throw error;
    }
    
    return data || [];
  },

  pauseShift: async (shiftId: number): Promise<Shift | null> => {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        status: 'paused',
      })
      .eq('id', shiftId)
      .select()
      .single();
    
    if (error) {
      console.error('Error pausing shift:', error);
      throw error;
    }
    
    return data;
  },

  resumeShift: async (shiftId: number): Promise<Shift | null> => {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        status: 'active',
      })
      .eq('id', shiftId)
      .select()
      .single();
    
    if (error) {
      console.error('Error resuming shift:', error);
      throw error;
    }
    
    return data;
  },

  closeShift: async (shiftId: number, closingBalance: number): Promise<Shift | null> => {
    // Get current shift data for cash discrepancy calculation
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('opening_balance, total_sales')
      .eq('id', shiftId)
      .single();
    
    if (!shiftData) {
      throw new Error('Shift not found');
    }

    // Calculate cash sales from transactions (including tax) minus refunds
    const { data: transactions } = await supabase
      .from('transactions')
      .select('total_amount, refunded_amount')
      .eq('shift_id', shiftId)
      .eq('payment_method', 'cash')
      .eq('status', 'completed');
    
    const cashSales = transactions?.reduce((sum, t) => {
      const netAmount = (t.total_amount || 0) - (Number(t.refunded_amount) || 0);
      return sum + netAmount;
    }, 0) || 0;
    
    // Calculate discrepancy (actual closing balance vs expected cash drawer amount)
    const expectedBalance = (shiftData.opening_balance || 0) + cashSales;
    const discrepancy = closingBalance - expectedBalance;

    // Update the shift with closing data
    // Note: total_sales should already be accurate from the database trigger
    const { data, error } = await supabase
      .from('shifts')
      .update({
        status: 'closed',
        end_time: new Date().toISOString(),
        closing_balance: closingBalance,
        cash_discrepancy: discrepancy,
      })
      .eq('id', shiftId)
      .select()
      .single();
    
    if (error) {
      console.error('Error closing shift:', error);
      throw error;
    }
    
    return data;
  },

  forceCloseShift: async (shiftId: number): Promise<Shift | null> => {
    // Get the current shift data to calculate expected balance
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('opening_balance, total_sales')
      .eq('id', shiftId)
      .single();
    
    if (!shiftData) {
      throw new Error('Shift not found');
    }

    // Calculate cash sales from transactions (including tax) minus refunds
    const { data: transactions } = await supabase
      .from('transactions')
      .select('total_amount, refunded_amount')
      .eq('shift_id', shiftId)
      .eq('payment_method', 'cash')
      .eq('status', 'completed');
    
    const cashSales = transactions?.reduce((sum, t) => {
      const netAmount = (t.total_amount || 0) - (Number(t.refunded_amount) || 0);
      return sum + netAmount;
    }, 0) || 0;
    
    // Calculate expected cash drawer balance
    const expectedBalance = (shiftData.opening_balance || 0) + cashSales;

    // Force close with expected balance (no discrepancy)
    // Note: total_sales should already be accurate from the database trigger
    const { data, error } = await supabase
      .from('shifts')
      .update({
        status: 'closed',
        end_time: new Date().toISOString(),
        closing_balance: expectedBalance,
        cash_discrepancy: 0, // Force zero discrepancy
      })
      .eq('id', shiftId)
      .select()
      .single();
    
    if (error) {
      console.error('Error force closing shift:', error);
      throw error;
    }
    
    return data;
  },
  
  getRecentShifts: async (limit = 10, userId?: string): Promise<Shift[]> => {
    let query = supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) {
      query = query.eq('assigned_user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching recent shifts:', error);
      throw error;
    }
    
    return data || [];
  },
};

export { ShiftsApi };
