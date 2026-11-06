import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payoutWaitingCopy, shouldShowPayoutWaiting } from './payoutWaiting';

const fmt = (n: number) => `$${n.toFixed(2)}`;

test('aviso: só com ganho a receber e conta não verificada', () => {
    assert.equal(shouldShowPayoutWaiting(0.8, 'not_started'), true);
    assert.equal(shouldShowPayoutWaiting(0.8, 'pending'), true);
    assert.equal(shouldShowPayoutWaiting(0.8, undefined), true);
    assert.equal(shouldShowPayoutWaiting(0.8, 'verified'), false);
    assert.equal(shouldShowPayoutWaiting(0, 'not_started'), false);
});

test('só pendente (dentro dos 7 dias): não diz que está disponível; mostra quando libera', () => {
    const c = payoutWaitingCopy(0, 0.8, 'Fri, 13 Nov', fmt);
    assert.equal(c.title, '$0.80 in pending earnings');
    assert.match(c.body, /released 7 days after each purchase \(next release: Fri, 13 Nov\)/);
    assert.ok(!/ready|available|waiting for you/i.test(c.title));
});

test('já liberado: diz que está pronto e depende só do cadastro', () => {
    const c = payoutWaitingCopy(16, 8, null, fmt);
    assert.equal(c.title, '$16.00 is ready to be paid to you');
    assert.match(c.body, /Another \$8\.00 is still in the 7-day refund window/);
});
