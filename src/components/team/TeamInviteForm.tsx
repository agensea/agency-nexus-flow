
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
      // Check for existing pending invites
      const existingInvitesQuery = await supabase
        .from("invites")
        .select("*")
        .eq("email", values.email)
        .eq("organization_id", organization.id)
        .eq("status", "pending");

      if (existingInvitesQuery.error) throw existingInvitesQuery.error;

      const existingInvites = existingInvitesQuery.data;
      if (existingInvites && existingInvites.length > 0) {
        toast.error("This email has already been invited");
        setLoading(false);
        return;
      }

      // Check if the user already exists
      const profilesQuery = await supabase
        .from("profiles")
        .select("id")
        .eq("email", values.email);

      if (profilesQuery.error) throw profilesQuery.error;

      const profiles = profilesQuery.data;
      if (profiles && profiles.length > 0) {
        const existingUserId = profiles[0].id;

        // Check if the user is already a team member
        const membersQuery = await supabase
          .from("team_members")
          .select("id, status")
          .eq("user_id", existingUserId)
          .eq("organization_id", organization.id);

        if (membersQuery.error) throw membersQuery.error;

        const members = membersQuery.data;
        const activeMembers = members.filter(m => m.status === "active") || [];
        if (activeMembers.length > 0) {
          toast.error("This user is already a team member");
          setLoading(false);
          return;
        }
      }

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

      const createInviteQuery = await supabase
        .from("invites")
        .insert(inviteData)
        .select();

      if (createInviteQuery.error) throw createInviteQuery.error;
      
      const createdInvites = createInviteQuery.data;
      if (!createdInvites || createdInvites.length === 0) {
        throw new Error("Failed to create invitation");
      }

      const createdInvite = createdInvites[0];

      const sendInviteQuery = await supabase.functions.invoke("send-invite", {
        body: { inviteId: createdInvite.id },
      });

      if (sendInviteQuery.error) throw sendInviteQuery.error;

      toast.success(`Invitation sent to ${values.email}`);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form control={form.control}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
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
          control={form.control}
          name="email"
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
          control={form.control}
          name="department"
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
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
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
