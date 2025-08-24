
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ComprehensiveReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { Users, DollarSign, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CHART_STYLES, CHART_CONFIG } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';

interface CustomersTabProps {
  report: ComprehensiveReport;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ report }) => {
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Create data for customer pie chart
  const customerData = [
    { name: 'New Customers', value: report.newCustomers, color: CHART_STYLES.pieColors[0] },
    { name: 'Repeat Customers', value: report.repeatCustomers, color: CHART_STYLES.pieColors[1] }
  ];

  // Create data for high value customers chart
  const highValueData = [...report.highValueCustomers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map(customer => ({
      name: customer.name,
      totalSpent: customer.totalSpent,
      transactionCount: customer.transactionCount
    }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-[#9b87f5]" />
              New Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{report.newCustomers}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-[#9b87f5]" />
              Repeat Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{report.repeatCustomers}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-[#9b87f5]" />
              Return Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">
              {formatPercent((report.repeatCustomers / (report.newCustomers + report.repeatCustomers)) * 100 || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#9b87f5]" />
              Customer Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    cornerRadius={3}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {customerData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: 20 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#9b87f5]" />
              High Value Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={highValueData}
                  margin={CHART_CONFIG.margin}
                  layout="vertical"
                >
                  <defs>
                    <linearGradient id="spentGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.9}/>
                      <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} horizontal={false} />
                  <XAxis 
                    type="number"
                    tick={{ fill: CHART_STYLES.axisColor, fontSize: CHART_CONFIG.axisFontSize }}
                    tickLine={false}
                    axisLine={{ stroke: CHART_STYLES.gridColor }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: CHART_STYLES.axisColor, fontSize: CHART_CONFIG.axisFontSize }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={<CustomTooltip 
                      formatter={(value: any, name: string) => {
                        if (name === "Total Spent") {
                          return formatCurrency(Number(value));
                        }
                        return value;
                      }}
                    />}
                  />
                  <Legend 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: 20 }}
                  />
                  <Bar 
                    dataKey="totalSpent" 
                    fill="url(#spentGradient)" 
                    name="Total Spent"
                    radius={[0, CHART_CONFIG.borderRadius, CHART_CONFIG.borderRadius, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>High Value Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.highValueCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell className="text-right">{customer.transactionCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
