// File path: server/models/Profile.js
const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    phoneNumber: { 
        type: String, 
        trim: true 
    },
    bio: { 
        type: String, 
        trim: true 
    },
    avatarUrl: { 
        type: String, 
        trim: true,
        default: ""
    },
    organization: { 
        type: String, 
        trim: true 
    }
    
}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);