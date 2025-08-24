import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Settings, Palette, CreditCard, Printer } from "lucide-react";
import { useLogoSettings } from "@/hooks/useLogoSettings";
import { stripeApi } from "@/services/stripe-api";

interface SettingRow {
  id: string;
  category: string;
  name: string;
  status: "active" | "inactive" | "configured" | "not_configured";
  description: string;
  icon: React.ReactNode;
  type: "system" | "logo" | "stripe" | "hardware";
}

interface SettingsTableProps {
  locationId: string;
  onViewSetting: (setting: SettingRow) => void;
}

const settingsData: SettingRow[] = [
  {
    id: "system",
    category: "General",
    name: "System Settings",
    status: "configured",
    description: "Configure general application settings and behavior",
    icon: <Settings className="h-4 w-4" />,
    type: "system"
  },
  {
    id: "logo",
    category: "General", 
    name: "Logo Settings",
    status: "not_configured",
    description: "Upload and manage your company logo for receipts and employee login",
    icon: <Palette className="h-4 w-4" />,
    type: "logo"
  },
  {
    id: "stripe",
    category: "Payments",
    name: "Stripe Settings", 
    status: "not_configured",
    description: "Configure payment processors and gateways",
    icon: <CreditCard className="h-4 w-4" />,
    type: "stripe"
  },
  {
    id: "hardware",
    category: "Hardware",
    name: "Hardware Settings",
    status: "active",
    description: "Configure POS hardware devices like printers and scanners",
    icon: <Printer className="h-4 w-4" />,
    type: "hardware"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case "configured":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Configured</Badge>;
    case "not_configured":
      return <Badge variant="outline" className="text-orange-600 border-orange-200">Not Configured</Badge>;
    case "inactive":
      return <Badge variant="outline" className="text-gray-600 border-gray-200">Inactive</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const SettingsTable = ({ locationId, onViewSetting }: SettingsTableProps) => {
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const { data: logoSettings } = useLogoSettings();

  useEffect(() => {
    const checkStripeConfig = async () => {
      try {
        await stripeApi.getPublishableKey();
        setStripeConfigured(true);
      } catch (error) {
        setStripeConfigured(false);
      }
    };
    checkStripeConfig();
  }, []);

  const getSettingStatus = (setting: SettingRow) => {
    switch (setting.type) {
      case "logo":
        return logoSettings?.logo_url ? "configured" : "not_configured";
      case "stripe":
        return stripeConfigured ? "configured" : "not_configured";
      default:
        return setting.status;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Setting</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settingsData.map((setting) => (
            <TableRow key={setting.id}>
              <TableCell>{setting.icon}</TableCell>
              <TableCell className="font-medium">{setting.name}</TableCell>
              <TableCell>{setting.category}</TableCell>
              <TableCell>{getStatusBadge(getSettingStatus(setting))}</TableCell>
              <TableCell className="text-muted-foreground max-w-[300px] truncate">
                {setting.description}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewSetting(setting)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};