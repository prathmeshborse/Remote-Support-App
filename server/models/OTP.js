// File path: server/models/OTP.js
const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const otpTemplate = require("../email_template/otpTemplate");

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { 
        type: Date,
        default: Date.now, // Removed ()
        expires: 5 * 60 // 5 minutes
    },
});


// async funciton to send email.
async function sendVerificationEmail(email, otp) {
    try{
        const mailResponse = await mailSender(email, "Verification email from remote service", otpTemplate(otp));
        // console.log("OTP sent successfully!");
    }
    catch(error){
        console.log("Error While sending mail for otp verification: ", error);
        throw error;
    }
};

// pre Save middleware befor saving otp in db
otpSchema.pre('save', async function(){
    try {
        // Only send an email when a new document is created
        if (this.isNew) {
            await sendVerificationEmail(this.email, this.otp);
        }
        // No next() needed here for async functions
    } catch (error) {
        console.log("Error occurred while sending mail: ", error);
        throw error; // Throwing error stops the save process
    }
});


//If sendVerificationEmail throws an error and you pass it into next(error), Mongoose will stop the saving process.
//This prevents "orphaned" OTPs in your database where a user has a code saved in the DB but never actually received the email.

module.exports = mongoose.model("OTP", otpSchema);

// File Name: OTP.js