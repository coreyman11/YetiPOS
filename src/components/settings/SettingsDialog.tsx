import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SystemSettings } from "./SystemSettings";
import { LogoSettings } from "./LogoSettings";
import { StripeSettings } from "./StripeSettings";
import { HardwareSettings } from "./HardwareSettings";

interface SettingRow {
  id: string;
  category: string;
  name: string;
  status: string;
  description: string;
  icon: React.ReactNode;
  type: "system" | "logo" | "stripe" | "hardware";
}

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  setting: SettingRow | null;
  locationId: string;
}

export const SettingsDialog = ({ isOpen, onOpenChange, setting, locationId }: SettingsDialogProps) => {
  if (!setting) return null;

  const renderContent = () => {
    switch (setting.type) {
      case "system":
        return <SystemSettings />;
      case "logo":
        return <LogoSettings locationId={locationId} />;
      case "stripe":
        return <StripeSettings />;
      case "hardware":
        return <HardwareSettings locationId={locationId} />;
      default:
        return <div>Setting not found</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {setting.icon}
            {setting.name}
          </DialogTitle>
          <DialogDescription>
            {setting.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};