
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { 
  Bell, 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  FileText, 
  Users, 
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Building2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const navItems = [
    { 
      path: "/dashboard", 
      name: "Dashboard", 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      path: "/organization/team", 
      name: "Team Management", 
      icon: <UserPlus className="h-5 w-5" /> 
    },
    { 
      path: "/tasks", 
      name: "Tasks", 
      icon: <CheckSquare className="h-5 w-5" /> 
    },
    { 
      path: "/chat", 
      name: "Chat", 
      icon: <MessageSquare className="h-5 w-5" /> 
    },
    { 
      path: "/invoices", 
      name: "Invoices", 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      path: "/clients", 
      name: "Clients", 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      path: "/organization-settings", 
      name: "Organization Settings", 
      icon: <Building2 className="h-5 w-5" /> 
    },
    { 
      path: "/settings", 
      name: "Settings", 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={`sidebar-item ${isActive ? "active" : "hover:bg-accent"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {item.icon}
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gradient">AgencyOS</h1>
          </Link>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <h1 className="text-xl font-bold">AgencyOS</h1>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 py-6 px-4 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                asChild
              >
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </Button>
              <Button 
                variant="destructive" 
                className="w-full justify-start" 
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border h-16 flex items-center px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">AgencyOS</h1>
          </div>
          
          <div className="ml-auto flex items-center space-x-2">
            <NotificationDropdown>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </NotificationDropdown>
            
            <div className="md:hidden">
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Organization name or setup prompt */}
        {organization ? (
          <div className="bg-muted/50 px-4 md:px-6 py-2 border-b border-border">
            <div className="flex items-center">
              <h2 className="text-sm font-medium">{organization.name}</h2>
              <Badge variant="outline" className="ml-2">
                {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 px-4 md:px-6 py-2 border-b border-border">
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground">
                Complete your setup: 
                <Link to="/organization/setup" className="ml-1 text-primary font-medium hover:underline">
                  Create your organization
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Loading skeleton for the dashboard layout
export const DashboardLayoutSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="flex-1 py-6 px-4 space-y-4">
          {Array(6).fill(null).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="bg-card border-b border-border h-16 flex items-center px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <div className="ml-auto flex items-center space-x-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10 rounded-full md:hidden" />
          </div>
        </header>

        {/* Organization name Skeleton */}
        <div className="bg-muted/50 px-4 md:px-6 py-2 border-b border-border">
          <Skeleton className="h-6 w-48" />
        </div>

        {/* Main Content Skeleton */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="grid gap-6">
            <Skeleton className="h-12 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array(3).fill(null).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
