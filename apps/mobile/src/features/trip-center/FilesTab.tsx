/**
 * FilesTab — galeria de arquivos pessoais da viagem.
 *
 * UI: chips de categoria em cima (com "Todos") + grade de FileCard
 * em duas colunas + botão "Adicionar arquivo" no rodapé. Empty state
 * dedicado quando ainda não há nada.
 *
 * Mutações:
 *   - Add: AddFileModal cuida do upload e devolve o payload pronto.
 *   - Delete: confirm() → otimista → API → rollback se falhar.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import { notify } from '../../utils/notify';
import { confirm } from '../../utils/confirm';
import {
    uploadTripFile,
    deleteTripFile,
    type TravelerFile,
} from '../../services/tripCenter';
import FileCard from './FileCard';
import AddFileModal from './AddFileModal';
import EmptyState from './EmptyState';
import FilePreviewModal from './FilePreviewModal';
import {
    FILE_FILTERS,
    ALL_FILTER,
    normalizeCategory,
    type FileFilter,
} from './fileCategories';

export interface FilesTabProps {
    itineraryId: string;
    token: string | null;
    files: TravelerFile[];
    onFilesChange: (next: TravelerFile[]) => void;
    canEdit: boolean;
}

export default function FilesTab({
    itineraryId,
    token,
    files,
    onFilesChange,
    canEdit,
}: FilesTabProps) {
    const [filter, setFilter] = useState<FileFilter>(ALL_FILTER);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewFile, setPreviewFile] = useState<TravelerFile | null>(null);

    const filtered = useMemo(() => {
        if (filter === ALL_FILTER) return files;
        // Normaliza antes de comparar — protege contra arquivos antigos com
        // categoria em formato legado ('voos' lowercase, etc) que ainda
        // existem no Supabase prod.
        return files.filter(f => normalizeCategory(f.category) === filter);
    }, [files, filter]);

    // Renderiza em duas colunas usando linhas de 2 itens — evita FlatList
    // dentro de ScrollView (anti-padrão) já que o pai é um ScrollView.
    const rows = useMemo(() => {
        const out: TravelerFile[][] = [];
        for (let i = 0; i < filtered.length; i += 2) {
            out.push(filtered.slice(i, i + 2));
        }
        return out;
    }, [filtered]);

    // Clique no card = abrir PREVIEW (não baixar). Download fica como ação
    // explícita dentro do FilePreviewModal. Decisão: nunca disparar
    // openExternalUrl direto no toque do card — historicamente isso causava
    // download silencioso conforme Content-Disposition do servidor.
    const handleOpen = (file: TravelerFile) => {
        haptics.light();
        setPreviewFile(file);
    };

    const handleDelete = async (file: TravelerFile) => {
        if (!canEdit || !token) return;
        const ok = await confirm({
            title: 'Remover arquivo?',
            message: `"${file.title}" será removido da Central da Viagem.`,
            confirmText: 'Remover',
            destructive: true,
        });
        if (!ok) return;

        haptics.light();
        const prev = files;
        const idx = files.findIndex(f => f.id === file.id);
        const next = files.filter(f => f.id !== file.id);
        onFilesChange(next);
        try {
            await deleteTripFile(itineraryId, file.id, token);
            haptics.success();
        } catch (e: any) {
            const restored = [...next];
            restored.splice(Math.max(0, idx), 0, file);
            onFilesChange(restored);
            haptics.error();
            notify({ title: 'Não foi possível remover', message: e?.message || 'Tente novamente.' });
        }
    };

    const handleSave = async (payload: {
        category: string;
        title: string;
        note?: string;
        uri: string;
        filename: string;
        mimeType: string;
    }) => {
        if (!token) throw new Error('Sessão expirada.');
        const prev = files;
        try {
            const saved = await uploadTripFile(itineraryId, payload, token);
            onFilesChange([saved, ...prev]);
            haptics.success();
        } catch (e: any) {
            haptics.error();
            notify({ title: 'Não foi possível salvar', message: e?.message || 'Tente novamente.' });
            throw e;
        }
    };

    return (
        <View>
            {/* Filtros */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
                style={styles.filterScroll}
            >
                {FILE_FILTERS.map(cat => {
                    const active = filter === cat;
                    return (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => { haptics.selection(); setFilter(cat); }}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {files.length === 0 ? (
                <EmptyState
                    icon="folder-open-outline"
                    title="Sem arquivos por aqui"
                    text="Guarde vouchers, passagens, seguro e tudo que quiser ter à mão durante a viagem."
                    ctaLabel={canEdit ? 'Adicionar arquivo' : undefined}
                    onCta={canEdit ? () => setModalVisible(true) : undefined}
                    disabled={!canEdit}
                />
            ) : (
                <>
                    {filtered.length === 0 ? (
                        <View style={styles.emptyFilter}>
                            <Text style={styles.emptyFilterText}>
                                Nenhum arquivo nesta categoria.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.grid}>
                            {rows.map((row, i) => (
                                <View key={i} style={styles.gridRow}>
                                    {row.map(file => (
                                        <FileCard
                                            key={file.id}
                                            file={file}
                                            onPress={() => handleOpen(file)}
                                            onLongPress={canEdit ? () => handleDelete(file) : undefined}
                                            onDelete={canEdit ? () => handleDelete(file) : undefined}
                                        />
                                    ))}
                                    {/* Espaço fantasma para alinhar última linha ímpar */}
                                    {row.length === 1 && <View style={{ flex: 1 }} />}
                                </View>
                            ))}
                        </View>
                    )}

                    {canEdit && (
                        <TouchableOpacity
                            style={styles.addCta}
                            onPress={() => setModalVisible(true)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={styles.addCtaLabel}>Adicionar arquivo</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            <AddFileModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                token={token}
                onSave={handleSave}
            />

            <FilePreviewModal
                visible={previewFile !== null}
                file={previewFile}
                onClose={() => setPreviewFile(null)}
                onDelete={
                    canEdit && previewFile
                        ? async () => {
                            // Fecha o modal ANTES de confirmar pra que o
                            // confirm() apareça por cima da Central e não
                            // do modal — UX mais clara.
                            const target = previewFile;
                            setPreviewFile(null);
                            await handleDelete(target);
                        }
                        : undefined
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    filterScroll: {
        marginTop: 6,
        marginBottom: 12,
    },
    filterRow: {
        gap: 8,
        paddingRight: 4,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: '#fff',
    },
    chipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    chipLabelActive: {
        color: '#fff',
    },
    grid: {
        gap: 10,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    emptyFilter: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyFilterText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    addCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        ...theme.shadows.button,
    },
    addCtaLabel: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});
