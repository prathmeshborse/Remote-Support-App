// File path: server/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = async (req, res, next) => {
    try {
        const token = 
            req.cookies?.token || 
            (req.header("Authorization") ? req.header("Authorization").replace("Bearer ", "") : null);

        if (!token)
            return res.status(401).json({ success: false, message: "JWT Token is missing"});

        // 3. Verify token
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        
        // 4. CALL NEXT() HERE - Everything is successful
        next();
    } 
    catch (error) {
        console.log("Error in auth middleware: ", error);
        return res.status(401).json({
            success: false,
            message: "invalid or expired token"
        });
    }
};

// File name: authMiddleware.js