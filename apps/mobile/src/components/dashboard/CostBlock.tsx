/**
 * CostBlock — bloco unificado de transparência de custo para itens de
 * módulo do roteiro (hospedagem, transporte, passeio, restaurante, voo,
 * gasto extra). Implementa a regra de produto "transparência graduada":
 *
 *   1. Não informar valor   (default; sem input, sem upload)
 *   2. Valor estimado       (valor + observação opcional)
 *   3. Valor comprovado     (valor + upload de comprovante + observação)
 *
 * O componente expõe um único `onChange(cost)` com o novo `ModuleCostInfo`.
 * O caller é responsável por persistir tanto em `item.cost` quanto, se
 * quiser preservar retrocompatibilidade com leitores legados, em
 * `item.spending` (helper `costToLegacySpending`).
 */

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
    COST_DISCLOSURE_COPY,
    type CostDisclosureType,
    type CostProofFile,
    type ModuleCostInfo,
    type ModuleSpending,
    createEmptyCostInfo,
    formatMoney,
    getAmountPerPerson,
    normalizeSharedBy,
    parseMoney,
    resolveCostInfo,
} from '@vamo/shared/itinerary';
import { theme } from '../../theme/theme';
import FormInput from './FormInput';
import MoneyInput from './MoneyInput';
import { CurrencyPicker } from '../common/CurrencyPicker';
import { acceptAttributeFor, uploadHint, validateUploadFile } from '../../utils/uploadContexts';

export interface CostBlockProps {
    /** Valor atual do bloco de custo. Pode ser null/undefined em itens novos. */
    cost?: ModuleCostInfo | null;
    /** Compatibilidade: se `cost` não existe mas `spending` (legado) sim,
     *  o componente infere disclosureType="estimated" automaticamente. */
    legacySpending?: ModuleSpending | null;
    /** Callback com o novo ModuleCostInfo. */
    onChange: (next: ModuleCostInfo) => void;
    /** Moeda padrão (em geral a moeda comercial do roteiro). */
    defaultCurrency?: string;
    /** Texto de ajuda curto exibido no topo do bloco. Sobrescreve o padrão. */
    helperShort?: string;
    /** Mostra incentivo amigável de comprovante quando true (categorias
     *  com recomendação: hospedagem, voo, passeio caro, ingresso). */
    encourageProof?: boolean;
    /** Upload de comprovante: caller fornece a função de upload. Quando
     *  ausente, o botão de upload fica desabilitado (apenas seleção visual). */
    uploadProof?: (uri: string, filenameHint?: string, mimeHint?: string) => Promise<string>;
}

const DISCLOSURE_OPTIONS: Array<{
    key: CostDisclosureType;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
}> = [
    {
        key: 'not_informed',
        label: COST_DISCLOSURE_COPY.options.not_informed.label,
        description: COST_DISCLOSURE_COPY.options.not_informed.description,
        icon: 'help-circle-outline',
    },
    {
        key: 'estimated',
        label: COST_DISCLOSURE_COPY.options.estimated.label,
        description: COST_DISCLOSURE_COPY.options.estimated.description,
        icon: 'pricetag-outline',
    },
    {
        key: 'verified',
        label: COST_DISCLOSURE_COPY.options.verified.label,
        description: COST_DISCLOSURE_COPY.options.verified.description,
        icon: 'shield-checkmark-outline',
    },
];

export default function CostBlock({
    cost,
    legacySpending,
    onChange,
    defaultCurrency = 'AUD',
    helperShort,
    encourageProof = false,
    uploadProof,
}: CostBlockProps) {
    const resolved: ModuleCostInfo = cost
        ? {
            ...createEmptyCostInfo(defaultCurrency),
            ...cost,
            currency: cost.currency || defaultCurrency,
        }
        : legacySpending
            ? resolveCostInfo({ spending: legacySpending })
            : createEmptyCostInfo(defaultCurrency);

    const [uploading, setUploading] = useState(false);

    const patch = (p: Partial<ModuleCostInfo>) => {
        const next: ModuleCostInfo = {
            ...resolved,
            ...p,
            updatedAt: new Date().toISOString(),
        };
        onChange(next);
    };

    const setType = (type: CostDisclosureType) => {
        // Limpa valores incompatíveis ao mudar de tipo, mas preserva o
        // que faz sentido (evita perda acidental).
        if (type === 'not_informed') {
            patch({
                disclosureType: 'not_informed',
                amount: '',
                proofFiles: [],
                proofStatus: 'none',
            });
            return;
        }
        if (type === 'estimated') {
            patch({
                disclosureType: 'estimated',
                proofFiles: [],
                proofStatus: 'none',
            });
            return;
        }
        // verified
        patch({
            disclosureType: 'verified',
            proofStatus: (resolved.proofFiles?.length ?? 0) > 0 ? 'uploaded' : 'none',
        });
    };

    async function handlePickProof() {
        if (!uploadProof) return;
        const res = await DocumentPicker.getDocumentAsync({
            type: acceptAttributeFor('costProof'),
            multiple: false,
            copyToCacheDirectory: true,
        });
        if (res.canceled || !res.assets?.length) return;
        const asset = res.assets[0];
        // Valida formato + tamanho no contexto costProof
        // (imagens incl. HEIC ou PDF, até 25 MB).
        const validation = validateUploadFile(
            {
                uri: asset.uri,
                filename: asset.name,
                mime: asset.mimeType,
                size: asset.size,
            },
            'costProof',
        );
        if (!validation.valid) {
            Alert.alert('Comprovante inválido', validation.reason);
            return;
        }
        setUploading(true);
        try {
            const url = await uploadProof(
                asset.uri,
                asset.name,
                asset.mimeType,
            );
            const file: CostProofFile = {
                url,
                name: asset.name || undefined,
                mimeType: asset.mimeType || validation.mimeType || undefined,
                size: asset.size || undefined,
                uploadedAt: new Date().toISOString(),
            };
            const nextFiles = [...(resolved.proofFiles ?? []), file];
            patch({
                proofFiles: nextFiles,
                proofStatus: 'uploaded',
            });
        } catch (e: any) {
            Alert.alert('Falha no envio', e?.message || 'Tente novamente.');
        } finally {
            setUploading(false);
        }
    }

    function removeProof(idx: number) {
        const next = (resolved.proofFiles ?? []).filter((_, i) => i !== idx);
        patch({
            proofFiles: next,
            proofStatus: next.length === 0 ? 'none' : resolved.proofStatus,
        });
    }

    const amount = resolved.amount ?? '';
    const isInformed = resolved.disclosureType !== 'not_informed';
    const isVerified = resolved.disclosureType === 'verified';
    const amountInvalid = isInformed && parseMoney(amount) <= 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="wallet-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.title}>{COST_DISCLOSURE_COPY.sectionTitle}</Text>
            </View>
            <Text style={styles.helper}>
                {helperShort || COST_DISCLOSURE_COPY.sectionSubtitle}
            </Text>

            {/* Selector */}
            <View style={styles.optionsList}>
                {DISCLOSURE_OPTIONS.map(opt => {
                    const active = resolved.disclosureType === opt.key;
                    return (
                        <TouchableOpacity
                            key={opt.key}
                            style={[styles.optionRow, active && styles.optionRowActive]}
                            onPress={() => setType(opt.key)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.radio, active && styles.radioActive]}>
                                {active && <View style={styles.radioDot} />}
                            </View>
                            <Ionicons
                                name={opt.icon}
                                size={18}
                                color={active ? theme.colors.primary : theme.colors.text.tertiary}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                                    {opt.label}
                                </Text>
                                <Text style={styles.optionDesc}>{opt.description}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Inputs condicionais */}
            {isInformed && (
                <View style={styles.inputsBlock}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                        <View style={{ flex: 2 }}>
                            <MoneyInput
                                label="Valor total pago"
                                placeholder="Ex: 3000,00"
                                value={amount || ''}
                                onChangeText={v => patch({ amount: v })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <CurrencyPicker
                                label="Moeda"
                                compact
                                value={resolved.currency || defaultCurrency}
                                onChange={code => patch({ currency: code })}
                            />
                        </View>
                    </View>
                    {amountInvalid && (
                        <Text style={styles.errorText}>
                            {isVerified
                                ? 'Informe o valor pago ou escolha "Valor estimado".'
                                : 'Informe um valor aproximado ou escolha "Não informar valor".'}
                        </Text>
                    )}

                    {/* Stepper: pessoas que dividiram esse gasto */}
                    {(() => {
                        const shared = normalizeSharedBy(resolved.sharedByPeople);
                        const totalNum = parseMoney(amount);
                        const perPerson = totalNum > 0 ? totalNum / shared : 0;
                        const currency = resolved.currency || defaultCurrency;
                        const setShared = (n: number) => patch({ sharedByPeople: normalizeSharedBy(n) });
                        return (
                            <View style={styles.sharedBlock}>
                                <View style={styles.sharedRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sharedLabel}>Pessoas que dividiram esse gasto</Text>
                                        <Text style={styles.sharedHelper}>
                                            {shared === 1
                                                ? 'Gasto individual (apenas você)'
                                                : `Compartilhado entre ${shared} pessoas`}
                                        </Text>
                                    </View>
                                    <View style={styles.sharedStepper}>
                                        <TouchableOpacity
                                            style={[styles.sharedStepBtn, shared <= 1 && styles.sharedStepBtnDisabled]}
                                            onPress={() => setShared(shared - 1)}
                                            disabled={shared <= 1}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="remove" size={16} color={shared <= 1 ? theme.colors.text.tertiary : theme.colors.primary} />
                                        </TouchableOpacity>
                                        <Text style={styles.sharedStepValue}>{shared}</Text>
                                        <TouchableOpacity
                                            style={[styles.sharedStepBtn, shared >= 30 && styles.sharedStepBtnDisabled]}
                                            onPress={() => setShared(shared + 1)}
                                            disabled={shared >= 30}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="add" size={16} color={shared >= 30 ? theme.colors.text.tertiary : theme.colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {perPerson > 0 && shared > 1 && (
                                    <View style={styles.sharedResult}>
                                        <Ionicons name="calculator-outline" size={13} color={theme.colors.primary} />
                                        <Text style={styles.sharedResultText}>
                                            Referência por pessoa:{' '}
                                            <Text style={styles.sharedResultValue}>{formatMoney(perPerson, currency)}</Text>
                                            <Text style={styles.sharedResultMeta}>
                                                {' '}({formatMoney(totalNum, currency)} ÷ {shared})
                                            </Text>
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })()}

                    <FormInput
                        label="Observação (opcional)"
                        placeholder={COST_DISCLOSURE_COPY.notesPlaceholder}
                        value={resolved.notes ?? ''}
                        onChangeText={v => patch({ notes: v })}
                        multiline
                        style={{ minHeight: 50, textAlignVertical: 'top' }}
                    />
                </View>
            )}

            {/* Comprovante */}
            {isVerified && (
                <View style={styles.proofBlock}>
                    <View style={styles.proofHeader}>
                        <Ionicons name="document-attach-outline" size={14} color={theme.colors.primary} />
                        <Text style={styles.proofTitle}>Comprovante</Text>
                    </View>
                    <Text style={styles.helper}>
                        {COST_DISCLOSURE_COPY.proofUploadHelp} {uploadHint('costProof')}.
                    </Text>
                    <Text style={styles.privacyTip}>{COST_DISCLOSURE_COPY.proofPrivacyTip}</Text>

                    {(resolved.proofFiles ?? []).map((file, i) => (
                        <View key={i} style={styles.fileRow}>
                            {file.mimeType?.startsWith('image/') && file.url ? (
                                <Image source={{ uri: file.url }} style={styles.fileThumb} resizeMode="cover" />
                            ) : (
                                <View style={[styles.fileThumb, styles.fileThumbDoc]}>
                                    <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fileName} numberOfLines={1}>
                                    {file.name || 'Comprovante'}
                                </Text>
                                <Text style={styles.fileStatus}>
                                    {resolved.proofStatus === 'approved' ? 'Aprovado pela VAMO'
                                        : resolved.proofStatus === 'rejected' ? 'Comprovante rejeitado'
                                        : resolved.proofStatus === 'pending_review' ? 'Em análise pela VAMO'
                                        : 'Enviado (aguardando análise)'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => removeProof(i)} style={styles.removeBtn}>
                                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.uploadBtn, (!uploadProof || uploading) && styles.uploadBtnDisabled]}
                        onPress={handlePickProof}
                        disabled={!uploadProof || uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.primary} />
                                <Text style={styles.uploadBtnText}>
                                    {(resolved.proofFiles?.length ?? 0) === 0
                                        ? 'Anexar comprovante'
                                        : 'Adicionar outro comprovante'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {(resolved.proofFiles?.length ?? 0) === 0 && (
                        <View style={styles.requiredBox}>
                            <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                            <Text style={styles.requiredText}>
                                Obrigatório para "Valor comprovado". Anexe um arquivo ou troque para "Valor estimado" / "Não informar valor".
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Incentivo amigável (categorias caras) */}
            {encourageProof && resolved.disclosureType !== 'verified' && (
                <View style={styles.encourageBox}>
                    <Ionicons name="ribbon-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.encourageText}>
                        Adicionar comprovante aumenta a confiança do roteiro e pode melhorar seu destaque na VAMO.
                    </Text>
                </View>
            )}
        </View>
    );
}

/**
 * Converte ModuleCostInfo para o formato legado ModuleSpending — útil
 * quando o caller quer manter `item.spending` em sincronia com o novo
 * `item.cost` (retrocompatibilidade com leitores antigos).
 */
export function costToLegacySpending(cost: ModuleCostInfo | null | undefined): ModuleSpending | undefined {
    if (!cost) return undefined;
    if (cost.disclosureType === 'not_informed') return undefined;
    const amount = cost.amount ?? '';
    if (!amount) return undefined;
    return { value: String(amount), currency: cost.currency || 'AUD' };
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
        backgroundColor: theme.colors.primary + '06',
        borderRadius: 12,
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    helper: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        lineHeight: 16,
    },
    privacyTip: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        lineHeight: 15,
    },
    optionsList: {
        gap: 6,
        marginTop: 4,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: '#fff',
    },
    optionRowActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '0C',
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: theme.colors.border,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioActive: {
        borderColor: theme.colors.primary,
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
    },
    optionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    optionLabelActive: {
        color: theme.colors.primary,
    },
    optionDesc: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        lineHeight: 15,
        marginTop: 2,
    },
    inputsBlock: {
        marginTop: 4,
        gap: 4,
    },
    errorText: {
        fontSize: 11,
        color: theme.colors.error,
        marginTop: 2,
    },
    proofBlock: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        gap: 6,
    },
    proofHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    proofTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        padding: 8,
        marginTop: 4,
    },
    fileThumb: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
    },
    fileThumbDoc: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileName: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    fileStatus: {
        fontSize: 10,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    removeBtn: {
        padding: 4,
    },
    uploadBtn: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary + '88',
        backgroundColor: theme.colors.primary + '08',
    },
    uploadBtnDisabled: {
        opacity: 0.4,
    },
    uploadBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    warnText: {
        fontSize: 11,
        color: theme.colors.warning,
        marginTop: 4,
    },
    requiredBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 6,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.error + '55',
        backgroundColor: theme.colors.error + '10',
    },
    requiredText: {
        flex: 1,
        fontSize: 11,
        color: theme.colors.error,
        lineHeight: 15,
        fontWeight: '600',
    },
    sharedBlock: {
        marginTop: 4,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 8,
    },
    sharedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sharedLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    sharedHelper: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginTop: 1,
    },
    sharedStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: theme.colors.primary + '0C',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.primary + '33',
        paddingHorizontal: 2,
    },
    sharedStepBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sharedStepBtnDisabled: {
        opacity: 0.4,
    },
    sharedStepValue: {
        minWidth: 24,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    sharedResult: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        padding: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.primary + '0C',
    },
    sharedResultText: {
        flex: 1,
        fontSize: 11,
        color: theme.colors.text.secondary,
        lineHeight: 15,
    },
    sharedResultValue: {
        fontWeight: '700',
        color: theme.colors.primary,
    },
    sharedResultMeta: {
        color: theme.colors.text.tertiary,
    },
    encourageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        padding: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.primary + '0A',
    },
    encourageText: {
        flex: 1,
        fontSize: 11,
        color: theme.colors.primary,
        lineHeight: 15,
    },
});
