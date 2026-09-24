import nodemailer, { Transporter } from 'nodemailer';

// Envio via Gmail (SMTP) com "senha de app" da conta do VAMO.
// Sem SMTP_USER/SMTP_PASS o envio é pulado com log — nunca derruba a rota.
const env = () => {
    const user = process.env.SMTP_USER;
    return {
        user,
        pass: process.env.SMTP_PASS,
        from: process.env.MAIL_FROM || (user ? `VAMO <${user}>` : ''),
        appUrl: (process.env.APP_BASE_URL || 'http://localhost:8081').replace(/\/$/, ''),
    };
};

let transporter: Transporter | null = null;
function getTransporter(): Transporter | null {
    const { user, pass } = env();
    if (!user || !pass) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    }
    return transporter;
}

export function isMailerConfigured(): boolean {
    const { user, pass } = env();
    return !!(user && pass);
}

const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
    const button = cta
        ? `<p style="margin:28px 0"><a href="${cta.url}" style="background:#28C9BF;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;display:inline-block">${escapeHtml(cta.label)}</a></p>`
        : '';
    return `<!doctype html><html><body style="margin:0;background:#F4F7FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1A3263">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#28C9BF,#1A3263);padding:24px 28px;color:#fff;font-size:24px;font-weight:800;letter-spacing:1px">VAMO</td></tr>
<tr><td style="padding:28px">
<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>
${bodyHtml}${button}
<p style="font-size:13px;color:#6B7A90;margin-top:32px">Dúvidas? Responda este e-mail ou escreva para ${escapeHtml(env().user || 'vamoappviagens@gmail.com')}.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string, text: string): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
        console.warn(`[mailer] SMTP não configurado — e-mail "${subject}" para ${to} não enviado`);
        return false;
    }
    try {
        const { from, user } = env();
        await t.sendMail({ from, to, subject, html, text, replyTo: user });
        console.log(`[mailer] enviado "${subject}" → ${to}`);
        return true;
    } catch (err: any) {
        console.error(`[mailer] falha ao enviar "${subject}" → ${to}:`, err?.message || err);
        return false;
    }
}

export function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const first = (name || '').trim().split(/\s+/)[0] || 'viajante';
    const url = `${env().appUrl}/`;
    const html = layout(
        `Bem-vindo(a) ao VAMO, ${first}!`,
        `<p style="line-height:1.6">Sua conta está pronta. No VAMO você encontra roteiros completos, feitos por quem já viveu o destino — com voos, hospedagem, passeios, custos e checklist.</p>`,
        { label: 'Explorar roteiros', url },
    );
    const text = `Bem-vindo(a) ao VAMO, ${first}! Sua conta está pronta. Explore roteiros: ${url}`;
    return send(to, 'Bem-vindo(a) ao VAMO ✈️', html, text);
}

export function sendPurchaseConfirmationEmail(opts: {
    to: string;
    name: string;
    itineraryId: string;
    itineraryTitle: string;
    amountTotal?: number | null;
    currency?: string | null;
}): Promise<boolean> {
    const first = (opts.name || '').trim().split(/\s+/)[0] || 'viajante';
    const url = `${env().appUrl}/purchased-itinerary/${encodeURIComponent(opts.itineraryId)}`;
    const amount =
        opts.amountTotal != null && opts.currency
            ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: opts.currency.toUpperCase() }).format(opts.amountTotal / 100)
            : null;
    const html = layout(
        'Compra confirmada! 🎉',
        `<p style="line-height:1.6">Oi, ${escapeHtml(first)}! Seu roteiro já está liberado:</p>
<p style="font-size:17px;font-weight:700;margin:12px 0">${escapeHtml(opts.itineraryTitle)}</p>
${amount ? `<p style="color:#6B7A90;margin:0">Valor pago: <strong style="color:#1A3263">${amount}</strong></p>` : ''}
<p style="line-height:1.6;margin-top:16px">Ele fica para sempre em <strong>Meus Roteiros</strong>. O recibo do pagamento chega em um e-mail separado da Stripe.</p>`,
        { label: 'Abrir meu roteiro', url },
    );
    const text = `Compra confirmada! Seu roteiro "${opts.itineraryTitle}" já está liberado${amount ? ` (valor pago: ${amount})` : ''}. Abrir: ${url}`;
    return send(opts.to, `Seu roteiro está liberado: ${opts.itineraryTitle}`, html, text);
}

export function buildPasswordResetUrl(rawToken: string): string {
    return `${env().appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export function sendPasswordResetEmail(opts: { to: string; name: string; resetUrl: string; expiresInMinutes: number }): Promise<boolean> {
    const first = (opts.name || '').trim().split(/\s+/)[0] || 'viajante';
    const m = opts.expiresInMinutes;
    const validity = m % 60 === 0 ? `${m / 60} hora${m > 60 ? 's' : ''}` : `${m} minutos`;
    const html = layout(
        'Redefina sua senha no VAMO',
        `<p style="line-height:1.6">Oi, ${escapeHtml(first)}! Recebemos uma solicitação para redefinir a senha da sua conta.</p>
<p style="line-height:1.6">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>${validity}</strong> e só pode ser usado uma vez.</p>`,
        { label: 'Redefinir minha senha', url: opts.resetUrl },
    ).replace(
        '<p style="font-size:13px;color:#6B7A90;margin-top:32px">',
        `<p style="font-size:13px;color:#6B7A90;line-height:1.6">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all">${escapeHtml(opts.resetUrl)}</span></p>
<p style="font-size:13px;color:#6B7A90;line-height:1.6">Se não foi você quem pediu, é só ignorar este e-mail: sua senha continua a mesma.</p>
<p style="font-size:13px;color:#6B7A90;margin-top:32px">`,
    );
    const text = [
        `Oi, ${first}!`,
        'Recebemos uma solicitação para redefinir a senha da sua conta no VAMO.',
        `Crie uma nova senha por este link (expira em ${validity} e só pode ser usado uma vez):`,
        opts.resetUrl,
        'Se não foi você quem pediu, ignore este e-mail: sua senha continua a mesma.',
    ].join('\n\n');
    return send(opts.to, 'Redefina sua senha no VAMO', html, text);
}
