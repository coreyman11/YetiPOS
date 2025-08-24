
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Database } from "@/types/supabase";
import { startOfDay, endOfDay, subDays, getHours } from "date-fns";

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface PeakHoursChartProps {
  transactions: Transaction[];
  showMonthly: boolean;
  onToggleChange: (value: boolean) => void;
}

export const PeakHoursChart = ({ transactions, showMonthly, onToggleChange }: PeakHoursChartProps) => {
  const getPeakHoursData = () => {
    let filteredTransactions = [];
    
    if (!showMonthly) {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= startOfToday && transactionDate <= endOfToday;
      });
    } else {
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 29);
      const startOfPeriod = startOfDay(thirtyDaysAgo);
      const endOfPeriod = endOfDay(today);
      
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= startOfPeriod && transactionDate <= endOfPeriod;
      });
    }
    
    // Group transactions by hour
    const hourlyData: { [key: number]: number } = {};
    
    // Initialize all hours with 0
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }
    
    filteredTransactions.forEach(transaction => {
      const hour = getHours(new Date(transaction.created_at));
      hourlyData[hour] = hourlyData[hour] + 1;
    });
    
    // Convert to chart data format
    return Object.entries(hourlyData).map(([hour, count]) => {
      const hourNum = parseInt(hour);
      const formatHour = (h: number) => {
        if (h === 0) return "12 AM";
        if (h < 12) return `${h} AM`;
        if (h === 12) return "12 PM";
        return `${h - 12} PM`;
      };
      
      return {
        hour: formatHour(hourNum),
        transactions: count,
        hourValue: hourNum
      };
    });
  };

  const data = getPeakHoursData();
  const peakHour = data.reduce((max, current) => 
    current.transactions > max.transactions ? current : max
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-medium">
            Peak Hours Performance
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="peak-hours-chart-toggle"
            checked={showMonthly}
            onCheckedChange={onToggleChange}
          />
          <Label htmlFor="peak-hours-chart-toggle" className="text-xs">
            {showMonthly ? "Monthly" : "Daily"}
          </Label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            Busiest time: <span className="font-medium text-foreground">{peakHour.hour}</span> 
            {" "}({peakHour.transactions} transactions)
          </p>
          <p className="text-xs text-muted-foreground">
            {showMonthly ? "Last 30 days analysis" : "Today's hourly breakdown"}
          </p>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value) => [value, "Transactions"]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Bar 
                dataKey="transactions" 
                fill="hsl(var(--primary))" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
