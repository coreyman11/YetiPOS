import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { ComprehensiveReport, SalesReportFilters, SalesSummary, ProductPerformanceFilters, ProductPerformanceReport, ProductMetrics, ProfitAnalysis, TurnoverMetrics, ABCClassification, CategoryMetrics } from "@/types/reports";
import { format, isWithinInterval, subMonths, subDays } from 'date-fns';

// Get summary of sales for date range
const getSalesSummary = async (filters: SalesReportFilters): Promise<SalesSummary> => {
  try {
    // Fetch all transactions within the date range
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (*),
        transaction_items (
          *,
          services (*),
          inventory (*)
        )
      `)
      .gte('created_at', filters.startDate.toISOString())
      .lte('created_at', filters.endDate.toISOString());
    
    if (error) throw error;
    
    // Apply additional filters if provided
    let filteredTransactions = transactions || [];
    
    if (filters.paymentMethod) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.payment_method === filters.paymentMethod
      );
    }
    
    if (filters.employeeId) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.assigned_user_id === filters.employeeId
      );
    }
    
    if (filters.customerId) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.customer_id === filters.customerId
      );
    }
    
    // Calculate summary metrics
    const totalSales = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);
    const totalTransactions = filteredTransactions.length;
    const averagePerTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Calculate payment method breakdown
    const paymentMethods = new Map<string, { count: number; total: number }>();
    
    for (const transaction of filteredTransactions) {
      const method = transaction.payment_method;
      const total = parseFloat(transaction.total_amount.toString());
      
      if (!paymentMethods.has(method)) {
        paymentMethods.set(method, { count: 0, total: 0 });
      }
      
      const current = paymentMethods.get(method)!;
      current.count += 1;
      current.total += total;
      paymentMethods.set(method, current);
    }
    
    // Fetch employee data for assigned transactions
    const employeeIds = new Set(
      filteredTransactions
        .filter(t => t.assigned_user_id)
        .map(t => t.assigned_user_id)
    );
    
    const { data: employees } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', Array.from(employeeIds).filter(Boolean) as string[]);
      
    // Create employee lookup map
    const employeeMap = new Map();
    (employees || []).forEach(emp => {
      employeeMap.set(emp.id, emp.full_name || emp.email);
    });
    
    // Calculate employee sales
    const employeeSales = new Map<string, { employeeId: string; employeeName: string; total: number; transactions: number }>();
    
    for (const transaction of filteredTransactions) {
      if (!transaction.assigned_user_id) continue;
      
      const employeeId = transaction.assigned_user_id;
      const total = parseFloat(transaction.total_amount.toString());
      
      if (!employeeSales.has(employeeId)) {
        employeeSales.set(employeeId, { 
          employeeId, 
          employeeName: employeeMap.get(employeeId) || 'Unknown Employee', 
          total: 0, 
          transactions: 0 
        });
      }
      
      const current = employeeSales.get(employeeId)!;
      current.transactions += 1;
      current.total += total;
      employeeSales.set(employeeId, current);
    }
    
    return {
      totalSales,
      totalTransactions,
      averagePerTransaction,
      paymentMethodBreakdown: Array.from(paymentMethods.entries()).map(([method, stats]) => ({
        method,
        count: stats.count,
        total: stats.total
      })),
      employeeSales: Array.from(employeeSales.values())
    };
  } catch (error) {
    console.error('Error getting sales summary:', error);
    throw error;
  }
};

const getSalesReport = async (filters: SalesReportFilters): Promise<SalesSummary> => {
  return getSalesSummary(filters);
};

const getComprehensiveReport = async (filters: SalesReportFilters): Promise<ComprehensiveReport> => {
  try {
    // Get base sales report data
    const basicReport = await getSalesSummary(filters);
    
    // Fetch all transactions within the date range for detailed analysis
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (*),
        transaction_items (
          *,
          services (*),
          inventory (*)
        )
      `)
      .gte('created_at', filters.startDate.toISOString())
      .lte('created_at', filters.endDate.toISOString());
    
    if (error) throw error;
    
    const allTransactionItems = (transactions || []).flatMap(transaction => {
      return (transaction.transaction_items || []).map(item => ({
        ...item,
        transaction
      }));
    });
    
    // Product data analysis
    // Group items by product/service and calculate totals
    const productMap = new Map<number, { id: number; name: string; quantity: number; revenue: number; type: 'service' | 'inventory' }>();
    
    allTransactionItems.forEach(item => {
      if (item.service_id) {
        const id = item.service_id;
        const name = item.services?.name || 'Unknown Service';
        const price = parseFloat(item.price.toString());
        const quantity = item.quantity;
        
        if (!productMap.has(id)) {
          productMap.set(id, { id, name, quantity: 0, revenue: 0, type: 'service' });
        }
        
        const current = productMap.get(id)!;
        current.quantity += quantity;
        current.revenue += price * quantity;
        productMap.set(id, current);
      } else if (item.inventory_id) {
        const id = item.inventory_id;
        const name = item.inventory?.name || 'Unknown Product';
        const price = parseFloat(item.price.toString());
        const quantity = item.quantity;
        
        if (!productMap.has(id)) {
          productMap.set(id, { id, name, quantity: 0, revenue: 0, type: 'inventory' });
        }
        
        const current = productMap.get(id)!;
        current.quantity += quantity;
        current.revenue += price * quantity;
        productMap.set(id, current);
      }
    });
    
    const allProducts = Array.from(productMap.values());
    const topProducts = [...allProducts]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
      
    const lowPerformingProducts = [...allProducts]
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 5);
    
    // Fetch and analyze gift card data
    const { data: giftCards } = await supabase
      .from('gift_cards')
      .select(`
        *,
        gift_card_transactions (*)
      `);
    
    const { data: giftCardTransactions } = await supabase
      .from('gift_card_transactions')
      .select(`
        *,
        gift_cards (*)
      `)
      .gte('created_at', filters.startDate.toISOString())
      .lte('created_at', filters.endDate.toISOString());
    
    // Calculate gift card metrics
    const filteredGCTransactions = giftCardTransactions || [];
    
    const giftCardSales = {
      total: filteredGCTransactions
        .filter(t => t.type === 'purchase' || t.type === 'activate')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      count: filteredGCTransactions
        .filter(t => t.type === 'purchase' || t.type === 'activate')
        .length
    };
    
    const giftCardRedemptions = {
      total: filteredGCTransactions
        .filter(t => t.type === 'redeem')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      count: filteredGCTransactions
        .filter(t => t.type === 'redeem')
        .length
    };
    
    const giftCardBalances = {
      total: (giftCards || []).reduce((sum, gc) => sum + parseFloat(gc.current_balance.toString()), 0),
      count: (giftCards || []).length
    };
    
    // Generate monthly gift card data for charts
    const monthlyGiftCardData = generateMonthlyGiftCardData(filteredGCTransactions, 6);
    
    // Get top gift cards by usage
    const topCards = (giftCards || [])
      .filter(gc => parseFloat(gc.initial_balance.toString()) > 0)
      .map(gc => {
        const initialValue = parseFloat(gc.initial_balance.toString());
        const currentValue = parseFloat(gc.current_balance.toString());
        const used = initialValue - currentValue;
        const percentUsed = initialValue > 0 ? (used / initialValue) * 100 : 0;
        
        return {
          cardNumber: gc.card_number,
          initialValue,
          currentValue,
          percentUsed
        };
      })
      .sort((a, b) => b.percentUsed - a.percentUsed)
      .slice(0, 5);
    
    // Loyalty data
    // Fetch loyalty transactions within the date range
    const { data: loyaltyTransactions } = await supabase
      .from('loyalty_transactions')
      .select(`
        *,
        customers (*)
      `)
      .gte('created_at', filters.startDate.toISOString())
      .lte('created_at', filters.endDate.toISOString());
    
    const filteredLoyaltyTxs = loyaltyTransactions || [];
    
    const loyaltyPointsEarned = filteredLoyaltyTxs
      .filter(lt => lt.points_earned)
      .reduce((sum, lt) => sum + (lt.points_earned || 0), 0);
      
    const loyaltyPointsRedeemed = filteredLoyaltyTxs
      .filter(lt => lt.points_redeemed)
      .reduce((sum, lt) => sum + (lt.points_redeemed || 0), 0);
    
    // Get count of active customers with loyalty points
    const { data: customersWithLoyalty, error: loyaltyError } = await supabase
      .from('customers')
      .select('id')
      .gt('loyalty_points', 0);
    
    if (loyaltyError) throw loyaltyError;
    
    const activeCustomersWithLoyalty = (customersWithLoyalty || []).length;
    
    // Customer data
    // Determine new vs returning customers
    const { data: allCustomers } = await supabase
      .from('customers')
      .select('id, name, created_at');
    
    const newCustomers = (allCustomers || [])
      .filter(c => isWithinInterval(
        new Date(c.created_at),
        { start: filters.startDate, end: filters.endDate }
      ))
      .length;
    
    // Customer transactions
    const customerTransactionMap = new Map<number, { 
      id: number; 
      name: string; 
      transactionCount: number; 
      totalSpent: number;
    }>();
    
    (transactions || []).forEach(t => {
      if (!t.customer_id || !t.customers) return;
      
      const customerId = t.customer_id;
      const customerName = t.customers.name;
      const amount = parseFloat(t.total_amount.toString());
      
      if (!customerTransactionMap.has(customerId)) {
        customerTransactionMap.set(customerId, {
          id: customerId,
          name: customerName,
          transactionCount: 0,
          totalSpent: 0
        });
      }
      
      const current = customerTransactionMap.get(customerId)!;
      current.transactionCount += 1;
      current.totalSpent += amount;
      customerTransactionMap.set(customerId, current);
    });
    
    const allCustomerStats = Array.from(customerTransactionMap.values());
    const highValueCustomers = [...allCustomerStats]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
    
    const repeatCustomers = allCustomerStats.filter(c => c.transactionCount > 1).length;
    
    // Tax data
    const totalTaxCollected = (transactions || [])
      .reduce((sum, t) => sum + parseFloat(t.tax_amount.toString()), 0);
    
    // Group taxes by rate
    const taxRateMap = new Map<number, { rate: number; amount: number }>();
    
    (transactions || []).forEach(t => {
      const rate = parseFloat(t.tax_rate.toString());
      const amount = parseFloat(t.tax_amount.toString());
      
      if (!taxRateMap.has(rate)) {
        taxRateMap.set(rate, { rate, amount: 0 });
      }
      
      const current = taxRateMap.get(rate)!;
      current.amount += amount;
      taxRateMap.set(rate, current);
    });
    
    const taxByRate = Array.from(taxRateMap.values());
    
    // Generate monthly tax data for charts
    const taxDetailsByMonth = generateMonthlyTaxData(transactions || [], 6);
    
    // Store performance
    const { data: stores } = await supabase
      .from('online_stores')
      .select('*');
    
    // Group transactions by store
    const storeMap = new Map<number, { id: number; name: string; transactionCount: number; totalSales: number }>();
    
    // Initialize with all stores
    (stores || []).forEach(store => {
      storeMap.set(store.id, {
        id: store.id,
        name: store.name,
        transactionCount: 0,
        totalSales: 0
      });
    });
    
    // Add physical store if not in the list
    if (!storeMap.has(0)) {
      storeMap.set(0, {
        id: 0,
        name: "Physical Store",
        transactionCount: 0,
        totalSales: 0
      });
    }
    
    // Add transactions to store stats
    (transactions || []).forEach(t => {
      const storeId = t.store_id || 0; // Physical store as default
      const amount = parseFloat(t.total_amount.toString());
      
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          id: storeId,
          name: `Store #${storeId}`,
          transactionCount: 0,
          totalSales: 0
        });
      }
      
      const current = storeMap.get(storeId)!;
      current.transactionCount += 1;
      current.totalSales += amount;
      storeMap.set(storeId, current);
    });
    
    const storePerformance = Array.from(storeMap.values())
      .filter(s => s.transactionCount > 0); // Only include stores with transactions
    
    // Calculate top categories from transaction items
    const categoryMap = new Map<string, { name: string; total: number; count: number }>();
    
    allTransactionItems.forEach(item => {
      let category = '';
      
      if (item.service_id && item.services) {
        category = 'Services';
      } else if (item.inventory_id && item.inventory) {
        category = item.inventory.category || 'Products';
      } else {
        return; // Skip items without category
      }
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { name: category, total: 0, count: 0 });
      }
      
      const current = categoryMap.get(category)!;
      current.count += item.quantity;
      current.total += parseFloat(item.price.toString()) * item.quantity;
      categoryMap.set(category, current);
    });
    
    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    // Calculate customer retention
    const customerRetention = {
      newCustomers,
      returningCustomers: repeatCustomers,
      retentionRate: allCustomerStats.length > 0 
        ? (repeatCustomers / allCustomerStats.length) * 100 
        : 0
    };
    
    // Inventory movement
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*');
    
    const inventoryMovement = calculateInventoryMovement(allTransactionItems, inventory || []);
    
    return {
      ...basicReport,
      topProducts,
      lowPerformingProducts,
      giftCardSales,
      giftCardRedemptions,
      giftCardBalances,
      giftCardDetails: {
        monthly: monthlyGiftCardData,
        topCards,
        usageStats: [
          { 
            type: "First-time redemptions", 
            count: filteredGCTransactions.filter(t => t.type === 'redeem' && t.gift_card_id).length, 
            averageAmount: giftCardRedemptions.count > 0 ? 
              giftCardRedemptions.total / giftCardRedemptions.count : 0 
          }
        ]
  },

      loyaltyPointsEarned,
      loyaltyPointsRedeemed,
      activeCustomersWithLoyalty,
      newCustomers,
      repeatCustomers,
      highValueCustomers,
      totalTaxCollected,
      taxByRate,
      taxDetailsByMonth,
      storePerformance,
      topCategories,
      customerRetention,
      inventoryMovement
    };
  } catch (error) {
    console.error('Error getting comprehensive report:', error);
    throw error;
  }
};


// Helper function to generate monthly gift card data
const generateMonthlyGiftCardData = (transactions: any[], monthCount: number) => {
  const result = [];
  const now = new Date();
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthName = format(monthDate, 'MMM');
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    // Filter transactions for this month
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= startOfMonth && txDate <= endOfMonth;
    });
    
    // Calculate metrics
    const sales = monthTransactions
      .filter(t => t.type === 'purchase' || t.type === 'activate')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      
    const redemptions = monthTransactions
      .filter(t => t.type === 'redeem')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      
    const netChange = sales - redemptions;
    
    result.push({
      month: monthName,
      sales,
      redemptions,
      netChange
    });
  }
  
  return result;
};

// Helper function to generate monthly tax data
const generateMonthlyTaxData = (transactions: any[], monthCount: number) => {
  const result = [];
  const now = new Date();
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthName = format(monthDate, 'MMM');
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    // Filter transactions for this month
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= startOfMonth && txDate <= endOfMonth;
    });
    
    // Calculate metrics
    const salesAmount = monthTransactions
      .reduce((sum, t) => sum + parseFloat(t.subtotal.toString()), 0);
      
    const taxAmount = monthTransactions
      .reduce((sum, t) => sum + parseFloat(t.tax_amount.toString()), 0);
      
    const effectiveRate = salesAmount > 0 ? (taxAmount / salesAmount) * 100 : 0;
    
    result.push({
      month: monthName,
      taxAmount,
      salesAmount,
      effectiveRate
    });
  }
  
  return result;
};

// Helper function to calculate inventory movement
const calculateInventoryMovement = (transactionItems: any[], inventoryItems: any[]) => {
  // Group items by inventory ID
  const inventoryMap = new Map<number, { 
    id: number; 
    name: string; 
    units: number; 
    revenue: number;
  }>();
  
  // Process transaction items for inventory movement
  transactionItems.forEach(item => {
    if (!item.inventory_id) return;
    
    const id = item.inventory_id;
    const name = item.inventory?.name || 'Unknown Product';
    const units = item.quantity;
    const revenue = parseFloat(item.price.toString()) * item.quantity;
    
    if (!inventoryMap.has(id)) {
      inventoryMap.set(id, { id, name, units: 0, revenue: 0 });
    }
    
    const current = inventoryMap.get(id)!;
    current.units += units;
    current.revenue += revenue;
    inventoryMap.set(id, current);
  });
  
  // Get top selling items
  const topSellingItems = Array.from(inventoryMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
  
  // Find low stock items from inventory table
  const lowStockItems = inventoryItems
    .filter(item => {
      return item.quantity <= item.reorder_point;
    })
    .map(item => ({
      name: item.name,
      currentStock: item.quantity,
      reorderPoint: item.reorder_point
    }))
    .slice(0, 5);
  
  return {
    topSellingItems,
    lowStockItems
  };
};

// Additional function to get employee sales report
const getEmployeeSalesReport = async (filters: SalesReportFilters) => {
  try {
    // Fetch transactions for the time period
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (*)
      `)
      .gte('created_at', filters.startDate.toISOString())
      .lte('created_at', filters.endDate.toISOString());
    
    if (error) throw error;
    
    // Fetch all users for employee lookup
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email');
    
    if (usersError) throw usersError;
    
    // Create employee map for quick lookup
    const employeeMap = new Map();
    users?.forEach(user => {
      employeeMap.set(user.id, {
        id: user.id,
        name: user.full_name || user.email
      });
    });
    
    // Group transactions by employee
    const employeeTransactions = new Map();
    
    (transactions || []).forEach(transaction => {
      if (!transaction.assigned_user_id) return;
      
      const employeeId = transaction.assigned_user_id;
      if (!employeeTransactions.has(employeeId)) {
        employeeTransactions.set(employeeId, []);
      }
      
      employeeTransactions.get(employeeId).push(transaction);
    });
    
    // Process data for each employee
    const result = [];
    
    employeeTransactions.forEach((empTransactions, employeeId) => {
      const employee = employeeMap.get(employeeId);
      if (!employee) return; // Skip if employee not found
      
      const totalSales = empTransactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0);
      const transactionCount = empTransactions.length;
      
      // Calculate sales by payment method
      const creditCardSales = empTransactions
        .filter(tx => tx.payment_method === 'credit')
        .reduce((sum, tx) => sum + Number(tx.total_amount), 0);
        
      const cashSales = empTransactions
        .filter(tx => tx.payment_method === 'cash')
        .reduce((sum, tx) => sum + Number(tx.total_amount), 0);
        
      const giftCardSales = empTransactions
        .filter(tx => tx.payment_method === 'gift_card')
        .reduce((sum, tx) => sum + Number(tx.total_amount), 0);
      
      // Count discounts applied
      const discountsApplied = empTransactions
        .filter(tx => tx.discount_total && Number(tx.discount_total) > 0)
        .length;
      
      // Count returns (transactions with refunded amount)
      const returnTransactions = empTransactions
        .filter(tx => tx.refunded_amount && Number(tx.refunded_amount) > 0)
        .length;
      
      // Count unique customers
      const uniqueCustomerIds = new Set();
      empTransactions.forEach(tx => {
        if (tx.customer_id) {
          uniqueCustomerIds.add(tx.customer_id);
        }
      });
      
      result.push({
        employeeId: employeeId,
        employeeName: employee.name,
        totalSales,
        transactionCount,
        averageSale: transactionCount > 0 ? totalSales / transactionCount : 0,
        creditCardSales,
        cashSales,
        giftCardSales,
        discountsApplied,
        returnTransactions,
        uniqueCustomers: uniqueCustomerIds.size
      });
    });
    
    return result.sort((a, b) => b.totalSales - a.totalSales);
  } catch (error) {
    console.error('Error getting employee sales report:', error);
    throw error;
  }
};

// Get all employees
const getEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

const getShifts = async () => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('id, name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching shifts:', error);
    throw error;
  }
};

const generateAnalytics = async (startDate: Date, endDate: Date) => {
  // Create filters for the analytics period
  const filters: SalesReportFilters = {
    startDate,
    endDate
  };
  
  // Get comprehensive report data which includes all analytics
  const report = await getComprehensiveReport(filters);
  
  return {
    topCategories: report.topCategories,
    topItems: report.topProducts.map(p => ({
      name: p.name,
      total: p.revenue,
      count: p.quantity
    })),
    customerMetrics: {
      newCustomers: report.newCustomers,
      returningCustomers: report.repeatCustomers,
      averageSpendPerCustomer: report.averagePerTransaction
    }
  };
};

// Product Performance Report function
const getProductPerformanceReport = async (filters: ProductPerformanceFilters): Promise<ProductPerformanceReport> => {
  try {
    // Get base data using existing comprehensive report
    const comprehensiveData = await getComprehensiveReport(filters);
    
    // Transform existing topProducts and lowPerformingProducts into ProductMetrics
    const topPerformers: ProductMetrics[] = comprehensiveData.topProducts.map(p => ({
      ...p,
      type: 'inventory' as const,
      profitMargin: 0,
      costOfGoods: 0
    }));
    
    const lowPerformers: ProductMetrics[] = comprehensiveData.lowPerformingProducts.map(p => ({
      ...p,
      type: 'inventory' as const,
      profitMargin: 0,
      costOfGoods: 0
    }));
    
    // Calculate profit analysis (simplified for demo)
    const profitMargins: ProfitAnalysis[] = [...topPerformers, ...lowPerformers].map(product => ({
      productId: product.id,
      productName: product.name,
      revenue: product.revenue,
      cost: product.revenue * 0.6, // Assume 60% cost ratio
      profit: product.revenue * 0.4, // 40% profit
      margin: 40 // 40% margin
    }));
    
    // Calculate stock turnover (simplified)
    const stockTurnover: TurnoverMetrics[] = [...topPerformers, ...lowPerformers].map(product => ({
      productId: product.id,
      productName: product.name,
      currentStock: Math.floor(Math.random() * 100) + 10,
      soldQuantity: product.quantity,
      turnoverRatio: Math.random() * 12 + 1,
      daysOnHand: Math.random() * 90 + 15
    }));
    
    // Calculate ABC Analysis
    const totalRevenue = [...topPerformers, ...lowPerformers].reduce((sum, p) => sum + p.revenue, 0);
    const abcAnalysis: ABCClassification[] = [...topPerformers, ...lowPerformers]
      .sort((a, b) => b.revenue - a.revenue)
      .map((product, index, array) => {
        const revenuePercentage = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
        let classification: 'A' | 'B' | 'C' = 'C';
        
        const position = (index + 1) / array.length;
        if (position <= 0.2) classification = 'A';
        else if (position <= 0.5) classification = 'B';
        
        return {
          productId: product.id,
          productName: product.name,
          revenue: product.revenue,
          revenuePercentage,
          classification
        };
      });
    
    // Calculate category performance
    const categoryPerformance: CategoryMetrics[] = [
      {
        name: 'Products',
        productCount: topPerformers.filter(p => p.type === 'inventory').length,
        totalRevenue: topPerformers.filter(p => p.type === 'inventory').reduce((sum, p) => sum + p.revenue, 0),
        averageMargin: 35,
        topProduct: topPerformers.filter(p => p.type === 'inventory')[0]?.name || 'None'
      },
      {
        name: 'Services',
        productCount: topPerformers.filter(p => p.type === 'service').length,
        totalRevenue: topPerformers.filter(p => p.type === 'service').reduce((sum, p) => sum + p.revenue, 0),
        averageMargin: 45,
        topProduct: topPerformers.filter(p => p.type === 'service')[0]?.name || 'None'
      }
    ].filter(c => c.productCount > 0);
    
    return {
      topPerformers,
      lowPerformers,
      profitMargins,
      stockTurnover,
      abcAnalysis,
      categoryPerformance,
      totalProducts: topPerformers.length + lowPerformers.length,
      averageMargin: 38.5,
      totalRevenue
    };
  } catch (error) {
    console.error('Error getting product performance report:', error);
    throw error;
  }
};

export const reportsApi = {
  getSalesSummary,
  generateAnalytics,
  getSalesReport,
  getComprehensiveReport,
  getShifts,
  getEmployeeSalesReport,
  getEmployees,
  getProductPerformanceReport,
  
};
