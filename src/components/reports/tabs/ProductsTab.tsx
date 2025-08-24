
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ComprehensiveReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { CHART_STYLES } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProductsTabProps {
  report: ComprehensiveReport;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ report }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.topProducts.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: CHART_STYLES.axisColor }}
                      axisLine={{ stroke: CHART_STYLES.axisColor }}
                    />
                    <YAxis 
                      tick={{ fill: CHART_STYLES.axisColor }}
                      axisLine={{ stroke: CHART_STYLES.axisColor }}
                    />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue" 
                      radius={[8, 8, 0, 0]}
                      fill={CHART_STYLES.barColors[0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No product data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-[#9b87f5]" />
              Low Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.lowPerformingProducts.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.lowPerformingProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: CHART_STYLES.axisColor }}
                      axisLine={{ stroke: CHART_STYLES.axisColor }}
                    />
                    <YAxis 
                      tick={{ fill: CHART_STYLES.axisColor }}
                      axisLine={{ stroke: CHART_STYLES.axisColor }}
                    />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue" 
                      radius={[8, 8, 0, 0]}
                      fill="#FEC6A1"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No product data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...report.topProducts, ...report.lowPerformingProducts]
                .sort((a, b) => b.revenue - a.revenue)
                .map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
