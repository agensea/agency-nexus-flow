import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, RefreshCw, Send, X } from "lucide-react";
import { format, isPast } from "date-fns";
import { Invite } from "@/types";

interface TeamInvitesProps {
  organization: any;
}

const TeamInvites: React.FC<TeamInvitesProps> = ({ organization }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
  const [inviteToRevoke, setInviteToRevoke] = useState<Invite | null>(null);
  const [confirmResendOpen, setConfirmResendOpen] = useState(false);
  const [inviteToResend, setInviteToResend] = useState<Invite | null>(null);
  const [resending, setResending] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, [organization.id]);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .eq("organization_id", organization.id)
        .order("invited_at", { ascending: false });

      if (error) throw error;
      setInvites(data as unknown as Invite[]);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvite = async () => {
    if (!inviteToRevoke) return;
    
    setRevoking(true);
    try {
      const { error } = await supabase
        .from("invites")
        .update({ status: "revoked" })
        .eq("id", inviteToRevoke.id);

      if (error) throw error;

      toast.success("Invitation revoked successfully");
      fetchInvites();
    } catch (error) {
      console.error("Error revoking invite:", error);
      toast.error("Failed to revoke invitation");
    } finally {
      setRevoking(false);
      setConfirmRevokeOpen(false);
      setInviteToRevoke(null);
    }
  };

  const handleResendInvite = async () => {
    if (!inviteToResend) return;
    
    setResending(true);
    try {
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      const { error } = await supabase
        .from("invites")
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
          status: "pending"
        })
        .eq("id", inviteToResend.id);

      if (error) throw error;

      const { error: sendError } = await supabase.functions.invoke('send-invite', {
        body: { 
          inviteId: inviteToResend.id,
          newToken: newToken 
        }
      });

      if (sendError) throw sendError;

      toast.success("Invitation resent successfully");
      fetchInvites();
    } catch (error) {
      console.error("Error resending invite:", error);
      toast.error("Failed to resend invitation");
    } finally {
      setResending(false);
      setConfirmResendOpen(false);
      setInviteToResend(null);
    }
  };

  const isExpired = (expiresAt: string) => {
    return isPast(new Date(expiresAt));
  };

  const getBadgeVariant = (status: string, expires_at: string) => {
    if (status === "accepted") return "success";
    if (status === "revoked") return "destructive";
    if (isExpired(expires_at)) return "outline";
    return "default";
  };

  const getStatusText = (status: string, expires_at: string) => {
    if (status === "accepted") return "Accepted";
    if (status === "revoked") return "Revoked";
    if (isExpired(expires_at)) return "Expired";
    return "Pending";
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Pending Invitations ({invites.filter(i => i.status === "pending" && !isExpired(i.expires_at)).length})</h3>
        <Button variant="outline" size="sm" onClick={fetchInvites}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invited</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                No invitations found
              </TableCell>
            </TableRow>
          ) : (
            invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>{invite.email}</TableCell>
                <TableCell>{invite.name || "-"}</TableCell>
                <TableCell>{invite.department || "-"}</TableCell>
                <TableCell className="capitalize">{invite.role}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(invite.status, invite.expires_at) as any}>
                    {getStatusText(invite.status, invite.expires_at)}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(invite.invited_at), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  {isExpired(invite.expires_at) ? (
                    <span className="text-muted-foreground">Expired</span>
                  ) : (
                    format(new Date(invite.expires_at), "MMM d, yyyy")
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {invite.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Resend invite"
                        onClick={() => {
                          setInviteToResend(invite);
                          setConfirmResendOpen(true);
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Revoke invite"
                        onClick={() => {
                          setInviteToRevoke(invite);
                          setConfirmRevokeOpen(true);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={confirmRevokeOpen} onOpenChange={setConfirmRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the invitation sent to {inviteToRevoke?.email}?
              They will no longer be able to use this invite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmRevokeOpen(false)}
              disabled={revoking}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRevokeInvite}
              disabled={revoking}
            >
              {revoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Invite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmResendOpen} onOpenChange={setConfirmResendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Invitation</DialogTitle>
            <DialogDescription>
              This will generate a new invitation link and send it to {inviteToResend?.email}.
              The previous link will no longer work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmResendOpen(false)}
              disabled={resending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResendInvite}
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Invite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamInvites;
