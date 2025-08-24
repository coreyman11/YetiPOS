import { useQuery } from "@tanstack/react-query";
import { DollarSign, CreditCard, Receipt, Users } from "lucide-react";
import { transactionsApi, customersApi, locationsApi } from "@/services";
import { Database } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, isAfter } from "date-fns";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ServicesChart } from "@/components/dashboard/ServicesChart";
import { TopProductsCard } from "@/components/dashboard/TopProductsCard";
import { PeakHoursChart } from "@/components/dashboard/PeakHoursChart";
import { RefundsChart } from "@/components/dashboard/RefundsChart";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { toast } from "sonner";
import { useRealtime } from "@/contexts/realtime-context";

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  transaction_items?: Array<{
    services?: {
      name?: string;
    };
  }>;
};
type DailyRevenue = { 
  name: string; 
  revenue: number;
  cashRevenue?: number;
  cardRevenue?: number;
};

type ChartItem = {
  id: string;
  component: JSX.Element;
};

const CHART_ORDER_STORAGE_KEY = 'dashboard-chart-order';

const Dashboard = () => {
  const [showMonthlyTotal, setShowMonthlyTotal] = useState(false);
  const [showMonthlyTransactions, setShowMonthlyTransactions] = useState(false);
  const [showMonthlyAverage, setShowMonthlyAverage] = useState(false);
  const [chartOrder, setChartOrder] = useState<ChartItem[]>([]);
  const [dragEnabled, setDragEnabled] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  
  const { networkStatus } = useRealtime();

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      const location = await locationsApi.getCurrentLocation();
      setSelectedLocationId(location?.id || null);
    };
    getCurrentLocation();
  }, []);

  const { data: dailyRevenue = [], refetch: refetchRevenue } = useQuery<DailyRevenue[]>({
    queryKey: ['daily-revenue', showMonthlyTotal, selectedLocationId],
    queryFn: () => transactionsApi.getDailyRevenue(showMonthlyTotal, true),
    staleTime: 60 * 1000,
    refetchInterval: networkStatus.online ? 60 * 1000 : false,
    enabled: !!selectedLocationId,
  });

  const { data: dailyTransactionCounts = [], refetch: refetchTransactions } = useQuery({
    queryKey: ['daily-transactions', showMonthlyTransactions, selectedLocationId],
    queryFn: () => transactionsApi.getDailyTransactionCounts(showMonthlyTransactions),
    staleTime: 60 * 1000,
    refetchInterval: networkStatus.online ? 60 * 1000 : false,
    enabled: !!selectedLocationId,
  });

  const { data: allTransactions = [], refetch: refetchAllTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (
            services (
              name
            )
          )
        `)
        .eq('location_id', selectedLocationId);
        
      if (error) throw error;
      return (data || []) as Transaction[];
    },
    staleTime: 60 * 1000,
    refetchInterval: networkStatus.online ? 60 * 1000 : false,
    enabled: !!selectedLocationId,
  });

  const { data: customerStats = { total: 0, newThisWeek: 0 }, refetch: refetchCustomerStats } = useQuery({
    queryKey: ['customer-stats', selectedLocationId],
    queryFn: () => customersApi.getCustomerStats(selectedLocationId || undefined),
    staleTime: 60 * 1000,
    refetchInterval: networkStatus.online ? 60 * 1000 : false,
    enabled: !!selectedLocationId,
  });

  const { data: dailyRefunds = [], refetch: refetchRefunds } = useQuery({
    queryKey: ['daily-refunds', showMonthlyTotal, selectedLocationId],
    queryFn: () => transactionsApi.getDailyRefunds(showMonthlyTotal),
    staleTime: 60 * 1000,
    refetchInterval: networkStatus.online ? 60 * 1000 : false,
    enabled: !!selectedLocationId,
  });

  useEffect(() => {
    if (networkStatus.online) {
      const refreshData = () => {
        console.log('🔄 Dashboard initial data load');
        refetchRevenue();
        refetchTransactions();
        refetchAllTransactions();
        refetchCustomerStats();
        refetchRefunds();
      };
      
      refreshData();
    }
  }, [networkStatus.online, refetchRevenue, refetchTransactions, refetchAllTransactions, refetchCustomerStats, refetchRefunds]);

  useEffect(() => {
    const savedChartOrder = localStorage.getItem(CHART_ORDER_STORAGE_KEY);
    
    if (savedChartOrder) {
      try {
        const savedOrderIds = JSON.parse(savedChartOrder);
        
        if (dailyRevenue.length > 0 && dailyTransactionCounts.length > 0 && dailyRefunds.length > 0) {
          const defaultCharts = getDefaultCharts(dailyRevenue, dailyTransactionCounts, dailyRefunds);
          
          const reorderedCharts = savedOrderIds.map(
            (id: string) => defaultCharts.find(chart => chart.id === id)
          ).filter(Boolean);
          
          if (reorderedCharts.length === defaultCharts.length) {
            setChartOrder(reorderedCharts);
            return;
          }
        }
      } catch (error) {
        console.error("Error parsing saved chart order:", error);
      }
    }
    
    if (dailyRevenue.length > 0 && dailyTransactionCounts.length > 0 && dailyRefunds.length > 0) {
      setChartOrder(getDefaultCharts(dailyRevenue, dailyTransactionCounts, dailyRefunds));
    }
  }, [dailyRevenue, dailyTransactionCounts, dailyRefunds]);

  // Update drag enabled state when chart order changes
  useEffect(() => {
    if (chartOrder.length > 0) {
      // Briefly disable dragging to ensure components are fully rendered
      setDragEnabled(false);
      const timer = setTimeout(() => setDragEnabled(true), 300);
      return () => clearTimeout(timer);
    }
  }, [chartOrder.length]);

  const getDefaultCharts = (revenue: DailyRevenue[], transactions: any[], refunds: any[]) => [
    {
      id: 'daily-revenue',
      component: <RevenueChart data={revenue} title="Daily Revenue" showBreakdown={true} />
    },
    {
      id: 'transaction-count',
      component: <ServicesChart data={transactions} showMonthly={showMonthlyTransactions} />
    },
    {
      id: 'monthly-trends',
      component: <RevenueChart data={revenue} title="Monthly Trends" />
    },
    {
      id: 'refunds-chart',
      component: <RefundsChart 
        data={refunds} 
        title={showMonthlyTotal ? "Monthly Refunds" : "Daily Refunds"} 
        showMonthly={showMonthlyTotal}
      />
    },
    {
      id: 'top-products',
      component: <TopProductsCard />
    }
  ];

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    const newChartOrder = Array.from(chartOrder);
    const [removed] = newChartOrder.splice(source.index, 1);
    newChartOrder.splice(destination.index, 0, removed);
    
    setChartOrder(newChartOrder);
    
    const orderIds = newChartOrder.map(chart => chart.id);
    localStorage.setItem(CHART_ORDER_STORAGE_KEY, JSON.stringify(orderIds));
    
    toast.success("Dashboard layout updated");
  };

  const calculateRevenue = () => {
    if (!showMonthlyTotal) {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      return (allTransactions || [])
        .filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate >= startOfToday && transactionDate <= endOfToday;
        })
        .reduce((sum, transaction) => {
          // Check if this is a gift card sale (revenue) vs redemption (not revenue)
          const isGiftCardSale = transaction.transaction_items?.some(item => 
            item.services?.name?.toLowerCase().includes('gift card'));
          const isGiftCardRedemption = transaction.payment_method === 'gift_card';
          
          // Only include revenue transactions: regular sales + gift card sales, exclude gift card redemptions
          if (!isGiftCardRedemption || isGiftCardSale) {
            // Use net amount (total_amount is already net after refunds in database)
            return sum + Number(transaction.total_amount);
          }
          return sum;
        }, 0);
    } else {
      // Calculate last 30 days including today
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 29); // 29 days back plus today = 30 days
      const startOfPeriod = startOfDay(thirtyDaysAgo);
      const endOfPeriod = endOfDay(today);
      
      return (allTransactions || [])
        .filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate >= startOfPeriod && transactionDate <= endOfPeriod;
        })
        .reduce((sum, transaction) => {
          // Check if this is a gift card sale (revenue) vs redemption (not revenue)
          const isGiftCardSale = transaction.transaction_items?.some(item => 
            item.services?.name?.toLowerCase().includes('gift card'));
          const isGiftCardRedemption = transaction.payment_method === 'gift_card';
          
          // Only include revenue transactions: regular sales + gift card sales, exclude gift card redemptions
          if (!isGiftCardRedemption || isGiftCardSale) {
            // Use net amount (total_amount is already net after refunds in database)
            return sum + Number(transaction.total_amount);
          }
          return sum;
        }, 0);
    }
  };

  const calculateTransactions = () => {
    if (!showMonthlyTransactions) {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      return (allTransactions || []).filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= startOfToday && transactionDate <= endOfToday;
      }).length;
    } else {
      // Calculate last 30 days including today
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 29); // 29 days back plus today = 30 days
      const startOfPeriod = startOfDay(thirtyDaysAgo);
      const endOfPeriod = endOfDay(today);
      
      return (allTransactions || []).filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= startOfPeriod && transactionDate <= endOfPeriod;
      }).length;
    }
  };

  const calculateAverageTransaction = () => {
    let filteredTransactions = [];
    
    if (!showMonthlyAverage) {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      filteredTransactions = (allTransactions || []).filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= startOfToday && transactionDate <= endOfToday;
      });
    } else {
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 29);
      const startOfPeriod = startOfDay(thirtyDaysAgo);
      const endOfPeriod = endOfDay(today);
      
      filteredTransactions = (allTransactions || []).filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= startOfPeriod && transactionDate <= endOfPeriod;
      });
    }
    
    if (filteredTransactions.length === 0) return 0;
    
    const revenueTransactions = filteredTransactions.filter(t => {
      // Check if this is a gift card sale (revenue) vs redemption (not revenue)
      const isGiftCardSale = t.transaction_items?.some(item => 
        item.services?.name?.toLowerCase().includes('gift card'));
      const isGiftCardRedemption = t.payment_method === 'gift_card';
      
      // Only include revenue transactions: regular sales + gift card sales, exclude gift card redemptions
      return !isGiftCardRedemption || isGiftCardSale;
    });
    
    const total = revenueTransactions.reduce((sum, transaction) => {
      // Use net amount (total_amount is already net after refunds in database)
      return sum + Number(transaction.total_amount);
    }, 0);
    
    const validTransactionsCount = revenueTransactions.length;
    
    return validTransactionsCount > 0 ? total / validTransactionsCount : 0;
  };

  const stats = [
    {
      key: `revenue-${calculateRevenue()}-${showMonthlyTotal}`,
      title: "Revenue",
      value: `$${calculateRevenue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      desc: showMonthlyTotal ? "Last 30 days" : "Today's sales",
      extra: (
        <div className="flex items-center space-x-2">
          <Switch
            id="revenue-toggle"
            checked={showMonthlyTotal}
            onCheckedChange={setShowMonthlyTotal}
          />
          <Label htmlFor="revenue-toggle" className="text-xs">
            {showMonthlyTotal ? "Monthly" : "Daily"}
          </Label>
        </div>
      ),
    },
    {
      key: `transactions-${calculateTransactions()}-${showMonthlyTransactions}`,
      title: "Transactions",
      value: calculateTransactions().toString(),
      icon: Receipt,
      desc: showMonthlyTransactions ? "Last 30 days" : "Today's transactions",
      extra: (
        <div className="flex items-center space-x-2">
          <Switch
            id="transactions-toggle"
            checked={showMonthlyTransactions}
            onCheckedChange={setShowMonthlyTransactions}
          />
          <Label htmlFor="transactions-toggle" className="text-xs">
            {showMonthlyTransactions ? "Monthly" : "Daily"}
          </Label>
        </div>
      ),
    },
    {
      key: `avg-transaction-${calculateAverageTransaction()}-${showMonthlyAverage}`,
      title: "Avg Transaction",
      value: `$${calculateAverageTransaction().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CreditCard,
      desc: showMonthlyAverage ? "30-day avg" : "Today's avg",
      extra: (
        <div className="flex items-center space-x-2">
          <Switch
            id="average-toggle"
            checked={showMonthlyAverage}
            onCheckedChange={setShowMonthlyAverage}
          />
          <Label htmlFor="average-toggle" className="text-xs">
            {showMonthlyAverage ? "Monthly" : "Daily"}
          </Label>
        </div>
      ),
    },
    {
      key: `customers-${customerStats.total}-${customerStats.newThisWeek}-${selectedLocationId}`,
      title: "Active Customers",
      value: customerStats.total.toString(),
      icon: Users,
      desc: `${customerStats.newThisWeek} new this week`,
    },
  ];

  return (
    <div className="mx-auto px-2 sm:px-4 lg:px-6 py-4 max-w-[1800px] animate-fadeIn">      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <StatsCard key={stat.key} {...stat} />
        ))}
      </div>

      <div className="mt-4">
        {dragEnabled ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard-charts" type="DASHBOARD_CHART" direction="horizontal">
              {(provided) => (
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {chartOrder.map((chart, index) => (
                    <Draggable key={chart.id} draggableId={chart.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative ${snapshot.isDragging ? 'z-10' : ''}`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
                          <div className={`cursor-move group ${snapshot.isDragging ? 'shadow-lg' : ''}`}>
                            {chart.component}
                            {snapshot.isDragging && (
                              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg border-2 border-dashed border-primary">
                                <p className="text-sm font-medium text-primary">Moving chart...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {chartOrder.map((chart) => (
              <div key={chart.id} className="cursor-move group">
                {chart.component}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
