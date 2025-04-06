
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // The verification is handled automatically by Supabase
        // We just need to check if it was successful
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Verification error:", error);
          setStatus("error");
          return;
        }
        
        if (data.session) {
          setStatus("success");
          // Wait a moment before redirecting to give the user time to see the success message
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
      }
    };

    handleEmailVerification();
  }, [navigate]);

  return (
    <AuthLayout 
      title="Email Verification" 
      subtitle="Confirming your email address"
    >
      <div className="space-y-6 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Verifying your email address...</p>
          </div>
        )}
        
        {status === "success" && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your email has been verified successfully. You'll be redirected to the dashboard shortly.
            </AlertDescription>
          </Alert>
        )}
        
        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>
              We couldn't verify your email. The link may have expired or been used already.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Button 
            onClick={() => navigate("/auth/login")} 
            variant="outline" 
            className="w-full"
          >
            Back to login
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;
