
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

// Define simpler interfaces to avoid deep type instantiation
interface ProfileResponse {
  data: { id: string } | null;
  error: any;
}

interface TeamMemberResponse {
  data: { id: string; status: string } | null;
  error: any;
}

interface InviteResponse {
  data: { id: string } | null;
  error: any;
}

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
      const existingInviteResponse = await supabase
        .from("invites")
        .select("*")
        .eq("email", values.email)
        .eq("organization_id", organization.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInviteResponse.error && existingInviteResponse.error.code !== "PGRST116") {
        throw existingInviteResponse.error;
      }

      if (existingInviteResponse.data) {
        toast.error("This email has already been invited");
        setLoading(false);
        return;
      }

      // Check if user already exists
      const profileResponse: ProfileResponse = await supabase
        .from("profiles")
        .select("id")
        .eq("email", values.email)
        .maybeSingle();

      if (profileResponse.error && profileResponse.error.code !== "PGRST116") {
        throw profileResponse.error;
      }

      // If user exists, check if they're already a team member
      let existingUser = null;
      if (profileResponse.data) {
        existingUser = { id: profileResponse.data.id };

        const memberResponse: TeamMemberResponse = await supabase
          .from("team_members")
          .select("id, status")
          .eq("user_id", existingUser.id)
          .eq("organization_id", organization.id)
          .maybeSingle();

        if (memberResponse.error && memberResponse.error.code !== "PGRST116") {
          throw memberResponse.error;
        }

        if (memberResponse.data && memberResponse.data.status === "active") {
          toast.error("This user is already a team member");
          setLoading(false);
          return;
        }
      }

      // Create the invite
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const inviteResponse: InviteResponse = await supabase
        .from("invites")
        .insert({
          email: values.email,
          name: values.name,
          department: values.department || null,
          organization_id: organization.id,
          role: values.role,
          invited_by: user.id,
          status: "pending",
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (inviteResponse.error) {
        throw inviteResponse.error;
      }

      // Send the invite email
      const sendResponse = await supabase.functions.invoke("send-invite", {
        body: { inviteId: inviteResponse.data.id },
      });

      if (sendResponse.error) {
        throw sendResponse.error;
      }

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
    <Form {...form}>
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
