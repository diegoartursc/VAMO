/**
 * AddFileModal — fluxo de adicionar arquivo à Central da Viagem.
 *
 * Fluxo:
 *   1. usuário toca em "Adicionar arquivo" → modal abre já no picker;
 *   2. picker devolve um asset (imagem/vídeo via ImagePicker; PDF via
 *      <input type="file"> no web — único caminho cross-platform sem
 *      adicionar expo-document-picker como nova dep);
 *   3. validamos com `validateUploadFile(..., 'travelerFile')`;
 *   4. preview + form (título / categoria);
 *   5. ao salvar: faz `uploadFile()` → chama `onSave({ category, title,
 *      url, mimeType, sizeBytes })` para o pai persistir via API.
 *
 * O upload acontece DENTRO do modal porque precisamos do título/categoria
 * antes de persistir o registro, mas o asset já foi escolhido. Se o
 * upload falhar, mostramos a mensagem e mantemos o form aberto.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import { notify } from '../../utils/notify';
import { uploadFile } from '../../utils/uploadFile';
import {
    validateUploadFile,
    acceptAttributeFor,
    uploadHint,
} from '../../utils/uploadContexts';
import { kindFromMime, type FileKind } from './FileCard';

const FILE_CATEGORIES = [
    'Voos',
    'Hospedagem',
    'Passeios e ingressos',
    'Documentos',
    'Seguro',
    'Recibos',
    'Transporte',
    'Outros',
] as const;

interface PickedAsset {
    uri: string;
    filename: string;
    mimeType: string;
    sizeBytes?: number;
    kind: FileKind;
}

export interface AddFileModalProps {
    visible: boolean;
    onClose: () => void;
    token: string | null;
    onSave: (payload: {
        category: string;
        title: string;
        url: string;
        mimeType?: string;
        sizeBytes?: number;
    }) => Promise<void> | void;
}

export default function AddFileModal({ visible, onClose, token, onSave }: AddFileModalProps) {
    const [asset, setAsset] = useState<PickedAsset | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<string>('Outros');
    const [picking, setPicking] = useState(false);
    const [uploading, setUploading] = useState(false);
    const webInputRef = useRef<any>(null);

    useEffect(() => {
        if (!visible) {
            setAsset(null);
            setTitle('');
            setCategory('Outros');
            setPicking(false);
            setUploading(false);
        }
    }, [visible]);

    const sanitizeFilenameForTitle = (filename: string): string => {
        const base = filename.replace(/\.[a-zA-Z0-9]+$/, '');
        return base.length > 0 ? base.slice(0, 80) : 'Arquivo';
    };

    const acceptAsset = (raw: {
        uri: string;
        filename?: string | null;
        mime?: string | null;
        size?: number | null;
    }) => {
        const validation = validateUploadFile(raw, 'travelerFile');
        if (!validation.valid) {
            notify({ title: 'Arquivo inválido', message: validation.reason });
            haptics.error();
            return;
        }
        const kind = kindFromMime(validation.mimeType, raw.uri);
        setAsset({
            uri: raw.uri,
            filename: validation.filename,
            mimeType: validation.mimeType,
            sizeBytes: validation.size,
            kind,
        });
        setTitle(prev => prev || sanitizeFilenameForTitle(validation.filename));
        haptics.light();
    };

    const handlePick = async () => {
        if (Platform.OS === 'web') {
            // No web acionamos o <input type=file> escondido — assim PDFs
            // entram (ImagePicker no web não cobre PDF).
            webInputRef.current?.click?.();
            return;
        }
        try {
            setPicking(true);
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                notify({
                    title: 'Permissão necessária',
                    message: 'Precisamos de acesso à galeria para anexar arquivos.',
                });
                return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.9,
                allowsMultipleSelection: false,
            });
            if (res.canceled || !res.assets?.length) return;
            const a: any = res.assets[0];
            acceptAsset({
                uri: a.uri,
                filename: a.fileName,
                mime: a.mimeType,
                size: a.fileSize,
            });
        } catch (e: any) {
            notify({ title: 'Falha ao escolher arquivo', message: e?.message || 'Tente novamente.' });
        } finally {
            setPicking(false);
        }
    };

    const handleWebFileChange = (event: any) => {
        const file: File | undefined = event?.target?.files?.[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        acceptAsset({
            uri: blobUrl,
            filename: file.name,
            mime: file.type,
            size: file.size,
        });
        // Permite re-selecionar o mesmo arquivo numa próxima tentativa.
        event.target.value = '';
    };

    const handleSave = async () => {
        if (!asset) return;
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            notify({ title: 'Dê um nome ao arquivo', message: 'O título ajuda você a encontrar depois.' });
            return;
        }
        if (!token) {
            notify({ title: 'Sessão expirada', message: 'Entre na conta novamente para enviar arquivos.' });
            return;
        }
        try {
            setUploading(true);
            haptics.light();
            const url = await uploadFile(asset.uri, token, asset.filename, asset.mimeType);
            await onSave({
                category,
                title: trimmedTitle,
                url,
                mimeType: asset.mimeType || undefined,
                sizeBytes: asset.sizeBytes,
            });
            haptics.success();
            onClose();
        } catch (e: any) {
            haptics.error();
            notify({ title: 'Falha ao enviar arquivo', message: e?.message || 'Tente novamente.' });
        } finally {
            setUploading(false);
        }
    };

    const showPreview = !!asset;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.bg}
            >
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Adicionar arquivo</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={uploading}>
                            <Ionicons name="close" size={22} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
                        {!showPreview ? (
                            <View style={styles.pickWrap}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="cloud-upload" size={26} color={theme.colors.primary} />
                                </View>
                                <Text style={styles.pickTitle}>Escolha um arquivo</Text>
                                <Text style={styles.pickHint}>
                                    {uploadHint('travelerFile')}
                                </Text>
                                <TouchableOpacity
                                    style={styles.pickBtn}
                                    onPress={handlePick}
                                    disabled={picking}
                                    activeOpacity={0.85}
                                >
                                    {picking ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="folder-open" size={16} color="#fff" />
                                            <Text style={styles.pickBtnLabel}>Selecionar</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.previewWrap}>
                                    {asset.kind === 'image' ? (
                                        <Image source={{ uri: asset.uri }} style={styles.previewImage} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.previewIcon}>
                                            <Ionicons
                                                name={
                                                    asset.kind === 'pdf'
                                                        ? 'document-text'
                                                        : asset.kind === 'video'
                                                            ? 'videocam'
                                                            : 'document'
                                                }
                                                size={42}
                                                color={theme.colors.primary}
                                            />
                                            <Text style={styles.previewFilename} numberOfLines={2}>
                                                {asset.filename}
                                            </Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={styles.swapBtn}
                                        onPress={handlePick}
                                        disabled={uploading}
                                    >
                                        <Ionicons name="swap-horizontal" size={14} color={theme.colors.primary} />
                                        <Text style={styles.swapBtnText}>Trocar</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Título</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Voucher do hotel"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    value={title}
                                    onChangeText={setTitle}
                                    maxLength={200}
                                />

                                <Text style={styles.label}>Categoria</Text>
                                <View style={styles.chipsRow}>
                                    {FILE_CATEGORIES.map(cat => {
                                        const active = category === cat;
                                        return (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[styles.chip, active && styles.chipActive]}
                                                onPress={() => { haptics.selection(); setCategory(cat); }}
                                                disabled={uploading}
                                            >
                                                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.btnGhost} onPress={onClose} disabled={uploading}>
                            <Text style={styles.btnGhostText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.btnPrimary,
                                (!showPreview || uploading || !title.trim()) && styles.btnDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={!showPreview || uploading || !title.trim()}
                            activeOpacity={0.85}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.btnPrimaryText}>Salvar</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {Platform.OS === 'web' && (
                        // input escondido para acionar o picker do navegador.
                        // Tipado como any: o tipo do RN para View não conhece
                        // <input>, mas no web ele renderiza como elemento DOM.
                        // @ts-ignore
                        <input
                            ref={webInputRef}
                            type="file"
                            accept={acceptAttributeFor('travelerFile')}
                            onChange={handleWebFileChange}
                            style={{ display: 'none' }}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 460,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 22,
        ...theme.shadows.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginTop: 12,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
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
    pickWrap: {
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 8,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.glass.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    pickTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    pickHint: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 14,
    },
    pickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        ...theme.shadows.button,
    },
    pickBtnLabel: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    previewWrap: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        minHeight: 160,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: 200,
    },
    previewIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 22,
        gap: 8,
    },
    previewFilename: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        maxWidth: 260,
    },
    swapBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    swapBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    btnGhost: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.borderLight,
    },
    btnGhostText: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    btnPrimary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
    },
    btnPrimaryText: {
        fontWeight: '700',
        color: '#fff',
    },
    btnDisabled: {
        opacity: 0.5,
    },
});
