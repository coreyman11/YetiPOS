
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesSummary } from "@/types/reports";

interface SalesMetricsProps {
  data: SalesSummary;
}

export const SalesMetrics = ({ data }: SalesMetricsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-[#af56d2]/10 to-[#9f71ed]/10 border-[#af56d2]/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${data.totalSales.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-[#18b5d0]/10 to-[#9be0f0]/10 border-[#18b5d0]/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalTransactions}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-[#9f71ed]/10 to-[#9be0f0]/10 border-[#9f71ed]/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${data.averagePerTransaction.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
