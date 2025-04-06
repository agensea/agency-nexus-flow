
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";

const Index: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading, refreshOrganization } = useOrganization();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  // Force refresh organization data when user is authenticated
  useEffect(() => {
    if (user && !orgLoading && !isRedirecting && !refreshAttempted) {
      console.log("Refreshing organization data");
      refreshOrganization();
      setRefreshAttempted(true);
    }
  }, [user, orgLoading, refreshOrganization, isRedirecting, refreshAttempted]);

  // Handle navigation based on authentication and organization state
  useEffect(() => {
    if (!authLoading && !orgLoading && !isRedirecting) {
      if (!user) {
        console.log("No user, redirecting to login");
        setIsRedirecting(true);
        navigate("/auth/login");
      } else if (refreshAttempted) {
        // Check if user is trying to access a specific route
        const intendedPath = sessionStorage.getItem('intendedPath');
        
        if (intendedPath) {
          console.log(`Found intended path: ${intendedPath}, redirecting`);
          sessionStorage.removeItem('intendedPath');
          setIsRedirecting(true);
          navigate(intendedPath);
        } else if (organization) {
          console.log("Organization found, redirecting to dashboard");
          setIsRedirecting(true);
          navigate("/dashboard");
        } else {
          console.log("No organization, redirecting to setup");
          setIsRedirecting(true);
          navigate("/organization/setup");
        }
      }
    }
  }, [user, authLoading, organization, orgLoading, navigate, isRedirecting, refreshAttempted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gradient">AgencyOS</h1>
        <p className="text-xl text-muted-foreground mb-6">Loading your workspace...</p>
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    </div>
  );
};

export default Index;
