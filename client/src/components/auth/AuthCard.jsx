// File path: client/src/components/auth/AuthCard.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * Standardized card layout wrapper for all onboarding page contexts
 */
export default function AuthCard({ title, description, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12 select-none">
      {/* Platform Branding Heading */}
      <div className="mb-6 text-center">
        <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 focus:outline-none">
          Portal<span className="text-blue-600">.rtc</span>
        </Link>
      </div>

      {/* Main Structural Containment Wrapper */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-100/50 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-500 font-medium">
              {description}
            </p>
          )}
        </div>

        {/* Render child form contents inside the card */}
        {children}
      </div>
    </div>
  );
}