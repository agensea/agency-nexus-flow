
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProfileForm from "@/components/profile/ProfileForm";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user, loading } = useAuth();

  // When profile page loads, sync the user's role in profile with team_members
  useEffect(() => {
    const syncUserRole = async () => {
      if (!user) return;

      try {
        // Get the team member data for the user
        const { data: teamMemberData, error: teamMemberError } = await supabase
          .from("team_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (teamMemberError && teamMemberError.code !== 'PGRST116') {
          console.error("Error fetching team member data:", teamMemberError);
          return;
        }

        // If the user has a team member role, update their profile to match
        if (teamMemberData) {
          // Get the current profile role
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile data:", profileError);
            return;
          }

          // If roles don't match, update the profile role to match team member role
          if (profileData.role !== teamMemberData.role) {
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ role: teamMemberData.role })
              .eq("id", user.id);

            if (updateError) {
              console.error("Error updating profile role:", updateError);
            } else {
              console.log("Profile role synchronized with team member role");
            }
          }
        }
      } catch (error) {
        console.error("Error synchronizing user role:", error);
      }
    };

    syncUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page if not authenticated
    window.location.href = "/auth/login";
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Your Profile | Dashboard</title>
      </Helmet>
      <DashboardLayout>
        <div className="container max-w-4xl py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your personal information and profile settings
            </p>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <ProfileForm />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Profile;
