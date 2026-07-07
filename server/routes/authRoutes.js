// File path: server/routes/authRoutes.js
const express = require("express");
const router = express.Router();

// Import controllers
const { 
    sendOTP, 
    signup, 
    login, 
    changePassword 
} = require("../controllers/authController");

const {resetPasswordToken, resetPassword} = require("../controllers/resetPasswordController");


// Import authorization middleware
const { auth } = require("../middlewares/authMiddleware");

// Public Routes (Accessible by anyone)
router.post("/sendOTP", sendOTP);
router.post("/signup", signup);
router.post("/login", login);

// Private Routes (Protected; requires a valid JWT cookie or authorization header)
router.post("/changePassword", auth, changePassword);


// Public routes(Reset Password)
router.post("/reset-password-token", resetPasswordToken);
router.post("/reset-password", resetPassword);

module.exports = router;