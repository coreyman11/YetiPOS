
import { Database } from "@/types/supabase";
import { PaymentMethod } from '@/pages/services/hooks/payment/types';

export interface SalesReportFilters {
  startDate: Date;
  endDate: Date;
  paymentMethod?: string;
  shiftId?: number;
  employeeId?: string;
  customerId?: number;
}

export interface ProductPerformanceFilters extends SalesReportFilters {
  categoryFilter?: string;
  includeServices?: boolean;
  minimumSales?: number;
}

export interface ProductMetrics {
  id: number;
  name: string;
  quantity: number;
  revenue: number;
  type?: 'service' | 'inventory';
  category?: string;
  profitMargin?: number;
  costOfGoods?: number;
}

export interface ProfitAnalysis {
  productId: number;
  productName: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface TurnoverMetrics {
  productId: number;
  productName: string;
  currentStock: number;
  soldQuantity: number;
  turnoverRatio: number;
  daysOnHand: number;
}

export interface ABCClassification {
  productId: number;
  productName: string;
  revenue: number;
  revenuePercentage: number;
  classification: 'A' | 'B' | 'C';
}

export interface CategoryMetrics {
  name: string;
  productCount: number;
  totalRevenue: number;
  averageMargin: number;
  topProduct: string;
}

export interface ProductPerformanceReport {
  topPerformers: ProductMetrics[];
  lowPerformers: ProductMetrics[];
  profitMargins: ProfitAnalysis[];
  stockTurnover: TurnoverMetrics[];
  abcAnalysis: ABCClassification[];
  categoryPerformance: CategoryMetrics[];
  totalProducts: number;
  averageMargin: number;
  totalRevenue: number;
}

export interface SalesSummary {
  totalSales: number;
  totalTransactions: number;
  averagePerTransaction: number;
  paymentMethodBreakdown: {
    method: string;
    count: number;
    total: number;
  }[];
  employeeSales?: {
    employeeId: string;
    employeeName: string;
    total: number;
    transactions: number;
  }[];
  shiftSales?: {
    shiftId: number;
    shiftName: string;
    total: number;
    transactions: number;
  }[];
}


export interface ComprehensiveReport extends SalesSummary {
  // Product data
  topProducts: {
    id: number;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  lowPerformingProducts: {
    id: number;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  
  // Gift card data
  giftCardSales: {
    total: number;
    count: number;
  };
  giftCardRedemptions: {
    total: number;
    count: number;
  };
  giftCardBalances: {
    total: number;
    count: number;
  };
  giftCardDetails?: {
    monthly: {
      month: string;
      sales: number;
      redemptions: number;
      netChange: number;
    }[];
    topCards?: {
      cardNumber: string;
      initialValue: number;
      currentValue: number;
      percentUsed: number;
    }[];
    usageStats?: {
      type: string;
      count: number;
      averageAmount: number;
    }[];
  };
  
  // Loyalty data
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  activeCustomersWithLoyalty: number;
  
  // Customer data
  newCustomers: number;
  repeatCustomers: number;
  highValueCustomers: {
    id: number;
    name: string;
    transactionCount: number;
    totalSpent: number;
  }[];
  
  // Tax data
  totalTaxCollected: number;
  taxByRate: {
    rate: number;
    amount: number;
  }[];
  taxDetailsByMonth?: {
    month: string;
    taxAmount: number;
    salesAmount: number;
    effectiveRate: number;
  }[];
  
  // Store performance
  storePerformance: {
    id: number;
    name: string;
    transactionCount: number;
    totalSales: number;
  }[];
  
  // Original data from SalesSummary extended
  topCategories: {
    name: string;
    total: number;
    count: number;
  }[];
  customerRetention: {
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
  };
  inventoryMovement: {
    topSellingItems: {
      name: string;
      units: number;
      revenue: number;
    }[];
    lowStockItems: {
      name: string;
      currentStock: number;
      reorderPoint: number;
    }[];
  };
}
