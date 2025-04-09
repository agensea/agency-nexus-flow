
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  department: z.string().optional(),
  role: z.enum(["admin", "member"]),
});

type FormValues = z.infer<typeof formSchema>;

const TeamInviteForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      role: "member",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!organization || !user) return;

    setLoading(true);
    try {
      console.log("Checking for existing invites");
      
      // Check for existing invites with this email
      const { data: existingInvites, error: existingInvitesError } = await supabase
        .from("invites")
        .select("id")
        .eq("email", values.email)
        .eq("organization_id", organization.id)
        .eq("status", "pending");

      if (existingInvitesError) {
        console.error("Error checking existing invites:", existingInvitesError);
        throw existingInvitesError;
      }

      // Simple check if there are any entries
      if (existingInvites && existingInvites.length > 0) {
        toast.error("This email has already been invited");
        setLoading(false);
        return;
      }

      console.log("Checking for existing profiles");
      
      // Check if the user already exists in the profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", values.email);

      if (profilesError) {
        console.error("Error checking profiles:", profilesError);
        throw profilesError;
      }

      let profileId = null;

      if (profiles && profiles.length > 0) {
        profileId = profiles[0].id;

        console.log("Found existing profile, checking team membership");
        
        // Check if the user is already a member of this organization
        const { data: members, error: membersError } = await supabase
          .from("team_members")
          .select("id, status")
          .eq("user_id", profileId)
          .eq("organization_id", organization.id);

        if (membersError) {
          console.error("Error checking team members:", membersError);
          throw membersError;
        }

        // Simple check if there are active members
        const isAlreadyMember = members && 
                               members.some(m => m.status === "active");
        
        if (isAlreadyMember) {
          toast.error("This user is already a team member");
          setLoading(false);
          return;
        }
      }

      console.log("Creating invite token");
      
      // Create a new invite
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const inviteData = {
        email: values.email,
        name: values.name,
        department: values.department || null,
        organization_id: organization.id,
        role: values.role,
        invited_by: user.id,
        status: "pending",
        token,
        expires_at: expiresAt.toISOString(),
      };

      console.log("Saving invite to database");
      
      const { data: createdInvites, error: createInviteError } = await supabase
        .from("invites")
        .insert(inviteData)
        .select();

      if (createInviteError) {
        console.error("Error creating invite:", createInviteError);
        throw createInviteError;
      }

      if (!createdInvites || createdInvites.length === 0) {
        throw new Error("Failed to create invitation");
      }
      
      const createdInvite = createdInvites[0];

      console.log("Sending invite via edge function");
      
      // Send the invite
      const { error: sendInviteError } = await supabase.functions.invoke("send-invite", {
        body: { inviteId: createdInvite.id },
      });

      if (sendInviteError) {
        console.error("Error sending invite:", sendInviteError);
        throw sendInviteError;
      }

      toast.success(`Invitation sent to ${values.email}`);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="teammate@example.com"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="department"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Marketing" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="role"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                disabled={loading}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Team Member</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Invite...
              </>
            ) : (
              "Send Invite"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamInviteForm;
