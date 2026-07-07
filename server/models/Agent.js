// File path: server/models/Agent.js
const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: [true, "First name is required"], 
        trim: true 
    },
    lastName: { 
        type: String, 
        required: [true, "Last name is required"], 
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        trim: true, 
        unique: true, 
        lowercase: true,
        match: [ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"]
    },
    password: { type: String, required: [true, "Password is required"] },
    
    // One-to-One relationship referencing the additional profile details
    additionalDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        required: true
    },

    token: { 
        type: String 
    },
    resetPasswordExpires: { 
        type: Date 
    }

}, { timestamps: true });

module.exports = mongoose.model("Agent", agentSchema);