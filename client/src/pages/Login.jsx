// File path: client/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import AuthCard from "../components/auth/AuthCard";
import AuthInput from "../components/auth/AuthInput";

export default function Login() {
    const navigate = useNavigate();
    const { agent, loading, login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (agent && !loading) {
            navigate("/dashboard");
        }
    }, [agent, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password, navigate);
    };

    return (
        <AuthCard
            title="Agent Portal"
            description="Access your administrative support dashboard."
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

                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Password
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none"
                        >
                            Forgot?
                        </Link>
                    </div>
                    <AuthInput
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold tracking-wide shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
                >
                    Access Dashboard
                </button>
            </form>

            {/* Helper route redirection anchors */}
            <div className="mt-8 text-center border-t border-slate-100 pt-6">
                <p className="text-sm text-slate-500">
                    New to the platform?{" "}
                    <Link
                        to="/signup"
                        className="font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                        Onboard here
                    </Link>
                </p>
            </div>
        </AuthCard>
    );
}