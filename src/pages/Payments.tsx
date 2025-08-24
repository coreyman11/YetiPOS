
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { stripeApi } from "@/services";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Payments = () => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkStripeConfiguration = async () => {
      if (!session) {
        console.log("No active session, deferring Stripe configuration check");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const key = await stripeApi.getPublishableKey();
        setIsConfigured(!!key);
      } catch (error) {
        console.error("Failed to check Stripe configuration:", error);
        setError(error.message);
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStripeConfiguration();
  }, [session]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
        <p className="text-muted-foreground">Process and track payments.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Stripe Integration</CardTitle>
            <CardDescription>
              Accept online payments using Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !session ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Authentication required to check Stripe configuration.
                </AlertDescription>
              </Alert>
            ) : error && error.includes("Session expired") ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your session has expired. Please refresh the page or log in again.
                </AlertDescription>
              </Alert>
            ) : isConfigured === false ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || "Stripe is not properly configured. Configure your Stripe keys in settings."}
                </AlertDescription>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Stripe
                </Button>
              </Alert>
            ) : (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-300">
                <AlertDescription>
                  Stripe is configured and ready to accept payments.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payments;
