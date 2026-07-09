// File path: client/src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

/**
 * Route-guard component securing the Agent Dashboard from unauthorized public access
 */
const PrivateRoute = () => {
    const { agent, loading } = useAuth();

    // 1. If the pre-flight session check is active on startup, hold the route and show a spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center gap-4">
                    {/* Tailwind Animated Spinner */}
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 font-semibold">Verifying secure session...</p>
                </div>
            </div>
        );
    }

    // 2. If the verification is complete and no active Agent session is detected, redirect to Login
    if (!agent) {
        return <Navigate to="/login" replace />;
    }

    // 3. If verified, render the nested private children pages
    return <Outlet />;
};

export default PrivateRoute;