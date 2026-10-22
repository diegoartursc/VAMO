import nodemailer, { Transporter } from 'nodemailer';
import { BASE_CURRENCY, BASE_LOCALE, BASE_TIMEZONE, BASE_TIMEZONE_LABEL } from '@vamo/shared/itinerary';

// Único ponto de envio de e-mail do VAMO: Gmail (SMTP) com "senha de app".
// Sem SMTP_USER/SMTP_PASS o envio é pulado com log. Nenhuma função daqui lança
// erro: a ação de negócio (venda, aprovação, resposta…) nunca falha por e-mail.
// Trocar de provedor (ex.: Resend com domínio próprio) = trocar só getTransporter().
const env = () => {
    const user = process.env.SMTP_USER;
    return {
        user,
        pass: process.env.SMTP_PASS,
        from: process.env.MAIL_FROM || (user ? `VAMO <${user}>` : ''),
        appUrl: (process.env.APP_BASE_URL || 'http://localhost:8081').replace(/\/$/, ''),
        adminUrl: (process.env.ADMIN_APP_URL || '').replace(/\/$/, ''),
        adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || user || '',
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
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const firstName = (name?: string | null, fallback = 'traveler') => (name || '').trim().split(/\s+/)[0] || fallback;

const appLink = (path: string) => `${env().appUrl}${path.startsWith('/') ? path : `/${path}`}`;

const supportEmail = () => env().user || 'vamoappviagens@gmail.com';

/** `amount` em unidades da moeda (29.9 = $29.90), nunca em centavos. */
export function formatMoney(amount: number | null | undefined, currency?: string | null): string | null {
    if (amount == null || !Number.isFinite(amount)) return null;
    return new Intl.NumberFormat(BASE_LOCALE, { style: 'currency', currency: (currency || BASE_CURRENCY).toUpperCase() }).format(amount);
}

const P = (html: string) => `<p style="line-height:1.6;margin:0 0 14px">${html}</p>`;
const HIGHLIGHT = (text: string) => `<p style="font-size:17px;font-weight:700;margin:12px 0 16px">${escapeHtml(text)}</p>`;
const QUOTE = (label: string, text: string) =>
    `<div style="background:#F4F7FA;border-left:4px solid #28C9BF;border-radius:8px;padding:12px 16px;margin:0 0 14px">
<div style="font-size:12px;color:#6B7A90;margin-bottom:4px">${escapeHtml(label)}</div>
<div style="line-height:1.6;white-space:pre-wrap">${escapeHtml(text)}</div></div>`;
const ROWS = (rows: Array<[string, string | null | undefined]>) =>
    `<table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px">${rows
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `<tr><td style="color:#6B7A90;padding:3px 16px 3px 0">${escapeHtml(k)}</td><td style="font-weight:600">${escapeHtml(String(v))}</td></tr>`)
        .join('')}</table>`;

function layout(opts: { title: string; body: string; cta?: { label: string; url: string }; footer?: string }): string {
    const button = opts.cta
        ? `<p style="margin:24px 0"><a href="${escapeHtml(opts.cta.url)}" style="background:#28C9BF;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;display:inline-block">${escapeHtml(opts.cta.label)}</a></p>`
        : '';
    return `<!doctype html><html><body style="margin:0;background:#F4F7FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1A3263">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#28C9BF,#1A3263);padding:24px 28px;color:#fff;font-size:24px;font-weight:800;letter-spacing:1px">VAMO</td></tr>
<tr><td style="padding:28px">
<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(opts.title)}</h1>
${opts.body}${button}${opts.footer || ''}
<p style="font-size:13px;color:#6B7A90;margin-top:32px">Questions? Reply to this email or write to ${escapeHtml(supportEmail())}.</p>
</td></tr></table></td></tr></table></body></html>`;
}

const FOOTNOTE = (html: string) => `<p style="font-size:13px;color:#6B7A90;line-height:1.6;margin:0 0 10px">${html}</p>`;

async function send(to: string | null | undefined, subject: string, html: string, text: string): Promise<boolean> {
    if (!to) {
        console.warn(`[mailer] sem destinatário — "${subject}" não enviado`);
        return false;
    }
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

const textOf = (...lines: Array<string | null | undefined | false>) => lines.filter(Boolean).join('\n\n');

// ─── Viajante ───────────────────────────────────────────────────

export function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const first = firstName(name);
    const url = appLink('/');
    const html = layout({
        title: `Welcome to VAMO, ${first}!`,
        body: P('Your account is ready. On VAMO you\'ll find complete itineraries made by people who have actually been there — with flights, lodging, tours, costs and a checklist.'),
        cta: { label: 'Explore itineraries', url },
    });
    return send(to, 'Welcome to VAMO ✈️', html, textOf(`Welcome to VAMO, ${first}!`, 'Your account is ready.', `Explore itineraries: ${url}`));
}

export function sendPurchaseConfirmationEmail(opts: {
    to: string;
    name: string;
    itineraryId: string;
    itineraryTitle: string;
    /** Em unidades da moeda (ex.: 29.9), não em centavos. */
    amount?: number | null;
    currency?: string | null;
}): Promise<boolean> {
    const first = firstName(opts.name);
    const url = appLink(`/purchased-itinerary/${encodeURIComponent(opts.itineraryId)}`);
    const amount = formatMoney(opts.amount, opts.currency);
    const html = layout({
        title: 'Purchase confirmed! 🎉',
        body: P(`Hi ${escapeHtml(first)}! Your itinerary is ready:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + (amount ? P(`Amount paid: <strong>${escapeHtml(amount)}</strong>`) : '')
            + P('It stays in <strong>My Itineraries</strong> for good. Your payment receipt arrives in a separate email from Stripe.'),
        cta: { label: 'Open my itinerary', url },
    });
    return send(opts.to, `Your itinerary is ready: ${opts.itineraryTitle}`, html,
        textOf(`Purchase confirmed! Your itinerary "${opts.itineraryTitle}" is ready.`, amount && `Amount paid: ${amount}`, `Open: ${url}`));
}

export function sendPurchaseAutoRefundEmail(opts: {
    to: string;
    name: string;
    itineraryTitle: string;
    amount?: number | null;
    currency?: string | null;
}): Promise<boolean> {
    const first = firstName(opts.name);
    const amount = formatMoney(opts.amount, opts.currency);
    const html = layout({
        title: 'Your payment was refunded',
        body: P(`Hi ${escapeHtml(first)}. We received your payment${amount ? ` of <strong>${escapeHtml(amount)}</strong>` : ''} for the itinerary:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + P('But the itinerary became unavailable before the purchase was completed. So VAMO <strong>started an automatic full refund</strong> — you don\'t need to do anything.')
            + P('How long the credit takes to appear depends on your card issuer (usually 5 to 10 business days). You\'ll also get the refund receipt by email from Stripe.'),
        cta: { label: 'Browse other itineraries', url: appLink('/') },
    });
    return send(opts.to, `Refund for your payment: ${opts.itineraryTitle}`, html, textOf(
        `Hi ${first}. We received your payment${amount ? ` of ${amount}` : ''} for the itinerary "${opts.itineraryTitle}", but it became unavailable before the purchase was completed.`,
        'VAMO started an automatic full refund. How long the credit takes depends on your card issuer (usually 5 to 10 business days).',
        `Questions: ${supportEmail()}`,
    ));
}

export function buildPasswordResetUrl(rawToken: string): string {
    return appLink(`/reset-password?token=${encodeURIComponent(rawToken)}`);
}

export function sendPasswordResetEmail(opts: { to: string; name: string; resetUrl: string; expiresInMinutes: number }): Promise<boolean> {
    const first = firstName(opts.name);
    const m = opts.expiresInMinutes;
    const validity = m % 60 === 0 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} minutes`;
    const html = layout({
        title: 'Reset your VAMO password',
        body: P(`Hi ${escapeHtml(first)}! We received a request to reset your account password.`)
            + P(`Click the button below to create a new password. The link expires in <strong>${validity}</strong> and can only be used once.`),
        cta: { label: 'Reset my password', url: opts.resetUrl },
        footer: FOOTNOTE(`If the button doesn't work, copy and paste this address into your browser:<br><span style="word-break:break-all">${escapeHtml(opts.resetUrl)}</span>`)
            + FOOTNOTE('If you didn\'t request this, you can just ignore this email: your password stays the same.'),
    });
    return send(opts.to, 'Reset your VAMO password', html, textOf(
        `Oi, ${first}!`,
        'We received a request to reset your VAMO account password.',
        `Create a new password with this link (expires in ${validity} and can only be used once):`,
        opts.resetUrl,
        'If you didn\'t request this, ignore this email: your password stays the same.',
    ));
}

export function sendPasswordChangedEmail(opts: { to: string; name: string; changedAt: Date }): Promise<boolean> {
    const first = firstName(opts.name);
    const when = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long', timeStyle: 'short', timeZone: BASE_TIMEZONE,
    }).format(opts.changedAt);
    const html = layout({
        title: 'Your password was changed',
        body: P(`Hi ${escapeHtml(first)}. Your VAMO account password was successfully changed on <strong>${escapeHtml(when)}</strong> (${BASE_TIMEZONE_LABEL}).`)
            + P('If this was you, all good — no action needed.')
            + P(`<strong>If this wasn't you</strong>, contact support right away by replying to this email or writing to ${escapeHtml(supportEmail())}.`),
        cta: { label: 'Sign in to VAMO', url: appLink('/login') },
    });
    return send(opts.to, 'Your VAMO password was changed', html, textOf(
        `Hi ${first}. Your VAMO account password was changed on ${when} (${BASE_TIMEZONE_LABEL}).`,
        'If this was you, no action needed.',
        `If this wasn't you, contact support right away: ${supportEmail()}`,
    ));
}

export function sendQuestionAnsweredEmail(opts: {
    to: string;
    name: string;
    itineraryTitle: string;
    question: string;
    answer: string;
}): Promise<boolean> {
    const first = firstName(opts.name);
    const url = appLink('/my-questions');
    const html = layout({
        title: 'Your question was answered',
        body: P(`Hi ${escapeHtml(first)}! The creator answered your question about the itinerary:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + QUOTE('Your question', opts.question)
            + QUOTE('Creator\'s answer', opts.answer),
        cta: { label: 'View my questions', url },
    });
    return send(opts.to, `Your question was answered: ${opts.itineraryTitle}`, html, textOf(
        `Hi ${first}! The creator answered your question about "${opts.itineraryTitle}".`,
        `Your question: ${opts.question}`,
        `Answer: ${opts.answer}`,
        `View: ${url}`,
    ));
}

// ─── Roteirista ─────────────────────────────────────────────────

export function sendCreatorSaleEmail(opts: {
    to: string;
    name: string;
    itineraryTitle: string;
    price: number;
    commission: number;
    currency?: string | null;
}): Promise<boolean> {
    const first = firstName(opts.name, 'creator');
    const price = formatMoney(opts.price, opts.currency);
    const commission = formatMoney(opts.commission, opts.currency);
    const net = formatMoney(opts.price - opts.commission, opts.currency);
    const pct = opts.price > 0 ? Math.round((opts.commission / opts.price) * 100) : null;
    const url = appLink('/creator-sales');
    const html = layout({
        title: 'You sold an itinerary! 🎉',
        body: P(`Congrats, ${escapeHtml(first)}! Someone just bought:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + ROWS([
                ['Sale amount', price],
                [`VAMO commission${pct != null ? ` (${pct}%)` : ''}`, commission],
                ['Estimated net amount', net],
            ])
            + FOOTNOTE('The net amount is an estimate based on the commission recorded for the sale. Payment fees and the payout date follow the Creator Terms.'),
        cta: { label: 'View my sales', url },
    });
    return send(opts.to, `You sold: ${opts.itineraryTitle}`, html, textOf(
        `Congrats, ${first}! Someone bought "${opts.itineraryTitle}".`,
        price && `Sale amount: ${price}`,
        commission && `VAMO commission: ${commission}`,
        net && `Estimated net amount: ${net}`,
        `View sales: ${url}`,
    ));
}

export function sendItineraryApprovedEmail(opts: { to: string; name: string; itineraryId: string; itineraryTitle: string }): Promise<boolean> {
    const first = firstName(opts.name, 'creator');
    const url = appLink(`/creator-itinerary/${encodeURIComponent(opts.itineraryId)}`);
    const html = layout({
        title: 'Your itinerary was approved and is live ✅',
        body: P(`Good news, ${escapeHtml(first)}! The VAMO team approved your itinerary and it is <strong>now published</strong>:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + P('It now shows up for travelers in the marketplace and can be purchased. If you need to take it down, use “Pause itinerary” in the Creator Portal.'),
        cta: { label: 'View my itinerary', url },
    });
    return send(opts.to, `Itinerary approved and published: ${opts.itineraryTitle}`, html, textOf(
        `Good news, ${first}! The VAMO team approved "${opts.itineraryTitle}".`,
        'It is now published and appears in the marketplace.',
        url,
    ));
}

export function sendItineraryRejectedEmail(opts: {
    to: string;
    name: string;
    itineraryId: string;
    itineraryTitle: string;
    reason: string;
}): Promise<boolean> {
    const first = firstName(opts.name, 'creator');
    const url = appLink(`/creator-itinerary/${encodeURIComponent(opts.itineraryId)}`);
    const html = layout({
        title: 'Your itinerary needs changes',
        body: P(`Hi ${escapeHtml(first)}. The VAMO team reviewed your itinerary and it has not been approved yet:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + QUOTE('Reason', opts.reason)
            + P('Make the requested changes and resubmit for review — just open the itinerary in the Creator Portal.'),
        cta: { label: 'Fix itinerary', url },
    });
    return send(opts.to, `Itinerary needs changes: ${opts.itineraryTitle}`, html, textOf(
        `Hi ${first}. "${opts.itineraryTitle}" has not been approved yet.`,
        `Reason: ${opts.reason}`,
        `Fix it and resubmit for review: ${url}`,
    ));
}

export function sendNewQuestionEmail(opts: {
    to: string;
    name: string;
    itineraryTitle: string;
    question: string;
    askerName?: string | null;
}): Promise<boolean> {
    const first = firstName(opts.name, 'creator');
    const url = appLink('/creator-questions');
    const asker = firstName(opts.askerName, 'A traveler');
    const html = layout({
        title: 'New question on your itinerary',
        body: P(`Hi ${escapeHtml(first)}! ${escapeHtml(asker)} asked a question about:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + QUOTE('Question', opts.question)
            + P('Answering quickly helps turn this into a sale.'),
        cta: { label: 'Answer question', url },
    });
    return send(opts.to, `New question: ${opts.itineraryTitle}`, html, textOf(
        `Hi ${first}! ${asker} asked a question about "${opts.itineraryTitle}".`,
        `Question: ${opts.question}`,
        `Answer: ${url}`,
    ));
}

export function sendNewReviewEmail(opts: {
    to: string;
    name: string;
    itineraryTitle: string;
    rating: number;
    comment?: string | null;
}): Promise<boolean> {
    const first = firstName(opts.name, 'creator');
    const url = appLink('/creator-reviews');
    const stars = '★'.repeat(Math.round(opts.rating)) + '☆'.repeat(Math.max(0, 5 - Math.round(opts.rating)));
    const comment = (opts.comment || '').trim();
    const html = layout({
        title: 'You received a new review',
        body: P(`Hi ${escapeHtml(first)}! A traveler reviewed your itinerary:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + P(`<span style="font-size:20px;color:#F5A623;letter-spacing:2px">${stars}</span> <strong>${opts.rating}/5</strong>`)
            + (comment ? QUOTE('Comment', comment) : ''),
        cta: { label: 'View reviews', url },
    });
    return send(opts.to, `New review (${opts.rating}/5): ${opts.itineraryTitle}`, html, textOf(
        `Hi ${first}! "${opts.itineraryTitle}" received a ${opts.rating}/5 review.`,
        comment && `Comment: ${comment}`,
        `View reviews: ${url}`,
    ));
}

export function sendCreatorApprovedEmail(opts: { to: string; name: string }): Promise<boolean> {
    const first = firstName(opts.name, 'creator');
    const url = appLink('/created-itineraries');
    // TRUSTED aparece no app como "Roteirista Recomendado" (VERIFICATION_CONFIGS no mobile).
    const html = layout({
        title: 'You\'re now a Recommended Creator ⭐',
        body: P(`Congrats, ${escapeHtml(first)}! The VAMO team approved your creator profile.`)
            + P('Your level is now <strong>Recommended Creator</strong>: the badge appears on your public profile and your itineraries, giving buyers more confidence.'),
        cta: { label: 'Open Creator Portal', url },
    });
    return send(opts.to, 'Your creator profile was approved', html, textOf(
        `Congrats, ${first}! The VAMO team approved your creator profile.`,
        'Your level is now Recommended Creator, with a badge on your profile and itineraries.',
        url,
    ));
}

// ─── Admin ──────────────────────────────────────────────────────

export function sendItinerarySubmittedForReviewEmail(opts: {
    creatorName: string;
    itineraryId: string;
    itineraryTitle: string;
    destination?: string | null;
    country?: string | null;
    price?: number | null;
    currency?: string | null;
    days?: number | null;
}): Promise<boolean> {
    const { adminEmail, adminUrl } = env();
    const reviewUrl = adminUrl ? `${adminUrl}/admin/roteiros` : null;
    const place = [opts.destination, opts.country].filter(Boolean).join(', ');
    const html = layout({
        title: 'Itinerary awaiting review',
        body: P(`<strong>${escapeHtml(opts.creatorName || 'A creator')}</strong> submitted an itinerary for review:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + ROWS([
                ['Destination', place || null],
                ['Duration', opts.days ? `${opts.days} days` : null],
                ['Price', formatMoney(opts.price, opts.currency)],
                ['ID', opts.itineraryId],
            ])
            + (reviewUrl ? '' : P('Review in: admin panel (site) → <strong>Itineraries</strong> → Under review.')),
        cta: reviewUrl ? { label: 'Review in the admin panel', url: reviewUrl } : undefined,
    });
    return send(adminEmail, `[Admin] Itinerary for review: ${opts.itineraryTitle}`, html, textOf(
        `${opts.creatorName || 'A creator'} submitted "${opts.itineraryTitle}" for review.`,
        place && `Destination: ${place}`,
        `ID: ${opts.itineraryId}`,
        reviewUrl ? `Review: ${reviewUrl}` : 'Review in: admin panel (site) → Itineraries → Under review.',
    ));
}
