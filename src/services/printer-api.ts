
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { toast } from 'sonner';

type PrinterConfig = Database['public']['Tables']['printer_configurations']['Row'];
type Receipt = Database['public']['Tables']['receipts']['Row'];

interface PrintServerStatus {
  connected: boolean;
  availablePrinters: string[];
  error?: string;
}

interface NetworkPrinter {
  name: string;
  ip: string;
  port?: number;
  model?: string;
  status?: string;
}

interface BluetoothDevice {
  name: string;
  deviceId: string;
  macAddress?: string;
  type?: string;
  model?: string;
}

class LocalPrintServer {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private _status: PrintServerStatus = {
    connected: false,
    availablePrinters: []
  };
  private connectCallbacks: Array<(status: PrintServerStatus) => void> = [];
  
  constructor(private port: number = 8000) {}

  get status(): PrintServerStatus {
    return this._status;
  }

  async connect(): Promise<PrintServerStatus> {
    try {
      return new Promise((resolve, reject) => {
        // Connect to local WebSocket server
        const wsUrl = `ws://localhost:${this.port}`;
        console.log('Attempting to connect to local print server:', wsUrl);
        
        try {
          this.socket = new WebSocket(wsUrl);
        } catch (error) {
          console.error('Failed to create WebSocket connection:', error);
          this._status = {
            connected: false,
            availablePrinters: [],
            error: 'Failed to connect to local print server'
          };
          reject(this._status);
          return;
        }

        this.socket.onopen = () => {
          console.log('Print server connection established');
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          // Request available printers
          this.socket.send(JSON.stringify({
            action: 'getPrinters'
          }));
          
          this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received message from print server:', data);
            
            if (data.action === 'printerList') {
              this._status = {
                connected: true,
                availablePrinters: data.printers || []
              };
              
              // Notify all callbacks about the connection
              this.connectCallbacks.forEach(callback => callback(this._status));
              resolve(this._status);
            }
            else if (data.action === 'printResult') {
              console.log('Print result:', data.success ? 'Success' : 'Failed', data.message);
            }
          } catch (error) {
            console.error('Error processing message from print server:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('Print server connection error:', error);
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          this._status = {
            connected: false,
            availablePrinters: [],
            error: 'Connection error with local print server'
          };
          
          reject(this._status);
        };

        this.socket.onclose = (event) => {
          console.log('Print server connection closed:', event.code, event.reason);
          this._status.connected = false;
          this.handleDisconnect();
        };

        // Set a connection timeout
        this.connectionTimeout = setTimeout(() => {
          console.log('Connection timeout reached');
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            this.socket.close();
            this._status = {
              connected: false,
              availablePrinters: [],
              error: 'Connection timeout - print server not responding'
            };
            reject(this._status);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('Print server connection error:', error);
      this._status = {
        connected: false,
        availablePrinters: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      throw this._status;
    }
  }

  onConnect(callback: (status: PrintServerStatus) => void) {
    this.connectCallbacks.push(callback);
    
    // If already connected, call the callback immediately
    if (this._status.connected) {
      callback(this._status);
    }
    
    return () => {
      this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback);
    };
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to print server (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), 2000);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this._status.connected = false;
  }

  async print(printerName: string, data: string): Promise<boolean> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Print server not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        const messageId = Date.now().toString();
        
        // Set up one-time message handler for this print job
        const messageHandler = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data);
            
            if (response.messageId === messageId && response.action === 'printResult') {
              // Remove this specific message handler
              this.socket?.removeEventListener('message', messageHandler);
              
              if (response.success) {
                resolve(true);
              } else {
                reject(new Error(response.message || 'Print failed'));
              }
            }
          } catch (error) {
            // Ignore non-JSON messages or messages without the expected format
          }
        };
        
        // Add temporary message handler
        this.socket.addEventListener('message', messageHandler);
        
        // Send print command
        this.socket.send(JSON.stringify({
          action: 'print',
          messageId,
          printer: printerName,
          data: data
        }));
        
        // Set timeout for response
        setTimeout(() => {
          this.socket?.removeEventListener('message', messageHandler);
          reject(new Error('Print command timed out'));
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  async scanNetwork(): Promise<NetworkPrinter[]> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Print server not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        const messageId = Date.now().toString();
        
        // Set up one-time message handler for network scan
        const messageHandler = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data);
            
            if (response.messageId === messageId && response.action === 'networkScanResult') {
              // Remove this specific message handler
              this.socket?.removeEventListener('message', messageHandler);
              
              if (response.success) {
                resolve(response.printers || []);
              } else {
                reject(new Error(response.message || 'Network scan failed'));
              }
            }
          } catch (error) {
            // Ignore non-JSON messages or messages without the expected format
          }
        };
        
        // Add temporary message handler
        this.socket.addEventListener('message', messageHandler);
        
        // Send network scan command
        this.socket.send(JSON.stringify({
          action: 'scanNetwork',
          messageId
        }));
        
        // Set timeout for response
        setTimeout(() => {
          this.socket?.removeEventListener('message', messageHandler);
          reject(new Error('Network scan timed out'));
        }, 30000); // Network scanning might take longer
      } catch (error) {
        reject(error);
      }
    });
  }
  
  async scanBluetoothDevices(): Promise<BluetoothDevice[]> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Print server not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        const messageId = Date.now().toString();
        
        // Set up one-time message handler for Bluetooth scan
        const messageHandler = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data);
            
            if (response.messageId === messageId && response.action === 'bluetoothScanResult') {
              // Remove this specific message handler
              this.socket?.removeEventListener('message', messageHandler);
              
              if (response.success) {
                resolve(response.devices || []);
              } else {
                reject(new Error(response.message || 'Bluetooth scan failed'));
              }
            }
          } catch (error) {
            // Ignore non-JSON messages or messages without the expected format
          }
        };
        
        // Add temporary message handler
        this.socket.addEventListener('message', messageHandler);
        
        // Send Bluetooth scan command
        this.socket.send(JSON.stringify({
          action: 'scanBluetooth',
          messageId
        }));
        
        // Set timeout for response
        setTimeout(() => {
          this.socket?.removeEventListener('message', messageHandler);
          reject(new Error('Bluetooth scan timed out'));
        }, 30000); // Bluetooth scanning might take longer
      } catch (error) {
        reject(error);
      }
    });
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance of the print server
const printServer = new LocalPrintServer();

// Keep track of printer connections
const printerConnections = new Map<number, string>();

// Simulated network printer discovery for demo purposes
const simulateNetworkPrinterDiscovery = async (): Promise<NetworkPrinter[]> => {
  // In a real implementation, this would communicate with the print server to scan the network
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate scan time
  
  // Return mock data
  return [
    { name: 'Epson TM-T88V', ip: '192.168.1.101', port: 9100, model: 'TM-T88V' },
    { name: 'Star TSP100', ip: '192.168.1.102', port: 9100, model: 'TSP100' },
    { name: 'HP LaserJet', ip: '192.168.1.103', port: 9100, model: 'LaserJet' }
  ];
};

// Simulated Bluetooth printer discovery for demo purposes
const simulateBluetoothDeviceDiscovery = async (): Promise<BluetoothDevice[]> => {
  // In a real implementation, this would use the Web Bluetooth API or communicate with a local service
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate scan time
  
  // Return mock data
  return [
    { name: 'Star TSP-100 BT', deviceId: '00:11:22:33:44:55', macAddress: '00:11:22:33:44:55', type: 'printer' },
    { name: 'Epson TM-P20', deviceId: 'AA:BB:CC:DD:EE:FF', macAddress: 'AA:BB:CC:DD:EE:FF', type: 'printer' },
    { name: 'HP Thermal Printer', deviceId: '11:22:33:44:55:66', macAddress: '11:22:33:44:55:66', type: 'printer' }
  ];
};

// Create a singleton to manage print functionality
export const printerApi = {
  getConfigurations: async () => {
    try {
      const { data, error } = await supabase
        .from('printer_configurations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching printer configurations:', error);
      throw error;
    }
  },

  addConfiguration: async (config: Omit<PrinterConfig, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    try {
      const { data, error } = await supabase
        .from('printer_configurations')
        .insert({ ...config, status: 'disconnected' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding printer configuration:', error);
      throw error;
    }
  },

  updateConfiguration: async (id: number, updates: Partial<PrinterConfig>) => {
    try {
      const { data, error } = await supabase
        .from('printer_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating printer configuration:', error);
      throw error;
    }
  },

  connectToPrintServer: async (): Promise<PrintServerStatus> => {
    try {
      return await printServer.connect();
    } catch (error) {
      console.error('Failed to connect to print server:', error);
      throw error;
    }
  },

  onPrintServerConnect: (callback: (status: PrintServerStatus) => void) => {
    return printServer.onConnect(callback);
  },

  getPrintServerStatus: (): PrintServerStatus => {
    return printServer.status;
  },

  scanNetworkForPrinters: async (): Promise<NetworkPrinter[]> => {
    try {
      // If print server is connected, use it to scan the network
      if (printServer.isConnected()) {
        try {
          return await printServer.scanNetwork();
        } catch (error) {
          console.warn('Print server network scan failed, falling back to simulation:', error);
          // Fall back to simulation if server scan fails
          return await simulateNetworkPrinterDiscovery();
        }
      } else {
        // If not connected, use simulated network scanner
        return await simulateNetworkPrinterDiscovery();
      }
    } catch (error) {
      console.error('Failed to scan network for printers:', error);
      throw error;
    }
  },
  
  scanBluetoothDevices: async (): Promise<BluetoothDevice[]> => {
    try {
      // If print server is connected, use it to scan for Bluetooth devices
      if (printServer.isConnected()) {
        try {
          return await printServer.scanBluetoothDevices();
        } catch (error) {
          console.warn('Print server Bluetooth scan failed, falling back to simulation:', error);
          // Fall back to simulation if server scan fails
          return await simulateBluetoothDeviceDiscovery();
        }
      } else {
        // If not connected, use simulated Bluetooth scanner
        return await simulateBluetoothDeviceDiscovery();
      }
    } catch (error) {
      console.error('Failed to scan for Bluetooth devices:', error);
      throw error;
    }
  },

  connectPrinter: async (id: number, printerName: string) => {
    try {
      // Store the printer name for this id
      printerConnections.set(id, printerName);
      
      // Update the database status
      const { data, error } = await supabase
        .from('printer_configurations')
        .update({ 
          status: 'connected',
          connection_details: { name: printerName }
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      // Update the database to show connection failed
      await supabase
        .from('printer_configurations')
        .update({ status: 'disconnected' })
        .eq('id', id);

      console.error('Failed to connect to printer:', error);
      throw error;
    }
  },

  disconnectPrinter: async (id: number) => {
    console.log('Disconnecting printer:', id);
    printerConnections.delete(id);

    const { error } = await supabase
      .from('printer_configurations')
      .update({ status: 'disconnected' })
      .eq('id', id);
    
    if (error) throw error;
  },

  createReceipt: async (transactionId: number, template: string, printerId?: string) => {
    try {
      // Create receipt record in database
      const { data, error } = await supabase
        .from('receipts')
        .insert({
          transaction_id: transactionId,
          template,
          printer_id: printerId,
          status: 'created'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // If print server is connected and we have a printer name, try to print directly
      if (printServer.isConnected() && printerId) {
        const printerName = printerConnections.get(parseInt(printerId));
        
        if (printerName) {
          try {
            // Send print job to the print server
            await printServer.print(printerName, template);
            
            // Update receipt status
            await supabase
              .from('receipts')
              .update({
                printed: true,
                status: 'printed'
              })
              .eq('id', data.id);
          } catch (printError) {
            console.error('Print error:', printError);
            
            // Update receipt with error
            await supabase
              .from('receipts')
              .update({
                status: 'error',
                error_message: printError instanceof Error ? printError.message : 'Unknown print error'
              })
              .eq('id', data.id);
              
            throw printError;
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }
  },

  getReceipt: async (transactionId: number) => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting receipt:', error);
      throw error;
    }
  },

  updateReceiptTemplate: async (template: string) => {
    // Here we would typically update a template configuration in the database
    // For now, we'll just simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  // Method to print a receipt using local print server
  printReceipt: async (printerId: number, receiptData: string) => {
    const printerName = printerConnections.get(printerId);
    if (!printerName) {
      throw new Error('Printer not configured with local print server');
    }

    if (!printServer.isConnected()) {
      throw new Error('Print server not connected');
    }

    return await printServer.print(printerName, receiptData);
  }
};
