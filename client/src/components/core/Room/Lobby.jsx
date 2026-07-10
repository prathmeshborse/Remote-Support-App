// File path: client/src/components/core/Room/Lobby.jsx
import React from "react";
import { Loader2 } from "lucide-react";

export default function Lobby({ onCancel }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans select-none">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-lg">
        
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
        
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Technician Offline
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
          Awaiting connection. Your support representative has been alerted and will activate this room shortly.
        </p>

        <button
          onClick={onCancel}
          className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-5 py-2.5 rounded-full transition-all focus:outline-none"
        >
          Cancel Support Request
        </button>
      </div>
    </div>
  );
}