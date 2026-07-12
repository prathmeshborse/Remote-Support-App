// File path: server/controllers/resetPasswordController.js
const Agent = require("../models/Agent");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mailSender = require("../utils/mailSender");
const resetPasswordTemplate = require("../email_template/resetPasswordTemplate");
require("dotenv").config();


// @desc    reset password link(token) generation
// @route   POST /api/auth/reset-password-token
exports.resetPasswordToken = async(req, res) => {
    try {
        const {email} = req.body;
        if(!email)
            return res.status(400).json({ success: false, message: "Email is required"});

        const agent = await Agent.findOne({email});
        if (!agent) {
            // Security: Don't tell the user the email doesn't exist.
            // This prevents "Account Enumeration" attacks.
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, we have sent a reset password link.",
            });
        }

        const token = crypto.randomUUID();
        await Agent.findOneAndUpdate(
            {email: email},
            {token: token, resetPasswordExpires: Date.now() + 5 * 60 * 1000 },
            // {returnDocument: "after"},
        );

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const url = `${frontendUrl}/reset-password/${token}`;

        await mailSender(email, "Password Reset Link", resetPasswordTemplate(url));
        return res.status(200).json({
            success: true,
            message: "Password reset link sent successfully",
        });

    } catch (error) {
        console.error("RESET PASSWORD TOKEN ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending the reset mail",
        });
    }
};


// @desc    reset password 
// @route   POST /api/auth/reset-password
exports.resetPassword = async(req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;

        // 1. Validation
        if (!password || !confirmPassword || !token)
            return res.status(400).json({ success: false, message: "All fields are required" });

        if (password !== confirmPassword)
            return res.status(400).json({ success: false, message: "Passwords do not match" });

        // 2. Find user by token
        const agent = await Agent.findOne({ token: token });
        if (!agent)
            return res.status(400).json({ success: false, message: "Invalid reset link" });

        if(agent.resetPasswordExpires < Date.now())
            return res.status(400).json({ success: false, message: "Reset link has expired. Please request a new one." });

        const salt = await bcrypt.genSalt(12); 
        const hashPassword = await bcrypt.hash(password, salt);

        agent.password = hashPassword;
        agent.token = undefined;
        agent.resetPasswordExpires = undefined;

        await agent.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. You can now log in."
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during password reset",
        });
        
    }
};