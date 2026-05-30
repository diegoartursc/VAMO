/**
 * FAQ data for digital itineraries.
 * Each entry is tied to a seller/creator and has a list of Q&A pairs.
 */

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQData {
    items: FAQItem[];
}

/**
 * FAQs for itineraries, keyed by itinerary ID.
 */
export const itineraryFAQs: Record<string, FAQData> = {
    '1': {
        items: [
            {
                question: 'Como recebo o roteiro após a compra?',
                answer: 'Assim que o pagamento for confirmado, o roteiro fica disponível em Meus Roteiros no app. Download offline será liberado em uma próxima versão.',
            },
            {
                question: 'Posso adaptar o roteiro para mais ou menos dias?',
                answer: 'Sim! O roteiro é flexível. Incluo dicas de como reduzir para 7 dias ou estender para 14. Você pode ajustar conforme sua disponibilidade.',
            },
            {
                question: 'O roteiro inclui preços atualizados?',
                answer: 'Sim, atualizo os preços de hospedagens, atrações e restaurantes a cada 3 meses. Você sempre terá acesso à versão mais recente.',
            },

            {
                question: 'Serve para viagem com crianças?',
                answer: 'Sim, incluo dicas específicas para famílias com crianças: parques, atividades kid-friendly, restaurantes com menu infantil e dicas de transporte.',
            },
        ],
    },
    '2': {
        items: [
            {
                question: 'Preciso saber japonês para seguir o roteiro?',
                answer: 'Não! Incluo um guia de frases essenciais em japonês e dicas de apps de tradução. Todos os locais têm indicações em inglês também.',
            },
            {
                question: 'O roteiro cobre transporte entre cidades?',
                answer: 'Sim, incluo guia completo do Japan Rail Pass, como comprar, ativar e usar. Também indico as melhores rotas de trem-bala.',
            },
            {
                question: 'É possível seguir o roteiro com orçamento limitado?',
                answer: 'Com certeza! Incluo opções para três faixas de orçamento: econômico, moderado e confortável. Há dicas de economia em cada etapa.',
            },
            {
                question: 'O roteiro inclui experiências culturais autênticas?',
                answer: 'Sim! Incluo templos menos conhecidos, cerimônias do chá, mercados locais e bairros fora do circuito turístico tradicional.',
            },
        ],
    },
};

/**
 * Legacy-compatible FAQs, keyed by old route ID.
 */
export const packageFAQs: Record<string, FAQData> = {
    'pkg-1': {
        items: [
            {
                question: 'O que está incluído no roteiro?',
                answer: 'O roteiro inclui informações, dicas, links e recomendações digitais conforme descrito na página do produto.',
            },
            {
                question: 'Posso cancelar após a reserva?',
                answer: 'Sim! Oferecemos cancelamento gratuito com reembolso integral se cancelado até 24 horas antes da data do passeio.',
            },
            {
                question: 'Como funciona o ponto de encontro?',
                answer: 'Após a confirmação, enviamos o endereço exato do ponto de encontro com mapa interativo. Também oferecemos serviço de busca no hotel por um valor adicional.',
            },
            {
                question: 'O passeio acontece com chuva?',
                answer: 'Sim, o passeio ocorre normalmente com chuva leve. Em caso de condições climáticas severas, oferecemos reagendamento sem custo ou reembolso total.',
            },
            {
                question: 'Crianças pagam valor integral?',
                answer: 'Crianças de 0 a 3 anos não pagam. De 4 a 11 anos pagam 50% do valor. A partir de 12 anos, valor integral.',
            },
        ],
    },
    'pkg-2': {
        items: [
            {
                question: 'Qual o tamanho máximo do grupo?',
                answer: 'Os tours coletivos têm no máximo 15 pessoas. Para uma experiência mais exclusiva, oferecemos a opção de tour privativo.',
            },
            {
                question: 'Preciso levar algo específico?',
                answer: 'Recomendamos sapatos confortáveis, protetor solar e garrafa d\'água. Enviaremos uma lista completa por email após a reserva.',
            },
            {
                question: 'O guia fala português?',
                answer: 'Sim! Todos os nossos guias são fluentes em português. Também temos opções com guias bilíngues (português/inglês).',
            },
            {
                question: 'Posso levar bagagens durante o tour?',
                answer: 'Sim, temos espaço para bagagens pequenas no veículo. Para malas grandes, sugerimos deixar no hotel ou usar nosso serviço de transfer.',
            },
        ],
    },
    '3': {
        items: [
            {
                question: 'O seguro viagem está incluído?',
                answer: 'Não. Seguro viagem deve ser contratado separadamente pelo viajante quando fizer sentido para o destino.',
            },
            {
                question: 'É possível adaptar o roteiro?',
                answer: 'Sim. O conteúdo serve como guia e pode ser ajustado pelo viajante conforme tempo, orçamento e preferências.',
            },
            {
                question: 'Alimentação está incluída?',
                answer: 'Não. Restaurantes e alimentação aparecem como recomendações ou estimativas, mas são pagos diretamente pelo viajante.',
            },
        ],
    },
};

/**
 * Default FAQ items used when no specific FAQ exists for the entity.
 */
export const defaultItineraryFAQ: FAQData = {
    items: [
        {
            question: 'Como recebo o roteiro?',
            answer: 'Após a confirmação do pagamento, o roteiro fica disponível em Meus Roteiros no app. Download offline será liberado em uma próxima versão.',
        },

        {
            question: 'O roteiro é atualizado?',
            answer: 'Sim, os criadores mantêm os roteiros atualizados com preços, horários e dicas recentes.',
        },
    ],
};

export const defaultPackageFAQ: FAQData = {
    items: [
        {
            question: 'O que está incluído?',
            answer: 'Cada roteiro detalha exatamente os módulos digitais incluídos, como dias, atividades, links, dicas e estimativas.',
        },
        {
            question: 'Posso cancelar minha reserva?',
            answer: 'Sim, oferecemos cancelamento gratuito até 24 horas antes do passeio com reembolso integral.',
        },
        {
            question: 'Crianças pagam?',
            answer: 'Crianças de 0 a 3 anos não pagam. De 4 a 11 anos, 50% do valor. A partir de 12 anos, valor integral.',
        },
    ],
};

/**
 * Get FAQ by itinerary or package ID, falling back to defaults.
 */
export const getItineraryFAQ = (id: string): FAQItem[] =>
    (itineraryFAQs[id] || defaultItineraryFAQ).items;

export const getPackageFAQ = (id: string): FAQItem[] =>
    (packageFAQs[id] || defaultPackageFAQ).items;
