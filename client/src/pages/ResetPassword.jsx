// File path: client/src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import AuthCard from "../components/auth/AuthCard";
import AuthInput from "../components/auth/AuthInput";
import { toast } from "react-hot-toast";

/**
 * Validates recovery parameters from URL paths and updates Agent passwords
 */
export default function ResetPassword() {
  const { token } = useParams(); // Retrieves the UUID token directly from React Router URL params
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic Frontend Validations
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    // 2. Invoke the central authorization operation to update credentials on MongoDB
    await resetPassword(password, confirmPassword, token, navigate);
  };

  return (
    <AuthCard
      title="Choose New Password"
      description="Enter your new secure credentials below to recover access."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="New Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <AuthInput
          label="Confirm New Password"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold tracking-wide shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
        >
          Reset Password
        </button>
      </form>
    </AuthCard>
  );
}