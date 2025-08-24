import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, GripVertical } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, TooltipProps } from "recharts";
import { Tooltip as UITooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CHART_STYLES } from '../reports/utils/chartStyles';

interface RefundsChartProps {
  data: Array<{ 
    name: string; 
    refunds: number;
  }>;
  title: string;
  showMonthly: boolean;
}

// Custom tooltip component for refunds
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-md bg-white/90 shadow-lg rounded-xl p-3 border border-gray-100">
        <p className="text-sm font-medium mb-1.5 text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 my-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <p className="text-xs text-gray-700">
              <span className="font-medium">Refunds: </span>
              ${entry.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const RefundsChart = ({ data, title, showMonthly }: RefundsChartProps) => {
  // Define gradient IDs
  const refundsGradientId = `refundsGradient-${title.replace(/\s+/g, '')}`;
  const refundsAreaId = `refundsArea-${title.replace(/\s+/g, '')}`;

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
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Refunds data for {title.toLowerCase()}</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
          >
            {/* Define gradients for lines and area fills */}
            <defs>
              <linearGradient id={refundsGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.orange.start} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.orange.end} stopOpacity={1} />
              </linearGradient>
              <linearGradient id={refundsAreaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.orange.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.orange.end} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: CHART_STYLES.axisColor }}
              angle={-45}
              textAnchor="end"
              height={50}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: CHART_STYLES.gridColor }}
              tickFormatter={(value) => {
                if (showMonthly && value.includes('/')) {
                  // For monthly format like "12/2024", convert to "Dec '24"
                  const [month, year] = value.split('/');
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${monthNames[parseInt(month) - 1]} '${year.slice(-2)}`;
                }
                return value;
              }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: CHART_STYLES.axisColor }}
              width={50}
              tickFormatter={(value) => `$${value}`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="refunds"
              stroke={`url(#${refundsGradientId})`}
              fill={`url(#${refundsAreaId})`}
              strokeWidth={2}
              dot={{ r: 4, fill: `url(#${refundsGradientId})` }}
              activeDot={{ r: 6, fill: `url(#${refundsGradientId})` }}
              name="Refunds"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};