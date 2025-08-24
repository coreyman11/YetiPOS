
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ComprehensiveReport } from '@/types/reports';
import { CHART_STYLES } from '../utils/chartStyles';
import { CustomTooltip } from '../charts/CustomTooltip';
import { Award, DollarSign, Users } from 'lucide-react';

interface LoyaltyTabProps {
  report: ComprehensiveReport;
}

export const LoyaltyTab: React.FC<LoyaltyTabProps> = ({ report }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-[#9b87f5]" />
              Points Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{report.loyaltyPointsEarned.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#9b87f5]" />
              Points Redeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{report.loyaltyPointsRedeemed.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-[#9b87f5]" />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1F2C]">{report.activeCustomersWithLoyalty}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#F6F6F7] shadow-sm">
        <CardHeader>
          <CardTitle>Loyalty Program Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Points Earned', value: report.loyaltyPointsEarned },
                    { name: 'Points Redeemed', value: report.loyaltyPointsRedeemed }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  dataKey="value"
                >
                  <Cell fill={CHART_STYLES.pieColors[0]} stroke="#ffffff" strokeWidth={2} />
                  <Cell fill={CHART_STYLES.pieColors[1]} stroke="#ffffff" strokeWidth={2} />
                </Pie>
                <Tooltip 
                  content={<CustomTooltip formatter={(value: number) => value.toLocaleString()} />}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
