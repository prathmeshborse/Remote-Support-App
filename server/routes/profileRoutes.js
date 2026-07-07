// File path: server/routes/profileRoutes.js
const express = require("express");
const router = express.Router();

// Import controllers
const { 
    getAgentDetails, 
    updateProfile, 
    deleteAccount 
} = require("../controllers/profileController");

// Import authorization middleware
const { auth } = require("../middlewares/authMiddleware");

// All profile routes are private and protected by JWT auth
router.get("/details", auth, getAgentDetails);
router.put("/update", auth, updateProfile);
router.delete("/delete", auth, deleteAccount);

module.exports = router;