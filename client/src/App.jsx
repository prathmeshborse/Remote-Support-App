// File path: client/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Import State Context Providers
import { SocketProvider } from "./providers/SocketProvider";
import { PeerProvider } from "./providers/PeerProvider";
import { AuthProvider } from "./providers/AuthProvider";

// Import Modular Components and Guards
import PrivateRoute from "./components/PrivateRoute";

// Import Fully Built Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Room from "./pages/Room";

// ------------------------------------------------------------------
// Temporary Mock Skeletons (Prevents Vite compiler errors during test)
// ------------------------------------------------------------------
const DashboardPlaceholder = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
    <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm text-center">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Agent Dashboard</h2>
      <p className="text-sm text-slate-500 mb-6">Build in progress. Your session is successfully authorized.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/50 px-4 py-2 rounded-full transition-all"
      >
        Trigger Silent Auto-Login Test
      </button>
    </div>
  </div>
);

const RoomPlaceholder = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
    <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm text-center">
      <h2 className="text-xl font-bold text-slate-800 mb-2">P2P Support Room</h2>
      <p className="text-sm text-slate-500">Build in progress. Shared video and chat workspace will mount here.</p>
    </div>
  </div>
);

// ------------------------------------------------------------------

const App = () => {
  return (
    // Wrap the routing context under the unified providers tree
    <SocketProvider>
      <PeerProvider>
        <AuthProvider>
          {/* Central Notification Toaster Mount */}
          <Toaster 
            position="top-center" 
            toastOptions={{
              className: 'text-sm font-sans font-medium text-slate-800 border border-slate-100 shadow-xl rounded-xl p-4',
              duration: 3000,
            }} 
          />

          <Routes>
            {/* 1. Public Landing Page */}
            <Route path="/" element={<Home />} />

            {/* 2. Public Onboarding Forms */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* 3. Secure Agent Dashboard (Guarded by PrivateRoute Outlet) */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* 4. Public Support Room (Dynamic gatekeeping handles authorization) */}
            <Route path="/room/:roomId" element={<Room />} /> 

            {/* 5. Fallback Route redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </PeerProvider>
    </SocketProvider>
  );
};

export default App;