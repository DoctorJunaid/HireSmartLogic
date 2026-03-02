const sendVerificationTemplate = (verificationToken) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email — HireSmart</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.05);overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:32px 0 24px;border-bottom:1px solid #eaebed;">
              <span style="font-size:28px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">Hire<span style="color:#2563eb;">Smart</span></span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1e293b;text-align:center;">
                Verify your email address
              </h1>
              <p style="margin:0 0 32px;font-size:16px;color:#475569;text-align:center;line-height:24px;">
                Thank you for signing up for HireSmart. To complete your registration and activate your account, please use the verification code below.
              </p>

              <!-- Token Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px 40px;display:inline-block;">
                      <p style="margin:0;font-size:36px;font-weight:700;color:#0f172a;letter-spacing:8px;text-align:center;">
                        ${verificationToken}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:15px;color:#475569;text-align:center;line-height:24px;">
                Enter this code in the HireSmart app to verify your identity. This code will expire in <strong>24 hours</strong>.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">

              <!-- Footer Note -->
              <p style="margin:0;font-size:14px;color:#64748b;text-align:center;line-height:22px;">
                If you did not attempt to sign up for a HireSmart account, please disregard this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Outer Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td align="center" style="padding:24px 0;">
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:20px;">
                © ${new Date().getFullYear()} HireSmart. All rights reserved.<br>
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export default sendVerificationTemplate;