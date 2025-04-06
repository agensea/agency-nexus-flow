
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import TeamMembers from "@/components/team/TeamMembers";
import TeamInvites from "@/components/team/TeamInvites";
import TeamInviteForm from "@/components/team/TeamInviteForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TeamManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { organization, members, loading } = useOrganization();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("members");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if the user has admin permissions
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !organization) return;

      try {
        const { data, error } = await supabase
          .from("team_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("organization_id", organization.id)
          .eq("status", "active")
          .single();

        if (error) throw error;

        if (data && (data.role === "admin" || data.role === "owner")) {
          setIsAdmin(true);
        } else {
          // Redirect non-admin users
          toast.error("You don't have permission to access this page");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("An error occurred while verifying your permissions");
        navigate("/dashboard");
      }
    };

    checkAdminStatus();
  }, [user, organization, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !organization || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Helmet>
        <title>Team Management | {organization.name}</title>
      </Helmet>
      <DashboardLayout>
        <div className="container max-w-6xl py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your organization's team members and invitations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Invite Form */}
            <Card className="md:col-span-1">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Invite New Member</h2>
                <TeamInviteForm />
              </CardContent>
            </Card>

            {/* Team Members & Invites Tabs */}
            <Card className="md:col-span-2">
              <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full border-b rounded-none px-6 pt-2">
                  <TabsTrigger value="members">Team Members</TabsTrigger>
                  <TabsTrigger value="invites">Pending Invites</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members" className="p-6">
                  <TeamMembers organization={organization} />
                </TabsContent>
                
                <TabsContent value="invites" className="p-6">
                  <TeamInvites organization={organization} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default TeamManagementPage;
