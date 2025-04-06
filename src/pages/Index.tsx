
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";

const Index: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth/login");
      } else if (!orgLoading) {
        if (organization) {
          navigate("/dashboard");
        } else {
          navigate("/organization/setup");
        }
      }
    }
  }, [user, authLoading, organization, orgLoading, navigate]);

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
