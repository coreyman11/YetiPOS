
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Settings, TestTube, Zap } from "lucide-react";

interface CashDrawerSettingsProps {
  locationId: string;
}

export const CashDrawerSettings: React.FC<CashDrawerSettingsProps> = ({ locationId }) => {
  return (
    <div className="space-y-6">
      {/* Status Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cash Drawer Status
          </CardTitle>
          <CardDescription>
            Current status and connection information for your cash drawers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Not Connected</Badge>
                <span className="text-sm text-muted-foreground">No cash drawer detected</span>
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
          <CardTitle>Cash Drawer Configuration</CardTitle>
          <CardDescription>
            Set up and configure your cash drawer connections and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Connection Type</h4>
              <p className="text-sm text-muted-foreground">Select how your cash drawer connects</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">USB</Badge>
                <Badge variant="outline">Serial</Badge>
                <Badge variant="outline">Network</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Auto-Open Settings</h4>
              <p className="text-sm text-muted-foreground">Configure when the drawer opens automatically</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">On Sale</Badge>
                <Badge variant="outline">On Cash Payment</Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm">
              <TestTube className="h-4 w-4 mr-2" />
              Test Open
            </Button>
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Force Open
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide Card */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>
            Step-by-step instructions for setting up your cash drawer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</div>
              <div>
                <p className="text-sm font-medium">Connect your cash drawer</p>
                <p className="text-xs text-muted-foreground">Use USB, serial, or network connection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">2</div>
              <div>
                <p className="text-sm font-medium">Configure connection settings</p>
                <p className="text-xs text-muted-foreground">Set up the communication parameters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">3</div>
              <div>
                <p className="text-sm font-medium">Test the connection</p>
                <p className="text-xs text-muted-foreground">Verify the drawer opens and closes properly</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
