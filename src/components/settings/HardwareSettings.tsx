
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, CreditCard, Wallet, ScanLine } from "lucide-react";
import { BarcodeScannerSettings } from "./BarcodeScannerSettings";
import { CardReaderSettings } from "./CardReaderSettings";
import { PrinterSettings } from "./PrinterSettings";
import { CashDrawerSettings } from "./CashDrawerSettings";

interface HardwareSettingsProps {
  locationId: string;
}

export const HardwareSettings: React.FC<HardwareSettingsProps> = ({ locationId }) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="printers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="printers" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Printers</span>
          </TabsTrigger>
          <TabsTrigger value="card-readers" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Card Readers</span>
          </TabsTrigger>
          <TabsTrigger value="cash-drawers" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Cash Drawers</span>
          </TabsTrigger>
          <TabsTrigger value="barcode-scanners" className="flex items-center gap-2">
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">Scanners</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="printers" className="space-y-4">
            <PrinterSettings locationId={locationId} />
          </TabsContent>

          <TabsContent value="card-readers" className="space-y-4">
            <CardReaderSettings locationId={locationId} />
          </TabsContent>

          <TabsContent value="cash-drawers" className="space-y-4">
            <CashDrawerSettings locationId={locationId} />
          </TabsContent>

          <TabsContent value="barcode-scanners" className="space-y-4">
            <BarcodeScannerSettings locationId={locationId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
