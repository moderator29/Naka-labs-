import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.FROM_EMAIL ?? 'alerts@steinzlabs.com';
const APP_NAME       = 'Steinz Labs';

interface EmailPayload {
  to:       string;
  subject:  string;
  html:     string;
}

async function sendEmail({ to, subject, html }: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: `${APP_NAME} <${FROM_EMAIL}>`, to: [to], subject, html }),
  });

  if (res.ok) {
    const data = await res.json();
    return { success: true, id: data.id };
  }
  const err = await res.text();
  console.error('[email] Resend error:', err);
  return { success: false, error: err };
}

// ── Email templates ──────────────────────────────────────────────────────────

function alertTriggeredHtml(alertName: string, symbol: string, price: number, condition: string, target: number) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #030912; color: #EEF2FF; margin: 0; padding: 20px; }
  .container { max-width: 480px; margin: 0 auto; background: #0D1A2B; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #1B4FFF, #00C6FF); padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; color: white; }
  .body { padding: 28px; }
  .stat { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .stat-label { color: #6B84A8; font-size: 13px; }
  .stat-value { font-weight: 700; font-size: 14px; }
  .btn { display: block; text-align: center; background: #1B4FFF; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-top: 20px; }
  .footer { text-align: center; color: #3D5270; font-size: 11px; padding: 16px; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>🚨 Alert Triggered</h1></div>
    <div class="body">
      <p style="color:#EEF2FF;font-size:16px;margin-bottom:20px">
        Your alert <strong>"${alertName}"</strong> has been triggered.
      </p>
      <div class="stat">
        <span class="stat-label">Token</span>
        <span class="stat-value">${symbol}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Current Price</span>
        <span class="stat-value" style="color:#00C874">$${price.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Condition</span>
        <span class="stat-value">${condition} $${target.toLocaleString()}</span>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.steinzlabs.com'}/alerts" class="btn">
        Manage Alerts →
      </a>
    </div>
    <div class="footer">© ${new Date().getFullYear()} ${APP_NAME} · <a href="#" style="color:#1B4FFF">Unsubscribe</a></div>
  </div>
</body>
</html>`;
}

function welcomeHtml(walletAddress: string) {
  const short = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #030912; color: #EEF2FF; margin: 0; padding: 20px; }
  .container { max-width: 480px; margin: 0 auto; background: #0D1A2B; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #1B4FFF, #00C6FF); padding: 32px; text-align: center; }
  .logo { font-size: 28px; font-weight: 900; color: white; letter-spacing: -0.5px; }
  .body { padding: 28px; }
  .feature { display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start; }
  .feature-icon { background: rgba(27,79,255,0.15); border-radius: 8px; padding: 8px; font-size: 18px; flex-shrink: 0; }
  .btn { display: block; text-align: center; background: linear-gradient(135deg,#1B4FFF,#00C6FF); color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-top: 24px; }
  .footer { text-align: center; color: #3D5270; font-size: 11px; padding: 16px; }
</style></head>
<body>
  <div class="container">
    <div class="header"><div class="logo">STEINZ LABS</div><p style="color:rgba(255,255,255,0.7);margin:8px 0 0">Next-Gen Crypto Intelligence</p></div>
    <div class="body">
      <p style="font-size:16px;margin-bottom:24px">Welcome! Your wallet <strong>${short}</strong> is now connected.</p>
      <div class="feature"><div class="feature-icon">🧠</div><div><strong>VTX AI</strong><br><span style="color:#6B84A8;font-size:13px">Real-time on-chain analysis powered by Claude AI</span></div></div>
      <div class="feature"><div class="feature-icon">📡</div><div><strong>Context Feed</strong><br><span style="color:#6B84A8;font-size:13px">Live whale movements, smart money signals, rug warnings</span></div></div>
      <div class="feature"><div class="feature-icon">🔐</div><div><strong>DNA Analyzer</strong><br><span style="color:#6B84A8;font-size:13px">Deep-dive any wallet's trading history and risk profile</span></div></div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.steinzlabs.com'}/dashboard" class="btn">
        Open Dashboard →
      </a>
    </div>
    <div class="footer">© ${new Date().getFullYear()} Steinz Labs</div>
  </div>
</body>
</html>`;
}

// ── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/notifications/email
 * body: { type: 'alert_triggered' | 'welcome', to: string, ...payload }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to } = body;

    if (!to || !type) {
      return NextResponse.json({ error: 'type and to are required' }, { status: 400 });
    }

    let subject = '';
    let html    = '';

    switch (type) {
      case 'alert_triggered': {
        const { alertName, symbol, price, condition, target } = body;
        subject = `🚨 Alert: ${symbol} price ${condition} $${target?.toLocaleString()}`;
        html    = alertTriggeredHtml(alertName, symbol, price, condition, target);
        break;
      }
      case 'welcome': {
        const { walletAddress } = body;
        subject = `Welcome to ${APP_NAME} 🚀`;
        html    = welcomeHtml(walletAddress);
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, html });
    return NextResponse.json(result, { status: result.success ? 200 : 503 });
  } catch (err) {
    console.error('Email route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
