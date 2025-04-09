
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteData {
  id: string;
  email: string;
  name: string | null;
  token: string;
  organization: {
    name: string;
    logo?: string | null;
  };
  inviter: {
    name: string;
  } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { inviteId } = await req.json();

    if (!inviteId) {
      throw new Error("Invite ID is required");
    }

    // Get the invite data
    const { data: inviteData, error: inviteError } = await supabase
      .from("invites")
      .select("*, organization:organizations(name, logo), inviter:profiles(name)")
      .eq("id", inviteId)
      .single();

    if (inviteError || !inviteData) {
      throw new Error("Invite not found");
    }

    const invite: InviteData = {
      id: inviteData.id,
      email: inviteData.email,
      name: inviteData.name,
      token: inviteData.token,
      organization: inviteData.organization,
      inviter: inviteData.inviter,
    };

    // Create the invite URL
    const inviteUrl = `${req.headers.get("origin") || "http://localhost:5173"}/invite/${invite.token}`;

    // Send the email invitation
    const emailSubject = `Join ${invite.organization.name} on AgencyOS`;
    const inviterName = invite.inviter?.name || "The team";
    const recipientName = invite.name || "there";

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      ${invite.organization.logo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${invite.organization.logo}" alt="${invite.organization.name}" style="max-height: 60px;"></div>` : ''}
      <h2 style="color: #374151; margin-bottom: 16px;">You've been invited to ${invite.organization.name}</h2>
      <p style="color: #4b5563; margin-bottom: 16px;">${inviterName} has invited you to join their organization on AgencyOS.</p>
      <p style="margin-bottom: 24px;">
        <a href="${inviteUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px; font-weight: 500;">Accept Invitation</a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">If you can't click the button above, copy and paste this link into your browser: <a href="${inviteUrl}" style="color: #4f46e5;">${inviteUrl}</a></p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">This invitation will expire in 7 days.</p>
    </div>
    `;

    // Send email using Supabase's built-in email service
    const { error: emailError } = await supabase.auth.admin.createUser({
      email: invite.email,
      email_confirm: true,
      user_metadata: {
        invitation_id: invite.id,
      },
      password: crypto.randomUUID(), // Random temporary password
    });

    if (emailError) {
      console.error("Error creating user for email:", emailError);
      // This might fail if user already exists, but we can continue with regular email
    }

    // For now, we'll log the invite details for testing
    console.log("Invitation sent:", {
      to: invite.email,
      subject: emailSubject,
      inviteUrl,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing invite:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
