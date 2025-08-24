
import { Database } from '@/types/supabase';
import { PaymentMethod } from '@/pages/services/hooks/payment/types';

export type GiftCard = Database['public']['Tables']['gift_cards']['Row'];
export type GiftCardTransaction = Database['public']['Tables']['gift_card_transactions']['Row'];

export type CreateGiftCardParams = {
  initialBalance: number;
  notes?: string;
  manualCardNumber?: string;
};

// Using the shared type from payment types
export { type SplitPayment } from '@/pages/services/hooks/payment/types';
