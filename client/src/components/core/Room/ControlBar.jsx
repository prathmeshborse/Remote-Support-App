// File path: client/src/components/core/Room/ControlBar.jsx
import React from "react";
import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff } from "lucide-react";

export default function ControlBar({
  isMicMuted,
  isCamMuted,
  isSharingScreen,
  toggleMic,
  toggleCamera,
  toggleScreenShare,
  onLeave,
  onEndTicket,
  isAgent,
}) {
  return (
    <div className="h-16 bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm shrink-0 select-none">
      
      {/* Toggling Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full hover:bg-slate-50 transition-colors focus:outline-none ${
            isMicMuted ? "text-red-500" : "text-slate-600"
          }`}
        >
          {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full hover:bg-slate-50 transition-colors focus:outline-none ${
            isCamMuted ? "text-red-500" : "text-slate-600"
          }`}
        >
          {isCamMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full hover:bg-slate-50 transition-colors focus:outline-none ${
            isSharingScreen ? "text-emerald-600 bg-emerald-50" : "text-slate-600"
          }`}
        >
          <ScreenShare className="w-5 h-5" />
        </button>
      </div>

      {/* Disconnection Actions */}
      <div className="flex items-center gap-3">
        {isAgent && (
          <button
            onClick={onEndTicket}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 px-4 py-2 rounded-full text-xs font-bold transition-all focus:outline-none"
          >
            Resolve Ticket
          </button>
        )}
        <button
          onClick={onLeave}
          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all focus:outline-none"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          Disconnect
        </button>
      </div>
    </div>
  );
}