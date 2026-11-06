import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowPayoutWaiting } from './payoutWaiting';

test('aviso de dinheiro esperando: só com saldo pendente e conta não verificada', () => {
    assert.equal(shouldShowPayoutWaiting(0.8, 'not_started'), true);
    assert.equal(shouldShowPayoutWaiting(0.8, 'pending'), true);
    assert.equal(shouldShowPayoutWaiting(0.8, 'restricted'), true);
    assert.equal(shouldShowPayoutWaiting(0.8, undefined), true);
    assert.equal(shouldShowPayoutWaiting(0.8, 'verified'), false);
    assert.equal(shouldShowPayoutWaiting(0, 'not_started'), false);
});
