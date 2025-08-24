
import { supabase } from '@/lib/supabase';
import { GiftCard } from './types';
import { locationsApi } from '../locations-api';

export const giftCardQueries = {
  getAll: async () => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('gift_cards')
      .select(`
        *,
        gift_card_transactions (*)
      `)
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getByCardNumber: async (cardNumber: string) => {
    console.log(`Fetching gift card with number: ${cardNumber}`);
    
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .select(`
        *,
        gift_card_transactions (*)
      `)
      .eq('card_number', cardNumber)
      .maybeSingle();
    
    if (giftCardError) {
      console.error('Error fetching gift card:', giftCardError);
      throw giftCardError;
    }
    
    if (!giftCard) {
      console.error('Gift card not found:', cardNumber);
      throw new Error('Gift card not found');
    }

    // Get the most recent transaction's balance
    let currentBalance = giftCard.current_balance;
    if (giftCard.gift_card_transactions && giftCard.gift_card_transactions.length > 0) {
      const sortedTransactions = [...giftCard.gift_card_transactions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      currentBalance = sortedTransactions[0].balance_after;
    }

    console.log(`Retrieved gift card ${cardNumber}, stored balance: ${giftCard.current_balance}, calculated balance: ${currentBalance}`);

    return {
      ...giftCard,
      current_balance: currentBalance
    };
  },

  checkExistingCard: async (cardNumber: string): Promise<GiftCard | null> => {
    console.log(`Checking if gift card exists: ${cardNumber}`);
    
    const { data, error } = await supabase
      .from('gift_cards')
      .select(`
        *,
        gift_card_transactions (*)
      `)
      .eq('card_number', cardNumber)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking existing card:', error);
      throw error;
    }
    
    if (data) {
      // Get the most recent transaction's balance
      let currentBalance = data.current_balance;
      if (data.gift_card_transactions && data.gift_card_transactions.length > 0) {
        const sortedTransactions = [...data.gift_card_transactions]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        currentBalance = sortedTransactions[0].balance_after;
      }

      console.log(`Found existing gift card ${cardNumber}, balance: ${currentBalance}`);
      
      return {
        ...data,
        current_balance: currentBalance
      };
    }
    
    console.log(`No gift card found with number: ${cardNumber}`);
    return null;
  },

  generateCardNumber: async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_gift_card_number');
    if (error) throw error;
    return data;
  }
};
