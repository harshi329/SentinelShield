import nodemailer from "nodemailer";

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });

const OTP_STYLE = `
  font-family: 'Segoe UI', sans-serif;
  background: #0F172A;
  color: #E2E8F0;
  padding: 0;
  margin: 0;
`;

const buildEmail = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="${OTP_STYLE}">
  <div style="max-width:520px;margin:40px auto;background:#1E293B;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0EA5E9,#2563EB);padding:32px 40px 28px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="background:rgba(255,255,255,0.2);border-radius:10px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;">🛡️</div>
        <div>
          <div style="font-size:20px;font-weight:700;color:#fff;">SentinelShield</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);">Advanced Security Platform</div>
        </div>
      </div>
    </div>
    <!-- Body -->
    <div style="padding:36px 40px;">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#F8FAFC;">${title}</h2>
      ${body}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#475569;">
        This email was sent by SentinelShield. If you did not request this, ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
`;

export const sendOTPEmail = async (
  to: string,
  name: string,
  otp: string,
  type: "login" | "change-password"
): Promise<void> => {
  const isLogin = type === "login";
  const subject = isLogin
    ? "SentinelShield — Your Login OTP"
    : "SentinelShield — Password Change Verification";

  const title = isLogin ? "Verify Your Login" : "Confirm Password Change";

  const body = `
    <p style="color:#94A3B8;font-size:14px;margin:0 0 28px;line-height:1.6;">
      ${isLogin
        ? `Hi <strong style="color:#E2E8F0;">${name}</strong>, use the OTP below to complete your login. It expires in <strong style="color:#38BDF8;">10 minutes</strong>.`
        : `Hi <strong style="color:#E2E8F0;">${name}</strong>, use this OTP to confirm your password change. It expires in <strong style="color:#38BDF8;">10 minutes</strong>.`
      }
    </p>
    <!-- OTP Box -->
    <div style="background:#0F172A;border:1px solid rgba(56,189,248,0.3);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#64748B;margin-bottom:16px;">Your One-Time Password</div>
      <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#38BDF8;font-family:monospace;">${otp}</div>
      <div style="margin-top:14px;font-size:12px;color:#475569;">Valid for 10 minutes · Do not share this code</div>
    </div>
    <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:12px 16px;font-size:12px;color:#FCA5A5;">
      🔒 Never share this OTP with anyone. SentinelShield will never ask for it.
    </div>
  `;

  await getTransporter().sendMail({
    from: `"SentinelShield Security" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: buildEmail(title, body),
  });
};

export const sendPasswordChangedEmail = async (
  to: string,
  name: string
): Promise<void> => {
  const body = `
    <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;line-height:1.6;">
      Hi <strong style="color:#E2E8F0;">${name}</strong>, your SentinelShield password was successfully changed.
    </p>
    <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:28px;margin-bottom:8px;">✅</div>
      <div style="font-size:15px;font-weight:600;color:#86EFAC;">Password Changed Successfully</div>
      <div style="font-size:12px;color:#64748B;margin-top:6px;">${new Date().toLocaleString()}</div>
    </div>
    <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:12px 16px;font-size:12px;color:#FCA5A5;">
      ⚠️ If you did not make this change, contact your administrator immediately.
    </div>
  `;

  await getTransporter().sendMail({
    from: `"SentinelShield Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: "SentinelShield — Password Changed",
    html: buildEmail("Password Changed", body),
  });
};
