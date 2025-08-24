
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmployeePerformanceTableProps {
  employees: Array<{
    employeeId: string;
    employeeName: string;
    total: number;
    transactions: number;
  }>;
}

export const EmployeePerformanceTable = ({ employees }: EmployeePerformanceTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium">Employee</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Transactions</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.employeeId} className="border-b">
                  <td className="p-4 align-middle">{employee.employeeName}</td>
                  <td className="p-4 align-middle">{employee.transactions}</td>
                  <td className="p-4 align-middle">${employee.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
