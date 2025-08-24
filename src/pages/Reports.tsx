
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialReport } from "@/components/reports/FinancialReport";
import { CustomerReport } from "@/components/reports/CustomerReport";
import { InventoryReport } from "@/components/reports/InventoryReport";
import { RefundsReport } from "@/components/reports/RefundsReport";
import { ShiftReport } from "@/components/reports/ShiftReport";
import { TransactionReport } from "@/components/reports/TransactionReport";

import { ProductPerformanceReport } from "@/components/reports/ProductPerformanceReport";
import { SalesAssociateReport } from "@/components/reports/SalesAssociateReport";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("financial");

  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
      <p className="text-muted-foreground">Generate and analyze reports for your business.</p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="sales">Product Performance</TabsTrigger>
          <TabsTrigger value="associates">Sales Associates</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>
        
        <TabsContent value="financial" className="space-y-4">
          <FinancialReport />
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-4">
          <ProductPerformanceReport />
        </TabsContent>
        
        <TabsContent value="associates" className="space-y-4">
          <SalesAssociateReport />
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <CustomerReport />
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <InventoryReport />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <TransactionReport />
        </TabsContent>
        
        <TabsContent value="shifts" className="space-y-4">
          <ShiftReport />
        </TabsContent>
        
        <TabsContent value="refunds" className="space-y-4">
          <RefundsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
