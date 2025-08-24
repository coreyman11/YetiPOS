
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, GripVertical } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, TooltipProps, Area, AreaChart } from "recharts";
import { Tooltip as UITooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CHART_STYLES, CHART_CONFIG } from '../reports/utils/chartStyles';

interface RevenueChartProps {
  data: Array<{ 
    name: string; 
    revenue: number;
    cashRevenue?: number;
    cardRevenue?: number;
  }>;
  title: string;
  showBreakdown?: boolean;
}

// Custom tooltip component for a more professional look
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-md bg-white/90 shadow-lg rounded-xl p-3 border border-gray-100">
        <p className="text-sm font-medium mb-1.5 text-gray-800">{label}</p>
        {payload.map((entry, index) => {
          const name = entry.dataKey === 'revenue' 
            ? 'Total Revenue' 
            : entry.dataKey === 'cashRevenue' 
              ? 'Cash Revenue' 
              : 'Card Revenue';
          
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 my-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <p className="text-xs text-gray-700">
                <span className="font-medium">{name}: </span>
                ${entry.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const RevenueChart = ({ data, title, showBreakdown = false }: RevenueChartProps) => {
  // Define gradient IDs
  const totalRevenueGradientId = `totalRevenueGradient-${title.replace(/\s+/g, '')}`;
  const cashRevenueGradientId = `cashRevenueGradient-${title.replace(/\s+/g, '')}`;
  const cardRevenueGradientId = `cardRevenueGradient-${title.replace(/\s+/g, '')}`;
  
  // Define area gradients for fills
  const totalRevenueAreaId = `totalRevenueArea-${title.replace(/\s+/g, '')}`;
  const cashRevenueAreaId = `cashRevenueArea-${title.replace(/\s+/g, '')}`;
  const cardRevenueAreaId = `cardRevenueArea-${title.replace(/\s+/g, '')}`;

  return (
    <Card className="min-h-[400px] group transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <span>{title}</span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Revenue data for {title.toLowerCase()}</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: title === "Daily Revenue" ? 20 : 0 }}
          >
            {/* Define gradients for lines and area fills */}
            <defs>
              <linearGradient id={totalRevenueGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={1} />
              </linearGradient>
              <linearGradient id={totalRevenueAreaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id={cashRevenueGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.orange.start} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.orange.end} stopOpacity={1} />
              </linearGradient>
              <linearGradient id={cashRevenueAreaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.orange.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.orange.end} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id={cardRevenueGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.lightPurple.end} stopOpacity={1} />
              </linearGradient>
              <linearGradient id={cardRevenueAreaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.lightPurple.end} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: CHART_STYLES.axisColor }}
              angle={title === "Daily Revenue" ? -45 : 0}
              textAnchor={title === "Daily Revenue" ? "end" : "middle"}
              height={40}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: CHART_STYLES.gridColor }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: CHART_STYLES.axisColor }}
              width={50}
              tickFormatter={(value) => `$${value}`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showBreakdown && (
              <Legend 
                iconSize={8} 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="line"
              />
            )}
            
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={`url(#${totalRevenueGradientId})`}
              fill={`url(#${totalRevenueAreaId})`}
              strokeWidth={2}
              dot={{ r: 4, fill: `url(#${totalRevenueGradientId})` }}
              activeDot={{ r: 6, fill: `url(#${totalRevenueGradientId})` }}
              name="Total Revenue"
            />
            
            {showBreakdown && (
              <>
                <Area
                  type="monotone"
                  dataKey="cashRevenue"
                  stroke={`url(#${cashRevenueGradientId})`}
                  fill={`url(#${cashRevenueAreaId})`}
                  strokeWidth={2}
                  dot={{ r: 4, fill: `url(#${cashRevenueGradientId})` }}
                  activeDot={{ r: 6, fill: `url(#${cashRevenueGradientId})` }}
                  name="Cash Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="cardRevenue"
                  stroke={`url(#${cardRevenueGradientId})`}
                  fill={`url(#${cardRevenueAreaId})`}
                  strokeWidth={2}
                  dot={{ r: 4, fill: `url(#${cardRevenueGradientId})` }}
                  activeDot={{ r: 6, fill: `url(#${cardRevenueGradientId})` }}
                  name="Card Revenue"
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
