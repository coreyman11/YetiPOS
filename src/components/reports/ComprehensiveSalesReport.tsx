
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/reports-api';
import { SalesReportFilters } from '@/types/reports';
import { ReportFilters } from './ReportFilters';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import { ReportActions } from './ReportActions';
import { 
  BarChart3, ShoppingCart, Gift, Award, 
  Users, Receipt, Building, Tags
} from 'lucide-react';

// Import the tab components
import { OverviewTab } from './tabs/OverviewTab';
import { ProductsTab } from './tabs/ProductsTab';
import { GiftCardsTab } from './tabs/GiftCardsTab';
import { LoyaltyTab } from './tabs/LoyaltyTab';
import { CustomersTab } from './tabs/CustomersTab';
import { TaxDiscountsTab } from './tabs/TaxDiscountsTab';
import { StoresTab } from './tabs/StoresTab';
import { exportComprehensiveReportToExcel } from './utils/exportUtils';

export const ComprehensiveSalesReport = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  
  const [filters, setFilters] = useState<SalesReportFilters>(() => {
    const today = new Date();
    const startDate = subDays(today, 30);
    return {
      startDate,
      endDate: today,
    };
  });

  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['comprehensive-report', filters],
    queryFn: () => reportsApi.getComprehensiveReport(filters),
    staleTime: 5 * 1000, // 5 seconds - for very frequent updates
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading report',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleFilterChange = (newFilters: SalesReportFilters) => {
    setFilters(newFilters);
  };

  const handleExport = async () => {
    if (!report) {
      toast({
        title: "No data to export",
        description: "There is no report data available to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const success = exportComprehensiveReportToExcel(report, filters);
      if (success) {
        toast({
          title: "Export successful",
          description: "Your report has been exported to Excel.",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No data available for the selected period.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Comprehensive Sales Report</CardTitle>
          <CardDescription>
            {format(filters.startDate, 'MMM d, yyyy')} - {format(filters.endDate, 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters 
            filters={filters} 
            setFilters={setFilters} 
            onExport={handleExport} 
          />
          <ReportActions 
            onExport={handleExport} 
            onPrint={handlePrint} 
            onRefresh={() => refetch()}
            isExporting={isExporting}
          />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap justify-start">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="gift-cards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Gift Cards
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Loyalty
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Tax & Discounts
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Stores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab report={report} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductsTab report={report} />
        </TabsContent>

        <TabsContent value="gift-cards" className="space-y-4">
          <GiftCardsTab report={report} />
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <LoyaltyTab report={report} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomersTab report={report} />
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <TaxDiscountsTab report={report} />
        </TabsContent>

        <TabsContent value="stores" className="space-y-4">
          <StoresTab report={report} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
