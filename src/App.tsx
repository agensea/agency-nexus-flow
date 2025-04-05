
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerificationSent from "./pages/auth/VerificationSent";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Main app pages
import Dashboard from "./pages/Dashboard";
import OrganizationSetup from "./pages/organization/Setup";

// Context providers
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { TaskProvider } from "./contexts/TaskContext";
import { ChatProvider } from "./contexts/ChatContext";
import { InvoiceProvider } from "./contexts/InvoiceContext";
import { ClientProvider } from "./contexts/ClientContext";
import { NotificationProvider } from "./contexts/NotificationContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <OrganizationProvider>
          <TaskProvider>
            <ChatProvider>
              <InvoiceProvider>
                <ClientProvider>
                  <NotificationProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Routes>
                        {/* Auth routes */}
                        <Route path="/auth/login" element={<Login />} />
                        <Route path="/auth/register" element={<Register />} />
                        <Route path="/auth/verification-sent" element={<VerificationSent />} />
                        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                        
                        {/* Organization routes */}
                        <Route path="/organization/setup" element={<OrganizationSetup />} />
                        
                        {/* Main app routes */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        
                        {/* Add more routes for other features */}
                        {/* e.g. <Route path="/tasks" element={<Tasks />} /> */}
                        
                        {/* Redirect from home to dashboard or login */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        {/* 404 route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </NotificationProvider>
                </ClientProvider>
              </InvoiceProvider>
            </ChatProvider>
          </TaskProvider>
        </OrganizationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
