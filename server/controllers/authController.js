// File path: server/controllers/authController.js
const Agent = require("../models/Agent");
const Profile = require("../models/Profile");
const OTP = require("../models/OTP");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const generateToken = require('../utils/generateToken');
const validator = require("validator");

const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const passwordChangedTemplate = require("../email_template/passwordChangedTemplate");
require("dotenv").config();


// @desc    Send otp wile registration
// @route   POST /api/auth/sendOTP
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if(!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const existingUser = await Agent.findOne({ email });

        if(existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already registered",
            });
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true,
        });

        await OTP.deleteMany({ email }); // each email has only one valid OTP at a time and avoids confusion
        await OTP.create({ email, otp });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });

    } catch (error) {
        console.error("Error while sending OTP (sendOTP):", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// @desc    Register a new Agent and their profile
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, otp } = req.body;

        // 1. Validation check
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }


        // 2. Check if the Agent already exists
        const existingAgent = await Agent.findOne({ email });
        if (existingAgent) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // OTP verification
        const otpDoc = await OTP.findOne({ email, otp });
        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }
        // Delete otp after successful verification
        await OTP.deleteMany({ email });

        // 3. Generate dynamic initials avatar URL using full name
        const seedName = `${firstName} ${lastName}`;
        const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seedName)}`;

        // 4. Create Profile (with default empty fields and our custom avatar)
        const profile = await Profile.create({
            phoneNumber: "",
            bio: "",
            avatarUrl: avatarUrl,
            organization: ""
        });

        // 5. Hash the password before saving (security standard)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Create Agent linked to the newly created Profile
        const agent = await Agent.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            additionalDetails: profile._id
        });

        // Query and populate the newly created Agent document to return a standard Mongoose shape
        const populatedAgent = await Agent.findById(agent._id)
            .populate("additionalDetails")
            .select("-password")
            .exec();

        // 7. Generate JWT Token
        const token = generateToken(agent.email, agent._id);
        const options = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        }
        res.cookie("token", token, options);

        // 8. Return response
        return res.status(201).json({
            success: true,
            message: "Agent registered successfully",
            agent: populatedAgent
        });

    } catch (error) {
        console.error("Signup Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// @desc    Authenticate Agent & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation check
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        // 2. Find Agent and Populate their Profile details
        const agent = await Agent.findOne({ email }).populate("additionalDetails");
        if (!agent) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 3. Compare entered password with stored hashed password
        const isMatch = await bcrypt.compare(password, agent.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Generate Token
        const token = generateToken(agent.email, agent._id);

        const options = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        }
            
        agent.password = undefined;
        
        res.cookie("token", token, options);

        // 5. Return response (with populated profile details)
        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            agent: agent
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// @desc    Clear active authentication cookie & logout Agent
// @route   POST /api/v1/auth/logout
// @access  Public
exports.logout = async (req, res) => {
    try {
        // Clear the HttpOnly session cookie cleanly
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        return res.status(200).json({
            success: true,
            message: "Cookie cleared. Logged out cleanly."
        });
    } catch (error) {
        console.error("Logout error in authController:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred during logout"
        });
    }
};


// @desc    Change password
// @route   POST /api/auth/changePassword
exports.changePassword = async (req, res) => {
    try{
        const {oldPassword, newPassword, confirmNewPassword} = req.body;
        const userId = req.user.id;

        if(!oldPassword || !newPassword || !confirmNewPassword){
            return res.status(400).json({
                success: false,
                message: "all fields are required"
            });
        }
        
        if(newPassword !== confirmNewPassword){
            return res.status(400).json({
                success: false,
                message: "password and confirm-password not matched"
            });
        }

        if(oldPassword === newPassword){
            return res.status(400).json({
                success: false,
                message: "New password must be different from old password",
            });
        }

        // Check user exits or not
        const existingUser = await Agent.findById(userId);
        
        if(!existingUser){
            return res.status(400).json({
                success: false,
                message: "No user with given email",
            });
        }
        
        const isMatch = await bcrypt.compare(oldPassword, existingUser.password.toString());

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }
        
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        existingUser.password = hashedPassword;
        await existingUser.save();

        // Send mail after successful passwrod change operation
        mailSender(existingUser.email, "Password changed successfully",
                     passwordChangedTemplate(`${existingUser.firstName} ${existingUser.lastName}`));

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch(error){
        console.log("Error in changePassword: ", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};