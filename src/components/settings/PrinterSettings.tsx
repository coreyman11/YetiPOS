import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { printerApi } from "@/services/printer-api";
import { Loader2, Plus, Trash, RefreshCw, Wifi, Bluetooth, Printer, Cable } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrinterSettingsProps {
  locationId: string;
}

const printerFormSchema = z.object({
  name: z.string().min(2, "Printer name is required"),
  type: z.enum(["wifi", "bluetooth", "local", "network"]),
  isDefault: z.boolean().default(false),
  connectionDetails: z.object({
    ip: z.string().optional(),
    port: z.coerce.number().optional(),
    deviceId: z.string().optional(),
    model: z.string().optional(),
    name: z.string().optional(),
    macAddress: z.string().optional(),
  }).optional(),
});

type PrinterFormValues = z.infer<typeof printerFormSchema>;

export const PrinterSettings: React.FC<PrinterSettingsProps> = ({ locationId }) => {
  const [isAddPrinterOpen, setIsAddPrinterOpen] = useState(false);
  const [isScanningNetwork, setIsScanningNetwork] = useState(false);
  const [isScanningBluetooth, setIsScanningBluetooth] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<any[]>([]);
  const [discoveredBluetoothDevices, setDiscoveredBluetoothDevices] = useState<any[]>([]);
  const [scanTab, setScanTab] = useState<string>("wifi");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: printers, isLoading, refetch } = useQuery({
    queryKey: ['printers', locationId],
    queryFn: async () => {
      try {
        return await printerApi.getConfigurations();
      } catch (error) {
        console.error("Error fetching printers:", error);
        toast.error("Failed to load printer configurations");
        return [];
      }
    }
  });

  const { data: serverStatus, isLoading: isServerStatusLoading } = useQuery({
    queryKey: ['print-server-status'],
    queryFn: () => {
      return printerApi.connectToPrintServer()
        .catch(error => {
          console.error("Error connecting to print server:", error);
          setErrorMessage("Could not connect to print server. Make sure the local print service is running.");
          return { connected: false, availablePrinters: [], error: error.message || "Failed to connect" };
        });
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const form = useForm<PrinterFormValues>({
    resolver: zodResolver(printerFormSchema),
    defaultValues: {
      name: "",
      type: "wifi",
      isDefault: false,
      connectionDetails: {
        ip: "",
        port: 9100,
        model: "",
      },
    },
  });

  useEffect(() => {
    const type = form.watch("type");
    if (type === "wifi" || type === "network") {
      form.setValue("connectionDetails.port", 9100);
    }
  }, [form.watch("type")]);

  const addPrinter = useMutation({
    mutationFn: (values: PrinterFormValues) => {
      return printerApi.addConfiguration({
        name: values.name,
        type: values.type,
        is_default: values.isDefault,
        connection_details: values.connectionDetails || {},
      });
    },
    onSuccess: () => {
      toast.success("Printer added successfully");
      setIsAddPrinterOpen(false);
      form.reset();
      setDiscoveredPrinters([]);
      setDiscoveredBluetoothDevices([]);
      queryClient.invalidateQueries({ queryKey: ['printers'] });
    },
    onError: (error) => {
      toast.error(`Failed to add printer: ${error.message}`);
    },
  });

  const deletePrinter = useMutation({
    mutationFn: (id: number) => {
      return printerApi.updateConfiguration(id, { status: "deleted" });
    },
    onSuccess: () => {
      toast.success("Printer removed");
      queryClient.invalidateQueries({ queryKey: ['printers'] });
    },
    onError: (error) => {
      toast.error(`Failed to remove printer: ${error.message}`);
    },
  });

  const connectPrinter = useMutation({
    mutationFn: ({ id, printerName }: { id: number, printerName: string }) => {
      return printerApi.connectPrinter(id, printerName);
    },
    onSuccess: () => {
      toast.success("Printer connected successfully");
      queryClient.invalidateQueries({ queryKey: ['printers'] });
    },
    onError: (error) => {
      toast.error(`Failed to connect printer: ${error.message}`);
    },
  });

  const disconnectPrinter = useMutation({
    mutationFn: (id: number) => {
      return printerApi.disconnectPrinter(id);
    },
    onSuccess: () => {
      toast.success("Printer disconnected");
      queryClient.invalidateQueries({ queryKey: ['printers'] });
    },
    onError: (error) => {
      toast.error(`Failed to disconnect printer: ${error.message}`);
    },
  });

  const scanNetwork = async () => {
    setIsScanningNetwork(true);
    setErrorMessage(null);
    try {
      const networkPrinters = await printerApi.scanNetworkForPrinters();
      setDiscoveredPrinters(networkPrinters);
      
      if (networkPrinters.length === 0) {
        toast.info("No printers found on network. Make sure printers are turned on and connected to the network.");
      } else {
        toast.success(`Found ${networkPrinters.length} printer${networkPrinters.length === 1 ? '' : 's'} on network`);
      }
    } catch (error) {
      console.error("Scan network error:", error);
      setErrorMessage(`Network scan failed: ${error.message || "Unknown error"}`);
      toast.error(`Failed to scan network: ${error.message}`);
    } finally {
      setIsScanningNetwork(false);
    }
  };

  const scanBluetoothDevices = async () => {
    setIsScanningBluetooth(true);
    setErrorMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate scan delay
      
      const mockDevices = [
        { name: "Star TSP-100 BT", deviceId: "00:11:22:33:44:55", macAddress: "00:11:22:33:44:55", type: "printer" },
        { name: "Epson TM-P20", deviceId: "AA:BB:CC:DD:EE:FF", macAddress: "AA:BB:CC:DD:EE:FF", type: "printer" },
        { name: "HP Thermal Printer", deviceId: "11:22:33:44:55:66", macAddress: "11:22:33:44:55:66", type: "printer" }
      ];
      
      setDiscoveredBluetoothDevices(mockDevices);
      
      if (mockDevices.length === 0) {
        toast.info("No Bluetooth printers found. Make sure printers are turned on and in pairing mode.");
      } else {
        toast.success(`Found ${mockDevices.length} Bluetooth printer${mockDevices.length === 1 ? '' : 's'}`);
      }
    } catch (error) {
      console.error("Bluetooth scan error:", error);
      setErrorMessage(`Bluetooth scan failed: ${error.message || "Unknown error"}`);
      toast.error(`Failed to scan for Bluetooth devices: ${error.message}`);
    } finally {
      setIsScanningBluetooth(false);
    }
  };

  useEffect(() => {
    if (!serverStatus?.connected) {
      printerApi.connectToPrintServer().catch((error) => {
        console.error("Print server connection error:", error);
        setErrorMessage("Print server connection failed. Some features may be unavailable.");
      });
    }
  }, [serverStatus]);

  const handleSubmit = (values: PrinterFormValues) => {
    addPrinter.mutate(values);
  };

  const handleConnectPrinter = (id: number, printerName: string) => {
    connectPrinter.mutate({ id, printerName });
  };

  const handleDisconnectPrinter = (id: number) => {
    disconnectPrinter.mutate(id);
  };

  const getPrinterTypeIcon = (type: string) => {
    switch (type) {
      case 'wifi': 
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'bluetooth':
        return <Bluetooth className="h-4 w-4" />;
      case 'local':
        return <Cable className="h-4 w-4" />;
      default:
        return <Printer className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Printer Settings</h3>
          <p className="text-sm text-muted-foreground">Configure your receipt printers for direct printing.</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddPrinterOpen} onOpenChange={setIsAddPrinterOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Printer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Printer</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Printer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Office Printer" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Printer Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select printer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wifi">WiFi/Network</SelectItem>
                            <SelectItem value="bluetooth">Bluetooth</SelectItem>
                            <SelectItem value="local">Local/USB</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("type") === "wifi" && (
                    <>
                      <FormField
                        control={form.control}
                        name="connectionDetails.ip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IP Address</FormLabel>
                            <FormControl>
                              <Input placeholder="192.168.1.100" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="connectionDetails.port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="9100" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 9100)}
                              />
                            </FormControl>
                            <FormDescription>
                              Standard printer port is usually 9100
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {form.watch("type") === "bluetooth" && (
                    <>
                      <FormField
                        control={form.control}
                        name="connectionDetails.deviceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Device ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Device ID or MAC address" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="connectionDetails.macAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MAC Address</FormLabel>
                            <FormControl>
                              <Input placeholder="XX:XX:XX:XX:XX:XX" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="connectionDetails.model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Printer model" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Default Printer</FormLabel>
                          <FormDescription>
                            Use this printer by default for all receipts
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddPrinterOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Printer</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Print Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${serverStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{serverStatus?.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setErrorMessage(null);
                  printerApi.connectToPrintServer().then(() => {
                    queryClient.invalidateQueries({ queryKey: ['print-server-status'] });
                    toast.success("Connected to print server");
                  }).catch((error) => {
                    setErrorMessage(`Print server connection failed: ${error.message}`);
                    toast.error(`Failed to connect: ${error.message}`);
                  });
                }}
                disabled={isServerStatusLoading || serverStatus?.connected}
              >
                {isServerStatusLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
            </div>
            
            {errorMessage && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription className="text-xs">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
            
            {serverStatus?.connected && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {serverStatus.availablePrinters.length > 0 
                    ? `Available system printers: ${serverStatus.availablePrinters.join(', ')}` 
                    : 'No system printers detected'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Discover Printers</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="wifi" value={scanTab} onValueChange={setScanTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="wifi">Network Printers</TabsTrigger>
                <TabsTrigger value="bluetooth">Bluetooth Printers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="wifi" className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Scan your network to discover available network printers
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={scanNetwork} 
                    disabled={isScanningNetwork}
                  >
                    {isScanningNetwork ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Network
                      </>
                    )}
                  </Button>
                </div>
                
                {discoveredPrinters.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium">Discovered Network Printers</h4>
                    <div className="space-y-3">
                      {discoveredPrinters.map((printer, index) => (
                        <div key={index} className="flex items-center justify-between border p-3 rounded-md">
                          <div>
                            <div className="font-medium flex items-center">
                              <Wifi className="h-4 w-4 mr-2 text-blue-500" />
                              {printer.name || 'Unknown Printer'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              IP: {printer.ip}{printer.port ? `:${printer.port}` : ''}
                              {printer.model ? ` • Model: ${printer.model}` : ''}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setIsAddPrinterOpen(true);
                              form.reset({
                                name: printer.name || `Printer at ${printer.ip}`,
                                type: "wifi",
                                isDefault: false,
                                connectionDetails: {
                                  ip: printer.ip,
                                  port: printer.port || 9100,
                                  model: printer.model || "",
                                },
                              });
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="bluetooth" className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Scan for nearby Bluetooth printers
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={scanBluetoothDevices} 
                    disabled={isScanningBluetooth}
                  >
                    {isScanningBluetooth ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Bluetooth
                      </>
                    )}
                  </Button>
                </div>
                
                {discoveredBluetoothDevices.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium">Discovered Bluetooth Printers</h4>
                    <div className="space-y-3">
                      {discoveredBluetoothDevices.map((device, index) => (
                        <div key={index} className="flex items-center justify-between border p-3 rounded-md">
                          <div>
                            <div className="font-medium flex items-center">
                              <Bluetooth className="h-4 w-4 mr-2 text-blue-500" />
                              {device.name || 'Unknown Device'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              MAC: {device.macAddress || device.deviceId || 'Unknown'}
                              {device.type ? ` • Type: ${device.type}` : ''}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setIsAddPrinterOpen(true);
                              form.reset({
                                name: device.name || 'Bluetooth Printer',
                                type: "bluetooth",
                                isDefault: false,
                                connectionDetails: {
                                  deviceId: device.deviceId || '',
                                  macAddress: device.macAddress || device.deviceId || '',
                                  model: device.model || "",
                                },
                              });
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Configured Printers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : printers && printers.filter(p => p.status !== 'deleted').length > 0 ? (
              <div className="space-y-4">
                {printers
                  .filter(printer => printer.status !== 'deleted')
                  .map((printer) => (
                    <div key={printer.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <div className="flex items-center space-x-2">
                          {getPrinterTypeIcon(printer.type)}
                          <span className="font-medium">{printer.name || `Printer #${printer.id}`}</span>
                          {printer.is_default && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {printer.type === 'wifi' && printer.connection_details?.ip && (
                            <span>IP: {printer.connection_details.ip}:{printer.connection_details.port || '9100'}</span>
                          )}
                          {printer.type === 'bluetooth' && printer.connection_details?.deviceId && (
                            <span>Device ID: {printer.connection_details.deviceId}</span>
                          )}
                          {printer.type === 'local' && (
                            <span>Local/USB Printer</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${printer.status === 'connected' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-xs">{printer.status === 'connected' ? 'Connected' : 'Disconnected'}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {printer.status !== 'connected' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (!serverStatus?.connected || serverStatus.availablePrinters.length === 0) {
                                toast.error("Print server not connected or no system printers available");
                                return;
                              }
                              
                              const systemPrinter = serverStatus.availablePrinters.find(
                                p => p.toLowerCase().includes(printer.name.toLowerCase())
                              );
                              
                              if (systemPrinter) {
                                handleConnectPrinter(printer.id, systemPrinter);
                              } else {
                                toast.error("Printer not found on system. Please check printer name or connection.");
                              }
                            }}
                            disabled={!serverStatus?.connected || serverStatus.availablePrinters.length === 0}
                          >
                            Connect
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDisconnectPrinter(printer.id)}
                          >
                            Disconnect
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this printer?")) {
                              deletePrinter.mutate(printer.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No printers configured</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add a printer to enable direct printing from your POS system
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
