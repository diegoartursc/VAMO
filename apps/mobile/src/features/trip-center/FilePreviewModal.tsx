/**
 * FilePreviewModal — visualização inline de arquivos da Central da Viagem.
 *
 * Decisão de design (importante):
 *   - **Clique no card** abre ESTE modal, NÃO baixa o arquivo automaticamente.
 *   - O download passa a ser ação explícita via botão dedicado.
 *
 * Estratégia por tipo:
 *   - `image` → <Image /> grande, dentro do modal (web e mobile).
 *   - `pdf`   → web: <iframe src={url}> embed nativo do navegador (sem
 *               nova dependência). mobile: tela intermediária com botão
 *               "Abrir PDF" (delega ao app de PDF do SO) e botão
 *               "Baixar/Compartilhar" — embed nativo confiável exigiria
 *               `react-native-pdf` (nova dep, fora do escopo).
 *   - `video` → web: <video controls>. mobile: tela intermediária.
 *   - outros  → tela com nome/tipo/categoria + botões "Abrir" e "Baixar".
 *
 * Limitação documentada: PDFs no mobile **não** têm preview inline neste
 * modal — abrem no app externo. Isso é melhor que "baixar silencioso" no
 * card (problema original) e não introduz dep nova.
 *
 * O modal nunca dispara abertura automática — só ações explícitas via
 * botões. Web nunca renderiza algo que dispare download por header do
 * servidor (o iframe respeita inline; <Image /> respeita inline).
 */

import React from 'react';
import {
    Modal,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import { openExternalUrl } from '../../utils/externalLinks';
import { kindFromMime, type FileKind } from './FileCard';
import { normalizeCategory, iconForCategory } from './fileCategories';
import type { TravelerFile } from '../../services/tripCenter';

export interface FilePreviewModalProps {
    visible: boolean;
    file: TravelerFile | null;
    onClose: () => void;
    /**
     * Quando definido, mostra botão "Excluir" no footer. O caller é
     * responsável por: (1) mostrar confirmação ANTES de chamar este handler;
     * (2) fechar o modal após sucesso (chame `onClose()` por dentro).
     * Mantemos o modal "burro" — não decide a UX da confirmação.
     */
    onDelete?: () => void;
}

export default function FilePreviewModal({ visible, file, onClose, onDelete }: FilePreviewModalProps) {
    if (!file) return null;

    const kind = kindFromMime(file.mimeType, file.url);
    const category = normalizeCategory(file.category);

    const handleDownload = async () => {
        haptics.light();
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            // Força download explícito via <a download>. Funciona em
            // navegadores modernos; respeita CORS do servidor.
            const a = document.createElement('a');
            a.href = file.url;
            a.download = file.title || 'arquivo';
            a.rel = 'noopener noreferrer';
            // Some servers ignore the `download` attribute when cross-origin
            // — fallback: open in new tab so the user can save manually.
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }
        // Mobile: delega ao SO (Safari/Chrome interceptam o download/abertura).
        await openExternalUrl(file.url, {
            invalidMessage: 'Este arquivo não tem um link válido.',
            fallbackMessage: 'Não foi possível baixar agora.',
        });
    };

    const handleOpenExternal = async () => {
        haptics.light();
        await openExternalUrl(file.url, {
            invalidMessage: 'Este arquivo não tem um link válido.',
            fallbackMessage: 'Não foi possível abrir agora.',
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.bg}>
                <View style={styles.card}>
                    {/* Header: título + categoria + fechar */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title} numberOfLines={2}>{file.title}</Text>
                            <View style={styles.categoryChip}>
                                <Ionicons
                                    name={iconForCategory(category) as any}
                                    size={11}
                                    color={theme.colors.primaryDark}
                                />
                                <Text style={styles.categoryLabel}>{category}</Text>
                            </View>
                            {file.note ? (
                                <Text style={styles.note}>{file.note}</Text>
                            ) : null}
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.closeBtn}
                        >
                            <Ionicons name="close" size={22} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Body: preview por tipo */}
                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                    >
                        <PreviewBody kind={kind} file={file} />
                    </ScrollView>

                    {/* Footer: ações */}
                    <View style={styles.actions}>
                        {onDelete && (
                            <TouchableOpacity
                                style={styles.btnDanger}
                                onPress={() => {
                                    haptics.selection();
                                    onDelete();
                                }}
                                activeOpacity={0.85}
                                accessibilityLabel="Excluir arquivo"
                            >
                                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                                <Text style={styles.btnDangerText}>Excluir</Text>
                            </TouchableOpacity>
                        )}
                        {/* "Abrir externamente" só pra tipos que não temos preview inline real */}
                        {kind !== 'image' && (
                            <TouchableOpacity
                                style={styles.btnGhost}
                                onPress={handleOpenExternal}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                                <Text style={styles.btnGhostText}>Abrir</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.btnPrimary}
                            onPress={handleDownload}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="download-outline" size={16} color="#fff" />
                            <Text style={styles.btnPrimaryText}>Baixar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── PreviewBody por tipo ─────────────────────────────────────

function PreviewBody({ kind, file }: { kind: FileKind; file: TravelerFile }) {
    if (/image\/hei[cf]/i.test(file.mimeType || '')) {
        return (
            <Placeholder
                icon="image"
                title="Imagem HEIC/HEIF"
                text="O arquivo foi salvo com segurança. Use Abrir para visualizá-lo em um aplicativo compatível."
                sizeBytes={file.sizeBytes}
            />
        );
    }

    if (kind === 'image') {
        return (
            <Image
                source={{ uri: file.url }}
                style={styles.imagePreview}
                resizeMode="contain"
            />
        );
    }

    if (kind === 'pdf') {
        if (Platform.OS === 'web') {
            // Embed nativo do navegador. Não baixa — renderiza inline.
            // Usamos um wrapper RN <View> mas o filho é HTML real no web.
            return (
                <View style={styles.iframeWrap}>
                    {/* @ts-ignore — iframe é HTML válido no Expo Web */}
                    <iframe
                        src={file.url}
                        title={file.title}
                        style={{
                            width: '100%',
                            height: 520,
                            border: 'none',
                            borderRadius: 12,
                            backgroundColor: '#F7F7F8',
                        }}
                    />
                </View>
            );
        }
        return (
            <Placeholder
                icon="document-text"
                title="PDF pronto para abrir"
                text="No celular, abrimos o PDF no leitor do sistema (Safari, Chrome, Files). Use os botões abaixo."
            />
        );
    }

    if (kind === 'video') {
        if (Platform.OS === 'web') {
            return (
                <View style={styles.iframeWrap}>
                    {/* @ts-ignore — <video> é HTML válido no Expo Web */}
                    <video
                        src={file.url}
                        controls
                        style={{
                            width: '100%',
                            maxHeight: 480,
                            borderRadius: 12,
                            backgroundColor: '#000',
                        }}
                    />
                </View>
            );
        }
        return (
            <Placeholder
                icon="videocam"
                title="Vídeo"
                text="Use o botão Abrir para reproduzir no app de vídeo do seu celular."
            />
        );
    }

    return (
        <Placeholder
            icon="document"
            title={file.title}
            text={
                file.mimeType
                    ? `Tipo: ${file.mimeType}. Use "Abrir" para visualizar ou "Baixar" para salvar.`
                    : 'Use "Abrir" para visualizar ou "Baixar" para salvar.'
            }
            sizeBytes={file.sizeBytes}
        />
    );
}

function Placeholder({
    icon,
    title,
    text,
    sizeBytes,
}: {
    icon: string;
    title: string;
    text: string;
    sizeBytes?: number | null;
}) {
    return (
        <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
                <Ionicons name={icon as any} size={36} color={theme.colors.primary} />
            </View>
            <Text style={styles.placeholderTitle}>{title}</Text>
            <Text style={styles.placeholderText}>{text}</Text>
            {typeof sizeBytes === 'number' && sizeBytes > 0 && (
                <Text style={styles.placeholderMeta}>
                    {formatBytes(sizeBytes)}
                </Text>
            )}
        </View>
    );
}

function formatBytes(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 720,
        maxHeight: '92%',
        backgroundColor: '#fff',
        borderRadius: 20,
        ...theme.shadows.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    note: {
        marginTop: 8,
        fontSize: 12,
        lineHeight: 17,
        color: theme.colors.text.secondary,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: theme.colors.glass.primary,
    },
    categoryLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.primaryDark,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    closeBtn: {
        padding: 4,
    },
    body: {
        // body cresce conforme conteúdo até o limite do card
    },
    bodyContent: {
        padding: 16,
        minHeight: 200,
    },
    imagePreview: {
        width: '100%',
        height: 480,
        borderRadius: 12,
        backgroundColor: '#F7F7F8',
    },
    iframeWrap: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F7F7F8',
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    placeholderIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: theme.colors.glass.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    placeholderTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    placeholderText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: 12,
        lineHeight: 18,
    },
    placeholderMeta: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    btnGhost: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: '#fff',
    },
    btnGhostText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    btnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },
    btnPrimaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    btnDanger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.error,
        backgroundColor: theme.colors.error + '10',
    },
    btnDangerText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.error,
    },
});
