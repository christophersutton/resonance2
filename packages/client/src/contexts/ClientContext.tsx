import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Client } from "../types/client"

type ClientContextType = {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  clients: Client[];
  isLoading: boolean;
  error: Error | null;
  refreshClients: () => Promise<void>;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3000/api';

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching clients...'); // Debug log
      const response = await fetch(`${API_BASE_URL}/clients`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received clients:', data); // Debug log
      
      // Validate the data structure
      if (!Array.isArray(data)) {
        throw new Error('Expected array of clients from API');
      }
      
      const clientsWithMessages = data.map((client: Client) => {
        console.log('Processing client:', client); // Debug individual client
        return {
          ...client,
          unreadMessages: 0
        };
      });
      
      console.log('Setting clients state:', clientsWithMessages); // Debug final state
      setClients(clientsWithMessages);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshClients = async () => {
    await fetchClients();
  };

  // Log state changes
  useEffect(() => {
    console.log('Clients state updated:', clients);
  }, [clients]);

  useEffect(() => {
    console.log('Loading state updated:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    fetchClients();
  }, []);

  const contextValue = {
    selectedClient,
    setSelectedClient,
    clients,
    isLoading,
    error,
    refreshClients
  };

  console.log('Context value:', contextValue); // Debug context value

  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
}