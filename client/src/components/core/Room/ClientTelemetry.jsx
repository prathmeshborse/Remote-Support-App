// File path: client/src/components/core/Room/ClientTelemetry.jsx
import React from "react";
import { Cpu } from "lucide-react";

export default function ClientTelemetry({ clientSpecs }) {
  if (!clientSpecs) return null;

  return (
    <div className="p-5 border-b border-slate-100 select-none">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        <Cpu className="w-3.5 h-3.5 text-blue-600" />
        <span>Client Telemetry</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <p className="text-slate-400 font-medium">OS</p>
          <p className="font-bold text-slate-800">{clientSpecs.os}</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium">Browser</p>
          <p className="font-bold text-slate-800">{clientSpecs.browser}</p>
        </div>
        <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-1">
          <p className="text-slate-400 font-medium">Resolution</p>
          <p className="font-bold text-slate-800">{clientSpecs.resolution}</p>
        </div>
        {clientSpecs.batteryLevel !== null && (
          <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-1">
            <p className="text-slate-400 font-medium">Battery Level</p>
            <p className="font-bold text-slate-800">{clientSpecs.batteryLevel}%</p>
          </div>
        )}
      </div>
    </div>
  );
}