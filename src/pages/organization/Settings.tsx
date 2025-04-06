
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationGeneralForm from "@/components/organization/OrganizationGeneralForm";
import OrganizationBrandingForm from "@/components/organization/OrganizationBrandingForm";
import OrganizationTeamMembers from "@/components/organization/OrganizationTeamMembers";
import { Card } from "@/components/ui/card";

const OrganizationSettings: React.FC = () => {
  const { user } = useAuth();
  const { organization, loading } = useOrganization();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  // Check if user is authenticated
  React.useEffect(() => {
    if (!user) {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  // Check if organization exists
  React.useEffect(() => {
    if (!organization && !loading) {
      navigate("/organization/setup");
    }
  }, [organization, loading, navigate]);

  if (!user || !organization) {
    return null; // Will redirect to login or setup
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization's details, branding, and team members.
          </p>
        </div>
        
        <Card>
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="team">Team Members</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="p-6">
              <OrganizationGeneralForm />
            </TabsContent>
            
            <TabsContent value="branding" className="p-6">
              <OrganizationBrandingForm />
            </TabsContent>
            
            <TabsContent value="team" className="p-6">
              <OrganizationTeamMembers />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationSettings;
