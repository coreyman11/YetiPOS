
import { RealtimeTable, NetworkStatus } from "@/types/realtime";

// Define the context type
export interface RealtimeContextType {
  networkStatus: NetworkStatus;
}

// Define which query keys should be invalidated for each table change
export const TABLE_TO_QUERY_KEYS: Record<RealtimeTable, string[]> = {
  'transactions': [
    'transactions', 
    'daily-revenue', 
    'daily-transactions', 
    'customer-stats', 
    'comprehensive-report',
    'transactions-financial',
    'transactions-customer',
    'transactions-tax',
    'refunds'
  ],
  'inventory': [
    'inventory',
    'inventory-report',
    'inventory-categories'
  ],
  'customers': [
    'customers', 
    'customer-stats', 
    'comprehensive-report',
    'customers-report',
    'loyalty-transactions' // Added this to ensure loyalty transactions are refreshed when customer data changes
  ],
  'services': ['services'],
  'gift_cards': ['gift-cards', 'comprehensive-report'],
  'loyalty_program_settings': ['loyalty-programs', 'comprehensive-report', 'loyalty-transactions'], // Added loyalty-transactions
  'tax_configurations': ['tax-configurations'],
  'refunds': [
    'refunds',
    'daily-revenue',
    'comprehensive-report',
    'transactions-financial'
  ]
};

// Define tables to listen for changes
export const REALTIME_TABLES: RealtimeTable[] = [
  'inventory',
  'transactions',
  'customers',
  'services',
  'gift_cards',
  'loyalty_program_settings',
  'tax_configurations',
  'refunds'
];
