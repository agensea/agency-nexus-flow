
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  showLogo = true 
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-accent p-4">
      <div className="w-full max-w-md">
        {showLogo && (
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-gradient">AgencyOS</h1>
            </Link>
          </div>
        )}
        
        <Card className="w-full shadow-lg border-t-4 border-t-primary animate-fade-in">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{title}</h2>
              {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;
