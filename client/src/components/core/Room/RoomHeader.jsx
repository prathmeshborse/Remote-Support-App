// File path: client/src/components/core/Room/RoomHeader.jsx
import React from "react";
import { Activity, Circle } from "lucide-react";

export default function RoomHeader({ roomId, connectionStatus, callDuration, formatTimer }) {
    return (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 select-none shrink-0">
            <div className="flex items-center gap-4">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                    Portal<span className="text-blue-600">.rtc</span>
                </span>
                <span className="hidden sm:inline w-px h-4 bg-slate-200" />
                <span className="hidden sm:inline text-xs text-slate-400 font-mono tracking-wider">
                    ROOM: {roomId ? roomId.slice(0, 8) : ""}...
                </span>
            </div>

            {/* Connection States */}
            <div className="flex items-center gap-6">
                {connectionStatus === "connected" && (
                    <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                        <span>Session Time: <span className="font-bold font-mono">{formatTimer(callDuration)}</span></span>
                    </div>
                )}
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 border rounded-full ${connectionStatus === "connected"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                        : "text-slate-600 bg-slate-100 border-slate-200"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`} />
                    {connectionStatus === "connected" ? "P2P Secure Connection" : "Synchronizing..."}
                </span>
            </div>
        </header>
    );
}