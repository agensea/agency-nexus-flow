
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UserCheck, 
  UserCog, 
  UserMinus, 
  MoreVertical,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  user_id: string;
  organization_id: string;
  profile_id: string;
  role: string;
  status: string;
  joined_at: string;
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
    department: string | null;
    email: string;
  }
}

interface TeamMembersProps {
  organization: any;
  userRole?: string | null;
}

const TeamMembers: React.FC<TeamMembersProps> = ({ organization, userRole }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [confirmRoleChangeOpen, setConfirmRoleChangeOpen] = useState(false);
  const [memberToUpdate, setMemberToUpdate] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  
  // Check if user has admin privileges
  const isAdminOrOwner = userRole === "admin" || userRole === "owner";

  useEffect(() => {
    fetchTeamMembers();
  }, [organization.id]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      // Fetch team members with profile information using the new relationship
      const { data, error } = await supabase
        .from("team_members")
        .select(`
          *,
          profiles(id, name, avatar_url, department, email)
        `)
        .eq("organization_id", organization.id)
        .eq("status", "active");

      if (error) throw error;

      // Properly map the data
      const mappedMembers = data?.map((member: any) => ({
        ...member,
        profiles: member.profiles || { 
          id: null,
          name: "Unknown User", 
          avatar_url: null, 
          department: null,
          email: "unknown@example.com" 
        }
      })) || [];

      setMembers(mappedMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !isAdminOrOwner) return;

    // Don't allow removing the owner
    if (memberToRemove.role === "owner") {
      toast.error("The organization owner cannot be removed");
      setConfirmRemoveOpen(false);
      setMemberToRemove(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("team_members")
        .update({ status: "inactive" })
        .eq("id", memberToRemove.id);

      if (error) throw error;

      toast.success("Team member removed successfully");
      fetchTeamMembers();
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    } finally {
      setConfirmRemoveOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleRoleChange = async () => {
    if (!memberToUpdate || !newRole || !isAdminOrOwner) return;

    // Don't allow changing the owner's role
    if (memberToUpdate.role === "owner") {
      toast.error("The organization owner's role cannot be changed");
      setConfirmRoleChangeOpen(false);
      setMemberToUpdate(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", memberToUpdate.id);

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setConfirmRoleChangeOpen(false);
      setMemberToUpdate(null);
      setNewRole("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
        <h3 className="text-lg font-medium">Team Members ({members.length})</h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            {isAdminOrOwner && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdminOrOwner ? 5 : 4} className="text-center py-6 text-muted-foreground">
                No team members found
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(member.profiles?.name || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.profiles?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles?.email || ""}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{member.profiles?.department || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {member.role === "owner" && (
                      <UserCheck className="h-4 w-4 mr-1 text-green-500" />
                    )}
                    {member.role === "admin" && (
                      <UserCog className="h-4 w-4 mr-1 text-blue-500" />
                    )}
                    <span className="capitalize">{member.role}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {member.joined_at 
                    ? format(new Date(member.joined_at), "MMM d, yyyy") 
                    : "-"}
                </TableCell>
                {isAdminOrOwner && (
                  <TableCell className="text-right">
                    {member.role !== "owner" || userRole === "owner" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role !== "owner" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setMemberToUpdate(member);
                                  setNewRole(member.role === "admin" ? "member" : "admin");
                                  setConfirmRoleChangeOpen(true);
                                }}
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Change to {member.role === "admin" ? "Member" : "Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setMemberToRemove(member);
                                  setConfirmRemoveOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No actions
                      </span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Remove Member Dialog - only shown for admin/owner */}
      {isAdminOrOwner && (
        <>
          <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Team Member</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove {memberToRemove?.profiles?.name} from your organization? 
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmRemoveOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveMember}
                >
                  Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Change Role Dialog */}
          <Dialog open={confirmRoleChangeOpen} onOpenChange={setConfirmRoleChangeOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Role</DialogTitle>
                <DialogDescription>
                  Are you sure you want to change {memberToUpdate?.profiles?.name}'s role from{" "}
                  {memberToUpdate?.role} to {newRole}?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select
                  value={newRole}
                  onValueChange={setNewRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmRoleChangeOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRoleChange}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default TeamMembers;
