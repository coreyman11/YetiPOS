
import { useState, useEffect } from "react";
import { locationsApi } from "@/services";
import { HardwareSettings } from "@/components/settings/HardwareSettings";
import { Skeleton } from "@/components/ui/skeleton";

const HardwareConfiguration = () => {
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setIsLoading(true);
        const location = await locationsApi.getCurrentLocation();
        if (location) {
          setCurrentLocationId(location.id);
        }
      } catch (error) {
        console.error("Error fetching location:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLocation();
  }, []);

  return (
    <div className="space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Hardware Configuration</h2>
        <p className="text-muted-foreground">Configure your POS hardware devices and peripherals.</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : currentLocationId ? (
        <HardwareSettings locationId={currentLocationId} />
      ) : (
        <div className="text-center p-8 border rounded-lg bg-muted/50">
          <p>No location found. Please create or select a location first.</p>
        </div>
      )}
    </div>
  );
};

export default HardwareConfiguration;
