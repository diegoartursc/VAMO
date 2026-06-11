/**
 * TripCenter — "Minha Central da Viagem".
 *
 * Container injetado na tela do roteiro comprado. Encapsula:
 *   - carregamento inicial de checklist + arquivos (em paralelo);
 *   - segmented control inline (Checklist / Arquivos) — sem dep nova;
 *   - cabeçalho com título + subtítulo institucional;
 *   - estado read-only quando o usuário não está autenticado (canEdit=false).
 *
 * O auth context é consumido aqui dentro para evitar prop drilling:
 *   o componente pega o token do AuthContext e passa para as filhas
 *   junto com `canEdit` decidido externamente (a tela do roteiro já
 *   sabe se deve permitir edição com base na compra do usuário).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import { notify } from '../../utils/notify';
import { useAuth } from '../../contexts/AuthContext';
import {
    getTripChecklist,
    getTripFiles,
    type TravelerChecklistItem,
    type TravelerFile,
} from '../../services/tripCenter';
import {
    getCustomization,
    putCustomization,
    type TravelerItineraryCustomization,
    type AddedItemsMap,
} from '../../services/routeCustomization';

import ChecklistTab from './ChecklistTab';
import FilesTab from './FilesTab';

type Tab = 'checklist' | 'files';

export interface TripCenterProps {
    /** Mantido para compat futura — backend ignora hoje. */
    purchaseId?: string;
    itineraryId: string;
    /** Checklist definido pelo criador do roteiro. Aceita strings ou objetos. */
    creatorChecklist: Array<
        string | { id?: string; category?: string; item?: string; text?: string }
    >;
    /** Se false: card aparece em modo somente leitura (sem add/edit/delete). */
    canEdit: boolean;
    /** Estado compartilhado com a aba Original, quando controlado pelo pai. */
    creatorChecklistProgress?: Record<string, boolean>;
    creatorChecklistPending?: boolean;
    onUpdateCreatorChecklistProgress?: (next: Record<string, boolean>) => Promise<void>;
}

export default function TripCenter({
    itineraryId,
    creatorChecklist,
    canEdit,
    creatorChecklistProgress,
    creatorChecklistPending = false,
    onUpdateCreatorChecklistProgress,
}: TripCenterProps) {
    const { accessToken, isAuthenticated } = useAuth();
    const effectiveCanEdit = canEdit && isAuthenticated && !!accessToken;

    const [tab, setTab] = useState<Tab>('checklist');
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<TravelerChecklistItem[]>([]);
    const [files, setFiles] = useState<TravelerFile[]>([]);
    const [customization, setCustomization] = useState<TravelerItineraryCustomization | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!accessToken) {
            // Sem token, não carregamos — exibimos só o checklist do criador
            // no estado read-only abaixo.
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        try {
            // O progresso do checklist pode ser controlado pelo
            // RouteVersioning. Nesse caso, evitamos uma segunda cópia de
            // customization que ficaria defasada ao trocar de aba.
            const [checklist, fileList, custom] = await Promise.all([
                getTripChecklist(itineraryId, accessToken),
                getTripFiles(itineraryId, accessToken),
                onUpdateCreatorChecklistProgress
                    ? Promise.resolve(null)
                    : getCustomization(itineraryId, accessToken),
            ]);
            setItems(checklist);
            setFiles(fileList);
            if (!onUpdateCreatorChecklistProgress) setCustomization(custom);
        } catch (e: any) {
            // Erro silencioso na UI principal (a Central é complementar).
            // Guardamos a mensagem para mostrar um banner discreto.
            setLoadError(e?.message || 'Não foi possível carregar sua Central da Viagem.');
        } finally {
            setLoading(false);
        }
    }, [accessToken, itineraryId, onUpdateCreatorChecklistProgress]);

    const creatorProgress =
        creatorChecklistProgress
        ?? customization?.addedItems?.creatorChecklistProgress
        ?? {};

    const updateCreatorProgress = useCallback(
        async (next: Record<string, boolean>) => {
            if (!accessToken) throw new Error('Sessão expirada');
            if (onUpdateCreatorChecklistProgress) {
                await onUpdateCreatorChecklistProgress(next);
                return;
            }
            const prev = customization;
            const nextAdded: AddedItemsMap = {
                ...(prev?.addedItems ?? {}),
                creatorChecklistProgress: next,
            };
            if (prev) setCustomization({ ...prev, addedItems: nextAdded });
            try {
                const saved = await putCustomization(
                    itineraryId,
                    { addedItems: nextAdded },
                    accessToken,
                );
                setCustomization(saved);
            } catch (error) {
                setCustomization(prev);
                notify({
                    title: 'Não foi possível salvar',
                    message: 'O progresso do checklist não foi atualizado. Tente novamente.',
                });
                throw error;
            }
        },
        [
            accessToken,
            customization,
            itineraryId,
            onUpdateCreatorChecklistProgress,
        ],
    );

    useEffect(() => { void load(); }, [load]);

    const switchTab = (next: Tab) => {
        if (next === tab) return;
        haptics.selection();
        setTab(next);
    };

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.headerIcon}>
                    <Ionicons name="briefcase" size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Minha Central da Viagem</Text>
                    <Text style={styles.subtitle}>
                        Guarde documentos, bilhetes, reservas e tarefas importantes em um só lugar.
                    </Text>
                </View>
            </View>

            {/* Toggle */}
            <View style={styles.toggle}>
                <TouchableOpacity
                    style={[styles.toggleBtn, tab === 'checklist' && styles.toggleBtnActive]}
                    onPress={() => switchTab('checklist')}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name="checkmark-done"
                        size={15}
                        color={tab === 'checklist' ? '#fff' : theme.colors.text.secondary}
                    />
                    <Text
                        style={[styles.toggleLabel, tab === 'checklist' && styles.toggleLabelActive]}
                    >
                        Checklist
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, tab === 'files' && styles.toggleBtnActive]}
                    onPress={() => switchTab('files')}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name="document-attach"
                        size={15}
                        color={tab === 'files' ? '#fff' : theme.colors.text.secondary}
                    />
                    <Text
                        style={[styles.toggleLabel, tab === 'files' && styles.toggleLabelActive]}
                    >
                        Arquivos
                    </Text>
                </TouchableOpacity>
            </View>

            {!effectiveCanEdit && (
                <View style={styles.readOnlyBanner}>
                    <Ionicons name="lock-closed-outline" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.readOnlyText}>
                        {isAuthenticated
                            ? 'Esta Central é só leitura porque sua sessão está limitada.'
                            : 'Entre na sua conta para editar a Central da Viagem.'}
                    </Text>
                </View>
            )}

            {loadError && (
                <TouchableOpacity
                    style={styles.errorBanner}
                    onPress={() => {
                        haptics.light();
                        void load();
                    }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                    <Text style={styles.errorText} numberOfLines={2}>
                        {loadError} Toque para tentar novamente.
                    </Text>
                </TouchableOpacity>
            )}

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator color={theme.colors.primary} />
                </View>
            ) : tab === 'checklist' ? (
                <ChecklistTab
                    itineraryId={itineraryId}
                    token={accessToken}
                    creatorChecklist={creatorChecklist}
                    items={items}
                    onItemsChange={setItems}
                    canEdit={effectiveCanEdit}
                    creatorProgress={creatorProgress}
                    creatorProgressPending={creatorChecklistPending}
                    onUpdateCreatorProgress={updateCreatorProgress}
                />
            ) : (
                <FilesTab
                    itineraryId={itineraryId}
                    token={accessToken}
                    files={files}
                    onFilesChange={setFiles}
                    canEdit={effectiveCanEdit}
                />
            )}
        </View>
    );
}

// `notify` está importado para uso futuro em load-failures que devam
// interromper o usuário; hoje exibimos apenas o banner discreto.
void notify;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginHorizontal: 16,
        marginVertical: 12,
        ...theme.shadows.medium,
    },
    headerRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: theme.colors.glass.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12.5,
        color: theme.colors.text.secondary,
        lineHeight: 17,
    },
    toggle: {
        flexDirection: 'row',
        gap: 6,
        padding: 4,
        borderRadius: 999,
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 999,
        minHeight: 44,
    },
    toggleBtnActive: {
        backgroundColor: theme.colors.primary,
    },
    toggleLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.secondary,
    },
    toggleLabelActive: {
        color: '#fff',
    },
    readOnlyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceLight,
    },
    readOnlyText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.error,
    },
    loadingWrap: {
        paddingVertical: 32,
        alignItems: 'center',
    },
});
