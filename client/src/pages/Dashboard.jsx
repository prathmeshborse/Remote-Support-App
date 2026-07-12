// File path: client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { getAgentTicketsHistory } from "../services/operations/ticketAPI";

// Import modular sub-components
import DashboardHeader from "../components/core/Dashboard/DashboardHeader";
import MetricsGrid from "../components/core/Dashboard/MetricsGrid";
import TicketGenerator from "../components/core/Dashboard/TicketGenerator";
import TicketHistoryTable from "../components/core/Dashboard/TicketHistoryTable";
import AgentProfileDrawer from "../components/core/Dashboard/AgentProfileDrawer";

export default function Dashboard() {
  const navigate = useNavigate();
  const { agent, logout, updateAgentProfile, deleteAgentAccount, changePassword } = useAuth();

  // Core Dynamic States
  const [tickets, setTickets] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 1. Fetch live support ticket logs from MongoDB Atlas on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getAgentTicketsHistory();
        if (response?.success && response?.data) {
          setTickets(response.data);
        }
      } catch (err) {
        console.error("Failed to load historical data logs.");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Handler: Append freshly generated ticket dynamically onto history table
  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  // Handler: Save profile updates (combines Agent and linked Profile modifications)
  const handleSaveProfile = async (updatedFields) => {
    // Standardizes phone naming to match Backend mongoose phoneNumber schema parameter
    const payload = {
      firstName: updatedFields.firstName,
      lastName: updatedFields.lastName,
      organization: updatedFields.organization,
      phoneNumber: updatedFields.phone,
      bio: updatedFields.bio
    };
    await updateAgentProfile(payload);
  };

  const hadnleChangePassword = async ({oldPassword, newPassword, confirmNewPassword}) => {
    await changePassword(oldPassword, newPassword, confirmNewPassword)
  };

  // Handler: Secure Logout sequence clearing token cookies
  const handleLogout = async () => {
    await logout(navigate);
  };

  // Handler: Permanently delete account cascadingly
  const handleDeleteAccount = async () => {
    await deleteAgentAccount(navigate);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <DashboardHeader
        agent={agent}
        onAvatarClick={() => setIsDrawerOpen(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Dynamic Welcome Title bar */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {agent?.firstName || "Agent"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Here's what's happening across your support sessions.
          </p>
        </div>

        {/* Dynamic performance metrics from MongoDB */}
        <MetricsGrid tickets={tickets} />

        {/* Form terminal to generate support invitations */}
        <TicketGenerator onTicketCreated={handleTicketCreated} />

        {/* Historical ticket audits */}
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 select-none">
            Ticket History
          </h2>
          {historyLoading ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading session audit logs...</p>
            </div>
          ) : (
            <TicketHistoryTable tickets={tickets} />
          )}
        </div>
      </main>

      {/* Edit settings slideover drawer */}
      <AgentProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        agent={agent}
        onSave={handleSaveProfile}
        onDeleteAccount={handleDeleteAccount}
        onPasswordChange={hadnleChangePassword}
      />
    </div>
  );
}