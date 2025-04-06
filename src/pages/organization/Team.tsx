
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet-async";
import { Loader2, ShieldAlert } from "lucide-react";
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Check if the user has proper permissions and fetch their role
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!user || !organization) return;
      setRoleLoading(true);

      try {
        const { data, error } = await supabase
          .from("team_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("organization_id", organization.id)
          .eq("status", "active")
          .single();

        if (error) throw error;

        setUserRole(data.role);

        // If user is not part of this organization at all, redirect them
        if (!data) {
          toast.error("You don't have access to this organization");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking user access:", error);
        toast.error("An error occurred while verifying your access");
        navigate("/dashboard");
      } finally {
        setRoleLoading(false);
      }
    };

    checkUserAccess();
  }, [user, organization, navigate]);

  const isAdminOrOwner = userRole === "admin" || userRole === "owner";

  if (loading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !organization) {
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
            {/* Invite Form - only shown to admins and owners */}
            {isAdminOrOwner ? (
              <Card className="md:col-span-1">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Invite New Member</h2>
                  <TeamInviteForm />
                </CardContent>
              </Card>
            ) : (
              <Card className="md:col-span-1">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
                    <ShieldAlert className="h-12 w-12 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Limited Access</h2>
                    <p className="text-muted-foreground">
                      As a team member, you can view the team but cannot invite new members or make changes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Members & Invites Tabs */}
            <Card className="md:col-span-2">
              <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full border-b rounded-none px-6 pt-2">
                  <TabsTrigger value="members">Team Members</TabsTrigger>
                  <TabsTrigger value="invites">Pending Invites</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members" className="p-6">
                  <TeamMembers organization={organization} userRole={userRole} />
                </TabsContent>
                
                <TabsContent value="invites" className="p-6">
                  <TeamInvites organization={organization} userRole={userRole} />
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
