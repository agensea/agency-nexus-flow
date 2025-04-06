
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProfileForm from "@/components/profile/ProfileForm";
import { Card, CardContent } from "@/components/ui/card";

const Profile = () => {
  const { user, loading } = useAuth();

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
