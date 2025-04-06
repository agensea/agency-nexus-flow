import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoices } from "@/contexts/InvoiceContext";
import { useClients } from "@/contexts/ClientContext";
import { Invoice, InvoiceItem } from "@/types";

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  amount: z.coerce.number(),
});

const formSchema = z.object({
  clientId: z.string({
    required_error: "Please select a client",
  }),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"], {
    required_error: "Please select a status",
  }),
  issueDate: z.date({
    required_error: "Issue date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%").optional(),
  discount: z.coerce.number().min(0, "Discount cannot be negative").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  onSuccess?: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSuccess }) => {
  const { createInvoice, updateInvoice, loading } = useInvoices();
  const { clients } = useClients();
  const [subTotal, setSubTotal] = useState(invoice?.subTotal || 0);
  const [taxAmount, setTaxAmount] = useState(invoice?.taxAmount || 0);
  const [total, setTotal] = useState(invoice?.total || 0);

  const isEditMode = !!invoice;

  const defaultValues: Partial<FormValues> = {
    clientId: invoice?.clientId || "",
    status: invoice?.status || "draft",
    issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    items: invoice?.items || [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    notes: invoice?.notes || "",
    terms: invoice?.terms || "Payment is due within 14 days of issue. Thank you for your business.",
    taxRate: invoice?.taxRate || 0,
    discount: invoice?.discount || 0,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const calculateItemAmount = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    const amount = Number(item.quantity) * Number(item.unitPrice);
    form.setValue(`items.${index}.amount`, amount);
    
    calculateTotals();
  };

  const calculateTotals = () => {
    const items = form.getValues("items");
    const discount = Number(form.getValues("discount") || 0);
    const taxRate = Number(form.getValues("taxRate") || 0);
    
    const calculatedSubTotal = items.reduce((total, item) => {
      return total + Number(item.amount || 0);
    }, 0);
    
    const discountedSubTotal = calculatedSubTotal - discount;
    
    const calculatedTaxAmount = (discountedSubTotal * taxRate) / 100;
    
    const calculatedTotal = discountedSubTotal + calculatedTaxAmount;
    
    setSubTotal(calculatedSubTotal);
    setTaxAmount(calculatedTaxAmount);
    setTotal(calculatedTotal);
  };

  const addInvoiceItem = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const processedItems: InvoiceItem[] = values.items.map(item => ({
        id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount
      }));

      const invoiceData = {
        clientId: values.clientId,
        status: values.status,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        items: processedItems,
        subTotal,
        taxAmount,
        total,
        notes: values.notes,
        terms: values.terms,
        taxRate: values.taxRate,
        discount: values.discount
      };

      if (isEditMode && invoice) {
        await updateInvoice(invoice.id, invoiceData);
      } else {
        await createInvoice(invoiceData);
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Invoice submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Invoice Details</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={loading}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={loading}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Additional Information</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes to the client" 
                        {...field} 
                        disabled={loading}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Invoice terms and conditions" 
                        {...field} 
                        disabled={loading}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Invoice Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInvoiceItem}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 mb-2 font-medium text-sm">
              <div className="col-span-6">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-1"></div>
            </div>
            
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Item description" 
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            min="0.01"
                            step="0.01"
                            onBlur={() => calculateItemAmount(index)}
                            onChange={(e) => {
                              field.onChange(e);
                              calculateItemAmount(index);
                            }}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            min="0"
                            step="0.01"
                            onBlur={() => calculateItemAmount(index)}
                            onChange={(e) => {
                              field.onChange(e);
                              calculateItemAmount(index);
                            }}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name={`items.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            readOnly
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      remove(index);
                      calculateTotals();
                    }}
                    disabled={loading || fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        onBlur={calculateTotals}
                        onChange={(e) => {
                          field.onChange(e);
                          calculateTotals();
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Amount</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="0"
                        step="0.01"
                        onBlur={calculateTotals}
                        onChange={(e) => {
                          field.onChange(e);
                          calculateTotals();
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="font-medium">Subtotal:</span>
              <span>${subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Tax:</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold border-t mt-2 pt-4">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading 
              ? isEditMode ? "Updating Invoice..." : "Creating Invoice..." 
              : isEditMode ? "Update Invoice" : "Create Invoice"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InvoiceForm;
