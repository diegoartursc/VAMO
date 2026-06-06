/**
 * AddItemModal — modal para adicionar um novo item ao roteiro
 * personalizado do viajante.
 *
 * Wrapper sobre `ItemFormModal` configurado para "criar":
 *  - sem aviso de "edição salva apenas no seu roteiro" (já é claro
 *    pelo contexto da tela);
 *  - botão primário "Adicionar ao meu roteiro";
 *  - inicial vazia (mas o caller pode passar `defaults` para campos
 *    pré-preenchidos — ex.: `dayNumber` numa atividade do dia).
 *
 * Geração de `addedId`: o caller dispara via `generateAddedId()` do
 * mergeEngine — esse modal só emite o `data`. Decisão deliberada para
 * manter o modal sem efeito colateral além de chamar `onSave`.
 */

import React from 'react';

import ItemFormModal from './ItemFormModal';
import { KIND_TITLE } from './itemFields';
import type { ItemKind } from '../../services/routeCustomization';

export interface AddItemModalProps {
    visible: boolean;
    onClose: () => void;
    kind: ItemKind;
    /** Valores padrão opcionais (ex.: dayNumber). */
    defaults?: Record<string, any> | null;
    onSave: (data: Record<string, any>) => Promise<void> | void;
}

export default function AddItemModal({
    visible,
    onClose,
    kind,
    defaults,
    onSave,
}: AddItemModalProps) {
    const meta = KIND_TITLE[kind];
    return (
        <ItemFormModal
            visible={visible}
            onClose={onClose}
            kind={kind}
            initial={defaults || null}
            title={meta?.addLabel || 'Adicionar item'}
            primaryLabel="Adicionar ao meu roteiro"
            onSave={onSave}
        />
    );
}
