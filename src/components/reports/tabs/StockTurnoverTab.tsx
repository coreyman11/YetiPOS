import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductPerformanceReport } from '@/types/reports';
import { CHART_STYLES } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { RotateCcw, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StockTurnoverTabProps {
  report: ProductPerformanceReport;
}

export const StockTurnoverTab: React.FC<StockTurnoverTabProps> = ({ report }) => {
  const getTurnoverStatus = (ratio: number) => {
    if (ratio > 12) return { status: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (ratio > 6) return { status: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (ratio > 2) return { status: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-[#9b87f5]" />
              Inventory Turnover Ratios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.stockTurnover.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.stockTurnover.slice(0, 10)}>
                    <defs>
                      <linearGradient id="turnoverGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={1} />
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="turnoverAreaGradient" x1="0" y1="0" x2="0" y2="1">
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
                      tickFormatter={(value) => `${value}x`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => `${value.toFixed(1)}x`} />} />
                    <Area
                      type="monotone"
                      dataKey="turnoverRatio"
                      stroke="url(#turnoverGradient)"
                      fill="url(#turnoverAreaGradient)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "url(#turnoverGradient)" }}
                      activeDot={{ r: 6, fill: "url(#turnoverGradient)" }}
                      name="Turnover Ratio"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No turnover data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#9b87f5]" />
              Days on Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.stockTurnover.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.stockTurnover.slice(0, 10)}>
                    <defs>
                      <linearGradient id="daysOnHandGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.orange.start} stopOpacity={1} />
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.orange.end} stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="daysOnHandAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.orange.start} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.orange.end} stopOpacity={0.1} />
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
                      tickFormatter={(value) => `${Math.round(value)}d`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => `${Math.round(value)} days`} />} />
                    <Area
                      type="monotone"
                      dataKey="daysOnHand"
                      stroke="url(#daysOnHandGradient)"
                      fill="url(#daysOnHandAreaGradient)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "url(#daysOnHandGradient)" }}
                      activeDot={{ r: 6, fill: "url(#daysOnHandGradient)" }}
                      name="Days on Hand"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No turnover data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>Stock Turnover Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Turnover Ratio</TableHead>
                <TableHead className="text-right">Days on Hand</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.stockTurnover.map((item) => {
                const { status, color } = getTurnoverStatus(item.turnoverRatio);
                return (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.currentStock}</TableCell>
                    <TableCell className="text-right">{item.soldQuantity}</TableCell>
                    <TableCell className="text-right">{item.turnoverRatio.toFixed(1)}x</TableCell>
                    <TableCell className="text-right">{Math.round(item.daysOnHand)} days</TableCell>
                    <TableCell className="text-center">
                      <Badge className={color}>{status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};