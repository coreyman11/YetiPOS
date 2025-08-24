
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, GripVertical } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Tooltip as UITooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CHART_STYLES, CHART_CONFIG } from '../reports/utils/chartStyles';

interface ServicesChartProps {
  data: Array<{ name: string; count: number }>;
  showMonthly?: boolean;
}

export const ServicesChart = ({ data, showMonthly = false }: ServicesChartProps) => {
  // Define gradient IDs for line and area
  const lineGradientId = `serviceCountLineGradient`;
  const areaGradientId = `serviceCountAreaGradient`;

  return (
    <Card className="min-h-[400px] group transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <span>Transaction Count</span>
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
                <p className="text-xs">Transaction count by {showMonthly ? "month" : "day"}</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            {/* Define gradients for line and area */}
            <defs>
              <linearGradient id={lineGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={1} />
              </linearGradient>
              <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: CHART_STYLES.axisColor }}
              angle={-45}
              textAnchor="end"
              height={40}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: CHART_STYLES.gridColor }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: CHART_STYLES.axisColor }}
              width={40}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              formatter={(value) => [`${value}`, 'Transactions']}
              contentStyle={{ 
                background: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #eee',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                padding: '8px 12px'
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={`url(#${lineGradientId})`}
              fill={`url(#${areaGradientId})`}
              strokeWidth={2}
              dot={{ r: 4, fill: `url(#${lineGradientId})` }}
              activeDot={{ r: 6, fill: `url(#${lineGradientId})` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
