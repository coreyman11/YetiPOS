import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { CardReader } from "@/types/hardware";

export interface StripeTerminalReader {
  id: string;
  object: string;
  device_type: string;
  label: string;
  location: string | null;
  serial_number: string;
  status: string;
  ip_address: string | null;
  livemode: boolean;
  base_url: string;
  created: number;
  metadata: Record<string, string>;
}

export const terminalApi = {
  createConnectionToken: async (connectedAccountId?: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-terminal-api", {
        body: { action: "createConnectionToken", connectedAccountId }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Failed to create connection token: ${error.message}`);
      }
      
      if (!data || !data.token) {
        throw new Error("No connection token received from server");
      }
      
      return data.token;
    } catch (error) {
      console.error("Error creating connection token:", error);
      throw error;
    }
  },

  listReaders: async (connectedAccountId?: string): Promise<StripeTerminalReader[]> => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-terminal-api", {
        body: { action: "listReaders", connectedAccountId }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Failed to list readers: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("No data received from server");
      }
      
      return data.readers || [];
    } catch (error) {
      console.error("Error listing readers:", error);
      throw error;
    }
  },

  connectById: async (readerId: string, connectedAccountId?: string): Promise<StripeTerminalReader> => {
    try {
      if (!readerId) {
        throw new Error("Reader ID is required");
      }

      if (!readerId.startsWith('tmr_')) {
        throw new Error("Invalid reader ID format. IDs should start with 'tmr_'");
      }

      console.log("Connecting to reader by ID:", readerId);
      
      const { data, error } = await supabase.functions.invoke("stripe-terminal-api", {
        body: {
          action: "connectReader",
          connectedAccountId,
          data: { readerId }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Failed to connect reader: ${error.message}`);
      }

      if (!data) {
        throw new Error("No response data received from server");
      }
      
      if (data.error) {
        console.error("Reader connection error:", data.error);
        
        if (data.error.code === "reader_offline") {
          throw new Error("Reader is offline. Please ensure it's powered on and in pairing mode.");
        } else if (data.error.code === "not_found") {
          throw new Error("Reader not found. Please verify the ID is correct.");
        } else if (data.error.message) {
          throw new Error(data.error.message);
        } else {
          throw new Error("Failed to connect to reader");
        }
      }

      if (!data.reader) {
        throw new Error("No reader data received from server");
      }

      console.log("Reader connected successfully:", data.reader);
      return data.reader;
    } catch (error) {
      console.error("Error connecting reader by ID:", error);
      
      let errorMessage = "Failed to connect to reader";
      if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  registerReader: async (registrationCode: string, label?: string, connectedAccountId?: string): Promise<StripeTerminalReader> => {
    try {
      console.log("Registering reader with code:", registrationCode);
      
      const { data, error } = await supabase.functions.invoke("stripe-terminal-api", {
        body: {
          action: "registerReader",
          connectedAccountId,
          data: {
            registrationCode,
            label
          }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Failed to register reader: ${error.message}`);
      }
      
      if (!data || !data.reader) {
        throw new Error("No reader data received from server");
      }
      
      if (data.warning) {
        console.log("Registration warning:", data.warning);
        toast.info(data.warning);
      }
      
      console.log("Reader registered/connected successfully:", data.reader);
      return data.reader;
    } catch (error) {
      console.error("Error registering reader:", error);
      let errorMessage = "Failed to register card reader";
      
      if (error.message) {
        if (error.message.includes("already registered") || 
            error.message.includes("already exists")) {
          errorMessage = "This reader is already registered. Please try connecting to it instead.";
        } else {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  processPayment: async (readerId: string, amount: number, description?: string, currency: string = 'usd', connectedAccountId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-terminal-api", {
        body: {
          action: "processPayment",
          connectedAccountId,
          data: {
            readerId,
            amount,
            currency,
            description
          }
        }
      });

      if (error) throw new Error(`Payment processing failed: ${error.message}`);
      return data;
    } catch (error) {
      console.error("Error processing payment:", error);
      throw error;
    }
  },

  disconnectReader: async (readerId: string, connectedAccountId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-terminal-api", {
        body: {
          action: "disconnectReader",
          connectedAccountId,
          data: { readerId }
        }
      });

      if (error) throw new Error(`Failed to disconnect reader: ${error.message}`);
      return data;
    } catch (error) {
      console.error("Error disconnecting reader:", error);
      throw error;
    }
  },

  getReader: async (readerId: string, connectedAccountId?: string): Promise<StripeTerminalReader> => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-terminal-api", {
        body: {
          action: "getReader",
          connectedAccountId,
          data: { readerId }
        }
      });

      if (error) throw new Error(`Failed to get reader: ${error.message}`);
      if (!data || !data.reader) throw new Error("No reader data received");
      
      return data.reader;
    } catch (error) {
      console.error("Error getting reader:", error);
      throw error;
    }
  },

  convertToCardReader: (stripeReader: StripeTerminalReader): CardReader => {
    return {
      id: stripeReader.id,
      model: stripeReader.device_type,
      connectionStatus: stripeReader.status === "online" ? "connected" : "disconnected",
      batteryStatus: 0, // Battery status not available from API directly
      lastConnectionTime: new Date(stripeReader.created * 1000).toISOString(),
      isDefault: false // Default status needs to be determined from local configuration
    };
  },

  pollReaderStatus: async (readerId: string): Promise<CardReader | null> => {
    try {
      const stripeReader = await terminalApi.getReader(readerId);
      return terminalApi.convertToCardReader(stripeReader);
    } catch (error) {
      console.error("Error polling reader status:", error);
      return null;
    }
  }
};
