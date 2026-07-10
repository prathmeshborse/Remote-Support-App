// File path: client/src/components/core/Room/AgentPreJoin.jsx
import React from "react";
import { Monitor } from "lucide-react";

export default function AgentPreJoin({ clientName, clientEmail, onJoin, onCancel }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans select-none">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-2xl p-8 shadow-lg">
        
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">
            Support Workspace
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Ready to initialize the secure P2P support line.
          </p>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Assigned Client</p>
              <p className="text-sm font-bold text-slate-800">{clientName}</p>
            </div>
            <div className="border-t border-slate-200/50 pt-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Client Email</p>
              <p className="text-xs font-mono font-bold text-slate-600">{clientEmail}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onJoin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all focus:outline-none"
            >
              Activate & Enter Room
            </button>
            <button
              onClick={onCancel}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold py-2 rounded-lg transition-all focus:outline-none"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}