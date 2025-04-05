
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/layouts/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

const Register: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Sign up to get started with AgencyOS"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
