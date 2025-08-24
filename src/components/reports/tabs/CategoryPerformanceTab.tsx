import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductPerformanceReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { CHART_STYLES } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { FolderOpen, TrendingUp } from 'lucide-react';

interface CategoryPerformanceTabProps {
  report: ProductPerformanceReport;
}

export const CategoryPerformanceTab: React.FC<CategoryPerformanceTabProps> = ({ report }) => {
  const COLORS = ['#9b87f5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-[#9b87f5]" />
              Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.categoryPerformance.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.categoryPerformance}>
                    <defs>
                      <linearGradient id="categoryRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.orange.start} stopOpacity={1} />
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.orange.end} stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="categoryRevenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
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
                      height={40}
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
                    <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                    <Area
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke="url(#categoryRevenueGradient)"
                      fill="url(#categoryRevenueAreaGradient)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "url(#categoryRevenueGradient)" }}
                      activeDot={{ r: 6, fill: "url(#categoryRevenueGradient)" }}
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No category data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.categoryPerformance.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.categoryPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {report.categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No category data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>Category Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Product Count</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Avg Margin</TableHead>
                <TableHead>Top Product</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.categoryPerformance.map((category, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">{category.productCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(category.totalRevenue)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${category.averageMargin > 30 ? 'text-green-600' : category.averageMargin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {category.averageMargin.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>{category.topProduct}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};