// File path: client/src/components/core/Dashboard/MetricsGrid.jsx
import React from "react";
import { Ticket, Activity, RefreshCw } from "lucide-react";

function MetricCard({ icon, label, value }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export default function MetricsGrid({ tickets }) {
  // Aggregate Metrics in real-time based on the DB tickets array
  const totalTickets = tickets.length;

  const activeTickets = tickets.filter(
    (t) => t.overallStatus === "in-progress"
  ).length;

  // Calculates every reconnection segment compiled in MongoDB across all tickets
  const totalReconnects = tickets.reduce(
    (sum, ticket) => sum + (ticket.connections?.length || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 select-none">
      <MetricCard
        icon={<Ticket className="w-4.5 h-4.5 text-blue-600" />}
        label="Total Tickets"
        value={totalTickets}
      />
      <MetricCard
        icon={<Activity className="w-4.5 h-4.5 text-blue-600" />}
        label="Active / In-Progress"
        value={activeTickets}
      />
      <MetricCard
        icon={<RefreshCw className="w-4.5 h-4.5 text-blue-600" />}
        label="Reconnection Logs"
        value={totalReconnects}
      />
    </div>
  );
}