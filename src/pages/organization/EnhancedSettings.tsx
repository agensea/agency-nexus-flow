import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  currency: z.string().min(1, "Currency is required"),
});

type FormValues = z.infer<typeof formSchema>;

const currencies = [
  { label: "US Dollar", value: "USD", symbol: "$" },
  { label: "Euro", value: "EUR", symbol: "€" },
  { label: "British Pound", value: "GBP", symbol: "£" },
  { label: "Indian Rupee", value: "INR", symbol: "₹" },
  { label: "Japanese Yen", value: "JPY", symbol: "¥" },
  { label: "Australian Dollar", value: "AUD", symbol: "A$" },
  { label: "Canadian Dollar", value: "CAD", symbol: "C$" },
  { label: "Swiss Franc", value: "CHF", symbol: "Fr" },
  { label: "Chinese Yuan", value: "CNY", symbol: "¥" },
  { label: "Singapore Dollar", value: "SGD", symbol: "S$" },
];

const EnhancedOrganizationSettings: React.FC = () => {
  const { user } = useAuth();
  const { organization, loading, updateOrganization, uploadLogo } = useOrganization();
  const navigate = useNavigate();
  const [fileUploadLoading, setFileUploadLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      currency: "USD",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address ? 
          `${organization.address.street}, ${organization.address.city}, ${organization.address.state} ${organization.address.zipCode}, ${organization.address.country}` : 
          "",
        taxId: organization.taxId || "",
        currency: organization.currency || "USD",
      });

      if (organization.logo) {
        setLogoPreview(organization.logo);
      }
    }
  }, [organization, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!organization) return;

    try {
      let logoUrl = organization.logo;
      if (selectedFile) {
        setFileUploadLoading(true);
        try {
          logoUrl = await uploadLogo(selectedFile);
        } catch (error) {
          console.error("Error uploading logo:", error);
          toast({
            title: "Error",
            description: "Failed to upload logo. Please try again.",
            variant: "destructive",
          });
          setFileUploadLoading(false);
          return;
        }
        setFileUploadLoading(false);
      }

      const addressParts = data.address ? data.address.split(",").map(part => part.trim()) : [];
      let addressObject = organization.address;
      
      if (addressParts.length >= 4) {
        const street = addressParts[0] || "";
        const city = addressParts[1] || "";
        let state = "";
        let zipCode = "";
        
        if (addressParts[2]) {
          const stateZipParts = addressParts[2].split(" ").filter(p => p);
          state = stateZipParts[0] || "";
          zipCode = stateZipParts.slice(1).join(" ") || "";
        }
        
        const country = addressParts[3] || "";
        
        addressObject = {
          street,
          city,
          state,
          zipCode,
          country
        };
      }

      await updateOrganization({
        ...organization,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        taxId: data.taxId || null,
        currency: data.currency,
        logo: logoUrl,
        address: addressObject
      });

      toast({
        title: "Success",
        description: "Organization settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-full max-w-md" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Skeleton className="h-10 w-32 mt-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!loading && !organization) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Organization Found</h1>
          <p className="mb-6">You need to create an organization first.</p>
          <Button onClick={() => navigate("/organization/setup")}>
            Create Organization
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Manage your organization's details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center mb-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={logoPreview || ""} alt="Organization logo" />
                      <AvatarFallback className="text-xl">
                        {organization?.name?.charAt(0) || "O"}
                      </AvatarFallback>
                    </Avatar>
                    {fileUploadLoading && (
                      <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">Organization Logo</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a logo for your organization. Recommended size: 512x512px.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex gap-2"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                        disabled={fileUploadLoading}
                      >
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={fileUploadLoading}
                      />
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLogoPreview(null);
                            setSelectedFile(null);
                          }}
                          disabled={fileUploadLoading}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@acmeinc.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Business email for invoices and communication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Business St, City, State 12345, Country" 
                          {...field}
                          rows={3} 
                        />
                      </FormControl>
                      <FormDescription>
                        Format: Street, City, State Zipcode, Country
                      </FormDescription>
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
                        <Input placeholder="Tax ID or VAT number" {...field} />
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
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.symbol} - {currency.label} ({currency.value})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Used for invoices and financial calculations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="mt-4"
                  disabled={fileUploadLoading || form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EnhancedOrganizationSettings;
