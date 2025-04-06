
import React, { createContext, useContext, useState, useEffect } from "react";
import { Organization, OrganizationSettings, TeamMember, Invite, Address } from "@/types";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  uploadLogo: (file: File) => Promise<string>;
  refreshOrganization: () => Promise<void>; // Added function
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Load organization data
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
      console.log("Loading organization for user:", user.id);
      
      // Check if user belongs to any organization
      const { data: teamMemberData, error: teamMemberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(); // Changed from single to maybeSingle

      if (teamMemberError && teamMemberError.code !== 'PGRST116') {
        console.error('Error fetching team member data:', teamMemberError);
        throw teamMemberError;
      }

      if (teamMemberData) {
        console.log("User belongs to organization:", teamMemberData.organization_id);
        
        // User belongs to an organization
        // Fetch organization data
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', teamMemberData.organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching organization data:', orgError);
          throw orgError;
        }

        // Fetch organization settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('organization_id', teamMemberData.organization_id)
          .maybeSingle(); // Changed from single to maybeSingle

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error fetching organization settings:', settingsError);
          throw settingsError;
        }

        // Fetch organization address if exists
        const { data: addressData, error: addressError } = await supabase
          .from('organization_addresses')
          .select('*')
          .eq('organization_id', teamMemberData.organization_id)
          .maybeSingle();

        if (addressError && addressError.code !== 'PGRST116') {
          console.error('Error fetching organization address:', addressError);
          throw addressError;
        }

        // Fetch all team members for this organization
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .eq('organization_id', teamMemberData.organization_id);

        if (membersError) {
          console.error('Error fetching team members:', membersError);
          throw membersError;
        }

        // Fetch all pending invites for this organization
        const { data: invitesData, error: invitesError } = await supabase
          .from('invites')
          .select('*')
          .eq('organization_id', teamMemberData.organization_id)
          .eq('status', 'pending');

        if (invitesError) {
          console.error('Error fetching invites:', invitesError);
          throw invitesError;
        }

        // Format the address
        const address: Address | undefined = addressData ? {
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zip_code,
          country: addressData.country,
        } : undefined;

        // Format the settings
        const settings: OrganizationSettings = settingsData ? {
          allowClientInvites: settingsData.allow_client_invites,
          allowTeamInvites: settingsData.allow_team_invites,
          defaultTaskView: settingsData.default_task_view as 'list' | 'board' | 'calendar',
          color: settingsData.color,
        } : {
          allowClientInvites: true,
          allowTeamInvites: true,
          defaultTaskView: 'board',
          color: '#6366f1',
        };

        // Create the organization object
        const org: Organization = {
          id: orgData.id,
          name: orgData.name,
          logo: orgData.logo,
          email: orgData.email,
          phone: orgData.phone,
          taxId: orgData.tax_id,
          currency: orgData.currency,
          address,
          createdById: orgData.created_by_id,
          createdAt: new Date(orgData.created_at),
          updatedAt: new Date(orgData.updated_at),
          plan: 'free', // Default plan, can be updated later
          settings: settings,
        };

        // Format team members
        const formattedMembers: TeamMember[] = membersData?.map(member => ({
          id: member.id,
          userId: member.user_id,
          organizationId: member.organization_id,
          role: member.role as 'owner' | 'admin' | 'member',
          invitedBy: member.invited_by,
          invitedAt: new Date(member.invited_at),
          joinedAt: member.joined_at ? new Date(member.joined_at) : undefined,
          status: member.status as 'invited' | 'active' | 'inactive',
          permissions: [], // Placeholder, can be expanded later
        })) || [];

        // Format invites
        const formattedInvites: Invite[] = invitesData?.map(invite => ({
          id: invite.id,
          email: invite.email,
          organizationId: invite.organization_id,
          role: invite.role as 'admin' | 'member' | 'client',
          invitedBy: invite.invited_by,
          invitedAt: new Date(invite.invited_at),
          status: invite.status as 'pending' | 'accepted' | 'declined',
          token: invite.token,
          expiresAt: new Date(invite.expires_at),
        })) || [];

        setOrganization(org);
        setMembers(formattedMembers);
        setInvites(formattedInvites);
        console.log("Organization loaded successfully:", org.name);
      } else {
        console.log("User doesn't belong to any organization yet");
        // User doesn't belong to any organization yet
        setOrganization(null);
        setMembers([]);
        setInvites([]);
      }
    } catch (error: any) {
      console.error("Failed to load organization:", error);
      toast.error("Failed to load organization data");
    } finally {
      setLoading(false);
    }
  };

  // Add function to refresh organization data
  const refreshOrganization = async () => {
    await loadOrganization();
  };

  // Load organization data when user changes
  useEffect(() => {
    loadOrganization();
  }, [user]);

  // Create organization
  const createOrganization = async (name: string) => {
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      console.log("Creating organization:", name);
      
      // Insert new organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          created_by_id: user.id
        })
        .select()
        .single();
        
      if (orgError) {
        console.error("Error creating organization:", orgError);
        throw orgError;
      }
      
      console.log("Organization created:", orgData);
      
      // Insert organization settings
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .insert({
          organization_id: orgData.id,
          allow_client_invites: true,
          allow_team_invites: true,
          default_task_view: 'board',
          color: '#6366f1'
        });
        
      if (settingsError) {
        console.error("Error creating organization settings:", settingsError);
        throw settingsError;
      }
      
      // Insert the user as the owner of the organization
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          user_id: user.id,
          organization_id: orgData.id,
          role: 'owner',
          invited_by: user.id,
          joined_at: new Date().toISOString(),
          status: 'active'
        });
        
      if (memberError) {
        console.error("Error creating team member:", memberError);
        throw memberError;
      }
      
      // Create the formatted organization object
      const settings: OrganizationSettings = {
        allowClientInvites: true,
        allowTeamInvites: true,
        defaultTaskView: 'board',
        color: '#6366f1',
      };
      
      const newOrg: Organization = {
        id: orgData.id,
        name: orgData.name,
        logo: orgData.logo,
        email: orgData.email,
        phone: orgData.phone,
        taxId: orgData.tax_id,
        currency: orgData.currency,
        createdById: orgData.created_by_id,
        createdAt: new Date(orgData.created_at),
        updatedAt: new Date(orgData.updated_at),
        plan: 'free',
        settings: settings,
      };
      
      // Create team member entry for the owner
      const ownerMember: TeamMember = {
        id: user.id,
        userId: user.id,
        organizationId: newOrg.id,
        role: 'owner',
        invitedBy: user.id,
        invitedAt: new Date(),
        joinedAt: new Date(),
        status: 'active',
        permissions: ['all'],
      };
      
      setOrganization(newOrg);
      setMembers([ownerMember]);
      
      console.log("Organization setup complete:", newOrg.name);
      toast.success("Organization created successfully");
      
      // Trigger a refresh to ensure we have the latest data
      setTimeout(() => refreshOrganization(), 500);
      
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast.error(error.message || "Failed to create organization");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update organization
  const updateOrganization = async (data: Partial<Organization>) => {
    if (!organization) throw new Error("No organization selected");
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Prepare database fields from the input data
      const updateData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        tax_id: data.taxId,
        currency: data.currency,
        updated_at: new Date().toISOString()
      };
      
      // Update organization data
      const { error: orgError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);
        
      if (orgError) throw orgError;
      
      // Update address if it exists in the input data
      if (data.address) {
        const addressData = {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          zip_code: data.address.zipCode,
          country: data.address.country,
          updated_at: new Date().toISOString()
        };
        
        // Check if address already exists
        const { data: existingAddress, error: addressCheckError } = await supabase
          .from('organization_addresses')
          .select('id')
          .eq('organization_id', organization.id)
          .maybeSingle();
          
        if (addressCheckError && addressCheckError.code !== 'PGRST116') throw addressCheckError;
        
        if (existingAddress) {
          // Update existing address
          const { error: addressUpdateError } = await supabase
            .from('organization_addresses')
            .update(addressData)
            .eq('id', existingAddress.id);
            
          if (addressUpdateError) throw addressUpdateError;
        } else {
          // Insert new address
          const { error: addressInsertError } = await supabase
            .from('organization_addresses')
            .insert({
              ...addressData,
              organization_id: organization.id
            });
            
          if (addressInsertError) throw addressInsertError;
        }
      }
      
      // Create the updated organization object
      const updatedOrg: Organization = {
        ...organization,
        ...data,
        updatedAt: new Date()
      };
      
      setOrganization(updatedOrg);
      
      toast.success("Organization updated successfully");
    } catch (error: any) {
      console.error("Error updating organization:", error);
      toast.error(error.message || "Failed to update organization");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Upload organization logo
  const uploadLogo = async (file: File): Promise<string> => {
    if (!organization) throw new Error("No organization selected");
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Upload file to Supabase Storage
      const fileName = `org_${organization.id}_logo_${Date.now()}`;
      const fileExt = file.name.split('.').pop();
      const filePath = `${fileName}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('organization_logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('organization_logos')
        .getPublicUrl(uploadData.path);
        
      const logoUrl = urlData.publicUrl;
      
      // Update organization with logo URL
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo: logoUrl })
        .eq('id', organization.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setOrganization({
        ...organization,
        logo: logoUrl
      });
      
      toast.success("Logo uploaded successfully");
      return logoUrl;
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Failed to upload logo");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update organization settings
  const updateSettings = async (settings: Partial<OrganizationSettings>) => {
    if (!organization) throw new Error("No organization selected");
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Prepare database fields from the input settings
      const updateData = {
        allow_client_invites: settings.allowClientInvites,
        allow_team_invites: settings.allowTeamInvites,
        default_task_view: settings.defaultTaskView,
        color: settings.color,
        updated_at: new Date().toISOString()
      };
      
      // Update settings in database
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .update(updateData)
        .eq('organization_id', organization.id);
        
      if (settingsError) throw settingsError;
      
      // Update local state
      const updatedSettings = {
        ...organization.settings,
        ...settings
      };
      
      setOrganization({
        ...organization,
        settings: updatedSettings,
        updatedAt: new Date()
      });
      
      toast.success("Settings updated successfully");
    } catch (error: any) {
      console.error("Error updating settings:", error);
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
      // Check if already invited
      const { data: existingInvite, error: checkError } = await supabase
        .from('invites')
        .select('*')
        .eq('email', email)
        .eq('organization_id', organization.id)
        .eq('status', 'pending')
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      if (existingInvite) {
        throw new Error("User already invited");
      }
      
      // Create invite token and expiry date (7 days from now)
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Insert new invite
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .insert({
          email,
          organization_id: organization.id,
          role,
          invited_by: user.id,
          status: 'pending',
          token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
        
      if (inviteError) throw inviteError;
      
      // Create invite object for local state
      const newInvite: Invite = {
        id: inviteData.id,
        email: inviteData.email,
        organizationId: inviteData.organization_id,
        role: inviteData.role as 'admin' | 'member' | 'client',
        invitedBy: inviteData.invited_by,
        invitedAt: new Date(inviteData.invited_at),
        status: inviteData.status as 'pending' | 'accepted' | 'declined',
        token: inviteData.token,
        expiresAt: new Date(inviteData.expires_at),
      };
      
      // Update local state
      setInvites([...invites, newInvite]);
      
      // In a real implementation, we would send an email to the invited user
      // with a link to accept the invitation
      
      toast.success(`Invitation sent to ${email}`);
    } catch (error: any) {
      console.error("Error inviting team member:", error);
      toast.error(error.message || "Failed to send invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Revoke invite
  const revokeInvite = async (inviteId: string) => {
    if (!organization) throw new Error("No organization selected");
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Update invite status to declined
      const { error } = await supabase
        .from('invites')
        .update({ status: 'declined' })
        .eq('id', inviteId)
        .eq('organization_id', organization.id);
        
      if (error) throw error;
      
      // Update local state
      setInvites(invites.filter(invite => invite.id !== inviteId));
      
      toast.success("Invitation revoked");
    } catch (error: any) {
      console.error("Error revoking invitation:", error);
      toast.error(error.message || "Failed to revoke invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove team member
  const removeMember = async (memberId: string) => {
    if (!organization) throw new Error("No organization selected");
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Get member to remove first
      const memberToRemove = members.find(m => m.id === memberId);
      if (!memberToRemove) throw new Error("Member not found");
      
      // Check if trying to remove the owner
      if (memberToRemove.role === "owner") {
        throw new Error("Cannot remove the organization owner");
      }
      
      // Update member status to inactive
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('id', memberId)
        .eq('organization_id', organization.id);
        
      if (error) throw error;
      
      // Update local state
      setMembers(members.filter(member => member.id !== memberId));
      
      toast.success("Team member removed");
    } catch (error: any) {
      console.error("Error removing team member:", error);
      toast.error(error.message || "Failed to remove team member");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: "admin" | "member") => {
    if (!organization) throw new Error("No organization selected");
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Get member to update first
      const memberToUpdate = members.find(m => m.id === memberId);
      if (!memberToUpdate) throw new Error("Member not found");
      
      // Check if trying to update the owner
      if (memberToUpdate.role === "owner") {
        throw new Error("Cannot change the role of the organization owner");
      }
      
      // Update member role
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId)
        .eq('organization_id', organization.id);
        
      if (error) throw error;
      
      // Update local state
      setMembers(members.map(member => 
        member.id === memberId ? { ...member, role } : member
      ));
      
      toast.success("Team member role updated");
    } catch (error: any) {
      console.error("Error updating team member role:", error);
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
        uploadLogo,
        refreshOrganization, // Add the new function to the context
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
