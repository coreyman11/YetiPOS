
export type NetworkStatus = {
  online: boolean;
  lastOnline: Date | null;
  lastChanged?: Date; // Added this field to support existing usage
};

export type RealtimeTable = 
  | 'transactions' 
  | 'inventory' 
  | 'customers'
  | 'services'
  | 'gift_cards'
  | 'loyalty_program_settings'
  | 'tax_configurations'
  | 'refunds';

export type RealtimeUpdate = {
  table: RealtimeTable;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  old_record: any | null;
  new_record: any | null;
  timestamp: Date;
};
