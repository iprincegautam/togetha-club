const MEMBER_EMAIL_WRAPPER_STYLE =
  'margin:0;padding:0;background:#f5edd8;font-family:Georgia,serif;color:#2c1810;'

const MEMBER_EMAIL_CARD_STYLE =
  'background:#fffef9;border:2px solid #2c1810;border-radius:4px;padding:28px 24px;box-shadow:4px 4px 0 #2c1810;'

function memberEmailShell(body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="${MEMBER_EMAIL_WRAPPER_STYLE}">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="${MEMBER_EMAIL_CARD_STYLE}">
      ${body}
      <p style="margin:28px 0 0;font-size:13px;color:#6b5344;font-style:italic;">— Togetha.Club</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#6b5344;margin-top:16px;">
      Questions? Reply to this email or write hello@togetha.club
    </p>
  </div>
</body>
</html>`
}

function memberCtaButton(href: string, label: string): string {
  return `<p style="margin:24px 0 0;text-align:center;">
  <a href="${href}" style="display:inline-block;background:#1a6b5a;color:#f5edd8;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:3px;border:2px solid #2c1810;box-shadow:3px 3px 0 #2c1810;">${label}</a>
</p>`
}

function credentialBox(email: string, password: string): string {
  return `<div style="margin:20px 0;padding:16px 18px;background:#f5edd8;border:1px dashed #2c1810;border-radius:4px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;">
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
    <p style="margin:0;"><strong>Temporary password:</strong> ${password}</p>
  </div>`
}

export function renderMemberWelcomeEmail(opts: {
  name: string
  email: string
  loginUrl: string
  settingsUrl: string
  temporaryPassword?: string
  existingAccount?: boolean
}): { subject: string; text: string; html: string } {
  const subject = '✦ Your Togetha.Club member login'

  if (opts.existingAccount) {
    const text = `Hi ${opts.name},

Your Togetha.Club payment is confirmed and linked to your account.

Log in to track your booking, complete your profile, and pay any remaining balance:
${opts.loginUrl}

Use the password you already set. Forgot it? Use "Forgot password" on the login page.

— Togetha.Club`

    const html = memberEmailShell(`
      <p style="margin:0 0 16px;font-size:16px;">Hi ${opts.name},</p>
      <p style="margin:0 0 16px;line-height:1.6;">Your payment is confirmed and your booking is now linked to your member account.</p>
      <p style="margin:0 0 8px;line-height:1.6;"><strong>How to log in</strong></p>
      <ol style="margin:0 0 16px;padding-left:20px;line-height:1.7;">
        <li>Go to the member portal</li>
        <li>Sign in with <strong>${opts.email}</strong> and your existing password</li>
        <li>Track your booking and complete your profile</li>
      </ol>
      ${memberCtaButton(opts.loginUrl, 'Log in to member portal →')}
    `)

    return { subject, text, html }
  }

  const text = `Hi ${opts.name},

Your Togetha.Club spot is confirmed. We created your member account so you can track your booking anytime.

Log in here:
${opts.loginUrl}

Email: ${opts.email}
Temporary password: ${opts.temporaryPassword}

How to get started:
1. Open the link above (or go to togetha.club/account/login)
2. Sign in with your email and temporary password
3. Set your own password under Account → Settings
4. Complete your profile and track your booking status

For security, please change your temporary password after your first login.

— Togetha.Club`

  const html = memberEmailShell(`
    <p style="margin:0 0 16px;font-size:16px;">Hi ${opts.name},</p>
    <p style="margin:0 0 16px;line-height:1.6;">Your spot is confirmed. We created your <strong>member account</strong> so you can track your booking, complete your profile, and pay any remaining balance — all in one place.</p>
    <p style="margin:0 0 8px;line-height:1.6;"><strong>Your login credentials</strong></p>
    ${credentialBox(opts.email, opts.temporaryPassword ?? '')}
    <p style="margin:0 0 8px;line-height:1.6;"><strong>How to log in</strong></p>
    <ol style="margin:0 0 16px;padding-left:20px;line-height:1.7;">
      <li>Click the button below (or visit togetha.club/account/login)</li>
      <li>Sign in with the email and temporary password above</li>
      <li>Go to <strong>Account → Settings</strong> and set your own password</li>
      <li>Complete your profile from the member dashboard</li>
    </ol>
    <p style="margin:0;font-size:13px;color:#6b5344;line-height:1.5;">For security, please change your temporary password after your first login.</p>
    ${memberCtaButton(opts.loginUrl, 'Log in to member portal →')}
    <p style="margin:16px 0 0;font-size:13px;color:#6b5344;text-align:center;">
      <a href="${opts.settingsUrl}" style="color:#1a6b5a;">Account settings</a> · change password anytime
    </p>
  `)

  return { subject, text, html }
}
