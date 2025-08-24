
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, ShoppingCart, CreditCard, BarChart3 } from 'lucide-react';
import { ComprehensiveReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { CHART_STYLES, COLORS } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';

interface OverviewTabProps {
  report: ComprehensiveReport;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ report }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#9b87f5]" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{formatCurrency(report.totalSales)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#9b87f5]" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{report.totalTransactions}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#9b87f5]" />
              Average Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{formatCurrency(report.averagePerTransaction)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#9b87f5]" />
            Sales by Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report.paymentMethodBreakdown}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 70
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} />
                <XAxis 
                  dataKey="method" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  interval={0}
                  tick={{ fill: CHART_STYLES.axisColor }}
                  axisLine={{ stroke: CHART_STYLES.axisColor }}
                />
                <YAxis 
                  tick={{ fill: CHART_STYLES.axisColor }}
                  axisLine={{ stroke: CHART_STYLES.axisColor }}
                />
                <Tooltip 
                  content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar 
                  dataKey="total" 
                  name="Total Sales" 
                  radius={[8, 8, 0, 0]}
                >
                  {report.paymentMethodBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <Bar 
                  dataKey="count" 
                  name="Transaction Count"
                  radius={[8, 8, 0, 0]} 
                  fill={CHART_STYLES.barColors[1]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
