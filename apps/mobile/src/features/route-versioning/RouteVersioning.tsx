/**
 * RouteVersioning — container do roteiro editável pós-compra.
 *
 * Renderiza o segmented control "Original / Minha versão" e despacha
 * para `OriginalView` (read-only, snapshot puro) ou `MyRouteView` (a
 * versão editável do viajante, ainda não implementada — placeholder).
 *
 * Carregamento:
 *  - Em mount, busca snapshot + customization em paralelo (Promise.all).
 *  - Sem token (usuário anônimo / sessão expirada) → só Original, mostrando
 *    `liveItinerary` como fallback do snapshot (back-compat para roteiros
 *    antigos cujo snapshot ainda não foi gerado).
 *  - Falhas individuais não bloqueiam — Original aparece com o que tiver,
 *    mensagens vão para banner discreto.
 *
 * Mutações (MyRouteView):
 *  - Estratégia optimistic + PUT + rollback. Mantemos o último
 *    customization persistido em `lastCommittedRef` e revertimos
 *    state em caso de erro do backend (chamado com `notify`).
 *  - Notes recebem debounce 500ms via `useEffect` na própria
 *    `NotesCard`; mutações estruturais (add/edit/hide) vão direto.
 *
 * Esta Task (1) entrega:
 *  - Layout do container (header + tabs + body).
 *  - Carregamento paralelo de snapshot + customization.
 *  - Renderização da aba Original com OriginalView.
 *  - Placeholder limpo para "Minha versão" (Task 5+ implementa).
 *  - Botão "Exportar PDF" emitindo `onExportPdf` (PDF é Task posterior).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import { notify } from '../../utils/notify';
import { useAuth } from '../../contexts/AuthContext';

import {
    getSnapshot,
    getCustomization,
    putCustomization,
    type RouteSnapshot,
    type TravelerItineraryCustomization,
    type CustomizationPatch,
    type AddedItem,
    type AddedItemsMap,
    type EditedPatchMap,
    type ItemKind,
} from '../../services/routeCustomization';
import {
    mergeItineraryWithCustomization,
    generateAddedId,
    dayKeyOf,
    type MergedItinerary,
    type MergedItem,
    type MergedDay,
} from './mergeEngine';

import VersionTabs, { type RouteVersionTab } from './VersionTabs';
import OriginalView from './OriginalView';
import MyRouteView from './MyRouteView';
import EditItemModal from './EditItemModal';
import AddItemModal from './AddItemModal';

// ─── Props ────────────────────────────────────────────────────

export interface RouteVersioningProps {
    itineraryId: string;
    /**
     * Roteiro "vivo" carregado pela tela (já existe no purchased-itinerary).
     * Servido como fallback quando o snapshot não vier — também é a
     * referência mais atualizada para campos não versionados (hero, etc.).
     */
    liveItinerary?: any;
    /** Se false: só mostra Original. Minha versão fica oculta/desabilitada. */
    canEdit: boolean;
    /**
     * Callback opcional para "Exportar PDF". Implementado em outra Task —
     * por ora o container só dispara o evento.
     */
    onExportPdf?: (args: {
        variant: 'original' | 'personalized';
        snapshot: RouteSnapshot | null;
        merged: MergedItinerary;
    }) => void;
    /**
     * Slot opcional renderizado APENAS quando a aba ativa é "Minha versão",
     * abaixo do MyRouteView. Usado por purchased-itinerary para encaixar a
     * Central da Viagem (TripCenter) dentro do contexto da versão editável —
     * mantendo a regra "checklist pessoal + arquivos vivem só na Minha Versão".
     *
     * Passe `undefined` (ou omita) se a tela não tem nada extra para a aba.
     */
    mineExtras?: React.ReactNode | ((context: {
        creatorChecklistProgress: Record<string, boolean>;
        creatorChecklistPending: boolean;
        onUpdateCreatorChecklistProgress: (next: Record<string, boolean>) => Promise<void>;
    }) => React.ReactNode);
    /**
     * Permite ao caller FORÇAR uma aba específica de fora (ex.: usuário
     * tocou no atalho "Abrir checklist" do "Comece por aqui" — queremos
     * que a aba "Minha versão" seja exibida já, pois a Central só aparece
     * lá). Cada mudança no `targetTab` (referência diferente, via
     * `Date.now()` etc) sincroniza o state interno via useEffect.
     *
     * NÃO é uma prop "controlada" no sentido React clássico: o state
     * interno continua autoritativo (usuário pode trocar de aba normalmente
     * via UI). Use `targetTab` apenas como gatilho externo.
     */
    targetTab?: RouteVersionTab;
    /**
     * Expõe a versão MERGEADA (snapshot + customization) para componentes
     * fora do RouteVersioning que precisem consumir o roteiro personalizado.
     *
     * Caso de uso atual: a seção "Custos e orçamento" / "Referência de
     * Gastos por Pessoa" vive FORA do RouteVersioning, mas precisa
     * recalcular usando os custos editados pelo viajante (que estão dentro
     * de `merged.<kind>.data.cost`). Sem essa exposição, a seção sempre
     * mostraria os custos originais do criador, ignorando edições.
     *
     * Dispara em todo recálculo do merge (mudança de snapshot ou
     * customization). Caller deve usar `setState` direto — `merged` é
     * memoizado e estável entre recálculos sem mudança.
     */
    onMergedChange?: (merged: MergedItinerary) => void;
}

// ─── Componente principal ────────────────────────────────────

export default function RouteVersioning({
    itineraryId,
    liveItinerary,
    canEdit,
    onExportPdf,
    mineExtras,
    targetTab,
    onMergedChange,
}: RouteVersioningProps) {
    const { accessToken, isAuthenticated } = useAuth();
    const hasAuth = !!accessToken && isAuthenticated;
    const effectiveCanEdit = canEdit && hasAuth;

    const [tab, setTab] = useState<RouteVersionTab>('original');

    // Sincroniza com `targetTab` externo — só dispara quando o caller muda
    // explicitamente (ref/valor diferente). NÃO bloqueia o usuário de trocar
    // de aba: o state interno continua autoritativo.
    useEffect(() => {
        if (targetTab && targetTab !== tab) {
            setTab(targetTab);
        }
        // Disable lint warning: o ponto é reagir apenas ao targetTab mudando.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetTab]);
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<RouteSnapshot | null>(null);
    const [customization, setCustomization] = useState<TravelerItineraryCustomization | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [creatorChecklistPending, setCreatorChecklistPending] = useState(false);

    // Mantém o último customization confirmado pelo backend, para rollback.
    const lastCommittedRef = useRef<TravelerItineraryCustomization | null>(null);

    // ─── Carregamento inicial ────────────────────────────────

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        // Sem token: usa apenas liveItinerary como snapshot e termina.
        if (!hasAuth) {
            setSnapshot((liveItinerary as RouteSnapshot) ?? null);
            setCustomization(null);
            lastCommittedRef.current = null;
            setLoading(false);
            return;
        }

        try {
            // Em paralelo — cada chamada captura seu próprio erro para que
            // uma falha pontual não derrube a outra.
            const [snapRes, custRes] = await Promise.allSettled([
                getSnapshot(itineraryId, accessToken!),
                getCustomization(itineraryId, accessToken!),
            ]);

            // Nunca substitui o Original comprado pelos dados atuais.
            if (snapRes.status === 'fulfilled') {
                setSnapshot(snapRes.value ?? null);
            } else {
                setSnapshot(null);
                setLoadError(
                    snapRes.reason?.message ||
                    'Não foi possível carregar a versão original comprada.',
                );
            }

            if (custRes.status === 'fulfilled') {
                setCustomization(custRes.value);
                lastCommittedRef.current = custRes.value;
            } else {
                setCustomization(null);
                lastCommittedRef.current = null;
                // Customization é opcional — se falhar, o usuário só não
                // verá personalizações; não é bloqueante.
            }
        } finally {
            setLoading(false);
        }
    }, [hasAuth, accessToken, itineraryId, liveItinerary]);

    useEffect(() => {
        void load();
    }, [load]);

    // ─── Merge (memo) ────────────────────────────────────────

    const merged: MergedItinerary = useMemo(
        () => mergeItineraryWithCustomization(snapshot, customization),
        [snapshot, customization],
    );

    // Notifica o caller a cada recálculo do merged. Útil pra seções
    // externas (custos, orçamento) que precisam ler a versão personalizada
    // sem montar seu próprio RouteVersioning.
    useEffect(() => {
        if (typeof onMergedChange === 'function') {
            onMergedChange(merged);
        }
    }, [merged, onMergedChange]);

    // ─── Mutação (optimistic + PUT + rollback) ────────────────

    /**
     * Atualiza o customization no backend de forma otimista. O caller
     * passa o `nextLocal` (estado já calculado para a UI mostrar imediato)
     * e o `patch` (delta a enviar ao backend). Em caso de falha, voltamos
     * para `lastCommittedRef.current` e notificamos o usuário.
     *
     * Exposto via `onMutateCustomization` para o MyRouteView consumir.
     * Mantido aqui mesmo sem MyRouteView ainda implementado — fica
     * pronto para a Task seguinte.
     */
    const mutateCustomization = useCallback(
        async (
            nextLocal: TravelerItineraryCustomization,
            patch: CustomizationPatch,
        ): Promise<boolean> => {
            if (!hasAuth) return false;

            // Optimistic — atualiza UI antes do PUT.
            setCustomization(nextLocal);

            try {
                const committed = await putCustomization(itineraryId, patch, accessToken!);
                setCustomization(committed);
                lastCommittedRef.current = committed;
                return true;
            } catch (e: any) {
                // Rollback
                setCustomization(lastCommittedRef.current);
                notify({
                    title: 'Não foi possível salvar',
                    message: e?.message || 'Tente novamente em instantes.',
                });
                return false;
            }
        },
        [hasAuth, accessToken, itineraryId],
    );

    // ─── Helpers de mutação (compõem o `nextLocal` + `patch`) ──

    /**
     * Constrói o "skeleton" de customization a partir do estado atual
     * (ou do default vazio). Usado como base para qualquer mutação local
     * antes do PUT.
     */
    const buildBase = useCallback((): TravelerItineraryCustomization => {
        const current = customization;
        return {
            id: current?.id ?? '__local__',
            travelerId: current?.travelerId ?? '__local__',
            itineraryId,
            saleId: current?.saleId ?? null,
            notes: current?.notes ?? null,
            addedItems: current?.addedItems ?? {},
            hiddenOriginalIds: Array.isArray(current?.hiddenOriginalIds)
                ? [...current!.hiddenOriginalIds]
                : [],
            editedOriginalItems: { ...(current?.editedOriginalItems ?? {}) },
            createdAt: current?.createdAt ?? new Date().toISOString(),
            updatedAt: current?.updatedAt ?? new Date().toISOString(),
        };
    }, [customization, itineraryId]);

    /**
     * Computa o diff entre `original` e `next` — retorna patch onde
     * campos novos/atualizados aparecem com o valor, e campos removidos
     * (existiam em original e sumiram em next) aparecem como `null`.
     */
    const computePatch = useCallback(
        (original: Record<string, any>, next: Record<string, any>): Record<string, any | null> => {
            const patch: Record<string, any | null> = {};
            // Campos presentes no original.
            for (const key of Object.keys(original ?? {})) {
                const a = original[key];
                const b = next[key];
                if (b === undefined || b === null || b === '') {
                    // Removido: marca para delete via null.
                    if (a !== undefined && a !== null && a !== '') {
                        patch[key] = null;
                    }
                } else if (!shallowEqual(a, b)) {
                    patch[key] = b;
                }
            }
            // Campos novos em next.
            for (const key of Object.keys(next ?? {})) {
                if (!(key in (original ?? {}))) {
                    if (next[key] !== undefined && next[key] !== null && next[key] !== '') {
                        patch[key] = next[key];
                    }
                }
            }
            return patch;
        },
        [],
    );

    // ─── Mutações específicas ──────────────────────────────────

    const applyEdit = useCallback(
        async (target: MergedItem, nextData: Record<string, any>) => {
            const base = buildBase();
            if (target.source === 'added' && target.addedId) {
                // Editou um item adicionado pelo viajante: substitui o `data`
                // no array correspondente.
                const map: AddedItemsMap = { ...(base.addedItems || {}) };
                if (target.kind === 'flightOutbound' || target.kind === 'flightReturn') {
                    map[target.kind] = { addedId: target.addedId, kind: target.kind, data: nextData };
                } else {
                    // dayActivity → bucket 'dayActivities'; day → bucket 'days'.
                    // Demais kinds usam o nome literal (já bate plural).
                    const bucketKey = bucketKeyOfKind(target.kind);
                    const bucket = Array.isArray((map as any)[bucketKey])
                        ? [...((map as any)[bucketKey] as AddedItem[])]
                        : [];
                    const idx = bucket.findIndex((a) => a.addedId === target.addedId);
                    const updated: AddedItem = {
                        ...(idx >= 0 ? bucket[idx] : { addedId: target.addedId, kind: target.kind }),
                        kind: target.kind,
                        data: nextData,
                    };
                    if (idx >= 0) bucket[idx] = updated;
                    else bucket.push(updated);
                    (map as any)[bucketKey] = bucket;
                }
                base.addedItems = map;
                await mutateCustomization(base, { addedItems: map });
            } else if (target.originalId) {
                // Editou um original: calcula patch (diff vs snapshot puro)
                // e grava em editedOriginalItems[originalId].
                const snapshotData = findSnapshotItem(snapshot, target.kind, target.originalId);
                const patch = computePatch(snapshotData ?? {}, nextData);
                const nextEdited: EditedPatchMap = { ...base.editedOriginalItems };
                if (Object.keys(patch).length === 0) {
                    delete nextEdited[target.originalId];
                } else {
                    nextEdited[target.originalId] = patch;
                }
                base.editedOriginalItems = nextEdited;
                await mutateCustomization(base, { editedOriginalItems: nextEdited });
            }
        },
        [buildBase, computePatch, snapshot, mutateCustomization],
    );

    const applyAdd = useCallback(
        async (kind: ItemKind, data: Record<string, any>, defaults?: Record<string, any> | null) => {
            const base = buildBase();
            const map: AddedItemsMap = { ...(base.addedItems || {}) };
            const addedId = generateAddedId();
            // Para `dayActivity`, o `dayNumber` vem dos defaults (qual dia
            // o usuário tocou em "+ Adicionar atividade"). Para `day`, vem
            // do próprio `data.dayNumber` informado no modal.
            const dayNumber = kind === 'dayActivity'
                ? (defaults?.dayNumber as number | undefined)
                : undefined;
            const item: AddedItem = {
                addedId,
                kind,
                data,
                ...(dayNumber !== undefined ? { dayNumber } : {}),
            };
            if (kind === 'flightOutbound' || kind === 'flightReturn') {
                map[kind] = item;
            } else {
                const bucketKey = bucketKeyOfKind(kind);
                const bucket = Array.isArray((map as any)[bucketKey])
                    ? [...((map as any)[bucketKey] as AddedItem[])]
                    : [];
                bucket.push(item);
                (map as any)[bucketKey] = bucket;
            }
            base.addedItems = map;
            await mutateCustomization(base, { addedItems: map });
        },
        [buildBase, mutateCustomization],
    );

    const applyHide = useCallback(
        async (target: MergedItem) => {
            const base = buildBase();
            if (target.source === 'added' && target.addedId) {
                // "Ocultar" um adicionado significa removê-lo (não temos
                // estado de hidden para added — o usuário pode sempre
                // adicionar de novo).
                const map: AddedItemsMap = { ...(base.addedItems || {}) };
                if (target.kind === 'flightOutbound' || target.kind === 'flightReturn') {
                    map[target.kind] = null;
                } else {
                    const bucketKey = bucketKeyOfKind(target.kind);
                    const bucket = Array.isArray((map as any)[bucketKey])
                        ? ((map as any)[bucketKey] as AddedItem[]).filter((a) => a.addedId !== target.addedId)
                        : [];
                    (map as any)[bucketKey] = bucket;
                }
                // Se o item é um dia adicionado: também removemos as
                // atividades vinculadas a ele (mesmo dayNumber) — não
                // adianta manter atividade órfã sem dia.
                if (target.kind === 'day') {
                    const dayNumber = (target.data as any)?.dayNumber;
                    if (typeof dayNumber === 'number') {
                        const acts = Array.isArray(map.dayActivities) ? map.dayActivities : [];
                        map.dayActivities = acts.filter((a) => a.dayNumber !== dayNumber);
                    }
                }
                base.addedItems = map;
                await mutateCustomization(base, { addedItems: map });
            } else if (target.originalId) {
                const set = new Set(base.hiddenOriginalIds);
                set.add(target.originalId);
                const nextHidden = Array.from(set);
                base.hiddenOriginalIds = nextHidden;
                await mutateCustomization(base, { hiddenOriginalIds: nextHidden });
            }
        },
        [buildBase, mutateCustomization],
    );

    /**
     * Move um dia da Minha Versão para cima ou para baixo. O movimento é
     * salvo na `addedItems.dayOrder` (array de chaves estáveis) — assim
     * dia editado/oculto/adicionado mantém identidade entre reorders.
     *
     * Cobertura de casos:
     *  - Se ainda NÃO existe dayOrder: inicializamos com a ordem visual
     *    atual (baseada no `merged.days` recém-renderizado), aplicamos o
     *    swap, e persistimos. Próximos moves apenas mutam esse array.
     *  - Movimentar pra cima no topo / pra baixo no fim: no-op silencioso
     *    (a UI já desabilita os botões, mas defendemos no handler).
     *  - Dia que não está em `merged.days` (ex.: ocultado): rejeita o move,
     *    mas em condições normais o caller não chega aqui.
     */
    const applyMoveDay = useCallback(
        async (target: MergedDay, direction: 'up' | 'down') => {
            // Ordem visual atual derivada do merged — fonte de verdade
            // estável dentro deste tick.
            const currentDays = merged.days;
            const idx = currentDays.findIndex(d => d.key === target.key);
            if (idx < 0) return;
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= currentDays.length) return;

            // Constroi novo dayOrder a partir da ordem atual + swap.
            const nextKeys = currentDays.map(d => d.key);
            const tmp = nextKeys[idx];
            nextKeys[idx] = nextKeys[newIdx];
            nextKeys[newIdx] = tmp;

            const base = buildBase();
            const map: AddedItemsMap = { ...(base.addedItems || {}) };
            map.dayOrder = nextKeys;
            base.addedItems = map;
            await mutateCustomization(base, { addedItems: map });
        },
        [merged.days, buildBase, mutateCustomization],
    );

    const applyRestore = useCallback(
        async (target: MergedItem) => {
            if (!target.originalId) return;
            const base = buildBase();
            const nextHidden = base.hiddenOriginalIds.filter((id) => id !== target.originalId);
            base.hiddenOriginalIds = nextHidden;
            await mutateCustomization(base, { hiddenOriginalIds: nextHidden });
        },
        [buildBase, mutateCustomization],
    );

    const applyPatchOnly = useCallback(
        async (patch: CustomizationPatch) => {
            const base = buildBase();
            // Aplica patch localmente para o optimistic state.
            if (patch.notes !== undefined) base.notes = patch.notes;
            if (patch.addedItems !== undefined) base.addedItems = patch.addedItems;
            if (patch.hiddenOriginalIds !== undefined) base.hiddenOriginalIds = patch.hiddenOriginalIds;
            if (patch.editedOriginalItems !== undefined) base.editedOriginalItems = patch.editedOriginalItems;
            await mutateCustomization(base, patch);
        },
        [buildBase, mutateCustomization],
    );

    // ─── Checklist do criador na aba Original (progresso pessoal) ──
    // Mesmo campo `creatorChecklistProgress` que a Central da Viagem usa,
    // com a mesma convenção de chave → marcar na Original reflete na Minha
    // Versão (e vice-versa) após o próximo carregamento. Estrutura do
    // checklist NUNCA muda; só o progresso (privado do comprador).
    const creatorChecklistProgress = useMemo(
        () => ((customization?.addedItems as any)?.creatorChecklistProgress ?? {}) as Record<string, boolean>,
        [customization],
    );

    const updateCreatorChecklistProgress = useCallback(
        async (nextProgress: Record<string, boolean>) => {
            if (creatorChecklistPending) return;
            setCreatorChecklistPending(true);
            try {
                const base = buildBase();
                const currentAdded = (base.addedItems ?? {}) as Record<string, any>;
                base.addedItems = {
                    ...currentAdded,
                    creatorChecklistProgress: nextProgress,
                };
                const saved = await mutateCustomization(base, { addedItems: base.addedItems });
                if (!saved) throw new Error('Não foi possível salvar o checklist.');
            } finally {
                setCreatorChecklistPending(false);
            }
        },
        [buildBase, creatorChecklistPending, mutateCustomization],
    );

    const toggleCreatorChecklist = useCallback(
        async (key: string) => {
            if (creatorChecklistPending) return;
            const nextProgress = {
                ...creatorChecklistProgress,
                [key]: !creatorChecklistProgress[key],
            };
            await updateCreatorChecklistProgress(nextProgress);
        },
        [
            creatorChecklistPending,
            creatorChecklistProgress,
            updateCreatorChecklistProgress,
        ],
    );

    // ─── Modais ────────────────────────────────────────────────

    const [editTarget, setEditTarget] = useState<MergedItem | null>(null);
    const [addContext, setAddContext] = useState<{
        kind: ItemKind;
        defaults?: Record<string, any> | null;
    } | null>(null);

    // ─── Export PDF handler ──────────────────────────────────

    const handleExport = useCallback(
        (variant: 'original' | 'personalized') => {
            haptics.light();
            if (typeof onExportPdf === 'function') {
                onExportPdf({ variant, snapshot, merged });
            } else {
                // Sem handler externo: feedback discreto para o usuário.
                notify({
                    title: 'Exportar PDF',
                    message: 'Em breve você poderá baixar este roteiro em PDF.',
                });
            }
        },
        [onExportPdf, snapshot, merged],
    );

    // ─── Render ──────────────────────────────────────────────

    return (
        <View style={styles.card}>
            {/* Cabeçalho */}
            <View style={styles.headerRow}>
                <View style={styles.headerIcon}>
                    <Ionicons name="git-branch" size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Meu roteiro</Text>
                    <Text style={styles.subtitle}>
                        Compare a versão original com a sua personalização. Suas anotações ficam
                        salvas só para você.
                    </Text>
                </View>
            </View>

            {/* Tabs */}
            <VersionTabs
                value={tab}
                onChange={setTab}
                disableMine={!effectiveCanEdit || loading}
            />

            {/* Banner: read-only */}
            {!effectiveCanEdit ? (
                <View style={styles.banner}>
                    <Ionicons name="lock-closed-outline" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.bannerText}>
                        {isAuthenticated
                            ? 'Personalização indisponível para esta sessão.'
                            : 'Entre na sua conta para personalizar seu roteiro.'}
                    </Text>
                </View>
            ) : null}

            {/* Banner: erro de carregamento (não bloqueante) */}
            {loadError ? (
                <TouchableOpacity
                    style={styles.errorBanner}
                    onPress={() => {
                        haptics.light();
                        void load();
                    }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="alert-circle-outline" size={14} color={theme.colors.error} />
                    <Text style={styles.errorText} numberOfLines={2}>
                        {loadError} Toque para tentar novamente.
                    </Text>
                </TouchableOpacity>
            ) : null}

            {/* Botão de exportar PDF (linka à aba ativa) */}
            {!loading ? (
                <TouchableOpacity
                    style={styles.exportBtn}
                    activeOpacity={0.85}
                    onPress={() =>
                        handleExport(tab === 'mine' ? 'personalized' : 'original')
                    }
                >
                    <Ionicons name="document-attach-outline" size={15} color={theme.colors.primary} />
                    <Text style={styles.exportBtnText}>
                        {tab === 'mine' ? 'Exportar minha versão (PDF)' : 'Exportar versão original (PDF)'}
                    </Text>
                </TouchableOpacity>
            ) : null}

            {/* Body */}
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator color={theme.colors.primary} />
                </View>
            ) : tab === 'original' ? (
                <View style={styles.body}>
                    {/* Checklist do criador interativo: progresso pessoal salvo
                        no customization (creatorChecklistProgress), mesma fonte
                        da Central da Viagem. Estrutura permanece somente-leitura. */}
                    <OriginalView
                        snapshot={snapshot}
                        itineraryId={itineraryId}
                        checklistProgress={creatorChecklistProgress}
                        canToggleChecklist={effectiveCanEdit}
                        checklistPending={creatorChecklistPending}
                        onToggleChecklist={(key) => { void toggleCreatorChecklist(key); }}
                    />
                </View>
            ) : (
                <View style={styles.body}>
                    <MyRouteView
                        merged={merged}
                        canEdit={effectiveCanEdit}
                        onPatch={applyPatchOnly}
                        onAddItem={(kind, defaults) => setAddContext({ kind, defaults })}
                        onEditItem={(item) => setEditTarget(item)}
                        onHideItem={(item) => { void applyHide(item); }}
                        onRestoreHidden={(item) => { void applyRestore(item); }}
                        onMoveDay={(day, dir) => { void applyMoveDay(day, dir); }}
                    />
                    {/* Slot "Minha Versão" — vive SÓ aqui. Hoje é onde o
                        purchased-itinerary encaixa a Central da Viagem
                        (checklist pessoal + arquivos), seguindo a regra
                        de produto: esses recursos não pertencem à Original. */}
                    {typeof mineExtras === 'function'
                        ? mineExtras({
                            creatorChecklistProgress,
                            creatorChecklistPending,
                            onUpdateCreatorChecklistProgress: updateCreatorChecklistProgress,
                        })
                        : mineExtras}
                </View>
            )}

            {/* Modais — montados no nível do container para sobreviverem
                a re-renders dos filhos. */}
            {editTarget ? (
                <EditItemModal
                    visible={!!editTarget}
                    onClose={() => setEditTarget(null)}
                    kind={editTarget.kind}
                    initial={editTarget.data}
                    isOriginal={editTarget.source !== 'added'}
                    onSave={async (data) => { await applyEdit(editTarget, data); }}
                />
            ) : null}

            {addContext ? (
                <AddItemModal
                    visible={!!addContext}
                    onClose={() => setAddContext(null)}
                    kind={addContext.kind}
                    defaults={addContext.defaults}
                    onSave={async (data) => {
                        await applyAdd(addContext.kind, data, addContext.defaults);
                    }}
                />
            ) : null}
        </View>
    );
}

// ─── Utilitários internos ───────────────────────────────────

/**
 * Mapeia um `ItemKind` para a chave correspondente em `AddedItemsMap`.
 * A maioria dos kinds bate o nome literal; as exceções são:
 *   - `dayActivity` → `dayActivities`
 *   - `day`         → `days`
 *
 * Centralizar essa lógica num único lugar evita os "lookups inline" que
 * já estavam espalhados antes e tinham bug latente (sem entrada pra `day`).
 */
function bucketKeyOfKind(kind: ItemKind): keyof AddedItemsMap {
    if (kind === 'dayActivity') return 'dayActivities';
    if (kind === 'day') return 'days';
    return kind as keyof AddedItemsMap;
}

function shallowEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a == null || b == null) return false;
    if (typeof a !== 'object') return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
        if (a[k] !== b[k]) return false;
    }
    return true;
}

/**
 * Localiza um item do snapshot por `(kind, originalId)` para diffing.
 * Replica a indexação do mergeEngine — necessário porque os items do
 * snapshot não têm um lookup direto por originalId.
 */
function findSnapshotItem(
    snapshot: RouteSnapshot | null,
    kind: ItemKind,
    originalId: string,
): Record<string, any> | null {
    if (!snapshot) return null;
    // Singletons de voo
    if (kind === 'flightOutbound') return snapshot?.flightInfo?.outbound ?? null;
    if (kind === 'flightReturn')  return snapshot?.flightInfo?.return ?? null;
    // Dia inteiro: originalId = "day:<dayNumber>"
    if (kind === 'day') {
        // Aceita o formato "day:N" e fallback caso venha só "N".
        const n = originalId.startsWith('day:')
            ? Number(originalId.slice(4))
            : Number(originalId);
        if (!Number.isFinite(n)) return null;
        const days = Array.isArray(snapshot.days) ? snapshot.days : [];
        const day = days.find((d: any) => d?.dayNumber === n);
        if (!day) return null;
        // Devolvemos só os campos editáveis (não atividades) — o diff em
        // computePatch compara contra esses 4 campos.
        return {
            dayNumber: day.dayNumber,
            title: day.title ?? '',
            summary: day.summary ?? '',
            description: day.description ?? '',
        };
    }
    // Atividade do dia: originalId = "<dayNumber>:<idx>"
    if (kind === 'dayActivity') {
        const [dayStr, idxStr] = originalId.split(':');
        const dayNumber = Number(dayStr);
        const idx = Number(idxStr);
        const days = Array.isArray(snapshot.days) ? snapshot.days : [];
        const day = days.find((d: any) => d?.dayNumber === dayNumber);
        const activities = Array.isArray(day?.activities) ? day.activities : [];
        return activities[idx] ?? null;
    }
    // Listas: tenta por id (se houver) e, em fallback, por `<kind>:<idx>`
    const sourceMap: Record<string, any> = {
        accommodations: snapshot.accommodations,
        transports: snapshot.transports,
        attractions: snapshot.attractions,
        restaurants: snapshot.restaurants,
        generalTips: snapshot.generalTips,
        checklistItems: snapshot.checklists ?? snapshot.checklist,
        extraSpendingItems: snapshot.extraSpendingItems,
    };
    const list = Array.isArray(sourceMap[kind]) ? sourceMap[kind] : [];
    // Tenta por id direto.
    const byId = list.find((it: any) => it?.id === originalId);
    if (byId) return byId;
    // Fallback: parse `<kind>:<idx>`.
    if (originalId.startsWith(`${kind}:`)) {
        const idx = Number(originalId.slice(kind.length + 1));
        return list[idx] ?? null;
    }
    return null;
}

// ─── Styles ──────────────────────────────────────────────────

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

    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceLight,
    },
    bannerText: {
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

    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary + '38',
        backgroundColor: theme.colors.primary + '10',
    },
    exportBtnText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: theme.colors.primary,
    },

    loadingWrap: {
        paddingVertical: 36,
        alignItems: 'center',
    },

    body: {
        marginTop: 16,
    },

});
