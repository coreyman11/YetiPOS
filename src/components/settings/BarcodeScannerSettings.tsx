
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine, Settings, TestTube, Bluetooth, Usb, Wifi } from "lucide-react";

interface BarcodeScannerSettingsProps {
  locationId: string;
}

export const BarcodeScannerSettings: React.FC<BarcodeScannerSettingsProps> = ({ locationId }) => {
  return (
    <div className="space-y-6">
      {/* Status Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Barcode Scanner Status
          </CardTitle>
          <CardDescription>
            Current status and connection information for your barcode scanners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Not Connected</Badge>
                <span className="text-sm text-muted-foreground">No scanner detected</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Scanner Configuration</CardTitle>
          <CardDescription>
            Set up and configure your barcode scanner connections and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Connection Types</h4>
              <p className="text-sm text-muted-foreground">Supported scanner connection methods</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Usb className="h-3 w-3" />
                  USB
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Bluetooth className="h-3 w-3" />
                  Bluetooth
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Wireless
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Scan Settings</h4>
              <p className="text-sm text-muted-foreground">Configure scanning behavior</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Auto-Enter</Badge>
                <Badge variant="outline">Beep on Scan</Badge>
                <Badge variant="outline">Duplicate Check</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Supported Barcode Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="secondary">UPC-A</Badge>
              <Badge variant="secondary">UPC-E</Badge>
              <Badge variant="secondary">EAN-13</Badge>
              <Badge variant="secondary">EAN-8</Badge>
              <Badge variant="secondary">Code 128</Badge>
              <Badge variant="secondary">Code 39</Badge>
              <Badge variant="secondary">QR Code</Badge>
              <Badge variant="secondary">Data Matrix</Badge>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm">
              <TestTube className="h-4 w-4 mr-2" />
              Test Scanner
            </Button>
            <Button variant="outline" size="sm">
              <ScanLine className="h-4 w-4 mr-2" />
              Scan Test Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide Card */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>
            Step-by-step instructions for setting up your barcode scanner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</div>
              <div>
                <p className="text-sm font-medium">Connect your scanner</p>
                <p className="text-xs text-muted-foreground">Use USB, Bluetooth, or wireless connection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">2</div>
              <div>
                <p className="text-sm font-medium">Configure scan settings</p>
                <p className="text-xs text-muted-foreground">Set up barcode types and scanning behavior</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">3</div>
              <div>
                <p className="text-sm font-medium">Test scanning</p>
                <p className="text-xs text-muted-foreground">Verify the scanner reads barcodes correctly</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
