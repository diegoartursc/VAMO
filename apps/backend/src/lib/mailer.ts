import nodemailer, { Transporter } from 'nodemailer';

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

const firstName = (name?: string | null, fallback = 'viajante') => (name || '').trim().split(/\s+/)[0] || fallback;

const appLink = (path: string) => `${env().appUrl}${path.startsWith('/') ? path : `/${path}`}`;

const supportEmail = () => env().user || 'vamoappviagens@gmail.com';

/** `amount` em unidades da moeda (29.9 = A$ 29,90), nunca em centavos. */
export function formatMoney(amount: number | null | undefined, currency?: string | null): string | null {
    if (amount == null || !Number.isFinite(amount)) return null;
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: (currency || 'AUD').toUpperCase() }).format(amount);
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
<p style="font-size:13px;color:#6B7A90;margin-top:32px">Dúvidas? Responda este e-mail ou escreva para ${escapeHtml(supportEmail())}.</p>
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
        title: `Bem-vindo(a) ao VAMO, ${first}!`,
        body: P('Sua conta está pronta. No VAMO você encontra roteiros completos, feitos por quem já viveu o destino — com voos, hospedagem, passeios, custos e checklist.'),
        cta: { label: 'Explorar roteiros', url },
    });
    return send(to, 'Bem-vindo(a) ao VAMO ✈️', html, textOf(`Bem-vindo(a) ao VAMO, ${first}!`, 'Sua conta está pronta.', `Explore roteiros: ${url}`));
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
        title: 'Compra confirmada! 🎉',
        body: P(`Oi, ${escapeHtml(first)}! Seu roteiro já está liberado:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + (amount ? P(`Valor pago: <strong>${escapeHtml(amount)}</strong>`) : '')
            + P('Ele fica para sempre em <strong>Meus Roteiros</strong>. O recibo do pagamento chega em um e-mail separado da Stripe.'),
        cta: { label: 'Abrir meu roteiro', url },
    });
    return send(opts.to, `Seu roteiro está liberado: ${opts.itineraryTitle}`, html,
        textOf(`Compra confirmada! Seu roteiro "${opts.itineraryTitle}" já está liberado.`, amount && `Valor pago: ${amount}`, `Abrir: ${url}`));
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
        title: 'Seu pagamento foi estornado',
        body: P(`Oi, ${escapeHtml(first)}. Recebemos o seu pagamento${amount ? ` de <strong>${escapeHtml(amount)}</strong>` : ''} pelo roteiro:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + P('Mas o roteiro deixou de estar disponível antes de a compra ser concluída. Por isso o VAMO <strong>iniciou o estorno automático do valor integral</strong> — você não precisa fazer nada.')
            + P('O prazo para o crédito aparecer depende da operadora do seu cartão (normalmente de 5 a 10 dias úteis). Você também vai receber o comprovante do reembolso por e-mail da Stripe.'),
        cta: { label: 'Ver outros roteiros', url: appLink('/') },
    });
    return send(opts.to, `Estorno do seu pagamento: ${opts.itineraryTitle}`, html, textOf(
        `Oi, ${first}. Recebemos o seu pagamento${amount ? ` de ${amount}` : ''} pelo roteiro "${opts.itineraryTitle}", mas ele deixou de estar disponível antes de a compra ser concluída.`,
        'O VAMO iniciou o estorno automático do valor integral. O prazo do crédito depende da operadora do cartão (normalmente de 5 a 10 dias úteis).',
        `Dúvidas: ${supportEmail()}`,
    ));
}

export function buildPasswordResetUrl(rawToken: string): string {
    return appLink(`/reset-password?token=${encodeURIComponent(rawToken)}`);
}

export function sendPasswordResetEmail(opts: { to: string; name: string; resetUrl: string; expiresInMinutes: number }): Promise<boolean> {
    const first = firstName(opts.name);
    const m = opts.expiresInMinutes;
    const validity = m % 60 === 0 ? `${m / 60} hora${m > 60 ? 's' : ''}` : `${m} minutos`;
    const html = layout({
        title: 'Redefina sua senha no VAMO',
        body: P(`Oi, ${escapeHtml(first)}! Recebemos uma solicitação para redefinir a senha da sua conta.`)
            + P(`Clique no botão abaixo para criar uma nova senha. O link expira em <strong>${validity}</strong> e só pode ser usado uma vez.`),
        cta: { label: 'Redefinir minha senha', url: opts.resetUrl },
        footer: FOOTNOTE(`Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all">${escapeHtml(opts.resetUrl)}</span>`)
            + FOOTNOTE('Se não foi você quem pediu, é só ignorar este e-mail: sua senha continua a mesma.'),
    });
    return send(opts.to, 'Redefina sua senha no VAMO', html, textOf(
        `Oi, ${first}!`,
        'Recebemos uma solicitação para redefinir a senha da sua conta no VAMO.',
        `Crie uma nova senha por este link (expira em ${validity} e só pode ser usado uma vez):`,
        opts.resetUrl,
        'Se não foi você quem pediu, ignore este e-mail: sua senha continua a mesma.',
    ));
}

export function sendPasswordChangedEmail(opts: { to: string; name: string; changedAt: Date }): Promise<boolean> {
    const first = firstName(opts.name);
    const when = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long', timeStyle: 'short', timeZone: 'Australia/Sydney',
    }).format(opts.changedAt);
    const html = layout({
        title: 'Sua senha foi alterada',
        body: P(`Oi, ${escapeHtml(first)}. A senha da sua conta VAMO foi alterada com sucesso em <strong>${escapeHtml(when)}</strong> (horário de Sydney).`)
            + P('Se foi você, está tudo certo — não precisa fazer nada.')
            + P(`<strong>Se não foi você</strong>, entre em contato com o suporte imediatamente respondendo este e-mail ou escrevendo para ${escapeHtml(supportEmail())}.`),
        cta: { label: 'Entrar no VAMO', url: appLink('/login') },
    });
    return send(opts.to, 'Sua senha do VAMO foi alterada', html, textOf(
        `Oi, ${first}. A senha da sua conta VAMO foi alterada em ${when} (horário de Sydney).`,
        'Se foi você, não precisa fazer nada.',
        `Se não foi você, fale com o suporte imediatamente: ${supportEmail()}`,
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
        title: 'Sua pergunta foi respondida',
        body: P(`Oi, ${escapeHtml(first)}! O roteirista respondeu sua pergunta sobre o roteiro:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + QUOTE('Sua pergunta', opts.question)
            + QUOTE('Resposta do roteirista', opts.answer),
        cta: { label: 'Ver minhas perguntas', url },
    });
    return send(opts.to, `Sua pergunta foi respondida: ${opts.itineraryTitle}`, html, textOf(
        `Oi, ${first}! O roteirista respondeu sua pergunta sobre "${opts.itineraryTitle}".`,
        `Sua pergunta: ${opts.question}`,
        `Resposta: ${opts.answer}`,
        `Ver: ${url}`,
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
    const first = firstName(opts.name, 'roteirista');
    const price = formatMoney(opts.price, opts.currency);
    const commission = formatMoney(opts.commission, opts.currency);
    const net = formatMoney(opts.price - opts.commission, opts.currency);
    const pct = opts.price > 0 ? Math.round((opts.commission / opts.price) * 100) : null;
    const url = appLink('/creator-sales');
    const html = layout({
        title: 'Você vendeu um roteiro! 🎉',
        body: P(`Parabéns, ${escapeHtml(first)}! Alguém acabou de comprar:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + ROWS([
                ['Valor da venda', price],
                [`Comissão VAMO${pct != null ? ` (${pct}%)` : ''}`, commission],
                ['Valor líquido estimado', net],
            ])
            + FOOTNOTE('O valor líquido é uma estimativa com base na comissão registrada na venda. Taxas de pagamento e a data do repasse seguem os termos do roteirista.'),
        cta: { label: 'Ver minhas vendas', url },
    });
    return send(opts.to, `Você vendeu: ${opts.itineraryTitle}`, html, textOf(
        `Parabéns, ${first}! Alguém comprou "${opts.itineraryTitle}".`,
        price && `Valor da venda: ${price}`,
        commission && `Comissão VAMO: ${commission}`,
        net && `Valor líquido estimado: ${net}`,
        `Ver vendas: ${url}`,
    ));
}

export function sendItineraryApprovedEmail(opts: { to: string; name: string; itineraryId: string; itineraryTitle: string }): Promise<boolean> {
    const first = firstName(opts.name, 'roteirista');
    const url = appLink(`/creator-itinerary/${encodeURIComponent(opts.itineraryId)}`);
    const html = layout({
        title: 'Seu roteiro foi aprovado ✅',
        body: P(`Boa notícia, ${escapeHtml(first)}! A equipe VAMO aprovou o seu roteiro:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + P('<strong>Falta um passo:</strong> aprovado ainda não significa publicado. Abra o roteiro no Portal do Roteirista e toque em <strong>“Publicar roteiro”</strong> quando quiser que ele apareça para os viajantes e comece a vender.'),
        cta: { label: 'Abrir e publicar', url },
    });
    return send(opts.to, `Roteiro aprovado: ${opts.itineraryTitle}`, html, textOf(
        `Boa notícia, ${first}! A equipe VAMO aprovou "${opts.itineraryTitle}".`,
        'Aprovado ainda não é publicado: abra o roteiro no Portal do Roteirista e toque em "Publicar roteiro".',
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
    const first = firstName(opts.name, 'roteirista');
    const url = appLink(`/creator-itinerary/${encodeURIComponent(opts.itineraryId)}`);
    const html = layout({
        title: 'Seu roteiro precisa de ajustes',
        body: P(`Oi, ${escapeHtml(first)}. A equipe VAMO revisou o seu roteiro e ele ainda não foi aprovado:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + QUOTE('Motivo', opts.reason)
            + P('Faça os ajustes indicados e envie de novo para revisão — é só abrir o roteiro no Portal do Roteirista.'),
        cta: { label: 'Corrigir roteiro', url },
    });
    return send(opts.to, `Roteiro precisa de ajustes: ${opts.itineraryTitle}`, html, textOf(
        `Oi, ${first}. "${opts.itineraryTitle}" ainda não foi aprovado.`,
        `Motivo: ${opts.reason}`,
        `Corrija e envie de novo para revisão: ${url}`,
    ));
}

export function sendNewQuestionEmail(opts: {
    to: string;
    name: string;
    itineraryTitle: string;
    question: string;
    askerName?: string | null;
}): Promise<boolean> {
    const first = firstName(opts.name, 'roteirista');
    const url = appLink('/creator-questions');
    const asker = firstName(opts.askerName, 'Um viajante');
    const html = layout({
        title: 'Nova pergunta no seu roteiro',
        body: P(`Oi, ${escapeHtml(first)}! ${escapeHtml(asker)} fez uma pergunta sobre:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + QUOTE('Pergunta', opts.question)
            + P('Responder rápido ajuda a converter a venda.'),
        cta: { label: 'Responder pergunta', url },
    });
    return send(opts.to, `Nova pergunta: ${opts.itineraryTitle}`, html, textOf(
        `Oi, ${first}! ${asker} fez uma pergunta sobre "${opts.itineraryTitle}".`,
        `Pergunta: ${opts.question}`,
        `Responder: ${url}`,
    ));
}

export function sendNewReviewEmail(opts: {
    to: string;
    name: string;
    itineraryTitle: string;
    rating: number;
    comment?: string | null;
}): Promise<boolean> {
    const first = firstName(opts.name, 'roteirista');
    const url = appLink('/creator-reviews');
    const stars = '★'.repeat(Math.round(opts.rating)) + '☆'.repeat(Math.max(0, 5 - Math.round(opts.rating)));
    const comment = (opts.comment || '').trim();
    const html = layout({
        title: 'Você recebeu uma nova avaliação',
        body: P(`Oi, ${escapeHtml(first)}! Um viajante avaliou o seu roteiro:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + P(`<span style="font-size:20px;color:#F5A623;letter-spacing:2px">${stars}</span> <strong>${opts.rating}/5</strong>`)
            + (comment ? QUOTE('Comentário', comment) : ''),
        cta: { label: 'Ver avaliações', url },
    });
    return send(opts.to, `Nova avaliação (${opts.rating}/5): ${opts.itineraryTitle}`, html, textOf(
        `Oi, ${first}! "${opts.itineraryTitle}" recebeu uma avaliação ${opts.rating}/5.`,
        comment && `Comentário: ${comment}`,
        `Ver avaliações: ${url}`,
    ));
}

export function sendCreatorApprovedEmail(opts: { to: string; name: string }): Promise<boolean> {
    const first = firstName(opts.name, 'roteirista');
    const url = appLink('/created-itineraries');
    // TRUSTED aparece no app como "Roteirista Recomendado" (VERIFICATION_CONFIGS no mobile).
    const html = layout({
        title: 'Você agora é Roteirista Recomendado ⭐',
        body: P(`Parabéns, ${escapeHtml(first)}! A equipe VAMO aprovou o seu perfil de roteirista.`)
            + P('Seu nível agora é <strong>Roteirista Recomendado</strong>: o selo aparece no seu perfil público e nos seus roteiros, passando mais confiança para quem compra.'),
        cta: { label: 'Abrir Portal do Roteirista', url },
    });
    return send(opts.to, 'Seu perfil de roteirista foi aprovado', html, textOf(
        `Parabéns, ${first}! A equipe VAMO aprovou o seu perfil de roteirista.`,
        'Seu nível agora é Roteirista Recomendado, com selo no perfil e nos roteiros.',
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
        title: 'Roteiro aguardando revisão',
        body: P(`<strong>${escapeHtml(opts.creatorName || 'Um roteirista')}</strong> enviou um roteiro para revisão:`)
            + HIGHLIGHT(opts.itineraryTitle)
            + ROWS([
                ['Destino', place || null],
                ['Duração', opts.days ? `${opts.days} dias` : null],
                ['Preço', formatMoney(opts.price, opts.currency)],
                ['ID', opts.itineraryId],
            ])
            + (reviewUrl ? '' : P('Revise em: painel admin (site) → <strong>Roteiros</strong> → Em análise.')),
        cta: reviewUrl ? { label: 'Revisar no painel admin', url: reviewUrl } : undefined,
    });
    return send(adminEmail, `[Admin] Roteiro para revisão: ${opts.itineraryTitle}`, html, textOf(
        `${opts.creatorName || 'Um roteirista'} enviou "${opts.itineraryTitle}" para revisão.`,
        place && `Destino: ${place}`,
        `ID: ${opts.itineraryId}`,
        reviewUrl ? `Revisar: ${reviewUrl}` : 'Revise em: painel admin (site) → Roteiros → Em análise.',
    ));
}
