// File path: client/src/components/core/Dashboard/TicketHistoryTable.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ScreenShare } from "lucide-react";

function StatusBadge({ status }) {
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-3 py-1">
      Resolved
    </span>
  );
}

export default function TicketHistoryTable({ tickets }) {
  const navigate = useNavigate();

  const handleJoin = (roomId) => {
    // Route guard validation check flag
    navigate(`/room/${roomId}`, {
      state: { fromDashboard: true },
    });
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (tickets.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center select-none">
        <p className="text-sm text-slate-400 font-medium">
          No tickets registered. Generate a support link above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 select-none">
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Generated Date
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                Connections
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket._id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {ticket.clientName}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {ticket.clientEmail}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                  {formatDate(ticket.createdAt)}
                </td>
                <td className="px-6 py-4 text-center select-none">
                  <span className="inline-flex items-center justify-center min-w-7 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full tabular-nums">
                    {ticket.connections?.length || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={ticket.overallStatus} />
                </td>
                <td className="px-6 py-4 text-right">
                  {ticket.overallStatus === "in-progress" && (
                    <button
                      onClick={() => handleJoin(ticket.roomId)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-100 hover:border-blue-600 px-3 py-1.5 rounded-full transition-all active:scale-[0.98] focus:outline-none"
                    >
                      <ScreenShare className="w-3.5 h-3.5" />
                      Join Room
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}