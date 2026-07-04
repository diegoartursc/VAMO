/**
 * Subtítulo dinâmico do card do Passaporte VAMO.
 *
 * Varia conforme o NÍVEL e a FASE do progresso dentro do nível. Os nomes das
 * fases (início / em movimento / reta / quase / máximo) são internos — o
 * usuário vê apenas o texto. Puro e testável.
 */
import type { TravelerLevel } from './gamification.types';

interface PhaseText {
    /** 0%–24% */
    start: string;
    /** 25%–59% */
    moving: string;
    /** 60%–89% */
    stretch: string;
    /** 90%–99% */
    almost: string;
    /** nível máximo (sem próximo nível) */
    max?: string;
}

const PHASE_TEXT: Record<TravelerLevel, PhaseText> = {
    explorer: {
        start: 'Você começou sua jornada na VAMO. Complete seu perfil, salve roteiros e ganhe seus primeiros carimbos.',
        moving: 'Seus primeiros passos já foram dados. Continue salvando roteiros e planejando sua próxima viagem.',
        stretch: 'Você está perto de se tornar Viajante Ativo. Complete mais missões para desbloquear o próximo carimbo.',
        almost: 'Falta pouco para virar Viajante Ativo. Mais uma ação pode levar você ao próximo nível.',
    },
    active_traveler: {
        start: 'Você já está planejando melhor suas viagens. Salve experiências e comece a montar seu carrinho.',
        moving: 'Sua intenção de viagem está ganhando forma. Continue avançando rumo à sua primeira compra.',
        stretch: 'Você está perto de virar Planejador. Sua primeira compra está logo ali.',
        almost: 'Falta pouco para virar Planejador. Conclua sua jornada de compra para subir de nível.',
    },
    planner: {
        start: 'Você já transforma inspiração em planejamento real. Use seus roteiros e comece a ajudar outros viajantes.',
        moving: 'Suas avaliações e personalizações começam a gerar confiança na comunidade.',
        stretch: 'Você está perto de virar Viajante Criador. Continue avaliando e aproveitando seus roteiros.',
        almost: 'Falta pouco para virar Viajante Criador. Mais uma ação consolida sua evolução.',
    },
    // key 'backpacker' = "Viajante Criador"
    backpacker: {
        start: 'Você começou a transformar sua experiência em roteiros publicados.',
        moving: 'Seu papel como criador está ganhando forma. Continue melhorando seus roteiros.',
        stretch: 'Você está perto de consolidar sua presença como Viajante Experiente.',
        almost: 'Falta pouco para o próximo nível. Continue publicando, melhorando e divulgando seus roteiros.',
    },
    experienced: {
        start: 'Você já participa dos dois lados da VAMO: compra, avalia e publica.',
        moving: 'Sua reputação como comprador e criador está se firmando.',
        stretch: 'Você está perto de virar Desbravador. Continue vendendo e elevando a qualidade dos roteiros.',
        almost: 'Falta pouco para virar Desbravador. Sua jornada está quase no próximo patamar.',
    },
    pathfinder: {
        start: 'Você já é referência na VAMO. Suas compras, avaliações e roteiros movem a comunidade.',
        moving: 'Sua escala no marketplace está crescendo de forma saudável.',
        stretch: 'Você está perto de virar Embaixador VAMO. Continue ampliando seu impacto.',
        almost: 'Falta pouco para virar Embaixador VAMO. O topo da jornada está logo ali.',
    },
    ambassador: {
        start: 'Você alcançou o status máximo da VAMO. Sua jornada inspira viajantes e fortalece a comunidade.',
        moving: 'Você alcançou o status máximo da VAMO. Sua jornada inspira viajantes e fortalece a comunidade.',
        stretch: 'Você alcançou o status máximo da VAMO. Sua jornada inspira viajantes e fortalece a comunidade.',
        almost: 'Você alcançou o status máximo da VAMO. Sua jornada inspira viajantes e fortalece a comunidade.',
        max: 'Você alcançou o status máximo da VAMO. Continue inspirando a comunidade — cada compra, avaliação e roteiro deixa sua marca.',
    },
};

/**
 * Retorna o subtítulo coerente com o nível e a fase do progresso.
 * @param progressPct 0..1 dentro do nível atual.
 * @param isMaxLevel true quando não há próximo nível (Embaixador).
 */
export function getTravelerLevelSubtitle(
    level: TravelerLevel,
    progressPct: number,
    isMaxLevel: boolean,
): string {
    const t = PHASE_TEXT[level] ?? PHASE_TEXT.explorer;
    if (isMaxLevel) return t.max ?? t.start;
    const pct = Number.isFinite(progressPct) ? Math.max(0, Math.min(1, progressPct)) : 0;
    if (pct >= 0.9) return t.almost;
    if (pct >= 0.6) return t.stretch;
    if (pct >= 0.25) return t.moving;
    return t.start;
}
