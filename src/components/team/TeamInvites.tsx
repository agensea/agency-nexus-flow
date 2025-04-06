import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

interface Invite {
  id: string;
  email: string;
  name: string | null;
  department: string | null;
  organization_id: string;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
}

interface Organization {
  id: string;
}

interface TeamInvitesProps {
  organization: Organization;
  userRole?: string | null;
}

const TeamInvites: React.FC<TeamInvitesProps> = ({ organization, userRole }) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

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

      setInvites(data || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast.error("Failed to load invites");
    } finally {
      setLoading(false);
    }
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
      fetchInvites();
    } catch (error) {
      console.error("Error revoking invite:", error);
      toast.error("Failed to revoke invitation");
    }
  };

  const renderInviteRow = (invite: Invite) => (
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
        <Badge className="capitalize bg-yellow-500">{invite.status}</Badge>
      </TableCell>
      <TableCell>{new Date(invite.invited_at).toLocaleDateString()}</TableCell>
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
  );

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
        <TableBody>{invites.map((invite) => renderInviteRow(invite))}</TableBody>
      </Table>
    </div>
  );
};

export default TeamInvites;
