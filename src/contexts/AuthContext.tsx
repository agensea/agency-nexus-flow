
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock authentication functions for demo
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user data
  const mockUsers = [
    {
      id: "user1",
      email: "demo@agencyos.com",
      password: "password", // In a real app, this would be hashed
      name: "Demo User",
      avatar: undefined,
      role: "admin" as const,
      createdAt: new Date(),
    },
  ];

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedAuth = localStorage.getItem("agencyos_auth");
        if (savedAuth) {
          const parsedAuth = JSON.parse(savedAuth);
          setUser(parsedAuth.user);
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (mockUsers.some((u) => u.email === email)) {
        throw new Error("User already exists");
      }

      const newUser = {
        id: `user${Date.now()}`,
        email,
        name,
        role: "admin" as const,
        createdAt: new Date(),
        avatar: undefined, // Add avatar property which was missing
      };

      // In a real app, we would make an API call here
      mockUsers.push({ ...newUser, password });
      
      // Send verification email (mocked)
      console.log(`Verification email sent to ${email}`);
      toast.success("Verification email sent! Please check your inbox.");
      
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to sign up");
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Find user
      const foundUser = mockUsers.find((u) => u.email === email && u.password === password);
      if (!foundUser) {
        throw new Error("Invalid email or password");
      }

      // Create user object without password
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Save to state and localStorage
      setUser(userWithoutPassword);
      localStorage.setItem("agencyos_auth", JSON.stringify({ user: userWithoutPassword }));
      
      toast.success("Signed in successfully");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Clear state and localStorage
      setUser(null);
      localStorage.removeItem("agencyos_auth");
      
      toast.success("Signed out successfully");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to sign out");
      throw error;
    }
  };

  // Email verification function
  const verifyEmail = async (token: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In a real app, we would verify the token with the backend
      const isValid = token === "valid-token";
      
      if (isValid) {
        toast.success("Email verified successfully");
      } else {
        toast.error("Invalid or expired verification token");
      }
      
      setLoading(false);
      return isValid;
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to verify email");
      return false;
    }
  };

  // Password reset request function
  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if user exists
      const userExists = mockUsers.some((u) => u.email === email);
      if (!userExists) {
        throw new Error("No account found with this email");
      }
      
      // In a real app, we would send a reset email here
      console.log(`Password reset email sent to ${email}`);
      toast.success("Password reset email sent! Please check your inbox.");
      
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to request password reset");
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In a real app, we would verify the token and update the password
      const isValid = token === "valid-token";
      
      if (isValid) {
        toast.success("Password reset successfully");
      } else {
        toast.error("Invalid or expired reset token");
      }
      
      setLoading(false);
      return isValid;
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to reset password");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        verifyEmail,
        requestPasswordReset,
        resetPassword,
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
