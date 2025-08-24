
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/services/locations-api";
import { SettingsTable } from "@/components/settings/SettingsTable";
import { SettingsDialog } from "@/components/settings/SettingsDialog";

interface SettingRow {
  id: string;
  category: string;
  name: string;
  status: string;
  description: string;
  icon: React.ReactNode;
  type: "system" | "logo" | "stripe" | "hardware";
}

const Settings = () => {
  const [selectedSetting, setSelectedSetting] = useState<SettingRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: location, isLoading, error } = useQuery({
    queryKey: ['current-location'],
    queryFn: locationsApi.getCurrentLocation,
  });

  const handleViewSetting = (setting: SettingRow) => {
    setSelectedSetting(setting);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  if (error || !location) {
    return <div>Error loading settings. Please try again.</div>;
  }

  const locationId = location.id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application settings and preferences.
        </p>
      </div>

      <SettingsTable 
        locationId={locationId}
        onViewSetting={handleViewSetting}
      />

      <SettingsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        setting={selectedSetting}
        locationId={locationId}
      />
    </div>
  );
};

export default Settings;
