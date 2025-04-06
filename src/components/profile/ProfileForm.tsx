
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ProfileAvatar from "./ProfileAvatar";
import { format } from "date-fns";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  phone: z.string().optional(),
  birthdate: z.string().optional(),
  department: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Define the expected profile structure
interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  phone?: string | null;
  birthdate?: string | null;
  department?: string | null;
  created_at: string;
  updated_at: string;
}

const ProfileForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string>("member");
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      birthdate: "",
      department: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        // Get team membership data
        const { data: teamMemberData, error: teamMemberError } = await supabase
          .from("team_members")
          .select("role, organization_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        // If team member data exists, use that role instead of the profile role
        if (teamMemberData) {
          setRole(teamMemberData.role);
          setOrganizationId(teamMemberData.organization_id);
          
          // Update the profile role to match the team member role if they are different
          if (profileData.role !== teamMemberData.role) {
            await supabase
              .from("profiles")
              .update({ role: teamMemberData.role })
              .eq("id", user.id);
          }
        } else {
          setRole(profileData.role || "member");
        }

        // Get user email from auth context since it might not be in the profiles table
        const userEmail = user.email || "";

        if (profileData) {
          const profile = profileData as Profile;
          
          form.reset({
            name: profile.name || "",
            email: userEmail,
            phone: profile.phone || "",
            birthdate: profile.birthdate 
              ? format(new Date(profile.birthdate), "yyyy-MM-dd") 
              : "",
            department: profile.department || "",
          });
          setAvatarUrl(profile.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching profile", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setSaving(true);
      if (!user) return;

      const updates = {
        id: user.id,
        name: values.name,
        phone: values.phone || null,
        birthdate: values.birthdate ? new Date(values.birthdate).toISOString().split('T')[0] : null,
        department: values.department || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);

      if (error) throw error;
      setAvatarUrl(url);
    } catch (error: any) {
      toast.error(error.message || "Error updating avatar URL");
      console.error("Error updating avatar URL:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileAvatar 
        url={avatarUrl} 
        onUpload={handleAvatarUpload} 
        userId={user?.id || ""} 
        name={form.getValues().name || user?.name || ""}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...field} disabled readOnly className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email can only be changed in account settings.
                  </p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birth Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Your department" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Input value={role} disabled readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                {organizationId ? 
                  "Your role is based on your organization membership." :
                  "Your role can only be changed by an organization administrator."}
              </p>
            </FormItem>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ProfileForm;
