
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { reportsApi } from "@/services/reports-api";
import { SalesReportFilters } from "@/types/reports";
import { SalesMetrics } from "./SalesMetrics";
import { PaymentMethodsTable } from "./PaymentMethodsTable";
import { EmployeePerformanceTable } from "./EmployeePerformanceTable";
import { ReportFilters } from "./ReportFilters";
import { exportToCSV } from "./utils/exportUtils";

export const SalesReport = () => {
  const [filters, setFilters] = useState<SalesReportFilters>({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(new Date().setHours(23, 59, 59, 999)),
  });

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-report', filters],
    queryFn: () => reportsApi.getSalesReport(filters),
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: reportsApi.getShifts,
  });

  const handleExport = () => {
    if (!salesData) return;
    exportToCSV(salesData, filters);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ReportFilters
        filters={filters}
        setFilters={setFilters}
        shifts={shifts}
        onExport={handleExport}
      />

      {salesData ? (
        <>
          <SalesMetrics data={salesData} />
          <PaymentMethodsTable breakdown={salesData.paymentMethodBreakdown} />
          {salesData.employeeSales && salesData.employeeSales.length > 0 && (
            <EmployeePerformanceTable employees={salesData.employeeSales} />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No sales found for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
