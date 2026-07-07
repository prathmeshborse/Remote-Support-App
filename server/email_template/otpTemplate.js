const otpTemplate = (otp) => {
    return `
        <div style="font-family: Arial, sans-serif;">
            <h2>Email Verification</h2>

            <p>Your OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP will expire in 5 minutes.</p>
        </div>
    `;
};

module.exports = otpTemplate;