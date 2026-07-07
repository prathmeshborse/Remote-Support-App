// File path: server/email_template/supportInvitationTemplate.js

const supportInvitationTemplate = (url, firstName, lastName) => {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Remote Support Session Invitation</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f3f4f6;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }
            .header {
                font-size: 22px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 24px;
                border-bottom: 2px solid #f3f4f6;
                padding-bottom: 16px;
            }
            .content {
                font-size: 16px;
                color: #374151;
                line-height: 1.6;
                margin-bottom: 32px;
            }
            .btn-container {
                text-align: center;
                margin: 32px 0;
            }
            .btn {
                display: inline-block;
                background-color: #2563eb;
                color: #ffffff !important;
                padding: 14px 32px;
                font-size: 16px;
                font-weight: 600;
                text-decoration: none;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
            }
            .link-alt {
                font-size: 14px;
                color: #6b7280;
                word-break: break-all;
                background-color: #f9fafb;
                padding: 12px;
                border-radius: 6px;
                border: 1px dashed #e5e7eb;
            }
            .footer {
                font-size: 12px;
                color: #9ca3af;
                margin-top: 40px;
                border-top: 1px solid #f3f4f6;
                padding-top: 24px;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">Remote Support Session invitation</div>
            <div class="content">
                <p>Hello,</p>
                <p>Agent <strong>${firstName} ${lastName}</strong> has initialized a secure remote support and screen-sharing workspace to help troubleshoot your technical issue.</p>
                <p>To join the session directly, click the button below. You will be prompted to type a temporary screen name and grant permission to share your screen upon joining.</p>
                
                <div class="btn-container">
                    <a href="${url}" class="btn" target="_blank">Join Support Room</a>
                </div>

                <p>If the button doesn't work, copy and paste this URL directly into your web browser's address bar:</p>
                <div class="link-alt">
                    <a href="${url}" target="_blank" style="color: #2563eb; text-decoration: none;">${url}</a>
                </div>
            </div>
            <div class="footer">
                This is an automated support notification sent securely from your agent's administration panel. For security and privacy, do not forward or share this link with unauthorized third parties.
            </div>
        </div>
    </body>
    </html>`;
};

module.exports = supportInvitationTemplate;