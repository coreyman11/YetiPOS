
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentMethodsTableProps {
  breakdown: Array<{
    method: string;
    count: number;
    total: number;
  }>;
}

export const PaymentMethodsTable = ({ breakdown }: PaymentMethodsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium">Method</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Count</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item) => (
                <tr key={item.method} className="border-b">
                  <td className="p-4 align-middle">{item.method}</td>
                  <td className="p-4 align-middle">{item.count}</td>
                  <td className="p-4 align-middle">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
