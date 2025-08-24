
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfDay, subMonths, startOfMonth, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { locationsApi } from '../locations-api';

// Simple in-memory cache
const cache = {
  dailyRevenue: {
    data: null as any,
    timestamp: 0,
    includeBreakdown: false,
    isMonthly: false
  },
  dailyTransactions: {
    data: null as any,
    timestamp: 0,
    isMonthly: false
  },
  // Cache TTL in milliseconds (30 seconds)
  TTL: 30 * 1000
};

export const getDailyRevenue = async (showMonthly = false, includePaymentBreakdown = false) => {
  // Check if we have valid cached data
  const currentTime = Date.now();
  const cacheKey = 'dailyRevenue';
  
  if (
    cache[cacheKey].data && 
    currentTime - cache[cacheKey].timestamp < cache.TTL &&
    cache[cacheKey].isMonthly === showMonthly &&
    cache[cacheKey].includeBreakdown === includePaymentBreakdown
  ) {
    console.log('Using cached daily revenue data');
    return cache[cacheKey].data;
  }
  
  console.log('Fetching fresh daily revenue data');
  
  // Get current location for filtering
  const location = await locationsApi.getCurrentLocation();
  
  let query = supabase
    .from('transactions')
    .select(`
      created_at, 
      total_amount, 
      payment_method, 
      refunded_amount,
      transaction_items (
        services (
          name
        )
      )
    `)
    .eq('location_id', location?.id)
    .order('created_at', { ascending: true });
    
  // Filter data based on the view type
  if (showMonthly) {
    // For monthly view, get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    query = query.gte('created_at', sixMonthsAgo.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) throw error;

  const revenue = new Map<string, { total: number, cash: number, card: number }>();
  
  const currentDate = toZonedTime(new Date(), 'America/New_York');
  
  if (showMonthly) {
    // Get data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(startOfMonth(currentDate), i);
      const formattedDate = format(date, 'MMM yyyy');
      revenue.set(formattedDate, { total: 0, cash: 0, card: 0 });
    }

    data.forEach(transaction => {
      const transactionDate = toZonedTime(new Date(transaction.created_at), 'America/New_York');
      const formattedDate = format(transactionDate, 'MMM yyyy');
      
      if (revenue.has(formattedDate)) {
        const currentData = revenue.get(formattedDate) || { total: 0, cash: 0, card: 0 };
        
        // Check if this is a gift card sale (revenue) vs redemption (not revenue)
        const isGiftCardSale = transaction.transaction_items?.some((item: any) => 
          item.services?.name?.toLowerCase().includes('gift card'));
        const isGiftCardRedemption = transaction.payment_method === 'gift_card';
        
        // Only include revenue transactions: regular sales + gift card sales, exclude gift card redemptions
        if (!isGiftCardRedemption || isGiftCardSale) {
          // Use net amount (total_amount is already net after refunds in Supabase)
          const netAmount = Number(transaction.total_amount);
          
          currentData.total += netAmount;
          
          // Update payment method breakdown
          if (transaction.payment_method === 'cash') {
            currentData.cash += netAmount;
          } else {
            currentData.card += netAmount;
          }
        }
        
        revenue.set(formattedDate, currentData);
      }
    });
  } else {
    // Get data for last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const date = subDays(startOfDay(currentDate), i);
      const formattedDate = format(date, 'MMM dd');
      revenue.set(formattedDate, { total: 0, cash: 0, card: 0 });
    }
    
    data.forEach(transaction => {
      const transactionDate = toZonedTime(new Date(transaction.created_at), 'America/New_York');
      const formattedDate = format(transactionDate, 'MMM dd');
      
      if (revenue.has(formattedDate)) {
        const currentData = revenue.get(formattedDate) || { total: 0, cash: 0, card: 0 };
        
        // Check if this is a gift card sale (revenue) vs redemption (not revenue)
        const isGiftCardSale = transaction.transaction_items?.some((item: any) => 
          item.services?.name?.toLowerCase().includes('gift card'));
        const isGiftCardRedemption = transaction.payment_method === 'gift_card';
        
        // Only include revenue transactions: regular sales + gift card sales, exclude gift card redemptions
        if (!isGiftCardRedemption || isGiftCardSale) {
          // Use net amount (total_amount is already net after refunds in Supabase)
          const netAmount = Number(transaction.total_amount);
          
          currentData.total += netAmount;
          
          // Update payment method breakdown
          if (transaction.payment_method === 'cash') {
            currentData.cash += netAmount;
          } else {
            currentData.card += netAmount;
          }
        }
        
        revenue.set(formattedDate, currentData);
      }
    });
  }

  const result = Array.from(revenue.entries())
    .map(([date, data]) => ({
      name: date,
      revenue: data.total,
      ...(includePaymentBreakdown ? {
        cashRevenue: data.cash,
        cardRevenue: data.card
      } : {})
    }))
    .sort((a, b) => {
      const dateA = new Date(a.name + (showMonthly ? ' 01' : ', 2024'));
      const dateB = new Date(b.name + (showMonthly ? ' 01' : ', 2024'));
      return dateA.getTime() - dateB.getTime();
    });
    
  // Update cache
  cache[cacheKey] = {
    data: result,
    timestamp: Date.now(),
    isMonthly: showMonthly,
    includeBreakdown: includePaymentBreakdown
  };
  
  return result;
};

export const getDailyTransactionCounts = async (showMonthly = false) => {
  // Check if we have valid cached data
  const currentTime = Date.now();
  const cacheKey = 'dailyTransactions';
  
  if (
    cache[cacheKey].data && 
    currentTime - cache[cacheKey].timestamp < cache.TTL &&
    cache[cacheKey].isMonthly === showMonthly
  ) {
    console.log('Using cached transaction counts data');
    return cache[cacheKey].data;
  }
  
  console.log('Fetching fresh transaction counts data');
  
  // Get current location for filtering
  const location = await locationsApi.getCurrentLocation();
  
  let query = supabase
    .from('transactions')
    .select('created_at')
    .eq('location_id', location?.id)
    .order('created_at', { ascending: true });
    
  // Filter data based on the view type
  if (showMonthly) {
    // For monthly view, get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    query = query.gte('created_at', sixMonthsAgo.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) throw error;

  const counts = new Map<string, number>();
  
  const currentDate = toZonedTime(new Date(), 'America/New_York');
  
  if (showMonthly) {
    // Get data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(startOfMonth(currentDate), i);
      const formattedDate = format(date, 'MMM yyyy');
      counts.set(formattedDate, 0);
    }
    
    data.forEach(transaction => {
      const transactionDate = toZonedTime(new Date(transaction.created_at), 'America/New_York');
      const formattedDate = format(transactionDate, 'MMM yyyy');
      
      if (counts.has(formattedDate)) {
        const currentCount = counts.get(formattedDate) || 0;
        counts.set(formattedDate, currentCount + 1);
      }
    });
  } else {
    // Get data for last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const date = subDays(startOfDay(currentDate), i);
      const formattedDate = format(date, 'MMM dd');
      counts.set(formattedDate, 0);
    }
    
    data.forEach(transaction => {
      const transactionDate = toZonedTime(new Date(transaction.created_at), 'America/New_York');
      const formattedDate = format(transactionDate, 'MMM dd');
      
      if (counts.has(formattedDate)) {
        const currentCount = counts.get(formattedDate) || 0;
        counts.set(formattedDate, currentCount + 1);
      }
    });
  }

  const result = Array.from(counts.entries())
    .map(([date, count]) => ({
      name: date,
      count
    }))
    .sort((a, b) => {
      const dateA = new Date(a.name + (showMonthly ? ' 01' : ', 2024'));
      const dateB = new Date(b.name + (showMonthly ? ' 01' : ', 2024'));
      return dateA.getTime() - dateB.getTime();
    });
    
  // Update cache
  cache[cacheKey] = {
    data: result,
    timestamp: Date.now(),
    isMonthly: showMonthly
  };
  
  return result;
};

// Function to manually invalidate cache
export const invalidateRevenueCache = () => {
  cache.dailyRevenue.timestamp = 0;
  cache.dailyTransactions.timestamp = 0;
};
