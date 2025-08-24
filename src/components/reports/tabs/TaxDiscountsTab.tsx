
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Area, AreaChart
} from 'recharts';
import { ComprehensiveReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { CHART_STYLES, CHART_CONFIG } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { Receipt, Calendar } from 'lucide-react';

interface TaxDiscountsTabProps {
  report: ComprehensiveReport;
}

export const TaxDiscountsTab: React.FC<TaxDiscountsTabProps> = ({ report }) => {
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Ensure we have all months in the data
  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = [...(report.taxDetailsByMonth || [])];
  
  // Check which months are missing and add with zero values if needed
  const existingMonths = monthlyData.map(item => item.month);
  allMonths.forEach(month => {
    if (!existingMonths.includes(month)) {
      monthlyData.push({
        month,
        taxAmount: 0,
        salesAmount: 0,
        effectiveRate: 0
      });
    }
  });
  
  // Sort by month order
  monthlyData.sort((a, b) => 
    allMonths.indexOf(a.month) - allMonths.indexOf(b.month)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#9b87f5]" />
              Total Tax Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{formatCurrency(report.totalTaxCollected)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#9b87f5]" />
              Effective Tax Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">
              {formatPercent((report.totalTaxCollected / (report.totalSales - report.totalTaxCollected)) * 100 || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#9b87f5]" />
            Monthly Tax Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={CHART_CONFIG.margin}
                >
                  <defs>
                    <linearGradient id="taxAmountGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="salesAmountGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: CHART_STYLES.axisColor, fontSize: CHART_CONFIG.axisFontSize }}
                    tickLine={false}
                    axisLine={{ stroke: CHART_STYLES.gridColor }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke={CHART_STYLES.axisColor}
                    tick={{ fill: CHART_STYLES.axisColor, fontSize: CHART_CONFIG.axisFontSize }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke={CHART_STYLES.axisColor}
                    tick={{ fill: CHART_STYLES.axisColor, fontSize: CHART_CONFIG.axisFontSize }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={<CustomTooltip 
                      formatter={(value: any, name: string) => {
                        if (name === "Tax Amount" || name === "Sales Amount") {
                          return formatCurrency(Number(value));
                        }
                        if (name === "Effective Rate") {
                          return formatPercent(Number(value));
                        }
                        return value;
                      }}
                    />}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 20 }} 
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="taxAmount"
                    stroke={CHART_STYLES.gradients.purple.start}
                    strokeWidth={CHART_CONFIG.strokeWidth}
                    fillOpacity={1}
                    fill="url(#taxAmountGradient)"
                    name="Tax Amount"
                    activeDot={{ r: CHART_CONFIG.activeDotSize, strokeWidth: 0 }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="salesAmount"
                    stroke={CHART_STYLES.gradients.lightPurple.start}
                    strokeWidth={CHART_CONFIG.strokeWidth}
                    fillOpacity={1}
                    fill="url(#salesAmountGradient)"
                    name="Sales Amount"
                    activeDot={{ r: CHART_CONFIG.activeDotSize, strokeWidth: 0 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="effectiveRate"
                    stroke={CHART_STYLES.gradients.orange.start}
                    strokeWidth={CHART_CONFIG.strokeWidth}
                    dot={{ r: CHART_CONFIG.dotSize, fill: CHART_STYLES.gradients.orange.start, strokeWidth: 0 }}
                    activeDot={{ r: CHART_CONFIG.activeDotSize, strokeWidth: 0 }}
                    name="Effective Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No monthly tax data available</p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>Tax Breakdown by Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {report.taxByRate.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.taxByRate}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    cornerRadius={3}
                    paddingAngle={2}
                    labelLine={false}
                    dataKey="amount"
                    nameKey="rate"
                    label={({ rate, percent }) => `${rate}%: ${(percent * 100).toFixed(1)}%`}
                  >
                    {report.taxByRate.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_STYLES.pieColors[index % CHART_STYLES.pieColors.length]} 
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                  <Legend 
                    formatter={(value) => `${value}% Tax Rate`} 
                    wrapperStyle={{ paddingTop: 20 }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No tax data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
