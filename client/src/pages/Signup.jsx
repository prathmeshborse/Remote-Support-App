// File path: client/src/pages/Signup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import AuthCard from "../components/auth/AuthCard";
import AuthInput from "../components/auth/AuthInput";

export default function Signup() {
    const navigate = useNavigate();

    const { agent, loading } = useAuth();

    useEffect(() => {
        if (agent && !loading) {
            navigate("/dashboard");
        }
    }, [agent, loading, navigate]);

    const { sendOTP, signUp } = useAuth();

    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // Consolidated sign up fields state
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        otp: "",
    });

    const { firstName, lastName, email, password, confirmPassword, otp } = formData;

    const handleInputChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    // Triggers secure email-OTP generation
    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) {
            alert("Please enter your email to receive an OTP.");
            return;
        }
        setOtpLoading(true);
        const success = await sendOTP(email);
        setOtpLoading(false);
        if (success) {
            setOtpSent(true);
        }
    };

    // Triggers total profile registration
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        if (!otp) {
            alert("Verification code is required to complete registration.");
            return;
        }
        await signUp(formData, navigate);
    };

    return (
        <AuthCard
            title="Create Support Account"
            description="Onboard as an authorized support technician."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dynamic Multi-column names */}
                <div className="grid grid-cols-2 gap-4">
                    <AuthInput
                        label="First Name"
                        name="firstName"
                        value={firstName}
                        onChange={handleInputChange}
                        placeholder="John"
                    />
                    <AuthInput
                        label="Last Name"
                        name="lastName"
                        value={lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                    />
                </div>

                <AuthInput
                    label="Email Address"
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    placeholder="name@company.com"
                />

                <AuthInput
                    label="Password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                />

                <AuthInput
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                />

                {/* Verification Trigger Segment */}
                <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                    {!otpSent ? (
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={otpLoading}
                            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-sm font-semibold tracking-wide active:scale-[0.98] disabled:opacity-50 transition-all focus:outline-none"
                        >
                            {otpLoading ? "Sending Code..." : "Send Verification OTP"}
                        </button>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center animate-fadeIn">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Verification OTP
                                </label>
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                                >
                                    Resend?
                                </button>
                            </div>
                            <AuthInput
                                name="otp"
                                value={otp}
                                onChange={handleInputChange}
                                maxLength="6"
                                placeholder="Enter 6-digit OTP"
                                className="text-center tracking-widest font-mono"
                            />
                        </div>
                    )}
                </div>

                {/* Central Registration Trigger Action */}
                <button
                    type="submit"
                    disabled={!otpSent}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold tracking-wide shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Complete Onboarding
                </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
                <p className="text-sm text-slate-500">
                    Already registered?{" "}
                    <Link
                        to="/login"
                        className="font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                        Return to Sign In
                    </Link>
                </p>
            </div>
        </AuthCard>
    );
}