
import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, Address } from "@/types";
import { useAuth } from "./AuthContext";
import { useOrganization } from "./OrganizationContext";
import { toast } from "sonner";

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  createClient: (data: Omit<Client, "id" | "createdAt" | "updatedAt" | "createdById" | "organizationId">) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
}

const ClientContext = createContext<ClientContextType | null>(null);

// Mock client data
const mockClients: Client[] = [
  {
    id: "client1",
    name: "Acme Corporation",
    organizationId: "org1",
    email: "contact@acme.com",
    phone: "+1 (555) 123-4567",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
    contactPerson: "John Smith",
    createdById: "user1",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "active",
  },
];

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      if (!user || !organization) {
        setClients([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // In a real app, we would fetch clients from an API
        setClients(mockClients);
      } catch (error) {
        console.error("Failed to load clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [user, organization]);

  // Create client
  const createClient = async (data: Omit<Client, "id" | "createdAt" | "updatedAt" | "createdById" | "organizationId">): Promise<Client> => {
    if (!user) throw new Error("User not authenticated");
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Create new client
      const newClient: Client = {
        id: `client${Date.now()}`,
        ...data,
        createdById: user.id,
        organizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save to state
      setClients([...clients, newClient]);
      
      toast.success("Client created successfully");
      return newClient;
    } catch (error: any) {
      toast.error(error.message || "Failed to create client");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update client
  const updateClient = async (id: string, data: Partial<Client>): Promise<Client> => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Find and update client
      const clientIndex = clients.findIndex(c => c.id === id);
      if (clientIndex === -1) {
        throw new Error("Client not found");
      }
      
      const updatedClient = { 
        ...clients[clientIndex], 
        ...data, 
        updatedAt: new Date() 
      };
      
      // Update clients array
      const updatedClients = [...clients];
      updatedClients[clientIndex] = updatedClient;
      setClients(updatedClients);
      
      toast.success("Client updated successfully");
      return updatedClient;
    } catch (error: any) {
      toast.error(error.message || "Failed to update client");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete client
  const deleteClient = async (id: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Delete client
      setClients(clients.filter(client => client.id !== id));
      
      toast.success("Client deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete client");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get client by ID
  const getClientById = (id: string) => {
    return clients.find(client => client.id === id);
  };

  return (
    <ClientContext.Provider
      value={{
        clients,
        loading,
        createClient,
        updateClient,
        deleteClient,
        getClientById,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClients must be used within a ClientProvider");
  }
  return context;
};
