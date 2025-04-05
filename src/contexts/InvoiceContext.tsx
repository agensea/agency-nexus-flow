
import React, { createContext, useContext, useState, useEffect } from "react";
import { Invoice, InvoiceItem } from "@/types";
import { useAuth } from "./AuthContext";
import { useOrganization } from "./OrganizationContext";
import { toast } from "sonner";

interface InvoiceContextType {
  invoices: Invoice[];
  loading: boolean;
  createInvoice: (data: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "createdById" | "organizationId" | "number">) => Promise<Invoice>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByClient: (clientId: string) => Invoice[];
  getInvoicesByStatus: (status: Invoice["status"]) => Invoice[];
  markAsPaid: (id: string) => Promise<Invoice>;
  generatePdf: (id: string) => Promise<string>;
  sendInvoice: (id: string, email: string) => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | null>(null);

// Mock invoice data
const mockInvoices: Invoice[] = [
  {
    id: "inv1",
    number: "INV-001",
    clientId: "client1",
    organizationId: "org1",
    createdById: "user1",
    status: "draft",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    items: [
      {
        id: "item1",
        description: "Website design",
        quantity: 1,
        unitPrice: 1500,
        amount: 1500,
      },
      {
        id: "item2",
        description: "Development services",
        quantity: 20,
        unitPrice: 100,
        amount: 2000,
      },
    ],
    subTotal: 3500,
    taxRate: 10,
    taxAmount: 350,
    total: 3850,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Load invoices
  useEffect(() => {
    const loadInvoices = async () => {
      if (!user || !organization) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // In a real app, we would fetch invoices from an API
        setInvoices(mockInvoices);
      } catch (error) {
        console.error("Failed to load invoices:", error);
        toast.error("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [user, organization]);

  // Create invoice
  const createInvoice = async (data: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "createdById" | "organizationId" | "number">): Promise<Invoice> => {
    if (!user) throw new Error("User not authenticated");
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Generate invoice number
      const invoiceNumber = `INV-${String(invoices.length + 1).padStart(3, '0')}`;
      
      // Create new invoice
      const newInvoice: Invoice = {
        id: `inv${Date.now()}`,
        number: invoiceNumber,
        ...data,
        createdById: user.id,
        organizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save to state
      setInvoices([...invoices, newInvoice]);
      
      toast.success("Invoice created successfully");
      return newInvoice;
    } catch (error: any) {
      toast.error(error.message || "Failed to create invoice");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update invoice
  const updateInvoice = async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Find and update invoice
      const invoiceIndex = invoices.findIndex(i => i.id === id);
      if (invoiceIndex === -1) {
        throw new Error("Invoice not found");
      }
      
      const updatedInvoice = { 
        ...invoices[invoiceIndex], 
        ...data, 
        updatedAt: new Date() 
      };
      
      // Update invoices array
      const updatedInvoices = [...invoices];
      updatedInvoices[invoiceIndex] = updatedInvoice;
      setInvoices(updatedInvoices);
      
      toast.success("Invoice updated successfully");
      return updatedInvoice;
    } catch (error: any) {
      toast.error(error.message || "Failed to update invoice");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete invoice
  const deleteInvoice = async (id: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Delete invoice
      setInvoices(invoices.filter(invoice => invoice.id !== id));
      
      toast.success("Invoice deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete invoice");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get invoice by ID
  const getInvoiceById = (id: string) => {
    return invoices.find(invoice => invoice.id === id);
  };

  // Get invoices by client
  const getInvoicesByClient = (clientId: string) => {
    return invoices.filter(invoice => invoice.clientId === clientId);
  };

  // Get invoices by status
  const getInvoicesByStatus = (status: Invoice["status"]) => {
    return invoices.filter(invoice => invoice.status === status);
  };

  // Mark invoice as paid
  const markAsPaid = async (id: string): Promise<Invoice> => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Find and update invoice
      const invoiceIndex = invoices.findIndex(i => i.id === id);
      if (invoiceIndex === -1) {
        throw new Error("Invoice not found");
      }
      
      const updatedInvoice = { 
        ...invoices[invoiceIndex], 
        status: "paid" as const,
        paidAt: new Date(),
        updatedAt: new Date() 
      };
      
      // Update invoices array
      const updatedInvoices = [...invoices];
      updatedInvoices[invoiceIndex] = updatedInvoice;
      setInvoices(updatedInvoices);
      
      toast.success("Invoice marked as paid");
      return updatedInvoice;
    } catch (error: any) {
      toast.error(error.message || "Failed to mark invoice as paid");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF
  const generatePdf = async (id: string): Promise<string> => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // In a real app, we would generate a PDF and return a download URL
      const downloadUrl = `https://example.com/invoices/${id}.pdf`;
      
      toast.success("PDF generated successfully");
      return downloadUrl;
    } catch (error: any) {
      toast.error(error.message || "Failed to generate PDF");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send invoice
  const sendInvoice = async (id: string, email: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Find invoice
      const invoice = invoices.find(i => i.id === id);
      if (!invoice) {
        throw new Error("Invoice not found");
      }
      
      // Update invoice status if it's a draft
      if (invoice.status === "draft") {
        await updateInvoice(id, { status: "sent" });
      }
      
      // In a real app, we would send an email with the invoice
      console.log(`Invoice ${id} sent to ${email}`);
      
      toast.success(`Invoice sent to ${email}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invoice");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        loading,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        getInvoiceById,
        getInvoicesByClient,
        getInvoicesByStatus,
        markAsPaid,
        generatePdf,
        sendInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error("useInvoices must be used within an InvoiceProvider");
  }
  return context;
};
