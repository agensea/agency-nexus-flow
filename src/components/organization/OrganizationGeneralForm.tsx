
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, { message: "Organization name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal('')),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const currencies = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CNY", label: "Chinese Yuan (CNY)" },
  { value: "INR", label: "Indian Rupee (INR)" },
];

const OrganizationGeneralForm: React.FC = () => {
  const { organization, updateOrganization, loading } = useOrganization();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization?.name || "",
      email: organization?.email || "",
      phone: organization?.phone || "",
      taxId: organization?.taxId || "",
      currency: organization?.currency || "USD",
      streetAddress: organization?.address?.street || "",
      city: organization?.address?.city || "",
      state: organization?.address?.state || "",
      zipCode: organization?.address?.zipCode || "",
      country: organization?.address?.country || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const address = {
        street: values.streetAddress,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        country: values.country,
      };

      await updateOrganization({
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        taxId: values.taxId || undefined,
        currency: values.currency || undefined,
        address: address,
      });
    } catch (error) {
      console.error("Failed to update organization:", error);
      // Error is already handled in the context with toast
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">General Information</h2>
          <p className="text-muted-foreground">
            Update your organization's basic information.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Organization Name" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="contact@yourcompany.com" 
                    {...field} 
                    disabled={loading}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Phone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+1 (555) 123-4567" 
                    {...field} 
                    disabled={loading}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax ID / VAT Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Tax ID or VAT Number" 
                    {...field} 
                    disabled={loading}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "USD"}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-semibold">Business Address</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="streetAddress"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123 Business St." 
                    {...field} 
                    disabled={loading}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="City" 
                    {...field} 
                    disabled={loading}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / Province</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="State or Province" 
                    {...field} 
                    disabled={loading}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zip / Postal Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Zip or Postal Code" 
                    {...field} 
                    disabled={loading}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Country" 
                    {...field} 
                    disabled={loading}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="mt-4" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};

export default OrganizationGeneralForm;
