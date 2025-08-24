import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reportsApi } from "@/services/reports-api";
import { ProductPerformanceFilters } from "@/types/reports";
import { ReportFilters } from "./ReportFilters";
import { ProductPerformanceTabContent } from "./tabs/ProductPerformanceTabContent";
import { ProfitabilityTab } from "./tabs/ProfitabilityTab";
import { StockTurnoverTab } from "./tabs/StockTurnoverTab";
import { ABCAnalysisTab } from "./tabs/ABCAnalysisTab";
import { CategoryPerformanceTab } from "./tabs/CategoryPerformanceTab";
import { Package, TrendingUp, BarChart3, PieChart, Target } from "lucide-react";

export const ProductPerformanceReport = () => {
  const [filters, setFilters] = useState<ProductPerformanceFilters>({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(new Date().setHours(23, 59, 59, 999)),
    includeServices: true,
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['product-performance-report', filters],
    queryFn: () => reportsApi.getProductPerformanceReport(filters),
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: reportsApi.getShifts,
  });

  const handleExport = () => {
    if (!reportData) return;
    // TODO: Implement product performance export
    console.log('Export product performance report', reportData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No product data found for the selected filters.
          </p>
        </CardContent>
      </Card>
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalProducts}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.averageMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Target className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">
              {reportData.topPerformers[0]?.name || 'No data'}
            </div>
            <div className="text-xs text-muted-foreground">
              ${reportData.topPerformers[0]?.revenue.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="turnover">Stock Turnover</TabsTrigger>
          <TabsTrigger value="abc">ABC Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <ProductPerformanceTabContent report={reportData} />
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <ProfitabilityTab report={reportData} />
        </TabsContent>

        <TabsContent value="turnover" className="space-y-4">
          <StockTurnoverTab report={reportData} />
        </TabsContent>

        <TabsContent value="abc" className="space-y-4">
          <ABCAnalysisTab report={reportData} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryPerformanceTab report={reportData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};