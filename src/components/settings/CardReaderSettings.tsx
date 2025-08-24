
import React, { useState } from "react";
import { useCardReader } from "@/hooks/useCardReader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Battery, Signal, Clock, Star, RefreshCw, PlusCircle, AlertCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CardReaderSettingsProps {
  locationId: string;
}

export const CardReaderSettings: React.FC<CardReaderSettingsProps> = ({ locationId }) => {
  const {
    reader,
    isConnecting,
    isTesting,
    isLoading,
    connectReader,
    disconnectReader,
    testReader,
    setDefaultReader,
    availableReaders,
    isDiscoveringReaders,
    discoverReaders
  } = useCardReader(locationId);

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [readerId, setReaderId] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleConnectById = async () => {
    try {
      setConnectionError(null);
      
      if (!readerId) {
        toast.error('Reader ID is required');
        return;
      }
      
      // Validate reader ID format
      if (!readerId.startsWith('tmr_')) {
        setConnectionError('Invalid reader ID format. IDs should start with "tmr_"');
        return;
      }
      
      await connectReader(readerId);
      toast.success('Reader connected successfully');
      setShowConnectDialog(false);
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionError(error.message || 'Failed to connect to reader');
    }
  };

  const handleConnectAvailableReader = async (readerId: string) => {
    try {
      await connectReader(readerId);
      toast.success('Reader connected successfully');
    } catch (error) {
      console.error('Connection error for available reader:', error);
      toast.error(error.message || 'Failed to connect to reader');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Card Reader Settings</CardTitle>
          <CardDescription>Configure and manage your card reader device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Card Reader Settings</span>
          {!reader?.connectionStatus || reader.connectionStatus !== 'connected' ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowConnectDialog(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Connect by ID
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => discoverReaders()}
                disabled={isDiscoveringReaders}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isDiscoveringReaders ? "animate-spin" : ""}`} />
                {isDiscoveringReaders ? "Scanning..." : "Scan for readers"}
              </Button>
            </div>
          ) : null}
        </CardTitle>
        <CardDescription>Configure and manage your card reader device.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Connection Status</h3>
            {reader ? (
              <Badge variant={reader.connectionStatus === 'connected' ? 'secondary' : 'destructive'}>
                {reader.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Badge>
            ) : (
              <Badge variant="secondary">No Reader</Badge>
            )}
          </div>
          {reader?.connectionStatus === 'connected' && (
            <Button
              variant="destructive"
              onClick={disconnectReader}
              disabled={isConnecting}
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Troubleshooting Info Alert */}
        {!reader?.connectionStatus || reader.connectionStatus !== 'connected' ? (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">Connection Tips</AlertTitle>
            <AlertDescription className="text-blue-600 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                <li>Ensure the reader is powered on and in pairing mode</li>
                <li>Check that both devices are on the same Wi-Fi network</li>
                <li>Make sure the reader is not already paired with another device</li>
                <li>Try restarting the card reader if connection fails</li>
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Available Readers List */}
        {availableReaders.length > 0 && (!reader?.connectionStatus || reader.connectionStatus !== 'connected') && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Available Readers</h3>
            <div className="grid gap-2">
              {availableReaders.map((availableReader) => (
                <div key={availableReader.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                  <div>
                    <p className="font-medium">{availableReader.label || availableReader.device_type}</p>
                    <p className="text-xs text-muted-foreground">ID: {availableReader.id}</p>
                    <p className="text-xs text-muted-foreground">S/N: {availableReader.serial_number}</p>
                    <p className="text-xs text-muted-foreground">Status: {availableReader.status}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleConnectAvailableReader(availableReader.id)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* No readers found message */}
        {availableReaders.length === 0 && isDiscoveringReaders === false && (!reader?.connectionStatus || reader.connectionStatus !== 'connected') && (
          <Alert className="bg-muted/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No readers found</AlertTitle>
            <AlertDescription>
              Make sure your card readers are powered on and connected to the same network as this device.
            </AlertDescription>
          </Alert>
        )}

        {/* Reader Information */}
        {reader && (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Reader Information</h3>
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Model:</span>
                  <span>{reader.model}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reader ID:</span>
                  <span className="font-mono text-xs">{reader.id}</span>
                </div>
                {reader.batteryStatus !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Battery:</span>
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4" />
                      {reader.batteryStatus}%
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Signal:</span>
                  <Signal className="h-4 w-4" />
                </div>
                {reader.lastConnectionTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Connected:</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(reader.lastConnectionTime).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={testReader}
                  disabled={isTesting || reader.connectionStatus !== 'connected'}
                >
                  {isTesting ? "Testing..." : "Test Payment"}
                </Button>
                <Button
                  variant="outline"
                  onClick={setDefaultReader}
                  disabled={reader.isDefault}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" fill={reader.isDefault ? "currentColor" : "none"} />
                  {reader.isDefault ? "Default Reader" : "Set as Default"}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Connect by ID Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Reader by ID</DialogTitle>
            <DialogDescription>
              Enter the Stripe Terminal reader ID (starts with 'tmr_') to connect directly.
            </DialogDescription>
          </DialogHeader>
          
          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reader-id">Reader ID</Label>
              <Input 
                id="reader-id" 
                placeholder="tmr_..."
                value={readerId} 
                onChange={(e) => setReaderId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Find your reader ID in the Stripe Dashboard under Terminal → Readers
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleConnectById} 
              disabled={!readerId || isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
