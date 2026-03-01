const getResetPasswordTemplate = (resetToken) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password — HireSmart</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d12;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d12;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#2a9cff,#0c7be8);border-radius:16px;padding:12px 24px;">
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Hire<span style="color:#bde0ff;">Smart</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1a1b25;border-radius:20px;padding:40px 36px;border:1px solid #272835;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:64px;height:64px;background:linear-gradient(135deg,#1e3a52,#0c4e6e);border-radius:50%;display:inline-block;text-align:center;line-height:64px;font-size:28px;">🔐</div>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.3px;">
                Reset Your Password
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#818898;text-align:center;line-height:22px;">
                We received a request to reset your password.<br>Use the token below in the HireSmart app.
              </p>

              <!-- Token Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="background:linear-gradient(135deg,#0f2033,#0c1e30);border:1px solid #2a9cff;border-radius:14px;padding:24px 40px;display:inline-block;">
                      <p style="margin:0 0 6px;font-size:11px;color:#818898;letter-spacing:2px;text-transform:uppercase;text-align:center;">Your Reset Code</p>
                      <p style="margin:0;font-size:48px;font-weight:700;color:#2a9cff;letter-spacing:12px;text-align:center;line-height:60px;">${resetToken}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#1e1510;border:1px solid #5c3d1f;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#ffbe4c;line-height:20px;">
                      ⏱ &nbsp;This token expires in <strong>15 minutes</strong>. Do not share it with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #272835;margin:0 0 24px;">

              <!-- Footer note -->
              <p style="margin:0;font-size:12px;color:#666d80;text-align:center;line-height:20px;">
                If you didn't request a password reset, you can safely ignore this email.<br>
                Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Bottom footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#36394a;">
                © ${new Date().getFullYear()} HireSmart. All rights reserved.
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

export default getResetPasswordTemplate;