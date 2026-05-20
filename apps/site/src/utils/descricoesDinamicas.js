/**
 * descricoesDinamicas.js
 *
 * Geradores de descrição dinâmica para as seções da vitrine do roteiro.
 *
 * Regras gerais:
 *  - Cada função analisa o que foi REALMENTE preenchido pelo roteirista.
 *  - Retorna uma string de descrição atrativa e honesta, OU null.
 *  - null = seção não aparece na vitrine.
 *  - Nunca promete algo que não existe nos dados.
 *
 * Como usar:
 *  import * as desc from "@/utils/descricoesDinamicas";
 *  const texto = desc.diarioViagem({ dias: roteiro.days, ... });
 *  if (texto) renderizarSecao(texto);
 */

// ─────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────

/** Verifica se uma lista tem ao menos um item com conteúdo relevante. */
function listaPreenchida(arr) {
    return Array.isArray(arr) && arr.length > 0;
}

/** Pluraliza "dia" ou "dias". */
function pluralDia(n) {
    return n === 1 ? "1 dia" : `${n} dias`;
}

/** Pluraliza qualquer palavra. */
function plural(n, singular, pluralForm) {
    return n === 1 ? `1 ${singular}` : `${n} ${pluralForm}`;
}

// ─────────────────────────────────────────────
// 1. DIÁRIO DE VIAGEM (itinerário por dia)
// ─────────────────────────────────────────────

/**
 * @param {object} dados
 * @param {Array}  dados.dias          - Array de dias preenchidos (cada dia = objeto com activities[])
 * @param {boolean} dados.temHorarios  - Se ao menos um dia tem horários nas atividades
 * @param {boolean} dados.temDicas     - Se ao menos um dia tem dicas/tips nas atividades
 * @returns {string|null}
 */
export function diarioViagem({ dias = [], temHorarios = false, temDicas = false }) {
    // Conta dias que têm ao menos 1 atividade
    const diasComConteudo = dias.filter(
        (d) => listaPreenchida(d.activities) || listaPreenchida(d.items)
    );

    if (diasComConteudo.length === 0) return null;

    const partes = [`Programação de ${pluralDia(diasComConteudo.length)} com locais e atividades`];

    if (temHorarios) partes.push("horários organizados");
    if (temDicas)    partes.push("dicas práticas de quem esteve lá");

    // Une: "Programação de 7 dias com locais e atividades, horários organizados e dicas práticas de quem esteve lá"
    return unirPartes(partes);
}

// ─────────────────────────────────────────────
// 2. ITINERÁRIO DE VOOS
// ─────────────────────────────────────────────

/**
 * @param {object}  dados
 * @param {object}  dados.vooIda        - Objeto do voo de ida (ou null)
 * @param {object}  dados.vooVolta      - Objeto do voo de volta (ou null)
 * @param {boolean} dados.temDicas      - Se campo de dicas/tips de voo foi preenchido
 * @returns {string|null}
 */
export function itinerarioVoos({ vooIda = null, vooVolta = null, temDicas = false }) {
    const voos = [vooIda, vooVolta].filter(Boolean);

    if (voos.length === 0) return null;

    const temCompanhia = voos.some((v) => v.airline && v.airline.trim() !== "");
    const temDatas     = voos.some((v) => v.departureDate && v.departureDate.trim() !== "");

    const partes = [];

    if (voos.length === 2) {
        partes.push("Sugestão de voo de ida e volta");
    } else {
        partes.push("Sugestão de voo");
    }

    if (temCompanhia) partes.push("companhia aérea indicada");
    if (temDatas)     partes.push("datas de embarque");
    if (temDicas)     partes.push("dicas para economizar na passagem");

    return unirPartes(partes);
}

// ─────────────────────────────────────────────
// 3. HOTÉIS & HOSPEDAGENS
// ─────────────────────────────────────────────

/**
 * @param {object}  dados
 * @param {Array}   dados.lista          - Array de hospedagens
 * @param {boolean} dados.temFaixaPreco  - Se ao menos uma hospedagem tem preco preenchido
 * @param {boolean} dados.temLocalizacao - Se ao menos uma hospedagem tem endereço/mapa
 * @returns {string|null}
 */
export function hoteis({ lista = [], temFaixaPreco = false, temLocalizacao = false }) {
    if (!listaPreenchida(lista)) return null;

    const qtd = lista.length;
    const partes = [`${plural(qtd, "opção de hospedagem", "opções de hospedagem")}`];

    if (temFaixaPreco)  partes.push("faixa de preço por noite");
    if (temLocalizacao) partes.push("localização com link no mapa");

    return unirPartes(partes);
}

// ─────────────────────────────────────────────
// 4. PASSEIOS & ATRAÇÕES
// ─────────────────────────────────────────────

/**
 * @param {object}  dados
 * @param {Array}   dados.lista           - Array de atrações
 * @param {boolean} dados.temPrecoIngresso - Se ao menos uma atração tem ticketValue
 * @param {boolean} dados.temHorarios     - Se ao menos uma atração tem hours preenchido
 * @param {boolean} dados.temDicas        - Se ao menos uma atração tem tips preenchido
 * @returns {string|null}
 */
export function passeiosAtracoes({
    lista = [],
    temPrecoIngresso = false,
    temHorarios = false,
    temDicas = false,
}) {
    if (!listaPreenchida(lista)) return null;

    const qtd = lista.length;
    const partes = [`${plural(qtd, "atração indicada", "atrações indicadas")}`];

    if (temPrecoIngresso) partes.push("preços de ingresso");
    if (temHorarios)      partes.push("horários de funcionamento");
    if (temDicas)         partes.push("dicas de quem conhece o local");

    return unirPartes(partes);
}

// ─────────────────────────────────────────────
// 5. LOCOMOÇÃO / TRANSPORTE
// ─────────────────────────────────────────────

/**
 * @param {object}  dados
 * @param {Array}   dados.lista       - Array de transportes cadastrados
 * @param {boolean} dados.temDicas    - Se ao menos um transporte tem notas/dicas
 * @returns {string|null}
 */
export function locomocao({ lista = [], temDicas = false }) {
    if (!listaPreenchida(lista)) return null;

    const partes = [`${plural(lista.length, "opção de transporte", "opções de transporte")} explicadas`];

    if (temDicas) partes.push("dicas práticas de uso");

    return unirPartes(partes);
}

// ─────────────────────────────────────────────
// 6. DICAS EXCLUSIVAS
// ─────────────────────────────────────────────

/**
 * @param {object}  dados
 * @param {Array}   dados.lista            - Array de dicas cadastradas
 * @param {boolean} dados.temHorarios      - Se alguma dica menciona melhores horários
 * @param {boolean} dados.temSegredosLocais - Se alguma dica é do tipo local/exclusiva
 * @param {boolean} dados.temEconomia      - Se alguma dica é sobre economia
 * @returns {string|null}
 */
export function dicasExclusivas({
    lista = [],
    temHorarios = false,
    temSegredosLocais = false,
    temEconomia = false,
}) {
    if (!listaPreenchida(lista)) return null;

    const partes = [`${plural(lista.length, "dica exclusiva", "dicas exclusivas")} de quem já foi`];

    if (temSegredosLocais) partes.push("segredos que não estão no Google");
    if (temHorarios)       partes.push("melhores horários para visitar");
    if (temEconomia)       partes.push("como economizar na viagem");

    return unirPartes(partes);
}

// ─────────────────────────────────────────────
// 7. RESTAURANTES & GASTRONOMIA
// ─────────────────────────────────────────────

/**
 * @param {object}  dados
 * @param {Array}   dados.lista             - Array de restaurantes
 * @param {boolean} dados.temOpcoesBolso    - Se há restaurantes com faixas de preço variadas
 * @param {boolean} dados.temPratosTipicos  - Se algum restaurante tem culinária local/típica
 * @returns {string|null}
 */
export function restaurantes({
    lista = [],
    temOpcoesBolso = false,
    temPratosTipicos = false,
}) {
    if (!listaPreenchida(lista)) return null;

    const qtd = lista.length;
    const partes = [`${plural(qtd, "restaurante indicado", "restaurantes indicados")}`];

    if (temOpcoesBolso)   partes.push("opções para diferentes orçamentos");
    if (temPratosTipicos) partes.push("pratos típicos que vale experimentar");

    return unirPartes(partes);
}

// ─────────────────────────────────────────────
// 8. CHECKLIST DE PLANEJAMENTO
// ─────────────────────────────────────────────

/**
 * @param {object} dados
 * @param {Array}  dados.itens          - Array de itens do checklist
 * @param {boolean} dados.temDocumentos - Se há itens do tipo documento
 * @param {boolean} dados.temMala       - Se há itens do tipo mala/packing
 * @param {boolean} dados.temTarefas    - Se há itens do tipo tarefa pré-viagem
 * @returns {string|null}
 */
export function checklist({
    itens = [],
    temDocumentos = false,
    temMala = false,
    temTarefas = false,
}) {
    if (!listaPreenchida(itens)) return null;

    const qtd = itens.length;
    const partes = [`Lista interativa com ${plural(qtd, "item", "itens")} para não esquecer nada`];

    if (temDocumentos) partes.push("documentos necessários");
    if (temMala)       partes.push("o que levar na mala");
    if (temTarefas)    partes.push("tarefas pré-viagem");

    return unirPartes(partes);
}

// ─────────────────────────────────────────────
// HELPER DE FORMATAÇÃO
// ─────────────────────────────────────────────

/**
 * Une partes de uma descrição com vírgulas e "e" no final.
 * Ex: ["A", "B", "C"] → "A, B e C"
 * Ex: ["A", "B"]      → "A e B"
 * Ex: ["A"]           → "A"
 */
function unirPartes(partes) {
    if (partes.length === 1) return partes[0];
    const inicio = partes.slice(0, -1).join(", ");
    return `${inicio} e ${partes[partes.length - 1]}`;
}

// ─────────────────────────────────────────────
// FUNÇÃO PRINCIPAL: gera todas as descrições de uma vez
// ─────────────────────────────────────────────

/**
 * Recebe o objeto completo do roteiro e retorna um mapa com
 * as descrições dinâmicas de todas as seções.
 * Seções sem conteúdo retornam null.
 *
 * @param {object} roteiro - Objeto completo do roteiro (formato da API/banco)
 * @returns {object} Mapa { secao: string|null }
 *
 * @example
 * const descricoes = gerarDescricoes(roteiro);
 * // { diario: "Programação de 7 dias...", voos: null, hoteis: "3 opções...", ... }
 */
export function gerarDescricoes(roteiro) {
    const dias = roteiro.days || [];
    const acoms = roteiro.accommodations || [];
    const atracoes = roteiro.attractions || [];
    const transportes = roteiro.transports || [];
    const dicas = roteiro.generalTips || [];
    const rests = roteiro.restaurants || [];
    const checks = roteiro.checklistItems || [];
    const vooIda = roteiro.flightInfo?.outbound || null;
    const vooVolta = roteiro.flightInfo?.return || null;

    return {
        diario: diarioViagem({
            dias,
            temHorarios: dias.some((d) =>
                (d.activities || []).some((a) => a.time && a.time.trim() !== "")
            ),
            temDicas: dias.some((d) =>
                (d.activities || []).some((a) => a.tips && a.tips.trim() !== "")
            ),
        }),

        voos: itinerarioVoos({
            vooIda,
            vooVolta,
            temDicas: !!(roteiro.flightInfo?.tips?.length > 0),
        }),

        hoteis: hoteis({
            lista: acoms,
            temFaixaPreco: acoms.some((a) => a.priceValue && a.priceValue !== ""),
            temLocalizacao: acoms.some((a) => a.mapLink && a.mapLink.trim() !== ""),
        }),

        passeios: passeiosAtracoes({
            lista: atracoes,
            temPrecoIngresso: atracoes.some((a) => a.ticketValue && a.ticketValue !== ""),
            temHorarios: atracoes.some((a) => a.hours && a.hours.trim() !== ""),
            temDicas: atracoes.some((a) => a.tips && a.tips.trim() !== ""),
        }),

        locomocao: locomocao({
            lista: transportes,
            temDicas: transportes.some((t) => t.notes && t.notes.trim() !== ""),
        }),

        dicas: dicasExclusivas({
            lista: dicas,
            // Campos futuros — por ora considera false até ter tipagem nas dicas
            temHorarios: false,
            temSegredosLocais: false,
            temEconomia: false,
        }),

        restaurantes: restaurantes({
            lista: rests,
            temOpcoesBolso: rests.some((r) => r.priceValue && r.priceValue !== ""),
            temPratosTipicos: rests.some((r) => r.cuisine && r.cuisine.trim() !== ""),
        }),

        checklist: checklist({
            itens: checks,
            temDocumentos: checks.some((c) => c.category === "documentos"),
            temMala: checks.some((c) => c.category === "mala"),
            temTarefas: checks.some((c) => c.category === "tarefas"),
        }),
    };
}

// ─────────────────────────────────────────────
// EXEMPLOS DE INTEGRAÇÃO NA VITRINE
// ─────────────────────────────────────────────
//
// ── React (Next.js) ──────────────────────────
//
//   import { gerarDescricoes } from "@/utils/descricoesDinamicas";
//
//   const descricoes = gerarDescricoes(roteiro);
//
//   {descricoes.hoteis && (
//     <SecaoVitrine titulo="Hotéis & Hospedagens" descricao={descricoes.hoteis} />
//   )}
//
// ── Ou com as funções individuais ────────────
//
//   import { hoteis } from "@/utils/descricoesDinamicas";
//
//   const textoHoteis = hoteis({
//     lista: roteiro.accommodations,
//     temFaixaPreco: roteiro.accommodations.some(a => a.priceValue),
//     temLocalizacao: roteiro.accommodations.some(a => a.mapLink),
//   });
//
//   // textoHoteis === null → não renderiza a seção
//   // textoHoteis === "3 opções de hospedagem, faixa de preço por noite e localização com link no mapa"
//
// ── Renderização condicional sugerida ────────
//
//   const SECOES = [
//     { key: "diario",      titulo: "Diário de Viagem",          icone: "🗓️" },
//     { key: "voos",        titulo: "Itinerário de Voos",        icone: "✈️" },
//     { key: "hoteis",      titulo: "Hotéis & Hospedagens",      icone: "🏨" },
//     { key: "passeios",    titulo: "Passeios & Atrações",       icone: "🎫" },
//     { key: "locomocao",   titulo: "Locomoção",                 icone: "🚌" },
//     { key: "dicas",       titulo: "Dicas Exclusivas",          icone: "💡" },
//     { key: "restaurantes",titulo: "Restaurantes & Gastronomia",icone: "🍴" },
//     { key: "checklist",   titulo: "Checklist de Planejamento", icone: "✅" },
//   ];
//
//   const descricoes = gerarDescricoes(roteiro);
//
//   {SECOES
//     .filter(s => descricoes[s.key] !== null)
//     .map(s => (
//       <SecaoVitrine
//         key={s.key}
//         icone={s.icone}
//         titulo={s.titulo}
//         descricao={descricoes[s.key]}
//       />
//     ))
//   }
