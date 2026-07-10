// File path: client/src/components/core/Dashboard/AgentProfileDrawer.jsx
import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";

export default function AgentProfileDrawer({ isOpen, onClose, agent, onSave, onDeleteAccount }) {
  const [form, setForm] = useState({
    firstName: agent?.firstName || "",
    lastName: agent?.lastName || "",
    organization: agent?.additionalDetails?.organization || "",
    phone: agent?.additionalDetails?.phoneNumber || "",
    bio: agent?.additionalDetails?.bio || "",
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    onSave?.(form);
    onClose();
  };

  return (
    <>
      {/* Dynamic Drawer Backdrop Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-over Form Panel Container */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl border-l border-slate-100 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Static Header Section */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 shrink-0">
            <h2 className="text-base font-semibold text-slate-900">
              Profile Settings
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors active:scale-[0.98] focus:outline-none"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Scrolling input wrapper */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Organization
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={handleChange("organization")}
                className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange("phone")}
                className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Bio Profile
              </label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={handleChange("bio")}
                className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>

            <button
              type="submit"
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-full shadow-md shadow-blue-500/10 active:scale-[0.98] focus:outline-none"
            >
              Save Profile Changes
            </button>

            {/* Cascading Destructive action zone */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3 select-none">
                Danger Zone
              </p>

              {!confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-100 hover:border-red-600 px-4 py-2.5 rounded-full transition-all active:scale-[0.98] focus:outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Account
                </button>
              ) : (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs text-red-700 leading-relaxed mb-3">
                    This will cascadingly wipe your profile, all generated tickets, 
                    and any cloud video recordings tied to this account. This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onDeleteAccount?.()}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-full transition-all active:scale-[0.98] focus:outline-none"
                    >
                      Permanently Delete Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 px-3.5 py-2 rounded-full transition-all active:scale-[0.98] focus:outline-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}