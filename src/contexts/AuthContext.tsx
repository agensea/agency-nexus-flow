import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  updateUser: (data: { name?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
            avatar: session.user.user_metadata.avatar_url,
            role: session.user.user_metadata.role || 'member',
            createdAt: new Date(session.user.created_at),
          };
          setUser(userData);
        } else {
          setUser(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.id);
      setSession(session);
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
          avatar: session.user.user_metadata.avatar_url,
          role: session.user.user_metadata.role || 'member',
          createdAt: new Date(session.user.created_at),
        };
        setUser(userData);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });
      
      if (error) throw error;
      
      toast.success("Verification email sent! Please check your inbox.");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to sign up");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Signed in successfully");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast.success("Signed out successfully");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to sign out");
      throw error;
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    setLoading(true);
    try {
      setLoading(false);
      return true;
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to verify email");
      return false;
    }
  };

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      console.log("Requesting password reset for:", email);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        console.error("Supabase password reset error:", error);
        throw error;
      }
      
      console.log("Password reset email sent successfully:", data);
      toast.success("Password reset email sent! Please check your inbox.");
      setLoading(false);
    } catch (error: any) {
      console.error("Password reset request detailed error:", error);
      setLoading(false);
      toast.error(error.message || "Failed to request password reset");
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) throw error;
      
      toast.success("Password reset successfully");
      setLoading(false);
      return true;
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to reset password");
      return false;
    }
  };

  const updateUser = async (data: { name?: string; password?: string }) => {
    setLoading(true);
    try {
      const updateData: {
        password?: string;
        data?: {
          name?: string;
        };
      } = {};
      
      if (data.password) {
        updateData.password = data.password;
      }
      
      if (data.name) {
        updateData.data = {
          name: data.name
        };
      }
      
      const { error } = await supabase.auth.updateUser(updateData);
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        verifyEmail,
        requestPasswordReset,
        resetPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
