
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, CreditCard, Info, Key, ShieldAlert, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { environmentInfo } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export const StripeSettings = () => {
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [connectedAccountId, setConnectedAccountId] = useState("");
  const [secretKeyConfigured, setSecretKeyConfigured] = useState(false);
  const [connectedAccountConfigured, setConnectedAccountConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [environment, setEnvironment] = useState(environmentInfo.mode || "development");
  const { session } = useAuth();
  
  // Fetch current stripe settings
  useEffect(() => {
    const fetchStripeSettings = async () => {
      setIsLoading(true);
      try {
        // First try to get from environment variables
        const envPublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (envPublishableKey) {
          console.log("Using Stripe publishable key from environment");
          setPublishableKey(envPublishableKey);
          setIsLoading(false);
          return;
        }
        
        // Check for active session
        if (!session) {
          console.log("No active session, cannot fetch Stripe settings");
          throw new Error('Authentication required');
        }
        
        const projectUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!projectUrl) {
          throw new Error('VITE_SUPABASE_URL environment variable is not configured');
        }
          
        // Get publishable key from Supabase Edge Function with auth headers
        const response = await fetch(
          `${projectUrl}/functions/v1/get-stripe-publishable-key`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching publishable key: ${response.statusText}`, errorText);
          throw new Error(`Error fetching publishable key: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data?.key) {
          setPublishableKey(data.key);
        }
        
        // Check if secret key and connected account are configured
        if (data?.secretKeyConfigured) {
          setSecretKeyConfigured(true);
        }
        if (data?.connectedAccountConfigured) {
          setConnectedAccountConfigured(true);
        }
      } catch (error) {
        console.error("Error in fetchStripeSettings:", error);
        toast.error("Failed to load Stripe settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStripeSettings();
  }, [session]);
  
  const handleSaveStripeSettings = async () => {
    if (!session) {
      toast.error("Authentication required");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Update Stripe settings in the database
      const { data, error } = await supabase.functions.invoke('update-stripe-settings', {
        body: {
          publishableKey: publishableKey || null,
          secretKey: secretKey || null,
          connectedAccountId: connectedAccountId || null,
        },
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Stripe settings updated successfully");
      
      // Set the secret key configuration state if a secret key was provided
      if (secretKey) {
        setSecretKeyConfigured(true);
      }
      if (connectedAccountId) {
        setConnectedAccountConfigured(true);
      }
      
      // Clear sensitive inputs for security
      setSecretKey("");
      setConnectedAccountId("");
      
      // If we're in development, show a message about updating .env
      if (environmentInfo.isDevelopment) {
        toast.info("For local development, consider updating your .env file with the Stripe publishable key", {
          duration: 6000
        });
      }
    } catch (error: any) {
      console.error("Error saving Stripe settings:", error);
      if (error?.name === 'FunctionsHttpError') {
        toast.error("Stripe settings must be managed via Supabase Secrets. Please set STRIPE_CONNECTED_ACCOUNT_ID in Supabase Functions Secrets.");
      } else {
        toast.error(error?.message || "Failed to update Stripe settings");
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="environment" className="flex items-center gap-1">
          <span>Current Environment</span>
          <Info className="h-4 w-4 text-muted-foreground" />
        </Label>
        <Alert className="py-2">
          <AlertDescription className="text-sm">
            You are currently in the <strong className="font-semibold">{environment}</strong> environment.
            {environmentInfo.isDevelopment && " Environment variables will use development fallbacks if not set."}
            {environmentInfo.isProduction && " Ensure all environment variables are properly configured for production."}
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="publishableKey">Stripe Publishable Key</Label>
        <Input
          id="publishableKey"
          value={publishableKey}
          onChange={(e) => setPublishableKey(e.target.value)}
          placeholder="pk_test_..."
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Your Stripe publishable key starts with pk_test_ or pk_live_
        </p>
      </div>

      {/* Connected Account ID */}
      {connectedAccountConfigured ? (
        <div className="space-y-2">
          <Label htmlFor="connectedAccountStatus" className="flex items-center gap-1">
            <span>Connected Account</span>
            <Lock className="h-4 w-4 text-green-600" />
          </Label>
          <Alert className="py-2">
            <AlertDescription className="text-sm">
              Connected account ID is configured. To update it, enter a new value below.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="connectedAccountId">Stripe Connected Account ID</Label>
        <Input
          id="connectedAccountId"
          value={connectedAccountId}
          onChange={(e) => setConnectedAccountId(e.target.value)}
          placeholder="acct_123..."
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Set the Stripe connected account ID (acct_...). Used for routing funds and platform fees.
        </p>
      </div>
      
      {secretKeyConfigured ? (
        <div className="space-y-2">
          <Label htmlFor="secretKeyStatus" className="flex items-center gap-1">
            <span>Stripe Secret Key</span>
            <Lock className="h-4 w-4 text-green-600" />
          </Label>
          <Alert className="py-2">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Secret key is configured and stored securely. To update it, enter a new secret key below.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
      
      <div className="space-y-2">
        <Label htmlFor="secretKey" className="flex items-center gap-1">
          <span>{secretKeyConfigured ? "Update Secret Key" : "Stripe Secret Key"}</span>
          <ShieldAlert className="h-4 w-4 text-amber-500" />
        </Label>
        <Input
          id="secretKey"
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="sk_test_..."
          disabled={isLoading}
        />
        <Alert variant="destructive" className="mt-2 py-2">
          <Key className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your secret key is stored securely and never shown again for security reasons. 
            It is transmitted securely to our server and not stored in the browser.
          </AlertDescription>
        </Alert>
      </div>
      
      {!publishableKey && !secretKeyConfigured && !secretKey && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Stripe is not configured. Online checkout will not work until you set up your Stripe keys.
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={handleSaveStripeSettings} 
        disabled={isSaving || isLoading}
        className="mt-4"
      >
        {isSaving ? "Saving..." : "Save Stripe Settings"}
      </Button>
    </div>
  );
};
