// File path: client/src/components/CTABanner.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

export default function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="px-6 pb-20 md:pb-28">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-slate-100 rounded-3xl px-8 py-16 md:py-20 text-center shadow-sm shadow-slate-200/60">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 max-w-xl mx-auto">
            Ready to streamline your assistance pipeline?
          </h2>
          <p className="mt-4 text-slate-600 max-w-md mx-auto">
            Set up your first session in under a minute. No credit card
            required.
          </p>
          <button
            onClick={() => navigate("/login")} // Sends users to unified Home state switcher (login)
            className="mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-7 py-3.5 rounded-full transition-all active:scale-[0.98] shadow-sm shadow-blue-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Start Your Journey
          </button>
        </div>
      </div>
    </section>
  );
}