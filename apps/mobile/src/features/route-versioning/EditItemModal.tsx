/**
 * EditItemModal — modal de edição de um item existente do roteiro.
 *
 * Usado quando o viajante toca/long-press em um card do MyRouteView.
 * Carrega o estado atual do item (original com patch aplicado OU added
 * cru) e, ao salvar, dispara `onSave(nextData)` — o caller calcula o
 * patch (diff vs original) e atualiza `editedOriginalItems` (se for
 * original) ou substitui o `data` do `addedItems[kind]` correspondente.
 *
 * Quando `isOriginal=true`, mostra o aviso "Edição salva apenas no
 * seu roteiro" no topo do form.
 *
 * Não conhece IDs ou mecânica de overlay — só recebe o `data` inicial
 * e emite o `data` final.
 */

import React from 'react';

import ItemFormModal from './ItemFormModal';
import { KIND_TITLE } from './itemFields';
import type { ItemKind } from '../../services/routeCustomization';

export interface EditItemModalProps {
    visible: boolean;
    onClose: () => void;
    kind: ItemKind;
    /** Estado atual do `data` (já merged se original com patch). */
    initial: Record<string, any> | null;
    /** True quando o item editado tem origem no snapshot ("Original"). */
    isOriginal: boolean;
    onSave: (data: Record<string, any>) => Promise<void> | void;
}

export default function EditItemModal({
    visible,
    onClose,
    kind,
    initial,
    isOriginal,
    onSave,
}: EditItemModalProps) {
    const meta = KIND_TITLE[kind];
    const title = isOriginal
        ? `Personalizar ${meta?.singular?.toLowerCase() || 'item'}`
        : `Editar ${meta?.singular?.toLowerCase() || 'item'}`;
    const primaryLabel = isOriginal ? 'Personalizar' : 'Salvar';

    return (
        <ItemFormModal
            visible={visible}
            onClose={onClose}
            kind={kind}
            initial={initial}
            isOriginal={isOriginal}
            title={title}
            primaryLabel={primaryLabel}
            onSave={onSave}
        />
    );
}
