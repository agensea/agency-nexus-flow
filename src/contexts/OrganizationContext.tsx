
import React, { createContext, useContext, useState, useEffect } from "react";
import { Organization, OrganizationSettings, TeamMember, Invite } from "@/types";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  members: TeamMember[];
  invites: Invite[];
  createOrganization: (name: string) => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  updateSettings: (settings: Partial<OrganizationSettings>) => Promise<void>;
  inviteTeamMember: (email: string, role: "admin" | "member") => Promise<void>;
  revokeInvite: (inviteId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: "admin" | "member") => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

// Mock organization data
const mockOrganizationSettings: OrganizationSettings = {
  allowClientInvites: true,
  allowTeamInvites: true,
  defaultTaskView: "board",
  color: "#6366f1",
};

const mockOrganization: Organization = {
  id: "org1",
  name: "Agency OS",
  createdById: "user1",
  createdAt: new Date(),
  updatedAt: new Date(),
  plan: "free",
  settings: mockOrganizationSettings,
};

const mockTeamMembers: TeamMember[] = [
  {
    id: "member1",
    userId: "user1",
    organizationId: "org1",
    role: "owner",
    invitedBy: "user1",
    invitedAt: new Date(),
    joinedAt: new Date(),
    status: "active",
    permissions: ["all"],
  },
];

const mockInvites: Invite[] = [];

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Load organization data
  useEffect(() => {
    const loadOrganization = async () => {
      if (!user) {
        setOrganization(null);
        setMembers([]);
        setInvites([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // In a real app, we would fetch the organization data from an API
        // Check if user has a saved organization
        const savedOrg = localStorage.getItem("agencyos_organization");
        if (savedOrg) {
          const parsedOrg = JSON.parse(savedOrg);
          setOrganization(parsedOrg);
          
          // Load members and invites
          setMembers(mockTeamMembers);
          setInvites(mockInvites);
        } else {
          // First login, no organization
          setOrganization(null);
        }
      } catch (error) {
        console.error("Failed to load organization:", error);
        toast.error("Failed to load organization data");
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, [user]);

  // Create organization
  const createOrganization = async (name: string) => {
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Create new organization
      const newOrg: Organization = {
        ...mockOrganization,
        id: `org${Date.now()}`,
        name,
        createdById: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Create owner team member
      const newMember: TeamMember = {
        id: `member${Date.now()}`,
        userId: user.id,
        organizationId: newOrg.id,
        role: "owner",
        invitedBy: user.id,
        invitedAt: new Date(),
        joinedAt: new Date(),
        status: "active",
        permissions: ["all"],
      };
      
      // Save to state and localStorage
      setOrganization(newOrg);
      setMembers([newMember]);
      localStorage.setItem("agencyos_organization", JSON.stringify(newOrg));
      
      toast.success("Organization created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update organization
  const updateOrganization = async (data: Partial<Organization>) => {
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Update organization
      const updatedOrg = { ...organization, ...data, updatedAt: new Date() };
      
      // Save to state and localStorage
      setOrganization(updatedOrg);
      localStorage.setItem("agencyos_organization", JSON.stringify(updatedOrg));
      
      toast.success("Organization updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update organization");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update organization settings
  const updateSettings = async (settings: Partial<OrganizationSettings>) => {
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Update settings
      const updatedSettings = { ...organization.settings, ...settings };
      const updatedOrg = { 
        ...organization, 
        settings: updatedSettings,
        updatedAt: new Date() 
      };
      
      // Save to state and localStorage
      setOrganization(updatedOrg);
      localStorage.setItem("agencyos_organization", JSON.stringify(updatedOrg));
      
      toast.success("Settings updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Invite team member
  const inviteTeamMember = async (email: string, role: "admin" | "member") => {
    if (!organization) throw new Error("No organization selected");
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if already invited
      if (invites.some(invite => invite.email === email)) {
        throw new Error("User already invited");
      }
      
      // Create invite
      const newInvite: Invite = {
        id: `invite${Date.now()}`,
        email,
        organizationId: organization.id,
        role,
        invitedBy: user.id,
        invitedAt: new Date(),
        status: "pending",
        token: `token-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
      
      // Save to state
      setInvites([...invites, newInvite]);
      
      toast.success(`Invitation sent to ${email}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Revoke invite
  const revokeInvite = async (inviteId: string) => {
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Remove invite
      setInvites(invites.filter(invite => invite.id !== inviteId));
      
      toast.success("Invitation revoked");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove team member
  const removeMember = async (memberId: string) => {
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if trying to remove owner
      const memberToRemove = members.find(m => m.id === memberId);
      if (memberToRemove?.role === "owner") {
        throw new Error("Cannot remove the organization owner");
      }
      
      // Remove member
      setMembers(members.filter(member => member.id !== memberId));
      
      toast.success("Team member removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove team member");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: "admin" | "member") => {
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if trying to update owner
      const memberToUpdate = members.find(m => m.id === memberId);
      if (memberToUpdate?.role === "owner") {
        throw new Error("Cannot change the role of the organization owner");
      }
      
      // Update member
      setMembers(members.map(member => 
        member.id === memberId ? { ...member, role } : member
      ));
      
      toast.success("Team member role updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update team member role");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        loading,
        members,
        invites,
        createOrganization,
        updateOrganization,
        updateSettings,
        inviteTeamMember,
        revokeInvite,
        removeMember,
        updateMemberRole,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
};
