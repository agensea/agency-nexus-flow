
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequestBody {
  inviteId: string;
  newToken?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request details
    const { inviteId, newToken } = await req.json() as InviteRequestBody;

    // Create a Supabase client with the project URL and service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the invitation details with organization and inviter data
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select(`
        *,
        organization:organizations(name, logo),
        inviter:profiles(name)
      `)
      .eq("id", inviteId)
      .single();

    if (inviteError) {
      throw new Error(`Error fetching invite: ${inviteError.message}`);
    }

    // If a new token was provided, update the invite record
    if (newToken) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { error: updateError } = await supabaseAdmin
        .from("invites")
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", inviteId);

      if (updateError) {
        throw new Error(`Error updating invite: ${updateError.message}`);
      }

      invite.token = newToken;
    }

    // Construct the invitation URL
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invite.token}`;

    // Log the invite details (in a real implementation, we'd send an actual email)
    console.log("Sending invite email:", {
      to: invite.email,
      subject: `You've been invited to join ${invite.organization.name}`,
      inviteUrl: inviteUrl,
      organizationName: invite.organization.name,
      inviterName: invite.inviter?.name || "Someone",
      recipientName: invite.name || "",
      department: invite.department || "",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email sent"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        status: 400,
      }
    );
  }
});
