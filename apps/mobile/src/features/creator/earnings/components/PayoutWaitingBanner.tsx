/**
 * Aviso de "dinheiro esperando": aparece quando o roteirista tem ganhos a
 * receber e ainda não terminou o cadastro de recebimento na Stripe. Sem esse
 * cadastro o repasse dos 80% não sai (as vendas ficam aguardando, sem se perder).
 *
 * Busca os próprios dados (ganhos + status da conta) e some sozinho quando a
 * conta está verificada ou não há nada pendente. Falha silenciosa.
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { theme } from '../../../../theme/theme';
import { Icon } from '../../../../components/common/Icons';
import VamoButton from '../../../../components/common/VamoButton';
import { useAuth } from '../../../../contexts/AuthContext';
import { createCreatorOnboardingLink, getCreatorEarnings, getCreatorPayoutStatus } from '../../../../services/api';
import { notify } from '../../../../utils/notify';
import { openExternalUrl } from '../../../../utils/externalLinks';
import { formatBaseCurrency } from '../utils';
import { shouldShowPayoutWaiting } from '../payoutWaiting';

interface Props {
    /** Sem `onSetup`, o próprio aviso abre o cadastro de recebimento da Stripe. */
    onSetup?: () => void;
}

export function PayoutWaitingBanner({ onSetup }: Props) {
    const { accessToken } = useAuth();
    const [waiting, setWaiting] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    const openSetup = useCallback(async () => {
        if (onSetup) { onSetup(); return; }
        if (busy) return;
        setBusy(true);
        try {
            const { url } = await createCreatorOnboardingLink(accessToken);
            await openExternalUrl(url, { fallbackMessage: 'We couldn\'t open payout setup right now.' });
        } catch (e: any) {
            notify({ title: 'Payout setup', message: e?.message || 'We couldn\'t start right now. Please try again in a moment.', variant: 'error' });
        } finally {
            setBusy(false);
        }
    }, [onSetup, busy, accessToken]);

    useFocusEffect(
        useCallback(() => {
            let alive = true;
            Promise.all([getCreatorEarnings(accessToken), getCreatorPayoutStatus(accessToken).catch(() => null)])
                .then(([earnings, payout]) => {
                    if (!alive) return;
                    const pending = earnings.summary.pendingBalance ?? 0;
                    setWaiting(shouldShowPayoutWaiting(pending, payout?.status) ? pending : null);
                })
                .catch(() => { if (alive) setWaiting(null); });
            return () => { alive = false; };
        }, [accessToken]),
    );

    if (waiting == null) return null;

    return (
        <View style={styles.card} accessibilityRole="alert">
            <View style={styles.row}>
                <View style={styles.iconWrap}>
                    <Icon name="card" size={18} color="#A16207" />
                </View>
                <View style={styles.textWrap}>
                    <Text style={styles.title}>{formatBaseCurrency(waiting)} is waiting for you</Text>
                    <Text style={styles.body}>
                        Set up payouts to receive your earnings. It takes about 10 minutes with Stripe, our payment partner. Your money stays safe with VAMO until then.
                    </Text>
                </View>
            </View>
            <VamoButton label="Set up payouts" onPress={openSetup} loading={busy} size="md" />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFBEB',
        borderColor: '#F59E0B66',
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        marginBottom: 16,
    },
    row: { flexDirection: 'row', gap: 12 },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F59E0B1F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrap: { flex: 1, gap: 4 },
    title: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
    body: { fontSize: 14, lineHeight: 20, color: theme.colors.text.secondary },
});
