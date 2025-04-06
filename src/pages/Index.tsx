
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";

const Index: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading, refreshOrganization } = useOrganization();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Ensure we're not in a redirect loop and only refresh organization once
    if (user && !orgLoading && !isRedirecting) {
      // Force a refresh to ensure we have the latest data
      refreshOrganization();
    }
  }, [user, orgLoading, refreshOrganization, isRedirecting]);

  useEffect(() => {
    if (!authLoading && !isRedirecting) {
      if (!user) {
        setIsRedirecting(true);
        navigate("/auth/login");
      } else if (!orgLoading) {
        if (organization) {
          setIsRedirecting(true);
          navigate("/dashboard");
        } else {
          setIsRedirecting(true);
          navigate("/organization/setup");
        }
      }
    }
  }, [user, authLoading, organization, orgLoading, navigate, isRedirecting]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gradient">AgencyOS</h1>
        <p className="text-xl text-muted-foreground">Loading your workspace...</p>
      </div>
    </div>
  );
};

export default Index;
