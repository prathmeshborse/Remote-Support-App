// File path: client/src/components/core/Room/ClientVerificationForm.jsx
import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ClientVerificationForm({ clientEmail, clientName, onVerifySuccess, onCancel }) {
  const [name, setName] = useState(clientName || "");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    // Strict local whitelisting validation (zero network resource waste)
    if (email.trim().toLowerCase() !== clientEmail.toLowerCase()) {
      toast.error("This email address is not authorized for this support session.");
      return;
    }

    // Success: return details to parent to trigger lazy socket connection and diagnostics
    onVerifySuccess({ name: name.trim(), email: email.trim().toLowerCase() });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans select-none">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-2xl p-8 shadow-lg">
        
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">
            Verification Required
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Please verify your details to join your secure support workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Authorized Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all focus:outline-none"
            >
              Verify & Join Session
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold py-2 rounded-lg transition-all focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}