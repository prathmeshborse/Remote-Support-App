// File path: client/src/components/core/Room/VideoGrid.jsx
import React from "react";
import { Loader2 } from "lucide-react";

export default function VideoGrid({ localVideoRef, remoteVideoRef, remoteStream }) {
  return (
    <div className="flex-1 bg-slate-900 border border-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center min-h-100">
      
      {/* Local Picture-in-Picture Thumbnail */}
      <div className="absolute bottom-4 right-4 w-40 h-28 bg-black/60 rounded-xl border border-white/10 shadow-lg overflow-hidden z-20">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <div className="absolute bottom-1.5 left-2 text-[10px] text-white font-medium bg-black/40 px-1.5 py-0.5 rounded-full select-none">
          Self (Webcam)
        </div>
      </div>

      {/* Main Remote Screen-sharing Canvas */}
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-center px-4 select-none">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-white text-sm font-semibold">
            Establishing encrypted peer connection...
          </p>
          <p className="text-slate-500 text-xs">
            Waiting for remote device tracks to negotiate.
          </p>
        </div>
      )}
    </div>
  );
}