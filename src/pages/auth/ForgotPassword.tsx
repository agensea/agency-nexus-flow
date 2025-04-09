
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
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
import AuthLayout from "@/components/layouts/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset, loading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null);
    try {
      await requestPasswordReset(values.email);
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      console.log("Password reset email requested for:", values.email);
    } catch (error: any) {
      console.error("Password reset request error:", error);
      setErrorMessage(error.message || "Failed to send reset link. Please try again later.");
      // Error is already handled in the context with toast
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout 
        title="Check your email"
        subtitle={`We've sent a password reset link to ${submittedEmail}`}
      >
        <div className="space-y-6 text-center">
          <Alert className="bg-primary/10 border-primary/20 text-left">
            <div className="flex items-start gap-3">
              <InfoIcon className="h-5 w-5 text-primary mt-0.5" />
              <AlertDescription className="text-sm text-foreground">
                Click the link in the email to reset your password. The link will expire in 24 hours.
                <br /><br />
                If you don't see the email, please check your spam folder. It may take a few minutes to arrive.
              </AlertDescription>
            </div>
          </Alert>
          
          <div className="space-y-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => onSubmit({ email: submittedEmail })}
            >
              Resend reset link
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/login">
                Back to login
              </Link>
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Reset your password" 
      subtitle="Enter your email and we'll send you a reset link"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="your.email@example.com" 
                    {...field} 
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Sending reset link..." : "Send reset link"}
          </Button>
          
          <div className="text-center">
            <Link to="/auth/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default ForgotPassword;
