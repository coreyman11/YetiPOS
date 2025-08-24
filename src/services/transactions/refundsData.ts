import { supabase } from '@/lib/supabase';
import { subDays, format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { locationsApi } from '../locations-api';

export const getDailyRefunds = async (showMonthly: boolean = false) => {
  try {
    const location = await locationsApi.getCurrentLocation();
    
    let startDate: Date;
    let endDate: Date;
    
    if (showMonthly) {
      // Show last 6 months for monthly view
      startDate = startOfMonth(subMonths(new Date(), 5));
      endDate = endOfMonth(new Date());
    } else {
      // Show last 7 days for daily view
      startDate = startOfDay(subDays(new Date(), 6));
      endDate = endOfDay(new Date());
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('created_at, refunded_amount')
      .eq('location_id', location?.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .gt('refunded_amount', 0)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const refunds = new Map<string, number>();

    if (showMonthly) {
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const key = format(date, 'MMM yyyy');
        refunds.set(key, 0);
      }
    } else {
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const key = format(date, 'MMM dd');
        refunds.set(key, 0);
      }
    }

    // Process transactions
    transactions?.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const key = showMonthly 
        ? format(date, 'MMM yyyy')
        : format(date, 'MMM dd');
      
      if (refunds.has(key)) {
        const currentRefunds = refunds.get(key) || 0;
        refunds.set(key, currentRefunds + Number(transaction.refunded_amount || 0));
      }
    });

    return Array.from(refunds.entries()).map(([name, refunds]) => ({
      name,
      refunds: Number(refunds.toFixed(2))
    }));
  } catch (error) {
    console.error('Error fetching daily refunds:', error);
    return [];
  }
};