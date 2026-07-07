const passwordChangedTemplate = (name) => {
    return `
        <div style="font-family: Arial, sans-serif;">
            <h2>Password Changed Successfully</h2>

            <p>Hello ${name},</p>

            <p>
                Your password has been changed successfully.
            </p>

            <p>
                If you did not perform this action, please contact support immediately.
            </p>

            <br>

            <p>Regards,</p>
            <p><strong>EdTech Team</strong></p>
        </div>
    `;
};

module.exports = passwordChangedTemplate;