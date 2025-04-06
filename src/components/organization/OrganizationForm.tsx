
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Organization name must be at least 2 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

const OrganizationForm: React.FC = () => {
  const { createOrganization, loading } = useOrganization();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createOrganization(values.name);
      toast.success("Organization created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Organization creation error:", error);
      toast.error(error.message || "Failed to create organization. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Create your organization</h2>
          <p className="text-muted-foreground">
            This is where all your agency work will happen. You can invite team members later.
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your Agency Name" 
                  {...field} 
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Organization"}
        </Button>
      </form>
    </Form>
  );
};

export default OrganizationForm;
