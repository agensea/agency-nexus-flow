
import React from "react";
import { useLocation, Link } from "react-router-dom";
import AuthLayout from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";

const VerificationSent: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || "your email";

  return (
    <AuthLayout 
      title="Check your email"
      subtitle={`We've sent a verification link to ${email}`}
    >
      <div className="space-y-6 text-center">
        <p className="text-muted-foreground">
          Click the link in the email to verify your account. If you don't see the email, check your spam folder.
        </p>
        
        <div className="space-y-2">
          <Button asChild variant="outline" className="w-full">
            <Link to="/auth/login">
              Back to login
            </Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerificationSent;
