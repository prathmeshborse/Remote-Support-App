// File path: server/utils/generateToken.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper function to generate a secure JWT Token
const generateToken = (email, id) => {
    const payload = {
        email: email,
        id: id
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "30d" // Session is valid for 30 days
    });
};

module.exports = generateToken;