
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ComprehensiveReport } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';
import { CHART_STYLES, CHART_CONFIG } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { Gift, CreditCard, DollarSign, Calendar, ArrowUpDown } from 'lucide-react';

interface GiftCardsTabProps {
  report: ComprehensiveReport;
}

export const GiftCardsTab: React.FC<GiftCardsTabProps> = ({ report }) => {
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Ensure we have all months in the data
  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = [...(report.giftCardDetails?.monthly || [])];
  
  // Check which months are missing and add with zero values if needed
  const existingMonths = monthlyData.map(item => item.month);
  allMonths.forEach(month => {
    if (!existingMonths.includes(month)) {
      monthlyData.push({
        month,
        sales: 0,
        redemptions: 0,
        netChange: 0
      });
    }
  });
  
  // Sort by month order
  monthlyData.sort((a, b) => 
    allMonths.indexOf(a.month) - allMonths.indexOf(b.month)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#9b87f5]" />
              Gift Card Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{formatCurrency(report.giftCardSales.total)}</div>
            <p className="text-muted-foreground">Count: {report.giftCardSales.count}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#9b87f5]" />
              Gift Card Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{formatCurrency(report.giftCardRedemptions.total)}</div>
            <p className="text-muted-foreground">Count: {report.giftCardRedemptions.count}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#9b87f5]" />
              Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{formatCurrency(report.giftCardBalances.total)}</div>
            <p className="text-muted-foreground">Active cards: {report.giftCardBalances.count}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#9b87f5]" />
            Monthly Gift Card Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={CHART_CONFIG.margin}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="redemptionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={0.1}/>
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
                    tick={{ fill: CHART_STYLES.axisColor, fontSize: CHART_CONFIG.axisFontSize }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: 20 }} 
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={CHART_STYLES.gradients.purple.start} 
                    fill="url(#salesGradient)" 
                    name="Sales" 
                    strokeWidth={CHART_CONFIG.strokeWidth}
                    activeDot={{ r: CHART_CONFIG.activeDotSize, strokeWidth: 0 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="redemptions" 
                    stroke={CHART_STYLES.gradients.lightPurple.start} 
                    fill="url(#redemptionsGradient)" 
                    name="Redemptions" 
                    strokeWidth={CHART_CONFIG.strokeWidth}
                    activeDot={{ r: CHART_CONFIG.activeDotSize, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netChange" 
                    stroke={CHART_STYLES.gradients.orange.start} 
                    strokeWidth={CHART_CONFIG.strokeWidth}
                    dot={{ r: CHART_CONFIG.dotSize, strokeWidth: 0 }}
                    activeDot={{ r: CHART_CONFIG.activeDotSize, strokeWidth: 0 }}
                    name="Net Change"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No monthly gift card data available</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-[#9b87f5]" />
              Gift Card Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.giftCardDetails?.usageStats ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={report.giftCardDetails.usageStats}
                    margin={CHART_CONFIG.margin}
                  >
                    <defs>
                      <linearGradient id="usageCountGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.9}/>
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="usageAmountGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={0.9}/>
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.lightPurple.end} stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.gridColor} vertical={false} />
                    <XAxis 
                      dataKey="type" 
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
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke={CHART_STYLES.axisColor}
                      tick={{ fill: CHART_STYLES.axisColor, fontSize: CHART_CONFIG.axisFontSize }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      content={<CustomTooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'Average Amount') {
                            return formatCurrency(Number(value));
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
                    <Bar 
                      yAxisId="left" 
                      dataKey="count" 
                      fill="url(#usageCountGradient)" 
                      name="Count"
                      radius={[CHART_CONFIG.borderRadius, CHART_CONFIG.borderRadius, 0, 0]}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="averageAmount" 
                      fill="url(#usageAmountGradient)" 
                      name="Average Amount"
                      radius={[CHART_CONFIG.borderRadius, CHART_CONFIG.borderRadius, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No usage statistics available</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#9b87f5]" />
              Top Gift Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.giftCardDetails?.topCards ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={report.giftCardDetails.topCards}
                    margin={{ ...CHART_CONFIG.margin, bottom: 70 }}
                    layout="vertical"
                  >
                    <defs>
                      <linearGradient id="initialValueGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.purple.start} stopOpacity={0.9}/>
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.purple.end} stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="currentValueGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_STYLES.gradients.lightPurple.start} stopOpacity={0.9}/>
                        <stop offset="100%" stopColor={CHART_STYLES.gradients.lightPurple.end} stopOpacity={0.8}/>
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
                      dataKey="cardNumber" 
                      width={150}
                      tick={{ fill: CHART_STYLES.axisColor, fontSize: CHART_CONFIG.axisFontSize }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      content={<CustomTooltip 
                        formatter={(value: any, name: string) => {
                          if (name === "Initial Value" || name === "Current Value") {
                            return formatCurrency(Number(value));
                          }
                          if (name === "Percent Used") {
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
                    <Bar 
                      dataKey="initialValue" 
                      fill="url(#initialValueGradient)" 
                      name="Initial Value"
                      radius={[0, CHART_CONFIG.borderRadius, CHART_CONFIG.borderRadius, 0]}
                    />
                    <Bar 
                      dataKey="currentValue" 
                      fill="url(#currentValueGradient)" 
                      name="Current Value"
                      radius={[0, CHART_CONFIG.borderRadius, CHART_CONFIG.borderRadius, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No top gift cards data available</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>Gift Card Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {report.giftCardDetails?.topCards ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card Number</TableHead>
                  <TableHead className="text-right">Initial Value</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.giftCardDetails.topCards.map((card, index) => (
                  <TableRow key={index}>
                    <TableCell>{card.cardNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(card.initialValue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(card.currentValue)}</TableCell>
                    <TableCell className="text-right">{formatPercent(card.percentUsed)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-5">No gift card details available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
