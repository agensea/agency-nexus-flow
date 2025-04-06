
import React, { useState } from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Upload, Image } from "lucide-react";

const formSchema = z.object({
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g., #6366F1)",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const OrganizationBrandingForm: React.FC = () => {
  const { organization, updateOrganization, updateSettings, uploadLogo, loading } = useOrganization();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | undefined>(organization?.logo);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      color: organization?.settings?.color || "#6366F1",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateSettings({
        color: values.color,
      });
    } catch (error) {
      console.error("Failed to update branding:", error);
      // Error is already handled in the context with toast
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewLogo(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadLogo(logoFile);
      setPreviewLogo(logoUrl);
      setLogoFile(null);
      // Clear the file input
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("Failed to upload logo:", error);
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Organization Branding</h2>
        <p className="text-muted-foreground">
          Customize your organization's branding including logo and colors.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Organization Logo</h3>
            
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 border border-input bg-background rounded-md h-32 w-32 flex items-center justify-center overflow-hidden">
                {previewLogo ? (
                  <img 
                    src={previewLogo} 
                    alt="Organization Logo" 
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Image className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a logo to display in your invoices and client portal.
                  </p>
                  <div className="flex items-center space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={loading || uploadingLogo}
                      className="relative"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="sr-only"
                      />
                    </Button>
                    
                    {logoFile && (
                      <Button 
                        type="button" 
                        onClick={handleLogoUpload}
                        disabled={loading || uploadingLogo}
                      >
                        {uploadingLogo ? "Uploading..." : "Upload Logo"}
                      </Button>
                    )}
                  </div>
                </div>
                
                {logoFile && (
                  <p className="text-sm">
                    Selected file: <span className="font-medium">{logoFile.name}</span>
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Recommended size: 512x512 pixels. Max file size: 2MB.
                  Supported formats: JPG, PNG, SVG.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Brand Color</h3>
                
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="h-9 w-9 rounded-md border border-input"
                          style={{ backgroundColor: field.value }}
                        />
                        <FormControl>
                          <Input 
                            placeholder="#6366F1" 
                            {...field} 
                            disabled={loading}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <p className="text-xs text-muted-foreground mt-2">
                  This color will be used as your primary brand color throughout the application.
                </p>
              </div>
              
              <Button type="submit" className="mt-4" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default OrganizationBrandingForm;
