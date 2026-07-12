// File path: client/src/components/core/Dashboard/AgentProfileDrawer.jsx
import React, { useState } from "react";
import { X, Trash2, Key } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AgentProfileDrawer({
    isOpen,
    onClose,
    agent,
    onSave,
    onDeleteAccount,
    onPasswordChange // New prop callback to handle security updates
}) {
    // 1. Isolated Profile details form state
    const [profileForm, setProfileForm] = useState({
        firstName: agent?.firstName || "",
        lastName: agent?.lastName || "",
        organization: agent?.additionalDetails?.organization || "",
        phone: agent?.additionalDetails?.phoneNumber || "",
        bio: agent?.additionalDetails?.bio || "",
    });

    // 2. Isolated Password form state to prevent form submittal conflicts
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });

    const { oldPassword, newPassword, confirmNewPassword } = passwordForm;

    const [confirmingDelete, setConfirmingDelete] = useState(false);

    // Form changers
    const handleProfileChange = (field) => (e) =>
        setProfileForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handlePasswordChange = (field) => (e) =>
        setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }));

    // Profile Save Submitter
    const handleProfileSubmit = (e) => {
        e.preventDefault();
        onSave?.(profileForm);
        onClose();
    };

    // Password Update Submitter
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // Local Validations
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            toast.error("Please fill in all password fields.");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        if (oldPassword === newPassword) {
            toast.error("New password must be different from your current password.");
            return;
        }

        // Call the parent callback to hit your backend JWT protected route [1.1.2]
        const success = await onPasswordChange?.(passwordForm);

        if (success) {
            // Clean up local RAM states to prevent credential exposure [1.1.2]
            setPasswordForm({
                oldPassword: "",
                newPassword: "",
                confirmNewPassword: ""
            });
        }
    };

    return (
        <>
            {/* Dynamic Drawer Backdrop Overlay */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            />

            {/* Slide-over Form Panel Container */}
            <aside
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl border-l border-slate-100 transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
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

                    {/* Scrollable Panel Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

                        {/* 1. Main Profile details form */}
                        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.firstName}
                                        onChange={handleProfileChange("firstName")}
                                        className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.lastName}
                                        onChange={handleProfileChange("lastName")}
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
                                    value={profileForm.organization}
                                    onChange={handleProfileChange("organization")}
                                    className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    onChange={handleProfileChange("phone")}
                                    className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Bio Profile
                                </label>
                                <textarea
                                    rows={3}
                                    value={profileForm.bio}
                                    onChange={handleProfileChange("bio")}
                                    className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-full shadow-md shadow-blue-500/10 active:scale-[0.98] focus:outline-none"
                            >
                                Save Profile Changes
                            </button>
                        </form>

                        {/* 2. Security & Credentials Section (New!) */}
                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                                <Key className="w-3.5 h-3.5 text-blue-600" />
                                <span>Security Settings</span>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={handlePasswordChange("oldPassword")}
                                        placeholder="••••••••"
                                        required
                                        className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={handlePasswordChange("newPassword")}
                                        placeholder="••••••••"
                                        required
                                        className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmNewPassword}
                                        onChange={handlePasswordChange("confirmNewPassword")}
                                        placeholder="••••••••"
                                        required
                                        className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-full active:scale-[0.98] focus:outline-none transition-all"
                                >
                                    Update Password
                                </button>
                            </form>
                        </div>

                        {/* 3. Cascading Destructive action zone */}
                        <div className="pt-6 border-t border-slate-100">
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

                    </div>
                </div>
            </aside>
        </>
    );
}