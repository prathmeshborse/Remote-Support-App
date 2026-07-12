// File path: client/src/pages/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import AuthCard from "../components/auth/AuthCard";
import AuthInput from "../components/auth/AuthInput";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { agent, loading } = useAuth();

    useEffect(() => {
        if (agent && !loading) {
            navigate("/dashboard");
        }
    }, [agent, loading, navigate]);
    const { requestPasswordReset } = useAuth();

    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        await requestPasswordReset(email);
    };

    return (
        <AuthCard
            title="Reset Password"
            description="Enter your email to receive a secure recovery link in your inbox."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                    label="Email Address"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                />

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold tracking-wide shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
                >
                    Send Recovery Mail
                </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
                <p className="text-sm text-slate-500">
                    <Link
                        to="/login"
                        className="font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                        Return to Sign In
                    </Link>
                </p>
            </div>
        </AuthCard>
    );
}