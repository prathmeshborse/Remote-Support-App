// File path: client/src/providers/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import * as authService from "../services/operations/authAPI";
import * as profileService from "../services/operations/profileAPI";

const AuthContext = createContext(null);

/**
 * Custom hook to safely access Agent state across components
 * @returns {object} Auth Context Value
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be consumed within an AuthProvider wrapper");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verify active HTTP cookie session on application mount
    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                // Call the pure profile details service directly
                const result = await profileService.getAgentDetails();
                if (result?.success && result?.agent) {
                    setAgent(result.agent);
                }
            } catch (error) {
                // Initial check fails silently for unauthenticated or first-time users
                console.log("No active support session detected.");
            } finally {
                setLoading(false);
            }
        };

        checkActiveSession();
    }, []);

    // Action: Request OTP Code
    const sendOTP = async (email) => {
        const toastId = toast.loading("Sending verification code...");
        try {
            await authService.sendOTP(email);
            toast.success("Verification code sent to your email!");
            return true;
        } catch (error) {
            toast.error(error.message || "Failed to send OTP.");
            return false;
        } finally {
            toast.dismiss(toastId);
        }
    };

    // Action: Secure SignUp Flow (Auto-logs the user in on success)
    const signUp = async (formData, navigate) => {
        const toastId = toast.loading("Registering support account...");
        setLoading(true);
        try {
            // Capture the backend response containing the generated agent document
            const response = await authService.signUp(formData);
            
            if (response?.success && response?.agent) {
                // Populate global React state using the returned database object
                setAgent(response.agent); 
                
                toast.success("Account created! Logged in successfully.");
                navigate("/dashboard"); // Redirect directly to the dashboard, skipping the login screen
            }
        } catch (error) {
            toast.error(error.message || "Registration failed.");
        } finally {
            setLoading(false);
            toast.dismiss(toastId);
        }
    };

    // Action: Secure Log In Flow
    const login = async (email, password, navigate) => {
        const toastId = toast.loading("Signing in...");
        setLoading(true);
        try {
            const data = await authService.login(email, password);
            setAgent(data.agent); // Contains populated name, email, and Profile additional details
            toast.success("Logged in successfully!");
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.message || "Invalid credentials.");
        } finally {
            setLoading(false);
            toast.dismiss(toastId);
        }
    };

    // Action: Change Active Password (Private)
    const changePassword = async (oldPassword, newPassword, confirmNewPassword) => {
        const toastId = toast.loading("Updating password...");
        try {
            await authService.changePassword({ oldPassword, newPassword, confirmNewPassword });
            toast.success("Password changed successfully!");
            return true;
        } catch (error) {
            toast.error(error.message || "Failed to update password.");
            return false;
        } finally {
            toast.dismiss(toastId);
        }
    };

    // Action: Request Password Recovery Link
    const requestPasswordReset = async (email) => {
        const toastId = toast.loading("Generating recovery email...");
        try {
            await authService.resetPasswordToken(email);
            toast.success("Password recovery link sent! Check your inbox.");
            return true;
        } catch (error) {
            toast.error(error.message || "Failed to send recovery email.");
            return false;
        } finally {
            toast.dismiss(toastId);
        }
    };

    // Action: Submit Password Reset Verification
    const resetPassword = async (password, confirmPassword, token, navigate) => {
        const toastId = toast.loading("Saving new password...");
        try {
            await authService.resetPassword(password, confirmPassword, token);
            toast.success("Password reset successfully! You can now log in.");
            navigate("/login");
        } catch (error) {
            toast.error(error.message || "Failed to reset password.");
        } finally {
            toast.dismiss(toastId);
        }
    };

    // Action: Update Agent Account & Profile
    const updateAgentProfile = async (formData) => {
        const toastId = toast.loading("Saving profile changes...");
        try {
            const data = await profileService.updateProfile(formData);
            setAgent(data.agent); // Update the global context state with populated new details
            toast.success("Profile saved successfully!");
            return true;
        } catch (error) {
            toast.error(error.message || "Failed to save profile changes.");
            return false;
        } finally {
            toast.dismiss(toastId);
        }
    };

    // Action: Permanently Delete Account (Cascading Delete)
    const deleteAgentAccount = async (navigate) => {
        const toastId = toast.loading("Permanently closing your account...");
        try {
            await profileService.deleteAccount();
            setAgent(null); // Clear context reference
            toast.success("Your account and all support history have been permanently wiped.");
            navigate("/");
        } catch (error) {
            toast.error(error.message || "Failed to close account.");
        } finally {
            toast.dismiss(toastId);
        }
    };

    // Action: Clear Session Cookie on Backend & Reset Frontend Context
    const logout = async (navigate) => {
        const toastId = toast.loading("Logging out cleanly...");
        try {
            // Request the server to securely delete the HttpOnly JWT cookie
            await authService.logout();
            
            // Clear your global React state context
            setAgent(null);
            
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            toast.error("Logout failed. Please check your network.");
        } finally {
            toast.dismiss(toastId);
        }
    };

    const value = {
        agent,
        setAgent,
        loading,
        sendOTP,
        signUp,
        login,
        changePassword,
        requestPasswordReset,
        resetPassword,
        updateAgentProfile,
        deleteAgentAccount,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};