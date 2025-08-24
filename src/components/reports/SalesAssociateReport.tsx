
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { reportsApi } from "@/services/reports-api";
import { userApi } from "@/services/user-api";
import { SalesReportFilters } from "@/types/reports";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportTable } from "./ReportTable";
import { ExportButton } from "./ExportButton";
import { UsersTables } from "@/types/database/users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface AssociateSalesData {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  transactionCount: number;
  averageSale: number;
  creditCardSales: number;
  cashSales: number;
  giftCardSales: number;
  discountsApplied: number;
  returnTransactions: number;
  uniqueCustomers: number;
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", 
  "#82CA9D", "#A4DE6C", "#D0ED57", "#FAD000", "#F45B5B"
];

export const SalesAssociateReport = () => {
  const [filters, setFilters] = useState<SalesReportFilters>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(new Date().setHours(23, 59, 59, 999)),
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"table" | "charts">("table");
  const [employeesWithSales, setEmployeesWithSales] = useState<UsersTables['user_profiles']['Row'][]>([]);

  // Get all user profiles
  const { data: allEmployees, isLoading: employeesLoading } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: userApi.getAllUsers,
  });

  // Fetch transactions with assigned_user_id for the selected date range
  const { data: transactionsWithUsers, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions-with-assigned-users', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('assigned_user_id')
        .gte('created_at', filters.startDate.toISOString())
        .lte('created_at', filters.endDate.toISOString())
        .not('assigned_user_id', 'is', null);
      
      if (error) {
        console.error('Error fetching transactions with users:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Get sales data for the report
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['employee-sales', filters, selectedEmployee],
    queryFn: () => reportsApi.getEmployeeSalesReport({
      ...filters,
      employeeId: selectedEmployee
    }),
  });

  // Update employees with sales whenever transactions or all employees data changes
  useEffect(() => {
    if (transactionsWithUsers && allEmployees) {
      // Get unique assigned_user_ids from transactions
      const assignedUserIds = new Set(transactionsWithUsers.map(tx => tx.assigned_user_id));
      
      // Filter all employees to only those who have transactions
      const employeesWithTransactions = allEmployees.filter(employee => 
        assignedUserIds.has(employee.id)
      );
      
      setEmployeesWithSales(employeesWithTransactions);
    }
  }, [transactionsWithUsers, allEmployees]);

  const filteredData = useMemo(() => {
    if (!salesData) return [];
    return salesData;
  }, [salesData]);

  const paymentMethodData = useMemo(() => {
    if (!filteredData.length) return [];
    
    if (selectedEmployee && filteredData.length > 0) {
      // Find the employee data
      const employeeData = filteredData.find(data => data.employeeId === selectedEmployee);
      
      if (employeeData) {
        return [
          { name: 'Credit Card', value: employeeData.creditCardSales },
          { name: 'Cash', value: employeeData.cashSales },
          { name: 'Gift Card', value: employeeData.giftCardSales },
        ].filter(item => item.value > 0);
      }
    }
    
    const totals = filteredData.reduce((acc, curr) => {
      acc.creditCard += curr.creditCardSales;
      acc.cash += curr.cashSales;
      acc.giftCard += curr.giftCardSales;
      return acc;
    }, { creditCard: 0, cash: 0, giftCard: 0 });
    
    return [
      { name: 'Credit Card', value: totals.creditCard },
      { name: 'Cash', value: totals.cash },
      { name: 'Gift Card', value: totals.giftCard },
    ].filter(item => item.value > 0);
  }, [filteredData, selectedEmployee]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <p className="font-medium">{`${payload[0].name}: $${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
  
    return null;
  };

  const handleExport = () => {
    if (!salesData) return;
    
    const exportData = salesData.map(item => ({
      'Employee': item.employeeName,
      'Total Sales': `$${item.totalSales.toFixed(2)}`,
      'Transactions': item.transactionCount,
      'Avg. Sale': `$${item.averageSale.toFixed(2)}`,
      'Credit Card Sales': `$${item.creditCardSales.toFixed(2)}`,
      'Cash Sales': `$${item.cashSales.toFixed(2)}`,
      'Gift Card Sales': `$${item.giftCardSales.toFixed(2)}`,
      'Discounts Applied': item.discountsApplied,
      'Returns': item.returnTransactions,
      'Unique Customers': item.uniqueCustomers
    }));
    
    return exportData;
  };

  const isLoading_all = isLoading || employeesLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <DateRangePicker
          dateRange={{
            from: filters.startDate,
            to: filters.endDate
          }}
          onUpdate={(dateRange) => {
            setFilters(prev => ({
              ...prev,
              startDate: dateRange.from || prev.startDate,
              endDate: dateRange.to || prev.endDate
            }));
          }}
        />
        
        <div className="flex items-center gap-2">
          <Select
            value={selectedEmployee || "all"}
            onValueChange={(value) => setSelectedEmployee(value !== "all" ? value : null)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employeesWithSales?.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.full_name || employee.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <ExportButton
            data={salesData || []}
            filename="sales-associate-report"
            transformData={handleExport}
          />
        </div>
      </div>
      
      <Tabs value={viewType} onValueChange={(value) => setViewType(value as "table" | "charts")}>
        <TabsList className="mb-4">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <span className="hidden sm:inline">Table View</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <span className="hidden sm:inline">Charts View</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="table">
          <ReportTable
            data={filteredData}
            columns={[
              { key: 'employeeName', header: 'Employee', sortable: true },
              { key: 'totalSales', header: 'Total Sales', sortable: true, 
                cell: (row: AssociateSalesData) => `$${row.totalSales.toFixed(2)}` },
              { key: 'transactionCount', header: 'Transactions', sortable: true },
              { key: 'averageSale', header: 'Avg. Sale', sortable: true,
                cell: (row: AssociateSalesData) => `$${row.averageSale.toFixed(2)}` },
              { key: 'creditCardSales', header: 'Credit Card', sortable: true,
                cell: (row: AssociateSalesData) => `$${row.creditCardSales.toFixed(2)}` },
              { key: 'cashSales', header: 'Cash', sortable: true,
                cell: (row: AssociateSalesData) => `$${row.cashSales.toFixed(2)}` },
              { key: 'giftCardSales', header: 'Gift Card', sortable: true,
                cell: (row: AssociateSalesData) => `$${row.giftCardSales.toFixed(2)}` },
              { key: 'discountsApplied', header: 'Discounts', sortable: true },
              { key: 'returnTransactions', header: 'Returns', sortable: true },
              { key: 'uniqueCustomers', header: 'Unique Customers', sortable: true },
            ]}
            isLoading={isLoading_all}
            searchable
            sortable
            emptyMessage="No sales data available for the selected period"
          />
        </TabsContent>
        
        <TabsContent value="charts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Sales by Employee
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart 
                      data={filteredData.sort((a, b) => b.totalSales - a.totalSales)} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <XAxis 
                        dataKey="employeeName" 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0}
                        tick={{ fontSize: 12 }}
                        height={70}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="totalSales" name="Total Sales">
                        {filteredData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${(value as number).toFixed(2)}`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No payment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
