
export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  name: string;
  mobile: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  credit_card_number: string;
  credit_card_expire_date?: string;
  token?: string;
  span?: string;
  bin?: string;
  created_at?: string;
}

export type PaymentMethod = "cash" | "credit" | "card_reader" | "gift_card" | "manual_credit";

export interface PendingTransaction {
  amount: number;
  amountToCharge: number;
  customerId: number | null;
  usePoints: boolean;
  cashierId?: string;
  giftCardId?: number;
  splitPayments?: SplitPayment[];
  items: any[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  shiftId?: number | null;
  loyaltyProgramId?: number | null;
}

export interface SplitPayment {
  payment_method: PaymentMethod;
  amount: number;
  gift_card_id?: number;
  gift_card_number?: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'inventory';
  service_id?: number | null;
  inventory_id?: number | null;
}
