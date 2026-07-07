// File path: server/config/cloudinary.js
const cloudinary = require("cloudinary").v2;

exports.cloudinaryConnect = function(){
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
    });
};
// File name: cloudinary.js