const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ─── Helper: calcula qualityScore (mesma fórmula do route) ──────────────────
function calcQuality(data) {
    let s = 0;
    if (data.title?.trim()) s += 5;
    if (data.subtitle?.trim()) s += 3;
    if (data.destination?.trim()) s += 4;
    if (data.country?.trim()) s += 2;
    if (data.description?.trim()) s += 3;
    if ((data.description?.trim().length ?? 0) >= 150) s += 2;
    if ((data.travelStyles?.length ?? 0) >= 1) s += 3;
    if (parseFloat(data.price) > 0) s += 6;
    if ((data.categories?.length ?? 0) >= 1) s += 2;
    if ((data.promoPrice && parseFloat(data.promoPrice) > 0) || data.installments) s += 2;
    const imgs = (data.images || []).filter(Boolean);
    if (imgs.length >= 1) s += 5;
    if (imgs.length >= 3) s += 3;
    const days = data.days || [];
    if (days.length >= 1) s += 5;
    if (days.length >= (data.duration ?? 1)) s += 7;
    const totalActs = days.reduce((acc, d) => acc + (d.activities?.length ?? 0), 0);
    if (days.length > 0 && totalActs / days.length >= 2) s += 5;
    if (days.some(d => d.activities?.some(a => a.time?.trim()))) s += 3;
    if ((data.accommodations?.length ?? 0) >= 1) s += 4;
    if ((data.attractions?.length ?? 0) >= 1)    s += 4;
    if ((data.restaurants?.length ?? 0) >= 1)    s += 4;
    if ((data.transports?.length ?? 0) >= 1)     s += 4;
    if ((data.generalTips ?? []).filter(t => t?.trim()).length >= 1) s += 2;
    if ((data.checklists?.length ?? 0) >= 1) s += 2;
    const sp = data.estimatedSpending;
    if (sp && (parseFloat(sp.min) > 0 || parseFloat(sp.max) > 0)) s += 5;
    if (data.travelProofUrl?.trim()) s += 5;
    if ((data.highlights || []).filter(Boolean).length >= 2) s += 5;
    if ((data.inclusions || []).filter(Boolean).length >= 2) s += 5;
    return Math.min(Math.round(s), 100);
}

async function main() {
    // ─── 1. Traveler + Creator ────────────────────────────────────────────
    const travelerEmail = 'maria.roteirista@vamo.com';
    let traveler = await prisma.traveler.findUnique({ where: { email: travelerEmail } });
    if (!traveler) {
        traveler = await prisma.traveler.create({
            data: {
                name: 'Maria Silva',
                email: travelerEmail,
                passwordHash: await bcrypt.hash('vamo1234', 10),
                avatar: 'https://i.pravatar.cc/150?img=47',
                bio: 'Viajante apaixonada por descobertas gastronômicas e culturais.',
                authProvider: 'EMAIL',
            },
        });
        console.log('✓ Traveler criada:', traveler.name);
    }

    let creator = await prisma.creator.findUnique({ where: { travelerId: traveler.id } });
    if (!creator) {
        creator = await prisma.creator.create({
            data: {
                travelerId: traveler.id,
                verificationLevel: 'TRUSTED',
                bio: 'Criadora de roteiros com mais de 30 viagens internacionais. Especialista em Europa e Ásia.',
                destinations: ['Lisboa', 'Paris', 'Tóquio', 'Bangkok'],
                languages: ['Português', 'Inglês', 'Espanhol'],
                totalSales: 124,
                averageRating: 4.8,
                tripsCompleted: 32,
                instagramUrl: 'https://instagram.com/mariaviaja',
            },
        });
        console.log('✓ Creator criado:', creator.id);
    }

    // ─── 2. Roteiro #1 — Lisboa Cultural ──────────────────────────────────
    const roteiro1 = {
        creatorId: creator.id,
        title: 'Lisboa Cultural — 5 dias entre azulejos e fado',
        subtitle: 'Uma imersão autêntica pelos bairros históricos e sabores portugueses',
        destination: 'Lisboa',
        country: 'Portugal',
        extraCities: ['Sintra', 'Cascais'],
        extraCountries: [],
        description: 'Roteiro completo de 5 dias por Lisboa, cobrindo os bairros históricos de Alfama, Bairro Alto e Belém, com visitas a Sintra e Cascais. Inclui restaurantes autênticos, dicas de transporte, hospedagem testada, e roteiro passo-a-passo com horários. Perfeito para casais e viajantes solo que querem viver Lisboa como um local.',
        price: 149,
        currency: 'BRL',
        duration: 5,
        highlights: [
            '🏰 Palácio da Pena em Sintra com horário ideal para evitar filas',
            '🎶 Casa de Fado autêntica em Alfama (não turística)',
            '🥐 Pastéis de Belém com fila reduzida (dica de horário)',
            '🚋 Como usar o tram 28 sem multidões',
            '🌊 Praia de Cascais em menos de 40 min de trem',
        ],
        inclusions: [
            '📅 Roteiro dia a dia detalhado',
            '🏨 3 hospedagens testadas',
            '🍽️ 8 restaurantes autênticos',
            '🎫 6 atrações com horários otimizados',
            '🚌 Guia completo de transporte público',
            '💡 Dicas exclusivas de local',
            '✅ Checklist de viagem',
        ],
        travelStyles: ['Cultural', 'Gastronômico', 'Romântico'],
        categories: ['Cidade', 'Cultura', 'Gastronomia'],
        productType: 'DIGITAL',
        activeModules: ['itinerario', 'hospedagem', 'passeios', 'restaurantes', 'transporte', 'dicas', 'checklist'],
        promoPrice: 119,
        installments: 3,
        immediateAccess: true, lifetimeAccess: true, offlineDownload: true,
        allowPdf: false, allowShare: true,
        featured: true,
        travelProofUrl: 'https://vamo.app/proofs/lisboa-maria-silva.pdf',
        tripStartDate: new Date('2025-09-15'),
        tripEndDate: new Date('2025-09-20'),
        estimatedSpending: {
            min: 3200, max: 4500, currency: 'BRL',
            breakdown: [
                { category: 'Hospedagem', amount: 1800, description: '4 noites em 3★' },
                { category: 'Alimentação', amount: 1200, description: 'Almoços + jantares' },
                { category: 'Transporte', amount: 400, description: 'Metrô + trem Sintra' },
                { category: 'Atrações', amount: 800, description: 'Palácio + museus' },
            ],
        },
        spendingProfile: { icon: '💶', label: 'Moderado (≈ A$ 200/dia)' },
        receiveList: [
            { icon: '📅', label: 'Roteiro dia a dia (5 dias)' },
            { icon: '🗺️', label: 'Mapa offline dos bairros' },
            { icon: '📱', label: 'Lista de apps úteis em Portugal' },
        ],
        generalTips: [
            'Evite o tram 28 entre 10h-13h — vai lotado. Vá às 8h ou depois das 17h.',
            'Compre o Lisboa Card se for visitar 3+ museus (vale a pena).',
            'Em Belém, chegue nos Pastéis antes das 10h ou depois das 16h.',
            'Ubers são baratos em Lisboa — use para trajetos curtos à noite.',
        ],
        flightInfo: {
            outbound: {
                airline: 'TAP Portugal', originCity: 'São Paulo',
                originAirport: 'GRU', destinationAirport: 'LIS',
                departureDate: '2025-09-14', arrivalDate: '2025-09-15', stops: 0,
            },
            return: {
                airline: 'TAP Portugal', originCity: 'Lisboa',
                originAirport: 'LIS', destinationAirport: 'GRU',
                departureDate: '2025-09-20', arrivalDate: '2025-09-21', stops: 0,
            },
            totalPrice: '4200', priceCurrency: 'BRL',
            tips: [
                'Reserve assento do lado da janela na TAP — vista incrível da chegada',
                'Leve snacks — refeição vegetariana precisa ser solicitada com 48h',
            ],
        },
        attractions: [
            { name: 'Palácio da Pena', type: 'Histórico', location: 'Sintra',
              description: 'Palácio colorido no topo da serra. Vista espetacular.',
              hours: '09:30 – 18:00', hoursStart: '09:30', hoursEnd: '18:00',
              duration: '3', externalLink: 'https://parquesdesintra.pt',
              ticketValue: '14', ticketCurrency: 'EUR',
              tips: 'Compre online e chegue cedo pra evitar filas',
              startDate: '2025-09-17', endDate: '2025-09-17' },
            { name: 'Mosteiro dos Jerónimos', type: 'Histórico', location: 'Belém, Lisboa',
              description: 'Obra-prima manuelina. Tumba de Vasco da Gama.',
              hours: '10:00 – 17:30', hoursStart: '10:00', hoursEnd: '17:30',
              duration: '2', ticketValue: '12', ticketCurrency: 'EUR',
              startDate: '2025-09-18', endDate: '2025-09-18' },
            { name: 'Torre de Belém', type: 'Histórico', location: 'Belém, Lisboa',
              description: 'Símbolo dos descobrimentos portugueses.',
              hours: '10:00 – 17:30', hoursStart: '10:00', hoursEnd: '17:30',
              duration: '1', ticketValue: '8', ticketCurrency: 'EUR',
              startDate: '2025-09-18', endDate: '2025-09-18' },
        ],
        restaurants: [
            { name: 'A Cevicheria', cuisine: 'Peruana-Portuguesa', location: 'Príncipe Real',
              description: 'Ceviche inesquecível do chef Kiko Martins.',
              hours: '12:30 – 23:00', hoursStart: '12:30',
              externalLink: 'https://instagram.com/acevicheria',
              priceValue: '35', priceCurrency: 'EUR',
              tips: 'Chegue às 19h ou espera 1h+ de fila.' },
            { name: 'Ramiro', cuisine: 'Marisqueira', location: 'Almirante Reis',
              description: 'Marisqueira clássica de Lisboa. Gambas à la gusano obrigatório.',
              hours: '12:00 – 00:30', hoursStart: '12:00',
              priceValue: '45', priceCurrency: 'EUR' },
            { name: 'Taberna da Rua das Flores', cuisine: 'Portuguesa contemporânea',
              location: 'Chiado', description: 'Petiscos elaborados, vinhos por copo.',
              hours: '12:00 – 23:00', hoursStart: '12:00',
              priceValue: '40', priceCurrency: 'EUR' },
        ],
        mediaUrls: [
            'https://images.unsplash.com/photo-1585208798174-6cedd86e019a',
            'https://images.unsplash.com/photo-1513735492246-483525079686',
        ],
        highlightPhotos: [
            'https://images.unsplash.com/photo-1583779457094-ab6f9164a1c8',
            'https://images.unsplash.com/photo-1588535050076-1c67fbfa5c46',
            'https://images.unsplash.com/photo-1555881400-74d7acaacd8b',
        ],
    };

    const days1 = [
        { dayNumber: 1, title: 'Chegada e Alfama', summary: 'Caminhada + fado à noite',
          description: 'Primeiro dia pra descansar e sentir o clima do bairro mais antigo.',
          activities: [
            { title: 'Check-in no hotel', time: '14:00', duration: '1', type: 'rest', icon: '🏨', location: 'Alfama' },
            { title: 'Miradouro de Santa Luzia', time: '16:30', duration: '1', type: 'activity', icon: '📸', tips: 'Vista panorâmica grátis' },
            { title: 'Jantar com fado — Clube de Fado', time: '20:00', duration: '2h30min', type: 'meal', icon: '🎶', tips: 'Reserve com 1 semana' },
          ]},
        { dayNumber: 2, title: 'Belém clássico', summary: 'Mosteiro + Torre + Pastéis',
          description: 'Dia dos descobrimentos — arquitetura manuelina e pastelaria.',
          activities: [
            { title: 'Mosteiro dos Jerónimos', time: '09:30', duration: '2', type: 'activity', icon: '🏛️' },
            { title: 'Pastéis de Belém', time: '11:30', duration: '30min', type: 'meal', icon: '🥐' },
            { title: 'Torre de Belém', time: '14:00', duration: '1', type: 'activity', icon: '🗼' },
            { title: 'MAAT — arte contemporânea', time: '16:00', duration: '2', type: 'activity', icon: '🎨' },
          ]},
        { dayNumber: 3, title: 'Sintra encantada', summary: 'Palácio da Pena + Quinta',
          description: 'Dia inteiro em Sintra com trem CP (40 min).',
          activities: [
            { title: 'Trem para Sintra (Rossio→Sintra)', time: '08:00', duration: '45min', type: 'transport', icon: '🚆' },
            { title: 'Palácio da Pena', time: '09:30', duration: '3', type: 'activity', icon: '🏰' },
            { title: 'Almoço — Tascantiga', time: '13:00', duration: '1h30min', type: 'meal', icon: '🍽️' },
            { title: 'Quinta da Regaleira', time: '15:00', duration: '2', type: 'activity', icon: '🌳' },
          ]},
        { dayNumber: 4, title: 'Chiado e Bairro Alto', summary: 'Livrarias, bares, Praça do Comércio',
          activities: [
            { title: 'Praça do Comércio', time: '10:00', duration: '1', type: 'activity', icon: '🏛️' },
            { title: 'Elevador de Santa Justa', time: '11:30', duration: '30min', type: 'activity', icon: '🛗' },
            { title: 'Livraria Bertrand (mais antiga do mundo)', time: '12:30', duration: '45min', type: 'activity', icon: '📚' },
            { title: 'Almoço — Taberna da Rua das Flores', time: '14:00', duration: '1h30min', type: 'meal', icon: '🍷' },
            { title: 'Bares do Bairro Alto', time: '22:00', duration: '3', type: 'activity', icon: '🍺' },
          ]},
        { dayNumber: 5, title: 'Cascais e volta', summary: 'Praia + retorno ao aeroporto',
          activities: [
            { title: 'Trem para Cascais', time: '09:00', duration: '40min', type: 'transport', icon: '🚆' },
            { title: 'Praia da Rainha', time: '10:00', duration: '3', type: 'activity', icon: '🏖️' },
            { title: 'Almoço na Marina', time: '13:30', duration: '1h30min', type: 'meal', icon: '🦞' },
            { title: 'Volta a Lisboa + aeroporto', time: '17:00', duration: '2', type: 'transport', icon: '✈️' },
          ]},
    ];

    const accommodations1 = [
        { name: 'Lisboa Pessoa Hotel', neighborhood: 'Avenida', address: 'Rua Vilhena Barbosa, 19',
          description: 'Hotel 4★ boutique com temática do escritor. Excelente café da manhã.',
          priceRange: '€€€', rating: 4.6, nights: 4, totalPrice: '520', priceCurrency: 'EUR',
          startDate: '2025-09-15', endDate: '2025-09-19',
          externalLink: 'https://booking.com/lisboa-pessoa',
          mapLink: 'https://maps.google.com/?q=Lisboa+Pessoa+Hotel',
          tips: 'Peça quarto no 5° andar — vista do castelo' },
    ];

    const transports1 = [
        { description: 'Metrô de Lisboa — 4 linhas que conectam tudo que importa',
          passTypes: 'Viva Viagem + zapping (€6 cartão + crédito)',
          estimatedPrice: 'A$ 3/trajeto', notes: 'Recarregue €10 pro primeiro dia',
          priceValue: '8', priceCurrency: 'BRL' },
        { description: 'Trem CP para Sintra e Cascais',
          passTypes: 'Bilhete único Rossio-Sintra (€2,30 ida)',
          estimatedPrice: 'A$ 5 round-trip',
          priceValue: '14', priceCurrency: 'BRL',
          startDate: '2025-09-17', endDate: '2025-09-19' },
    ];

    const checklists1 = [
        { category: 'documentos', item: 'Passaporte válido (6 meses)', isDefault: true },
        { category: 'documentos', item: 'Seguro viagem Schengen €30k+', isDefault: true },
        { category: 'documentos', item: 'Comprovante de hospedagem impresso', isDefault: true },
        { category: 'mala', item: 'Adaptador de tomada tipo F', isDefault: false },
        { category: 'mala', item: 'Casaco leve (noites frias)', isDefault: false },
        { category: 'pre-viagem', item: 'Ativar roaming ou chip Portugal', isDefault: false },
        { category: 'pre-viagem', item: 'Reservar Palácio da Pena online', isDefault: false },
    ];

    // Monta o score
    const score1 = calcQuality({ ...roteiro1, days: days1, accommodations: accommodations1,
        transports: transports1, checklists: checklists1, images: ['img1', 'img2', 'img3', 'img4'] });

    const created1 = await prisma.itinerary.create({
        data: {
            ...roteiro1,
            qualityScore: score1,
            status: 'APPROVED',
            approvedAt: new Date(),
            rating: 4.8,
            reviewCount: 23,
            images: { create: [
                { url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200', order: 0 },
                { url: 'https://images.unsplash.com/photo-1513735492246-483525079686?w=1200', order: 1 },
                { url: 'https://images.unsplash.com/photo-1588535050076-1c67fbfa5c46?w=1200', order: 2 },
                { url: 'https://images.unsplash.com/photo-1583779457094-ab6f9164a1c8?w=1200', order: 3 },
            ]},
            days: { create: days1.map(d => ({
                dayNumber: d.dayNumber, title: d.title, summary: d.summary, description: d.description || '',
                activities: { create: d.activities.map((a, i) => ({
                    order: i, title: a.title, description: a.description || '',
                    duration: a.duration || '', location: a.location || '', tips: a.tips || '',
                    time: a.time || '', type: a.type || 'activity', icon: a.icon || '📍',
                    images: a.images || [], mapLink: a.mapLink || '',
                }))},
            }))},
            accommodations: { create: accommodations1.map((a, i) => ({
                name: a.name, neighborhood: a.neighborhood, description: a.description,
                priceRange: a.priceRange, rating: a.rating, externalLink: a.externalLink,
                address: a.address, mapLink: a.mapLink, tips: a.tips, nights: a.nights,
                startDate: a.startDate, endDate: a.endDate,
                totalPrice: a.totalPrice, priceCurrency: a.priceCurrency, order: i,
            }))},
            transports: { create: transports1.map((t, i) => ({
                description: t.description, passTypes: t.passTypes, estimatedPrice: t.estimatedPrice,
                notes: t.notes || '', startDate: t.startDate, endDate: t.endDate,
                priceValue: t.priceValue, priceCurrency: t.priceCurrency, order: i,
            }))},
            checklists: { create: checklists1.map((c, i) => ({
                category: c.category, item: c.item, isDefault: c.isDefault, order: i,
            }))},
        },
    });
    console.log(`✓ Roteiro 1 criado: "${created1.title}" — score ${score1}/100`);

    // ─── 3. Roteiro #2 — Tóquio ────────────────────────────────────────────
    const roteiro2 = {
        creatorId: creator.id,
        title: 'Tóquio Essencial — 7 dias entre tradição e tecnologia',
        subtitle: 'Do sushi ao Shibuya Crossing: um mergulho completo na capital japonesa',
        destination: 'Tóquio',
        country: 'Japão',
        extraCities: ['Nikko', 'Kamakura'],
        extraCountries: [],
        description: 'Roteiro de 7 dias em Tóquio com bate-voltas para Nikko e Kamakura. Inclui dicas de JR Pass, melhores ramens por bairro, templos menos turísticos, experiências autênticas (ryokan, onsen) e tudo que você precisa para não se perder. Perfeito para primeira viagem ao Japão.',
        price: 249,
        currency: 'BRL',
        duration: 7,
        highlights: [
            '🏯 Templo Senso-ji antes das multidões',
            '🍜 Ramen autêntico de Shin-Yokohama (não turístico)',
            '🗼 Skytree vs Torre de Tóquio: qual vale mais',
            '🚅 Como usar o JR Pass para Nikko e Kamakura',
            '🛀 Onsen público em Hakone (experiência obrigatória)',
            '🎌 Mercado Toyosu (novo mercado de peixes)',
        ],
        inclusions: [
            '📅 Roteiro 7 dias com horários',
            '🏨 4 hospedagens (ryokan + hotel moderno)',
            '🍜 12 restaurantes testados',
            '🎫 10 atrações com dicas de horário',
            '🚅 Guia JR Pass + Suica',
            '💡 Frases essenciais em japonês',
            '✅ Checklist pré-Japão',
        ],
        travelStyles: ['Cultural', 'Aventura', 'Gastronômico'],
        categories: ['Cidade', 'Cultura', 'Gastronomia', 'Aventura'],
        productType: 'DIGITAL',
        activeModules: ['itinerario', 'hospedagem', 'passeios', 'restaurantes', 'transporte', 'dicas', 'voo', 'checklist', 'gasto'],
        promoPrice: 199,
        installments: 6,
        immediateAccess: true, lifetimeAccess: true, offlineDownload: true,
        allowPdf: false, allowShare: true,
        featured: true,
        travelProofUrl: 'https://vamo.app/proofs/toquio-maria-silva.pdf',
        tripStartDate: new Date('2025-10-05'),
        tripEndDate: new Date('2025-10-12'),
        estimatedSpending: {
            min: 8500, max: 12000, currency: 'BRL',
            breakdown: [
                { category: 'Hospedagem', amount: 4200, description: '6 noites entre ryokan + hotel' },
                { category: 'Alimentação', amount: 2800, description: 'Ramen, sushi, izakaya' },
                { category: 'Transporte', amount: 1800, description: 'JR Pass 7d + Suica' },
                { category: 'Atrações', amount: 1200, description: 'Templos + museus + onsen' },
            ],
        },
        spendingProfile: { icon: '💴', label: 'Confortável (≈ A$ 450/dia)' },
        receiveList: [
            { icon: '📅', label: 'Roteiro dia a dia (7 dias)' },
            { icon: '🗾', label: 'Mapa metrô + JR offline' },
            { icon: '🗣️', label: 'Frases de sobrevivência' },
        ],
        generalTips: [
            'Compre JR Pass ANTES de chegar no Japão — só vende fora.',
            'Leve dinheiro em espécie — muitos lugares não aceitam cartão estrangeiro.',
            'Tatuagens: alguns onsens recusam. Pesquise antes.',
            'App: Google Maps + Tabelog (restaurantes) + Hyperdia (trens).',
            'Lixeiras são raras — leve sacolinha pro lixo.',
        ],
        flightInfo: {
            outbound: {
                airline: 'ANA (All Nippon Airways)', originCity: 'São Paulo',
                originAirport: 'GRU', destinationAirport: 'HND',
                departureDate: '2025-10-04', arrivalDate: '2025-10-05', stops: 1,
            },
            return: {
                airline: 'ANA', originCity: 'Tóquio',
                originAirport: 'HND', destinationAirport: 'GRU',
                departureDate: '2025-10-12', arrivalDate: '2025-10-13', stops: 1,
            },
            totalPrice: '7800', priceCurrency: 'BRL',
            tips: [
                'Conexão em Houston ou Dallas — pegue voo com escala de 3h+ pra respirar',
                'Peça refeição japonesa — muito melhor que a internacional',
            ],
        },
        attractions: [
            { name: 'Templo Senso-ji', type: 'Religioso', location: 'Asakusa',
              description: 'Templo budista mais antigo de Tóquio. Chegue antes das 8h.',
              hours: '06:00 – 17:00', hoursStart: '06:00', hoursEnd: '17:00',
              duration: '2', ticketValue: '0', ticketCurrency: 'JPY',
              tips: 'Grátis! Nakamise Street tem doces tradicionais.',
              startDate: '2025-10-05', endDate: '2025-10-05' },
            { name: 'Skytree Tower', type: 'Observatório', location: 'Sumida',
              description: 'Torre mais alta do Japão (634m). Vista do Monte Fuji em dias claros.',
              hours: '10:00 – 21:00', hoursStart: '10:00', hoursEnd: '21:00',
              duration: '2', ticketValue: '2100', ticketCurrency: 'JPY',
              tips: 'Vá ao pôr do sol pra ver dia + noite', startDate: '2025-10-06', endDate: '2025-10-06' },
            { name: 'Shibuya Crossing', type: 'Urbano', location: 'Shibuya',
              description: 'Cruzamento mais movimentado do mundo. Starbucks do QFront tem vista.',
              hours: '24h', hoursStart: '00:00', hoursEnd: '23:59',
              duration: '1', ticketValue: '0', ticketCurrency: 'JPY',
              startDate: '2025-10-07', endDate: '2025-10-07' },
            { name: 'Mercado Toyosu', type: 'Gastronômico', location: 'Toyosu',
              description: 'Novo mercado de peixes. Leilão de atum 5h30.',
              hours: '05:00 – 17:00', hoursStart: '05:00', hoursEnd: '17:00',
              duration: '3', ticketValue: '0', ticketCurrency: 'JPY',
              tips: 'Agende leilão com 30 dias. Sushi de café da manhã OBRIGATÓRIO.',
              startDate: '2025-10-08', endDate: '2025-10-08' },
        ],
        restaurants: [
            { name: 'Ichiran Ramen', cuisine: 'Ramen', location: 'Shinjuku',
              description: 'Cabines individuais, ramen tonkotsu clássico.',
              hours: '24h', hoursStart: '00:00',
              priceValue: '1200', priceCurrency: 'JPY',
              tips: 'Peça ovo marinado extra.' },
            { name: 'Sukiyabashi Jiro', cuisine: 'Sushi omakase',
              location: 'Ginza', description: 'O sushiman do documentário. Reserva 2 meses antes.',
              hours: '11:30 – 14:00, 17:30 – 20:00', hoursStart: '11:30',
              priceValue: '40000', priceCurrency: 'JPY',
              externalLink: 'https://sukiyabashijiro.jp' },
            { name: 'Tsuta', cuisine: 'Ramen com trufa', location: 'Sugamo',
              description: 'Primeiro ramen com estrela Michelin.',
              hours: '11:00 – 16:00', hoursStart: '11:00',
              priceValue: '1500', priceCurrency: 'JPY' },
            { name: 'Torikizoku', cuisine: 'Yakitori', location: 'Várias filiais',
              description: 'Yakitori popular e barato. Tudo custa 327 ienes.',
              hours: '17:00 – 01:00', hoursStart: '17:00',
              priceValue: '2000', priceCurrency: 'JPY' },
        ],
        mediaUrls: [
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
        ],
        highlightPhotos: [
            'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
            'https://images.unsplash.com/photo-1542051841857-5f90071e7989',
        ],
    };

    const days2 = [
        { dayNumber: 1, title: 'Chegada e Asakusa', summary: 'Templo Senso-ji + primeira impressão',
          description: 'Dia leve pra se ambientar com o fuso e o caos de Tóquio.',
          activities: [
            { title: 'Chegada em Haneda + Suica card', time: '06:30', duration: '2', type: 'transport', icon: '✈️' },
            { title: 'Check-in hotel em Asakusa', time: '14:00', duration: '1', type: 'rest', icon: '🏨' },
            { title: 'Templo Senso-ji', time: '16:00', duration: '2', type: 'activity', icon: '⛩️' },
            { title: 'Jantar — Ichiran Ramen', time: '19:00', duration: '1', type: 'meal', icon: '🍜' },
          ]},
        { dayNumber: 2, title: 'Shibuya e Harajuku', summary: 'Neons e fashion',
          activities: [
            { title: 'Shibuya Crossing + Hachiko', time: '10:00', duration: '2', type: 'activity', icon: '🚦' },
            { title: 'Meiji Shrine', time: '13:00', duration: '2', type: 'activity', icon: '⛩️' },
            { title: 'Takeshita Street (Harajuku)', time: '15:30', duration: '2', type: 'activity', icon: '🌈' },
            { title: 'Observatório Shibuya Sky', time: '18:00', duration: '1h30min', type: 'activity', icon: '🌆' },
          ]},
        { dayNumber: 3, title: 'Cultura em Ueno', summary: 'Museus + parque',
          activities: [
            { title: 'Tokyo National Museum', time: '09:30', duration: '3', type: 'activity', icon: '🏛️' },
            { title: 'Parque Ueno', time: '13:00', duration: '2', type: 'activity', icon: '🌸' },
            { title: 'Ameyoko Market', time: '15:30', duration: '2', type: 'activity', icon: '🎣' },
          ]},
        { dayNumber: 4, title: 'Bate-volta a Nikko', summary: 'Templos + natureza',
          description: 'Shinkansen + trem local. JR Pass cobre tudo.',
          activities: [
            { title: 'Shinkansen para Nikko', time: '07:00', duration: '2', type: 'transport', icon: '🚅' },
            { title: 'Santuário Toshogu', time: '10:00', duration: '3', type: 'activity', icon: '⛩️' },
            { title: 'Cachoeira Kegon', time: '14:00', duration: '2', type: 'activity', icon: '💧' },
            { title: 'Volta a Tóquio', time: '18:00', duration: '2', type: 'transport', icon: '🚅' },
          ]},
        { dayNumber: 5, title: 'Mercado + Ginza', summary: 'Toyosu + luxo em Ginza',
          activities: [
            { title: 'Mercado Toyosu (sushi café da manhã)', time: '05:30', duration: '3', type: 'activity', icon: '🐟' },
            { title: 'Distrito de Ginza', time: '11:00', duration: '3', type: 'activity', icon: '🛍️' },
            { title: 'Jantar — Sukiyabashi Jiro', time: '17:30', duration: '1h30min', type: 'meal', icon: '🍣' },
          ]},
        { dayNumber: 6, title: 'Kamakura', summary: 'Grande Buda + praia',
          activities: [
            { title: 'Trem para Kamakura', time: '08:00', duration: '1', type: 'transport', icon: '🚆' },
            { title: 'Kotoku-in (Grande Buda)', time: '10:00', duration: '1h30min', type: 'activity', icon: '🧘' },
            { title: 'Templo Hase-dera', time: '12:00', duration: '1h30min', type: 'activity', icon: '⛩️' },
            { title: 'Praia de Yuigahama', time: '14:30', duration: '2', type: 'activity', icon: '🏖️' },
          ]},
        { dayNumber: 7, title: 'Akihabara + volta', summary: 'Tech vibes',
          activities: [
            { title: 'Akihabara Electric Town', time: '10:00', duration: '3', type: 'activity', icon: '🎮' },
            { title: 'Maid Café (experiência)', time: '13:30', duration: '1', type: 'meal', icon: '☕' },
            { title: 'Saída para Haneda', time: '16:00', duration: '2', type: 'transport', icon: '✈️' },
          ]},
    ];

    const accommodations2 = [
        { name: 'Asakusa View Hotel', neighborhood: 'Asakusa', address: '3-17-1 Nishiasakusa',
          description: 'Hotel com vista pro Skytree. Tradicional com toque moderno.',
          priceRange: '¥¥¥', rating: 4.4, nights: 3, totalPrice: '75000', priceCurrency: 'JPY',
          startDate: '2025-10-05', endDate: '2025-10-08',
          tips: 'Peça quarto andar alto vista Skytree' },
        { name: 'Ryokan Sawanoya', neighborhood: 'Yanaka', address: '2-3-11 Yanaka',
          description: 'Ryokan tradicional familiar. Futon + ofurô. Experiência obrigatória.',
          priceRange: '¥¥', rating: 4.8, nights: 2, totalPrice: '32000', priceCurrency: 'JPY',
          startDate: '2025-10-08', endDate: '2025-10-10',
          tips: 'Reserve o quarto Sakura' },
        { name: 'Hotel Sunroute Shinjuku', neighborhood: 'Shinjuku',
          description: 'Hotel moderno perto da JR Shinjuku Station.',
          priceRange: '¥¥¥', rating: 4.3, nights: 2, totalPrice: '48000', priceCurrency: 'JPY',
          startDate: '2025-10-10', endDate: '2025-10-12' },
    ];

    const transports2 = [
        { description: 'JR Pass 7 dias — ilimitado em todos os trens JR',
          passTypes: 'JR Pass Ordinary 7 days',
          estimatedPrice: 'A$ 550', notes: 'Comprar ANTES de viajar',
          priceValue: '1650', priceCurrency: 'BRL' },
        { description: 'Cartão Suica — pagamento contactless pra metrô, ônibus, lojas',
          passTypes: 'Suica (¥2000 inicial com ¥500 depósito)',
          estimatedPrice: 'A$ 25',
          priceValue: '70', priceCurrency: 'BRL' },
        { description: 'Shinkansen Tóquio → Nikko (incluído no JR Pass)',
          passTypes: 'JR Pass cobre', estimatedPrice: 'Sem custo extra',
          startDate: '2025-10-08', endDate: '2025-10-08' },
    ];

    const checklists2 = [
        { category: 'documentos', item: 'Passaporte válido (6 meses)', isDefault: true },
        { category: 'documentos', item: 'JR Pass voucher impresso', isDefault: false },
        { category: 'documentos', item: 'Seguro viagem internacional', isDefault: true },
        { category: 'documentos', item: 'Cópia do itinerário (imigração pode pedir)', isDefault: false },
        { category: 'mala', item: 'Adaptador tipo A/B (Japão)', isDefault: false },
        { category: 'mala', item: 'Sapatos fáceis de tirar (templos)', isDefault: false },
        { category: 'mala', item: 'Meias sem furos (templos + ryokan)', isDefault: false },
        { category: 'mala', item: 'Sacolinha plástica pro lixo', isDefault: false },
        { category: 'pre-viagem', item: 'Comprar JR Pass online', isDefault: false },
        { category: 'pre-viagem', item: 'Reservar Mercado Toyosu (leilão)', isDefault: false },
        { category: 'pre-viagem', item: 'Baixar app Hyperdia e Google Translate offline', isDefault: false },
    ];

    const score2 = calcQuality({ ...roteiro2, days: days2, accommodations: accommodations2,
        transports: transports2, checklists: checklists2, images: ['img1','img2','img3','img4','img5'] });

    const created2 = await prisma.itinerary.create({
        data: {
            ...roteiro2,
            qualityScore: score2,
            status: 'APPROVED',
            approvedAt: new Date(),
            rating: 4.9,
            reviewCount: 41,
            images: { create: [
                { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200', order: 0 },
                { url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1200', order: 1 },
                { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200', order: 2 },
                { url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200', order: 3 },
                { url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200', order: 4 },
            ]},
            days: { create: days2.map(d => ({
                dayNumber: d.dayNumber, title: d.title, summary: d.summary, description: d.description || '',
                activities: { create: d.activities.map((a, i) => ({
                    order: i, title: a.title, description: a.description || '',
                    duration: a.duration || '', location: a.location || '', tips: a.tips || '',
                    time: a.time || '', type: a.type || 'activity', icon: a.icon || '📍',
                    images: a.images || [], mapLink: a.mapLink || '',
                }))},
            }))},
            accommodations: { create: accommodations2.map((a, i) => ({
                name: a.name, neighborhood: a.neighborhood, description: a.description,
                priceRange: a.priceRange, rating: a.rating, externalLink: a.externalLink,
                address: a.address, mapLink: a.mapLink, tips: a.tips, nights: a.nights,
                startDate: a.startDate, endDate: a.endDate,
                totalPrice: a.totalPrice, priceCurrency: a.priceCurrency, order: i,
            }))},
            transports: { create: transports2.map((t, i) => ({
                description: t.description, passTypes: t.passTypes, estimatedPrice: t.estimatedPrice,
                notes: t.notes || '', startDate: t.startDate, endDate: t.endDate,
                priceValue: t.priceValue, priceCurrency: t.priceCurrency, order: i,
            }))},
            checklists: { create: checklists2.map((c, i) => ({
                category: c.category, item: c.item, isDefault: c.isDefault, order: i,
            }))},
        },
    });
    console.log(`✓ Roteiro 2 criado: "${created2.title}" — score ${score2}/100`);

    // ─── 4. Resumo ───────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Roteiros criados com sucesso:');
    console.log(`  1. ${created1.id} — Lisboa (${score1}/100)`);
    console.log(`  2. ${created2.id} — Tóquio (${score2}/100)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch(e => { console.error('Erro:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
