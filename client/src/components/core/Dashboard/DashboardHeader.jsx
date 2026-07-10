// File path: client/src/components/core/Dashboard/DashboardHeader.jsx
import React from "react";
import { LogOut } from "lucide-react";

export default function DashboardHeader({ agent, onAvatarClick, onLogout }) {
  const initials = `${agent?.firstName?.[0] ?? ""}${agent?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-50/80 border-b border-slate-100 select-none">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Branding Logo */}
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          Portal<span className="text-blue-600">.rtc</span>
        </span>

        {/* Identity & Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onAvatarClick}
            className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors active:scale-[0.98] focus:outline-none"
          >
            {agent?.additionalDetails?.avatarUrl ? (
              <img
                src={agent.additionalDetails.avatarUrl}
                alt={`${agent.firstName} ${agent.lastName}`}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                {initials || "A"}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-medium text-slate-900">
                {agent?.firstName} {agent?.lastName}
              </p>
              <p className="text-xs text-slate-400">
                {agent?.additionalDetails?.organization || "Independent Agent"}
              </p>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 border border-slate-100 hover:border-slate-200 px-3 py-2 rounded-full transition-all active:scale-[0.98] focus:outline-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}