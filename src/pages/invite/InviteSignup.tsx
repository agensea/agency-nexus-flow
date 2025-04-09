
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Invite } from "@/types";

interface InviteData extends Invite {
  organization: {
    name: string;
    logo?: string | null;
  };
  inviter?: {
    name: string;
  } | null;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

const InviteSignup: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      try {
        console.log("Processing invite with token:", token);
        
        // Try to exchange the token for a session first
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(token);
          
          if (sessionError) {
            console.error("Error exchanging token for session:", sessionError);
            // Continue to validate the invite even if session exchange fails
          } else if (sessionData && sessionData.session) {
            console.log("Successfully exchanged token for session");
          }
        } catch (exchangeError) {
          console.error("Failed to exchange token:", exchangeError);
          // Continue to check the invite even if token exchange fails
        }

        // Check if the invite exists and is valid
        const { data: inviteData, error: inviteError } = await supabase
          .from("invites")
          .select("*, organization:organizations(name, logo), inviter:profiles(name)")
          .eq("token", token)
          .single();

        if (inviteError || !inviteData) {
          console.error("Invite not found:", inviteError);
          setError("Invitation not found or has expired");
          setLoading(false);
          return;
        }

        console.log("Found invite data:", inviteData);

        // Convert inviter to match our expected type
        let processedInviter = null;
        if (inviteData.inviter && 
            typeof inviteData.inviter === 'object') {
          // Safely check for the name property
          const inviterObject = inviteData.inviter as Record<string, unknown>;
          if (inviterObject && 'name' in inviterObject) {
            processedInviter = { name: inviterObject.name as string };
          }
        }

        const typedInvite: InviteData = {
          ...inviteData,
          id: inviteData.id,
          email: inviteData.email,
          name: inviteData.name || null,
          department: inviteData.department || null,
          organization_id: inviteData.organization_id,
          role: inviteData.role as 'admin' | 'member' | 'client',
          invited_by: inviteData.invited_by,
          invited_at: inviteData.invited_at,
          status: inviteData.status as 'pending' | 'accepted' | 'declined' | 'revoked',
          token: inviteData.token,
          expires_at: inviteData.expires_at,
          created_at: inviteData.created_at,
          updated_at: inviteData.updated_at,
          organization: inviteData.organization,
          inviter: processedInviter
        };

        if (typedInvite.status !== "pending") {
          setError(`This invitation has already been ${typedInvite.status}`);
          setLoading(false);
          return;
        }

        const now = new Date();
        const expiryDate = new Date(typedInvite.expires_at);
        if (now > expiryDate) {
          setError("This invitation has expired");
          setLoading(false);
          return;
        }

        setInvite(typedInvite);
        setOrganization(typedInvite.organization);
        
        if (typedInvite.name) {
          form.setValue("name", typedInvite.name);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error validating invite:", error);
        setError("An error occurred while validating the invitation");
        setLoading(false);
      }
    };

    validateInvite();
  }, [token, form]);

  const onSubmit = async (values: FormValues) => {
    if (!invite) return;

    setSigningUp(true);
    try {
      console.log("Accepting invite and setting up profile with name:", values.name);
      
      // Check if user is already signed in from token exchange
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If not signed in, we need to create an account
        console.log("No active session, creating user account");
        
        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: invite.email,
          password: values.password,
          options: {
            data: {
              name: values.name,
              phone: values.phone || null,
              department: invite.department || null,
              role: invite.role
            },
          },
        });

        if (userError) {
          console.error("Error creating user:", userError);
          throw userError;
        }
        
        if (!userData.user) {
          // Email confirmation might be required
          toast.info("Please check your email for verification link");
          navigate("/auth/verification-sent");
          return;
        }
        
        // Update user data
        await supabase.auth.updateUser({
          password: values.password,
          data: {
            name: values.name,
            phone: values.phone || null,
            department: invite.department || null,
            role: invite.role
          }
        });
        
        await acceptInvite(userData.user.id);
      } else {
        // Already signed in from token exchange, just update user data
        console.log("User is signed in, updating profile");
        
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          password: values.password,
          data: {
            name: values.name,
            phone: values.phone || null,
            department: invite.department || null,
            role: invite.role
          }
        });
        
        if (updateError) {
          console.error("Error updating user:", updateError);
          throw updateError;
        }
        
        if (updateData.user) {
          await acceptInvite(updateData.user.id);
        }
      }
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast.error(error.message || "Failed to accept invitation");
      setSigningUp(false);
    }
  };

  const acceptInvite = async (userId: string) => {
    try {
      console.log("Accepting invite for user:", userId, "to organization:", invite!.organization_id);
      
      // Mark the invite as accepted
      const { error: updateInviteError } = await supabase
        .from("invites")
        .update({ status: "accepted" })
        .eq("id", invite!.id);

      if (updateInviteError) {
        console.error("Error updating invite status:", updateInviteError);
        throw updateInviteError;
      }

      // Create team member entry
      const { error: createMemberError } = await supabase
        .from("team_members")
        .insert({
          user_id: userId,
          organization_id: invite!.organization_id,
          role: invite!.role,
          invited_by: invite!.invited_by,
          joined_at: new Date().toISOString(),
          status: "active"
        });

      if (createMemberError) {
        console.error("Error creating team member:", createMemberError);
        throw createMemberError;
      }

      // Update profile
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          name: form.getValues().name,
          phone: form.getValues().phone || null,
          department: invite!.department || null,
          role: invite!.role
        })
        .eq("id", userId);

      if (updateProfileError) {
        console.error("Error updating profile:", updateProfileError);
        throw updateProfileError;
      }

      toast.success("You've successfully joined the organization!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Helmet>
          <title>Invalid Invitation</title>
        </Helmet>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/auth/login")}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Helmet>
        <title>Join {organization?.name || "Organization"}</title>
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {organization?.logo && (
            <div className="flex justify-center mb-4">
              <img 
                src={organization.logo} 
                alt={organization.name} 
                className="h-12 w-auto"
              />
            </div>
          )}
          <CardTitle>Join {organization?.name}</CardTitle>
          <CardDescription>
            You've been invited to join {organization?.name}. Please complete your account setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} disabled={signingUp} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {invite && (
                <div className="space-y-1.5">
                  <label className="font-medium text-sm">Email</label>
                  <Input 
                    value={invite.email} 
                    disabled={true} 
                    className="bg-gray-100 border border-gray-300"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll sign in with this email address
                  </p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} disabled={signingUp} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Create a password" 
                        {...field} 
                        disabled={signingUp}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your password" 
                        {...field} 
                        disabled={signingUp}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={signingUp}
              >
                {signingUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Join Organization
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteSignup;
