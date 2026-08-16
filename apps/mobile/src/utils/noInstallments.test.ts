/**
 * O VAMO não parcela — teste de regressão end-to-end.
 *
 * O lançamento é australiano e a regra comercial é: o roteiro é vendido pelo
 * preço total, sem parcelamento e sem BNPL. Este arquivo trava a remoção em
 * TODAS as camadas (UI, checkout, Stripe, tipos, payload, backend, score e
 * copy) para que o conceito não volte por descuido.
 *
 * O projeto não tem runner de componentes (sem jest/RNTL), então as camadas de
 * UI são verificadas por contrato de código-fonte; a lógica pura (score) roda
 * de verdade.
 *
 *   npx tsx --test apps/mobile/src/utils/noInstallments.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcQuality, calcQualityBlocks } from '../../../../packages/shared/itinerary/score';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const ler = (rel: string) => readFileSync(join(raiz, rel), 'utf8');

/** Só o CÓDIGO — comentários explicando a decisão podem citar o termo. */
const semComentarios = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

/** Termos que jamais podem voltar ao código de produção. */
const TERMOS_PARCELAMENTO = /\b(12x|10x|[2-9]x de|sem juros|parcelamento|parcelado|parcelas?|installments?)\b/i;
const TERMOS_BNPL = /\b(afterpay|clearpay|klarna|affirm|zip pay|bnpl|buy now,? pay later|pay in [34])\b/i;

// ══════════════════════════════════════════════════════════════════
// 1-7. DETALHES DO ROTEIRO
// ══════════════════════════════════════════════════════════════════

const detalhe = ler('apps/mobile/app/(tabs)/itinerary/[id].tsx');

test('1/2/3. o card de compra mostra o preço total, sem 12x nem "sem juros"', () => {
    const codigo = semComentarios(detalhe);
    assert.ok(!TERMOS_PARCELAMENTO.test(codigo), 'sobrou termo de parcelamento no detalhe');
    // O preço total continua lá.
    assert.ok(/priceValueText/.test(codigo) && /price\.toFixed\(2\)/.test(codigo));
    assert.ok(/Roteiro completo/.test(codigo));
});

test('4. nenhum cálculo de valor parcelado sobrou', () => {
    assert.ok(!/price\s*\/\s*12/.test(detalhe), 'ainda divide o preço por 12');
    assert.ok(!/priceInstallment/.test(detalhe), 'estilo do parcelamento ainda existe');
});

test('5/6/7. o card segue íntegro: acesso imediato, Adicionar e Comprar agora', () => {
    assert.ok(/Acesso imediato após a compra/.test(detalhe));
    assert.ok(/Comprar agora/.test(detalhe));
    assert.ok(/addToCart/.test(detalhe), 'ação de adicionar ao carrinho preservada');
});

// ══════════════════════════════════════════════════════════════════
// 8-12. CHECKOUT — ETAPA 1 (CONTATO)
// ══════════════════════════════════════════════════════════════════

const contato = ler('apps/mobile/app/checkout/itinerary-contact.tsx');

test('8. o rodapé mostra o total real', () => {
    assert.ok(/footerLabel[\s\S]{0,40}Total/.test(contato));
    assert.ok(/\{formattedPrice\}/.test(contato));
    assert.ok(/formatMoney\(checkoutPrice\)/.test(contato));
});

test('9/10/11/12. installment, footerInstallment e "sem juros" não existem mais', () => {
    const codigo = semComentarios(contato);
    assert.ok(!/installment/i.test(codigo));
    assert.ok(!/footerInstallment/.test(contato), 'estilo órfão precisa sumir');
    assert.ok(!TERMOS_PARCELAMENTO.test(codigo));
    assert.ok(!/checkoutPrice\s*\/\s*12/.test(contato));
});

// ══════════════════════════════════════════════════════════════════
// 13-17. CHECKOUT — PAGAMENTO
// ══════════════════════════════════════════════════════════════════

const pagamento = ler('apps/mobile/app/checkout/itinerary-payment.tsx');

test('13. Pix não existe no fluxo australiano (nem oculto no estado)', () => {
    const codigo = semComentarios(pagamento);
    assert.ok(!/'pix'/.test(codigo), 'Pix não pode voltar nem como valor default');
    assert.ok(!/PaymentMethod/.test(codigo), 'o seletor cosmético foi removido por inteiro');
});

test('14. nenhum BNPL na tela de pagamento', () => {
    assert.ok(!TERMOS_BNPL.test(semComentarios(pagamento)));
    assert.ok(!TERMOS_PARCELAMENTO.test(semComentarios(pagamento)));
});

test('15. segue redirecionando para o Checkout hospedado da Stripe', () => {
    assert.ok(/createCheckoutSession\(itineraryId, \{ source \}, accessToken\)/.test(pagamento),
        'a sessão é criada sem meio de pagamento local');
    assert.ok(/window\.location\.assign\(result\.url\)/.test(pagamento), 'redirect web preservado');
    assert.ok(/Linking\.openURL\(result\.url\)/.test(pagamento), 'redirect nativo preservado');
    assert.ok(/Você será redirecionado para a Stripe/.test(pagamento), 'copy explica o redirect');
});

test('16. compra gratuita continua liberando sem passar pela Stripe', () => {
    assert.ok(/result\.alreadyPurchased \|\| result\.freePurchase/.test(pagamento));
    assert.ok(/Resgatar grátis/.test(pagamento));
});

test('17. erros da Stripe continuam tratados', () => {
    assert.ok(/setPaymentError/.test(pagamento) && /errorBox/.test(pagamento));
});

// ══════════════════════════════════════════════════════════════════
// 18-25. BACKEND / STRIPE
// ══════════════════════════════════════════════════════════════════

const payments = ler('apps/backend/src/routes/payments.ts');

test('18. a Checkout Session declara explicitamente os meios permitidos', () => {
    assert.ok(/payment_method_types: \['card'\],/.test(payments),
        'sem payment_method_types a Stripe usa os métodos dinâmicos do Dashboard');
});

test('19/20/21. Afterpay, Klarna e qualquer outro BNPL ficam de fora', () => {
    const codigo = semComentarios(payments);
    assert.ok(!TERMOS_BNPL.test(codigo), 'nenhum BNPL pode ser habilitado no código');
    // A allowlist é o que garante isso: um único método, 'card'.
    const lista = payments.match(/payment_method_types: \[([^\]]*)\]/);
    assert.ok(lista, 'payment_method_types precisa existir');
    assert.equal(lista![1].trim(), "'card'", 'a allowlist deve conter apenas card');
});

test('22. moeda e valor total continuam corretos (nada de fração de parcela)', () => {
    assert.ok(/currency: \(itinerary\.currency \|\| 'AUD'\)\.toLowerCase\(\)/.test(payments));
    assert.ok(/unit_amount: Math\.round\(itinerary\.price \* 100\)/.test(payments), 'cobra o preço cheio');
    assert.ok(!/\/\s*12/.test(payments), 'nenhuma divisão de preço no backend');
});

test('23/24. success_url e cancel_url preservadas', () => {
    assert.ok(/success_url: `\$\{APP_BASE_URL\}\/checkout\/itinerary-confirm\?session_id=\{CHECKOUT_SESSION_ID\}/.test(payments));
    assert.ok(/cancel_url: `\$\{APP_BASE_URL\}\/checkout\/itinerary-confirm\?canceled=true/.test(payments));
});

test('25. metadata mantém o necessário e não grava mais escolha cosmética de UI', () => {
    assert.ok(/metadata: \{ itineraryId, travelerId, source: source \|\| '' \}/.test(payments));
    assert.ok(!/metadata\?\.paymentMethod/.test(payments), 'o método real vem do objeto Stripe');
    assert.ok(/resolveStripePaymentMethod\(session\)/.test(payments));
});

test('fulfillment e webhook seguem intactos', () => {
    assert.ok(/fulfillItineraryPurchase/.test(payments));
    assert.ok(/checkout\.session\.completed/.test(payments));
    assert.ok(/provider: 'free'/.test(payments), 'roteiro grátis continua liberado sem Stripe');
});

// ══════════════════════════════════════════════════════════════════
// 26-30. TIPOS / DOMÍNIO
// ══════════════════════════════════════════════════════════════════

test('26. ItineraryFormState não conhece parcelamento', () => {
    assert.ok(!/installments/.test(ler('packages/shared/itinerary/types.ts')));
});

test('27. o payload compartilhado não envia installments', () => {
    assert.ok(!/installments/.test(ler('packages/shared/itinerary/payload.ts')));
});

test('28. ItineraryDetail (API mobile) não expõe installments', () => {
    assert.ok(!/installments/.test(ler('apps/mobile/src/services/api.ts')));
});

test('29. o Zod do backend não aceita mais o campo', () => {
    assert.ok(!/installments/.test(ler('apps/backend/src/schemas/itineraries.ts')));
});

test('30. as rotas de roteiro não serializam nem gravam installments', () => {
    assert.ok(!/installments/.test(semComentarios(ler('apps/backend/src/routes/itineraries.ts'))));
});

test('o formulário do wizard não cria mais o campo', () => {
    const wizard = ler('apps/mobile/app/new-itinerary.tsx');
    assert.ok(!/installments/.test(wizard));
    assert.ok(!/parcelas/i.test(wizard), 'nem na documentação da etapa comercial');
});

// ══════════════════════════════════════════════════════════════════
// 31-33. SCORE
// ══════════════════════════════════════════════════════════════════

const rotasItinerario = ler('apps/backend/src/routes/itineraries.ts');

test('31. nenhuma fórmula de score referencia installments', () => {
    assert.ok(!/installments/.test(semComentarios(rotasItinerario)));
    assert.ok(!/installments/.test(ler('packages/shared/itinerary/score.ts')));
});

test('32. remover parcelamento não reduziu o score máximo (backend continua 100)', () => {
    // Soma dos pontos declarados na função do backend, extraída do próprio código.
    const inicio = rotasItinerario.indexOf('function calcItineraryQuality');
    const fn = rotasItinerario.slice(inicio, rotasItinerario.indexOf('\n}', inicio));
    const somas = [...fn.matchAll(/s \+= (\d+)/g)].map(m => Number(m[1]));
    const total = somas.reduce((a, b) => a + b, 0);
    assert.equal(total, 100, `o score máximo do backend deveria ser 100, é ${total}`);
    // O bloco comercial vale 10 sem depender de promoção nem parcelamento.
    assert.ok(/if \(parseFloat\(data\.price\) > 0\) s \+= 8;/.test(fn), 'preço passou a valer 8 pts');
    assert.ok(!/promoPrice/.test(semComentarios(fn)),
        'promoção não pode mais ser pré-requisito de pontos');
});

test('32b. um roteiro sem promoção atinge 100 no score compartilhado', () => {
    const completo: any = {
        title: 'Japão Clássico', subtitle: 'Dez dias por Tóquio, Kyoto e Osaka',
        destination: 'Tóquio', country: 'Japão',
        description: 'x'.repeat(200), travelStyles: ['moderado'], categories: ['cultura'],
        price: 29.9, currency: 'AUD',
        images: ['a.jpg', 'b.jpg', 'c.jpg'], highlightPhotos: [],
        duration: 3,
        days: [1, 2, 3].map(n => ({
            activities: [
                { time: '09:00', title: 'a', description: 'd' },
                { time: '14:00', title: 'b', description: 'd' },
            ],
        })),
        accommodations: [{ name: 'Hotel' }], attractions: [{ name: 'Templo' }],
        restaurants: [{ name: 'Ramen' }], transports: [{ description: 'Metrô' }],
        generalTips: ['dica'], checklistItems: [{ item: 'passaporte' }],
        flightOutbound: { airline: 'JAL', originCity: 'Sydney' },
        extraSpendingItems: [{ title: 'Chip', value: '30' }],
        activeModules: ['itinerario', 'hospedagem', 'passeios', 'restaurantes', 'transporte', 'dicas', 'checklist', 'voo', 'gastos_extras'],
        // Sem promoPrice — e, claro, sem installments.
    };
    const comercial = calcQualityBlocks(completo).find(b => b.label.includes('Comercial'))!;
    assert.equal(comercial.earned, comercial.max,
        'o bloco comercial deve fechar sem promoção nem parcelamento');

    // E criar uma promoção não compra pontos: o roteirista não é empurrado a
    // dar desconto para recuperar o que o parcelamento dava antes.
    assert.equal(
        calcQuality({ ...completo, promoPrice: 19.9 }),
        calcQuality(completo),
        'promoção não pode alterar o score',
    );
});

test('33. o bloco comercial do shared depende só do preço de venda', () => {
    const semPreco = calcQualityBlocks({ title: 'x' } as any).find(b => b.label.includes('Comercial'))!;
    const comPreco = calcQualityBlocks({ title: 'x', price: 10 } as any).find(b => b.label.includes('Comercial'))!;
    assert.equal(semPreco.earned, 0);
    assert.equal(comPreco.earned, comPreco.max);
});

// ══════════════════════════════════════════════════════════════════
// 34-36. COPY E BUSCA GLOBAL
// ══════════════════════════════════════════════════════════════════

test('34/35. a tela "Como funciona" não menciona parcelamento', () => {
    // Os componentes HowItWorks.tsx e OnboardingSlider.tsx foram REMOVIDOS:
    // eram código morto (nenhuma tela os importava, então nem entravam no
    // bundle) e carregavam a copy antiga "Pagamento seguro em até 12x".
    // A superfície viva é a rota /how-it-works, com conteúdo próprio.
    const tela = ler('apps/mobile/app/how-it-works.tsx');
    assert.ok(!TERMOS_PARCELAMENTO.test(semComentarios(tela)));
    assert.ok(/pagamento seguro/i.test(tela), 'a copy de pagamento seguro continua lá');

    for (const morto of [
        'apps/mobile/src/components/common/HowItWorks.tsx',
        'apps/mobile/src/components/onboarding/OnboardingSlider.tsx',
    ]) {
        assert.throws(() => ler(morto), `${morto} deveria ter sido removido`);
    }
});

/** Varre .ts/.tsx de produção (ignora testes, build e legado de Package). */
function arquivosDeProducao(dir: string, acc: string[] = []): string[] {
    for (const nome of readdirSync(join(raiz, dir))) {
        if (['node_modules', 'dist', '.next', '.expo', 'migrations'].includes(nome)) continue;
        const rel = `${dir}/${nome}`;
        if (statSync(join(raiz, rel)).isDirectory()) arquivosDeProducao(rel, acc);
        else if (/\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome)) acc.push(rel);
    }
    return acc;
}

test('36. varredura global: nenhum arquivo de produção oferece parcelamento', () => {
    // Package/agência é legado DESLIGADO: a rota /api/packages nem é montada
    // (ver teste abaixo), não há agências nem pacotes no banco e nenhuma tela
    // ativa expõe parcelamento. Fica fora da varredura em vez de sofrer uma
    // refatoração de legado que esta tarefa não pede.
    const LEGADO_PACKAGE = /packages\.ts$/;
    const alvos = [
        ...arquivosDeProducao('apps/mobile/app'),
        ...arquivosDeProducao('apps/mobile/src'),
        ...arquivosDeProducao('apps/backend/src'),
        ...arquivosDeProducao('packages/shared'),
    ].filter(rel => !LEGADO_PACKAGE.test(rel));
    const sujos: string[] = [];
    for (const rel of alvos) {
        const codigo = semComentarios(ler(rel));
        if (TERMOS_PARCELAMENTO.test(codigo) || TERMOS_BNPL.test(codigo)) sujos.push(rel);
    }
    assert.deepEqual(sujos, [], `arquivos ainda citam parcelamento/BNPL:\n  ${sujos.join('\n  ')}`);
});

test('36b. nenhum BNPL foi introduzido como "alternativa" ao parcelamento', () => {
    for (const rel of ['apps/backend/src/routes/payments.ts', 'apps/mobile/app/checkout/itinerary-payment.tsx']) {
        assert.ok(!TERMOS_BNPL.test(semComentarios(ler(rel))), `${rel} cita BNPL`);
    }
});

test('36c. o legado de Package continua desligado (se religar, revisitar parcelamento)', () => {
    const index = ler('apps/backend/src/index.ts');
    assert.ok(!/app\.use\('\/api\/packages'/.test(index),
        'a rota /api/packages voltou a ser montada — o parcelamento do legado de Package ' +
        'vira superfície ativa e precisa ser removido junto');
    // E o app, que está publicado, não pode mostrar parcelamento em pacote.
    for (const rel of ['apps/mobile/app/(tabs)/packages.tsx', 'apps/mobile/app/(tabs)/package/[id].tsx']) {
        assert.ok(!TERMOS_PARCELAMENTO.test(semComentarios(ler(rel))), `${rel} menciona parcelamento`);
    }
});
