
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OrganizationForm from "@/components/organization/OrganizationForm";
import { Card, CardContent } from "@/components/ui/card";

const OrganizationSetup: React.FC = () => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  // Check if organization already exists
  useEffect(() => {
    if (organization) {
      navigate("/dashboard");
    }
  }, [organization, navigate]);

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Complete Your Setup</h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your agency to get the most out of AgencyOS.
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <OrganizationForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationSetup;
