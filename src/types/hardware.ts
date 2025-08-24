
export interface CardReader {
  id: string;
  model: string;
  batteryStatus?: number;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastConnectionTime?: string;
  isDefault?: boolean;
}

export interface CardReaderConfiguration {
  id?: string;
  location_id: string;
  reader_id: string;
  model: string;
  is_default: boolean;
  last_connection_time?: string;
  created_at?: string;
}
