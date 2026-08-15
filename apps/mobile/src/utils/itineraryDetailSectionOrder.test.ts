/**
 * Trava a hierarquia de seções da tela de Detalhes do Roteiro.
 *
 * A ordem foi redesenhada para seguir uma jornada de decisão de compra
 * (entender → desejar → confiar → comprar → tangibilizar → aprofundar →
 * confirmar → objeções) em vez da ordem antiga, que jogava preço e criador
 * antes do usuário sequer entender que viagem é aquela. Este teste não
 * valida comportamento — só a posição relativa das seções no JSX, para que
 * uma futura edição não devolva preço/reviews pro topo por descuido.
 *
 *   npx tsx --test apps/mobile/src/utils/itineraryDetailSectionOrder.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const arquivo = 'apps/mobile/app/(tabs)/itinerary/[id].tsx';
const src = readFileSync(join(raiz, arquivo), 'utf8');

/** Marcadores estruturais únicos de cada seção, na ordem esperada. */
const SECOES_ESPERADAS = [
    ['Título & Localização', '<Text style={styles.title}>{itinerary.title}</Text>'],
    ['Stats (avaliação + duração)', '<View style={styles.statsCard}>'],
    ['Badge roteiro interativo', '<InteractiveRouteBadge />'],
    ['Sobre o Roteiro', 'title="Sobre o Roteiro"'],
    ['Resumo da experiência', '<ExperienceSummaryCard'],
    ['Destaques da viagem', 'title="Destaques da viagem"'],
    ['Fotos e Vídeos', '<MediaGallery itinerary={itinerary} />'],
    ['Para quem é este roteiro', 'styles.idealForCard'],
    ['Por que comprar este roteiro?', 'styles.whyBuyCard'],
    ['Criador + verificação', '<CreatorIdentityLink'],
    ['Preço + CTA', 'styles.priceSection'],
    ['O que você recebe (PurchaseBenefitsCard)', '<PurchaseBenefitsCard />'],
    ['O que você vai receber (módulos)', 'title="O que você vai receber"'],
    ['Prévia do que vai desbloquear', 'styles.unlockSection'],
    ['Central de viagem (InteractiveExperienceSection)', '<InteractiveExperienceSection />'],
    ['Referência de custos + TrustStrip', '<TravelCostSummarySection'],
    ['Trust Info do criador', 'styles.trustBox'],
    ['Avaliações (PremiumReviewsSection)', '<PremiumReviewsSection'],
    ['Como você vai receber', 'title="Como você vai receber"'],
    ['Antes de comprar, saiba', 'styles.beforeBuyBox'],
    ['FAQ', '<FAQSection'],
] as const;

test('cada marcador estrutural existe exatamente uma vez no arquivo', () => {
    for (const [nome, marcador] of SECOES_ESPERADAS) {
        const ocorrencias = src.split(marcador).length - 1;
        assert.equal(ocorrencias, 1, `"${nome}" (${marcador}) deveria aparecer 1x, aparece ${ocorrencias}x`);
    }
});

test('a hierarquia de seções segue a jornada de decisão de compra', () => {
    let posicaoAnterior = -1;
    let nomeAnterior = '(início do arquivo)';
    for (const [nome, marcador] of SECOES_ESPERADAS) {
        const posicao = src.indexOf(marcador);
        assert.ok(
            posicao > posicaoAnterior,
            `"${nome}" deveria vir depois de "${nomeAnterior}", mas apareceu antes (posição ${posicao} <= ${posicaoAnterior})`,
        );
        posicaoAnterior = posicao;
        nomeAnterior = nome;
    }
});

test('o preço/CTA aparece só depois da construção de valor (não no topo, não no fim)', () => {
    const posPreco = src.indexOf('styles.priceSection');
    const posSobre = src.indexOf('title="Sobre o Roteiro"');
    const posFAQ = src.indexOf('<FAQSection');
    assert.ok(posPreco > posSobre, 'preço não pode vir antes de "Sobre o Roteiro"');
    assert.ok(posPreco < posFAQ, 'preço não pode ser jogado para o fim absoluto da página');
});

test('avaliações (reviews) aparecem depois da descrição do roteiro, não no início', () => {
    const posReviews = src.indexOf('<PremiumReviewsSection');
    const posSobre = src.indexOf('title="Sobre o Roteiro"');
    const posDestaques = src.indexOf('title="Destaques da viagem"');
    assert.ok(posReviews > posSobre && posReviews > posDestaques,
        'reviews não podem funcionar como primeira explicação do produto');
});

test('criador aparece depois do título/destino, mas antes da oferta', () => {
    const posTitulo = src.indexOf('<Text style={styles.title}>{itinerary.title}</Text>');
    const posCriador = src.indexOf('<CreatorIdentityLink');
    const posPreco = src.indexOf('styles.priceSection');
    assert.ok(posCriador > posTitulo, 'criador não pode aparecer antes do usuário saber o que é o roteiro');
    assert.ok(posCriador < posPreco, 'criador deve funcionar como prova de autoria antes do preço');
});
