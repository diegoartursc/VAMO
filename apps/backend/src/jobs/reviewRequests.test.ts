/**
 * Regras do convite de avaliação (sem banco).
 *   cd apps/backend && npx tsx --test src/jobs/reviewRequests.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextReviewRequestStage } from './reviewRequests';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-20T12:00:00Z');
const sale = (daysAgo: number, invitedDaysAgo: number | null = null, remindedDaysAgo: number | null = null) => ({
    createdAt: new Date(now.getTime() - daysAgo * DAY),
    reviewRequestSentAt: invitedDaysAgo == null ? null : new Date(now.getTime() - invitedDaysAgo * DAY),
    reviewReminderSentAt: remindedDaysAgo == null ? null : new Date(now.getTime() - remindedDaysAgo * DAY),
});

test('compra recente (< 3 dias) não recebe nada', () => {
    assert.equal(nextReviewRequestStage(sale(1), false, now), null);
    assert.equal(nextReviewRequestStage(sale(2.9), false, now), null);
});

test('3 dias depois da compra, sem avaliação → convite', () => {
    assert.equal(nextReviewRequestStage(sale(3), false, now), 'invite');
    assert.equal(nextReviewRequestStage(sale(10), false, now), 'invite');
});

test('quem já avaliou nunca recebe convite nem lembrete', () => {
    assert.equal(nextReviewRequestStage(sale(5), true, now), null);
    assert.equal(nextReviewRequestStage(sale(20, 15), true, now), null);
});

test('convite já enviado há menos de 7 dias → espera', () => {
    assert.equal(nextReviewRequestStage(sale(12, 6), false, now), null);
});

test('convite enviado há 7+ dias, sem avaliação → um lembrete', () => {
    assert.equal(nextReviewRequestStage(sale(20, 7), false, now), 'reminder');
});

test('depois do lembrete não manda mais nada', () => {
    assert.equal(nextReviewRequestStage(sale(40, 30, 23), false, now), null);
});

test('venda com mais de 60 dias nunca dispara e-mail', () => {
    assert.equal(nextReviewRequestStage(sale(61), false, now), null);
    assert.equal(nextReviewRequestStage(sale(70, 63), false, now), null);
});
