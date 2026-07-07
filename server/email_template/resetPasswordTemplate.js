const resetPasswordTemplate = (url) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reset Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px;">
            
            <h2 style="color: #333;">Reset Your Password</h2>
            
            <p>Hello,</p>
            
            <p>
                We received a request to reset the password for your EdTech account.
            </p>

            <p>
                Click the button below to create a new password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a
                    href="${url}"
                    style="
                        background-color: #2563eb;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                    "
                >
                    Reset Password
                </a>
            </div>

            <p>
                If the button above doesn't work, copy and paste the following link into your browser:
            </p>

            <p style="word-break: break-all;">
                <a href="${url}">${url}</a>
            </p>

            <p>
                This link will expire shortly for security reasons.
            </p>

            <p>
                If you did not request a password reset, you can safely ignore this email.
            </p>

            <br>

            <p>Regards,</p>
            <p><strong>EdTech Team</strong></p>

        </div>

    </body>
    </html>
    `;
};

module.exports = resetPasswordTemplate;