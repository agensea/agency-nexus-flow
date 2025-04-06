
import React, { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreVertical, 
  UserMinus, 
  UserCog, 
  ArrowUpDown 
} from "lucide-react";
import { toast } from "sonner";

const OrganizationTeamMembers: React.FC = () => {
  const { user } = useAuth();
  const { members, invites, inviteTeamMember, revokeInvite, removeMember, updateMemberRole, loading } = useOrganization();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  
  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    try {
      await inviteTeamMember(inviteEmail, inviteRole);
      setInviteEmail("");
      setIsInviteOpen(false);
    } catch (error) {
      console.error("Failed to invite team member:", error);
    }
  };
  
  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      setMemberToRemove(null);
    } catch (error) {
      console.error("Failed to remove team member:", error);
    }
  };
  
  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeInvite(inviteId);
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
    }
  };
  
  const handleUpdateRole = async (memberId: string, role: "admin" | "member") => {
    try {
      await updateMemberRole(memberId, role);
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Team Members</h2>
          <p className="text-muted-foreground mt-1">
            Manage who has access to your organization.
          </p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as "admin" | "member")}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Admins can manage team members and organization settings.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInvite} 
                disabled={!inviteEmail || loading}
              >
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader className="px-6">
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Active Members ({members.length})
          </CardTitle>
          <CardDescription>
            People who are currently part of your organization.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    Role
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(member.userId)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.userId}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize font-medium">
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                      <span className="capitalize">{member.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(
                              member.id, 
                              member.role === "admin" ? "member" : "admin"
                            )}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Change to {member.role === "admin" ? "Member" : "Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setMemberToRemove(member.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {invites.length > 0 && (
        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-lg flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Pending Invitations ({invites.length})
            </CardTitle>
            <CardDescription>
              People who have been invited but haven't joined yet.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {invite.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{invite.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize font-medium">
                        {invite.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(invite.invitedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Confirmation Dialog for Member Removal */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this team member from your organization? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMemberToRemove(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              disabled={loading}
            >
              {loading ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationTeamMembers;
