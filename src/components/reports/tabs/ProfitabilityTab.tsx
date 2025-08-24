import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductPerformanceReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { CHART_STYLES } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { DollarSign, TrendingUp } from 'lucide-react';

interface ProfitabilityTabProps {
  report: ProductPerformanceReport;
}

export const ProfitabilityTab: React.FC<ProfitabilityTabProps> = ({ report }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
              Profit Margins by Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.profitMargins.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.profitMargins.slice(0, 10)}>
                    <defs>
                      <linearGradient id="profitMarginGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={1} />
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="profitMarginAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} vertical={false} />
                    <XAxis 
                      dataKey="productName" 
                      tick={{ fontSize: 11, fill: CHART_STYLES.axisColor }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                      tickLine={false}
                      axisLine={{ stroke: CHART_STYLES.gridColor }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: CHART_STYLES.axisColor }}
                      width={50}
                      tickFormatter={(value) => `${value}%`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />} />
                    <Area
                      type="monotone"
                      dataKey="margin"
                      stroke="url(#profitMarginGradient)"
                      fill="url(#profitMarginAreaGradient)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "url(#profitMarginGradient)" }}
                      activeDot={{ r: 6, fill: "url(#profitMarginGradient)" }}
                      name="Profit Margin %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No profitability data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#9b87f5]" />
              Revenue vs Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.profitMargins.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={report.profitMargins}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} />
                    <XAxis 
                      dataKey="revenue" 
                      name="Revenue"
                      tick={{ fill: CHART_STYLES.axisColor }}
                      axisLine={{ stroke: CHART_STYLES.axisColor }}
                    />
                    <YAxis 
                      dataKey="profit" 
                      name="Profit"
                      tick={{ fill: CHART_STYLES.axisColor }}
                      axisLine={{ stroke: CHART_STYLES.axisColor }}
                    />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                    <Scatter 
                      name="Products" 
                      fill={CHART_STYLES.barColors[1]}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No profitability data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>Detailed Profitability Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.profitMargins.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.profit)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${item.margin > 30 ? 'text-green-600' : item.margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {item.margin.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};