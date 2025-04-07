
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTasks } from "@/contexts/TaskContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import DashboardLayout, { DashboardLayoutSkeleton } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CheckCircle, Clock, DollarSign, Plus, Users } from "lucide-react";
import { useClients } from "@/contexts/ClientContext";
import { useChat } from "@/contexts/ChatContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/contexts/NotificationContext";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { tasks, loading: tasksLoading } = useTasks();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { clients, loading: clientsLoading } = useClients();
  const { rooms, loading: chatLoading, getTotalUnreadCount } = useChat();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isInvited, setIsInvited] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    const checkInviteStatus = async () => {
      try {
        const { data: inviteData, error: inviteError } = await supabase
          .from("invites")
          .select("id")
          .eq("email", user.email)
          .eq("status", "accepted")
          .single();

        if (inviteData) {
          setIsInvited(true);
        }
      } catch (error) {
        console.error("Error checking invite status:", error);
      }
    };

    checkInviteStatus();

    // If user is authenticated but has no organization, redirect to setup
    if (user && !organization && !tasksLoading && !invoicesLoading && !clientsLoading && !chatLoading) {
      navigate("/organization/setup");
    }

    // Set loading state based on all data loading states
    setIsLoading(tasksLoading || invoicesLoading || clientsLoading || chatLoading);

    // Show welcome notification if first time
    const hasShownWelcome = localStorage.getItem("welcomed");
    if (user && organization && !hasShownWelcome) {
      addNotification({
        userId: user.id,
        title: "Welcome to AgencyOS!",
        message: "Your agency workspace is ready. Let's get started by exploring the dashboard.",
        type: "info",
        link: "/dashboard",
      });
      localStorage.setItem("welcomed", "true");
    }
  }, [
    user, 
    organization, 
    navigate, 
    tasksLoading, 
    invoicesLoading, 
    clientsLoading, 
    chatLoading,
    addNotification
  ]);

  if (!user) {
    return null; // Will redirect to login
  }

  if (isLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!organization && !isInvited) {
    navigate("/organization/setup");
  }

  // Get counts for dashboard stats
  const tasksDueToday = tasks.filter(task => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  });

  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today && task.status !== "done";
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user.name}! Here's what's happening today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksDueToday.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueTasks.length} tasks overdue
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalUnpaidAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {unpaidInvoices.length} unpaid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {clients.filter(c => c.status === "active").length} active clients
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {rooms.length} active conversations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Tabs defaultValue="tasks" className="col-span-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={() => navigate("/tasks/new")}>
                <Plus className="h-4 w-4 mr-1" /> New Task
              </Button>
            </div>
            <TabsContent value="tasks" className="space-y-4 mt-4">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground">No tasks yet. Create your first task to get started.</p>
                    <Button className="mt-4" onClick={() => navigate("/tasks/new")}>
                      <Plus className="h-4 w-4 mr-1" /> Create Task
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div 
                          className={`flex items-center p-4 ${
                            task.status === "done" ? "bg-green-50 dark:bg-green-950/20" : ""
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{task.title}</h3>
                              {task.priority === "high" || task.priority === "urgent" ? (
                                <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded">
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {task.dueDate ? (
                                <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                              ) : (
                                <span>No due date</span>
                              )}
                            </div>
                          </div>
                          {task.status === "done" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/tasks/${task.id}`)}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {tasks.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="link" onClick={() => navigate("/tasks")}>
                        View all tasks
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="invoices" className="space-y-4 mt-4">
              {invoices.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground">No invoices yet. Create your first invoice to get started.</p>
                    <Button className="mt-4" onClick={() => navigate("/invoices/new")}>
                      <Plus className="h-4 w-4 mr-1" /> Create Invoice
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {invoices.slice(0, 5).map((invoice) => (
                    <Card key={invoice.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{invoice.number}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                invoice.status === "paid" 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                                  : invoice.status === "overdue" 
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground mt-1">
                              <span>
                                Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                              </span>
                              <span className="font-medium text-foreground">
                                ${invoice.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {invoices.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="link" onClick={() => navigate("/invoices")}>
                        View all invoices
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>Your most recently added clients.</CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No clients yet. Add your first client to get started.</p>
                  <Button onClick={() => navigate("/clients/new")}>
                    <Plus className="h-4 w-4 mr-1" /> Add Client
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.slice(0, 5).map((client) => (
                    <div key={client.id} className="flex items-center">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{client.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2" 
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  {clients.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="link" onClick={() => navigate("/clients")}>
                        View all clients
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
