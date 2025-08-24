import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductPerformanceReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { CHART_STYLES } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { Target, Users, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ABCAnalysisTabProps {
  report: ProductPerformanceReport;
}

export const ABCAnalysisTab: React.FC<ABCAnalysisTabProps> = ({ report }) => {
  // Group products by ABC classification
  const classificationStats = report.abcAnalysis.reduce((acc, item) => {
    if (!acc[item.classification]) {
      acc[item.classification] = { count: 0, revenue: 0 };
    }
    acc[item.classification].count += 1;
    acc[item.classification].revenue += item.revenue;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const pieData = Object.entries(classificationStats).map(([classification, stats]) => ({
    name: `Class ${classification}`,
    value: stats.count,
    revenue: stats.revenue,
  }));

  const getClassificationColor = (classification: 'A' | 'B' | 'C') => {
    switch (classification) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
    }
  };

  const getClassificationDescription = (classification: 'A' | 'B' | 'C') => {
    switch (classification) {
      case 'A': return 'High value, high impact';
      case 'B': return 'Medium value, medium impact';
      case 'C': return 'Low value, low impact';
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class A Products</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {classificationStats.A?.count || 0}
            </div>
            <div className="text-xs text-green-600">
              {classificationStats.A ? formatCurrency(classificationStats.A.revenue) : '$0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class B Products</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {classificationStats.B?.count || 0}
            </div>
            <div className="text-xs text-yellow-600">
              {classificationStats.B ? formatCurrency(classificationStats.B.revenue) : '$0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class C Products</CardTitle>
            <BarChart3 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {classificationStats.C?.count || 0}
            </div>
            <div className="text-xs text-red-600">
              {classificationStats.C ? formatCurrency(classificationStats.C.revenue) : '$0'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle>Product Distribution by Class</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No ABC analysis data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle>Revenue by Classification</CardTitle>
          </CardHeader>
          <CardContent>
            {report.abcAnalysis.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.abcAnalysis.slice(0, 15)}>
                    <defs>
                      <linearGradient id="abcRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={1} />
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.lightPurple.end} stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="abcRevenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.lightPurple.end} stopOpacity={0.1} />
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
                      tickFormatter={(value) => `$${value}`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#abcRevenueGradient)"
                      fill="url(#abcRevenueAreaGradient)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "url(#abcRevenueGradient)" }}
                      activeDot={{ r: 6, fill: "url(#abcRevenueGradient)" }}
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No ABC analysis data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>ABC Classification Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Revenue %</TableHead>
                <TableHead className="text-center">Classification</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.abcAnalysis.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                  <TableCell className="text-right">{item.revenuePercentage.toFixed(1)}%</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getClassificationColor(item.classification)}>
                      Class {item.classification}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getClassificationDescription(item.classification)}
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