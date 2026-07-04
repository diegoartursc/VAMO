/**
 * PurchaseBenefitsCard — card "O que você recebe" da tela de detalhes.
 *
 * Consolida numa única superfície premium o que antes eram dois avisos
 * inline soltos (produto digital + salvo na conta): lista objetiva do que o
 * comprador leva, com o aviso legal de produto digital como rodapé discreto.
 *
 * Sem regra de negócio — só apresentação. Navy no título, teal apenas nos
 * ícones de confirmação (uso positivo), cinza no resto.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export interface PurchaseBenefitsCardProps {
    /** Acesso vitalício muda a copy do último item. */
    lifetimeAccess?: boolean;
}

export function PurchaseBenefitsCard({ lifetimeAccess }: PurchaseBenefitsCardProps) {
    const benefits: string[] = [
        'Acesso imediato ao roteiro digital',
        lifetimeAccess ? 'Salvo para sempre em Meus Roteiros' : 'Salvo na sua conta, em Meus Roteiros',
        'Crie sua versão personalizada da viagem',
        'Checklist e organização dentro da VAMO',
    ];

    return (
        <View style={styles.card}>
            <Text style={styles.title}>O que você recebe</Text>
            <Text style={styles.intro}>
                Compre uma vez, acesse pela VAMO e organize sua própria versão da viagem em Meus Roteiros.
            </Text>

            <View style={styles.list}>
                {benefits.map((text) => (
                    <View key={text} style={styles.item}>
                        <View style={styles.check}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                        <Text style={styles.itemText}>{text}</Text>
                    </View>
                ))}
            </View>

            <Text style={styles.footer}>
                Produto digital: o pagamento é referente ao conteúdo informativo do roteiro, não a serviços turísticos.
            </Text>
        </View>
    );
}

export default PurchaseBenefitsCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    intro: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
        marginBottom: 14,
    },
    list: {
        gap: 11,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    check: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    footer: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        fontSize: 11,
        lineHeight: 15,
        color: theme.colors.text.tertiary,
    },
});
