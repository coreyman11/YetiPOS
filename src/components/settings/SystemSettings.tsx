
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const SystemSettings = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Logged out successfully");
      // The navigation will be handled by the auth context
    } catch (error) {
      console.error("Logout error:", error);
      // Force navigation to login page even if there's an error
      navigate('/login');
      toast.error("There was an issue during logout, but you have been signed out.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          System Settings
        </CardTitle>
        <CardDescription>General system configuration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Account</h4>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
