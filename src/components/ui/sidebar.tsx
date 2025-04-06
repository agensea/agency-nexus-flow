import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Settings,
  Users,
  UserPlus,
  MessageSquare,
  FileText,
  User,
  LogOut,
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
}

export function Sidebar({ className, isCollapsed, ...props }: SidebarProps) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !organization) return;

      try {
        const { data, error } = await supabase
          .from("team_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("organization_id", organization.id)
          .eq("status", "active")
          .single();
        
        if (error) throw error;
        
        setIsAdmin(data.role === "admin" || data.role === "owner");
      } catch (error) {
        console.error("Error checking admin permissions:", error);
      }
    };

    checkAdminStatus();
  }, [user, organization]);

  return (
    <div
      className={cn(
        "flex flex-col h-screen border-r bg-background",
        isCollapsed ? "w-[70px]" : "w-[240px]",
        className
      )}
      {...props}
    >
      <div className="py-4 h-16 border-b px-3 flex items-center">
        <Link
          to="/"
          className={cn(
            "flex items-center font-semibold",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          {organization?.logo ? (
            <img
              src={organization.logo}
              alt={organization.name}
              className={cn(
                "rounded object-contain",
                isCollapsed ? "h-8 w-8" : "h-8 w-8 mr-2"
              )}
            />
          ) : (
            <div
              className={cn(
                "flex items-center justify-center bg-primary text-primary-foreground rounded font-bold",
                isCollapsed ? "h-8 w-8 text-sm" : "h-8 w-8 mr-2 text-sm"
              )}
            >
              {organization?.name?.charAt(0) || "A"}
            </div>
          )}
          {!isCollapsed && (
            <span className="truncate">
              {organization?.name || "Application"}
            </span>
          )}
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 gap-1">
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname === "/dashboard"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
              isCollapsed &&
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-0"
            )}
          >
            <LayoutDashboard
              className={cn("h-5 w-5", isCollapsed ? "w-5 h-5" : "w-4 h-4")}
            />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>

          {/* Show organization/team for all users who are part of an organization */}
          {organization && (
            <Link
              to="/organization/team"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                pathname === "/organization/team"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                isCollapsed &&
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-0"
              )}
            >
              <UserPlus
                className={cn("h-5 w-5", isCollapsed ? "w-5 h-5" : "w-4 h-4")}
              />
              {!isCollapsed && <span>Team Management</span>}
            </Link>
          )}
          
          <Link
            to="/clients"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname === "/clients"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
              isCollapsed &&
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-0"
            )}
          >
            <Users
              className={cn("h-5 w-5", isCollapsed ? "w-5 h-5" : "w-4 h-4")}
            />
            {!isCollapsed && <span>Clients</span>}
          </Link>

          <Link
            to="/messages"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname === "/messages"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
              isCollapsed &&
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-0"
            )}
          >
            <MessageSquare
              className={cn("h-5 w-5", isCollapsed ? "w-5 h-5" : "w-4 h-4")}
            />
            {!isCollapsed && <span>Messages</span>}
          </Link>

          <Link
            to="/invoices"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname === "/invoices"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
              isCollapsed &&
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-0"
            )}
          >
            <FileText
              className={cn("h-5 w-5", isCollapsed ? "w-5 h-5" : "w-4 h-4")}
            />
            {!isCollapsed && <span>Invoices</span>}
          </Link>

          {isAdmin && (
            <Link
              to="/organization/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                pathname === "/organization/settings"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                isCollapsed &&
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-0"
              )}
            >
              <Settings
                className={cn("h-5 w-5", isCollapsed ? "w-5 h-5" : "w-4 h-4")}
              />
              {!isCollapsed && <span>Settings</span>}
            </Link>
          )}
        </nav>
      </div>
      
      <div className="mt-auto border-t p-3">
        <div className="flex flex-col gap-1">
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname === "/profile"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
              isCollapsed &&
                "justify-center flex h-10 w-10 shrink-0 items-center rounded-lg p-0"
            )}
          >
            <User
              className={cn("h-5 w-5", isCollapsed ? "w-5 h-5" : "w-4 h-4")}
            />
            {!isCollapsed && <span>Profile</span>}
          </Link>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 px-3 py-2 text-sm",
              isCollapsed &&
                "justify-center flex h-10 w-10 shrink-0 items-center rounded-lg p-0"
            )}
            onClick={signOut}
          >
            <LogOut
              className={cn("h-5 w-5", isCollapsed ? "w-5 h-5" : "w-4 h-4")}
            />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
