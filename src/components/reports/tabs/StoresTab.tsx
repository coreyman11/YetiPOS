
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ComprehensiveReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { CHART_STYLES, COLORS } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { Building } from 'lucide-react';

interface StoresTabProps {
  report: ComprehensiveReport;
}

export const StoresTab: React.FC<StoresTabProps> = ({ report }) => {
  if (report.storePerformance.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardContent className="py-10">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No store data available or only a single store exists.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-[#9b87f5]" />
            Store Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.storePerformance}>
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
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar 
                  dataKey="totalSales" 
                  name="Total Sales"
                  radius={[8, 8, 0, 0]}
                >
                  {report.storePerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>Store Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead className="text-right">Average Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.storePerformance.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>{store.name}</TableCell>
                  <TableCell className="text-right">{store.transactionCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(store.totalSales)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(store.totalSales / (store.transactionCount || 1))}
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
