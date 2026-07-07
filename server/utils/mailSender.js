// File path: server/utils/mailSender.js
const nodeMailer = require("nodemailer");
require("dotenv").config();

const mailSender = async(email, title, body) =>{
    try{
        const transporter = nodeMailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 587, // Standard port for TLS
            secure: false, // Set to true for port 465, false for others
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        // Send the email and store the response
        const info = await transporter.sendMail({
            from: `"EdTech services" <${process.env.MAIL_USER}>`,
            to: email,
            subject: title,
            html: body,
        });

        return info;
    }
    catch(error){
        console.log("Error in mailSender: ", error);
        throw error; // Re-throw so the middleware knows it failed
    }
};

module.exports = mailSender;