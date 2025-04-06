
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Invite } from "@/types";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface TeamInvitesProps {
  organization: any;
  userRole?: string | null;
}

const TeamInvites: React.FC<TeamInvitesProps> = ({ organization, userRole }) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user has admin privileges
  const isAdminOrOwner = userRole === "admin" || userRole === "owner";

  useEffect(() => {
    fetchInvites();
  }, [organization.id]);

  const fetchInvites = async () => {
    if (!organization) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("status", "pending");

      if (error) throw error;

      // Map the data to the correct Invite type to ensure role compatibility
      const mappedInvites: Invite[] = (data || []).map(invite => ({
        ...invite,
        // Ensure the role matches the expected union type in the Invite interface
        role: mapDatabaseRoleToInviteRole(invite.role),
      }));

      setInvites(mappedInvites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast.error("Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to ensure role matches expected type
  const mapDatabaseRoleToInviteRole = (role: string): "admin" | "member" | "client" => {
    if (role === "admin" || role === "member" || role === "client") {
      return role as "admin" | "member" | "client";
    }
    // Default to member if we receive an unexpected role
    console.warn(`Unexpected role received from database: ${role}`);
    return "member";
  };

  const handleResendInvite = async (inviteId: string) => {
    if (!isAdminOrOwner) return;
    
    try {
      const { error } = await supabase.functions.invoke("send-invite", {
        body: { inviteId },
      });

      if (error) throw error;

      toast.success("Invitation resent successfully");
    } catch (error) {
      console.error("Error resending invite:", error);
      toast.error("Failed to resend invitation");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!isAdminOrOwner) return;
    
    try {
      const { error } = await supabase
        .from("invites")
        .update({ status: "revoked" })
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Invitation revoked successfully");
      fetchInvites(); // Refresh the list
    } catch (error) {
      console.error("Error revoking invite:", error);
      toast.error("Failed to revoke invitation");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No pending invitations
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Pending Invitations ({invites.length})</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invitee</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invited</TableHead>
            {isAdminOrOwner && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {invite.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{invite.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{invite.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {invite.role}
                </Badge>
              </TableCell>
              <TableCell>{invite.department || "-"}</TableCell>
              <TableCell>
                <Badge className="capitalize bg-yellow-500">
                  {invite.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(invite.invited_at).toLocaleDateString()}
              </TableCell>
              {isAdminOrOwner && (
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendInvite(invite.id)}
                  >
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRevokeInvite(invite.id)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamInvites;
