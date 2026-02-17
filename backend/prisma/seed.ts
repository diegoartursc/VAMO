import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clean existing data
    await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE booking_inclusions, booking_documents, booking_timelines,
    purchase_history, review_responses, review_images, reviews,
    itinerary_activities, itinerary_days, itinerary_files, itinerary_sales, itinerary_images, itineraries,
    package_pricing_windows, package_images, packages,
    saved_items, notifications, faq_answers, faq_questions,
    creator_balances, creators, traveler_personal_data, travelers,
    agency_employees, agencies, destinations
    CASCADE
  `);

    // ─── AGENCIES ───
    const cvc = await prisma.agency.create({
        data: {
            id: 'cvc', name: 'CVC', cnpj: '01.234.567/0001-01', logo: '🏖️', verified: true,
            contactUrl: 'https://www.cvc.com.br', whatsapp: '+5511999999999',
        },
    });
    const decolar = await prisma.agency.create({
        data: {
            id: 'decolar', name: 'Decolar', cnpj: '02.345.678/0001-02', logo: '✈️', verified: true,
            contactUrl: 'https://www.decolar.com',
        },
    });
    const hurb = await prisma.agency.create({
        data: {
            id: 'hurb', name: 'Hurb', cnpj: '03.456.789/0001-03', logo: '🌴', verified: true,
            contactUrl: 'https://www.hurb.com',
        },
    });
    const azul = await prisma.agency.create({
        data: {
            id: 'azul-viagens', name: 'Azul Viagens', cnpj: '04.567.890/0001-04', logo: '🛫', verified: true,
            contactUrl: 'https://www.azulviagens.com.br',
        },
    });
    console.log('✅ Agencies created');

    // ─── TRAVELERS (base for creators) ───
    const travelerDiego = await prisma.traveler.create({
        data: { id: 'trav-diego', name: 'Diego Artur', email: 'diego@vamo.com', avatar: '👨‍✈️' },
    });
    const travelerMariana = await prisma.traveler.create({
        data: { id: 'trav-mariana', name: 'Mariana Silva', email: 'mariana@vamo.com', avatar: '👩‍🦰' },
    });
    const travelerCarlos = await prisma.traveler.create({
        data: { id: 'trav-carlos', name: 'Carlos Mendes', email: 'carlos@vamo.com', avatar: '👨‍💼' },
    });
    const travelerJulia = await prisma.traveler.create({
        data: { id: 'trav-julia', name: 'Julia Costa', email: 'julia@vamo.com', avatar: '👩‍🎓' },
    });
    const travelerPedro = await prisma.traveler.create({
        data: { id: 'trav-pedro', name: 'Pedro Oliveira', email: 'pedro@vamo.com', avatar: '👨‍🎨' },
    });
    const travelerAna = await prisma.traveler.create({
        data: { id: 'trav-ana', name: 'Ana Beatriz', email: 'ana@vamo.com', avatar: '👩‍🍳' },
    });
    const travelerRafael = await prisma.traveler.create({
        data: { id: 'trav-rafael', name: 'Rafael Torres', email: 'rafael@vamo.com', avatar: '🧑‍🏫' },
    });
    const travelerCamila = await prisma.traveler.create({
        data: { id: 'trav-camila', name: 'Camila Reis', email: 'camila@vamo.com', avatar: '🧘‍♀️' },
    });
    const travelerLucas = await prisma.traveler.create({
        data: { id: 'trav-lucas', name: 'Lucas Ferreira', email: 'lucas@vamo.com', avatar: '👨‍🎤' },
    });
    const travelerMarco = await prisma.traveler.create({
        data: { id: 'trav-marco', name: 'Marco Explorer', email: 'marco@vamo.com', avatar: '🧭' },
    });
    // Reviewers
    const travelerReview1 = await prisma.traveler.create({
        data: { id: 'trav-rev1', name: 'Maria S.', email: 'maria@test.com' },
    });
    const travelerReview2 = await prisma.traveler.create({
        data: { id: 'trav-rev2', name: 'João P.', email: 'joao@test.com' },
    });
    const travelerReview3 = await prisma.traveler.create({
        data: { id: 'trav-rev3', name: 'Ana L.', email: 'anal@test.com' },
    });
    console.log('✅ Travelers created');

    // ─── CREATORS ───
    const creators: Record<string, any> = {};
    const creatorData = [
        { id: 'diego', travelerId: 'trav-diego', level: 'AMBASSADOR' as const, bio: 'Viajante profissional há 10 anos. Já visitei mais de 40 países e compartilho roteiros econômicos e práticos.', destinations: ['Paris', 'Roma', 'Barcelona', 'Buenos Aires', 'Cusco'], languages: ['Português', 'Inglês', 'Espanhol'], totalSales: 1234, averageRating: 4.9, responseTime: '< 1h', tripsCompleted: 89, instagram: 'https://instagram.com/diegoviaja', youtube: 'https://youtube.com/diegoviaja' },
        { id: 'mariana', travelerId: 'trav-mariana', level: 'EXPERT' as const, bio: 'Especialista em Ásia. Morei 2 anos no Japão e conheço cada cantinho de Tóquio, Kyoto e Osaka.', destinations: ['Tóquio', 'Kyoto', 'Osaka', 'Seul', 'Bangkok'], languages: ['Português', 'Inglês', 'Japonês'], totalSales: 892, averageRating: 4.8, responseTime: '< 2h', tripsCompleted: 45 },
        { id: 'carlos', travelerId: 'trav-carlos', level: 'TRUSTED' as const, bio: 'Apaixonado por grandes cidades. Roteiros práticos para Nova York, Londres e Chicago.', destinations: ['Nova York', 'Londres', 'Chicago', 'Los Angeles'], languages: ['Português', 'Inglês'], totalSales: 567, averageRating: 4.7, responseTime: '< 3h', tripsCompleted: 32 },
        { id: 'julia', travelerId: 'trav-julia', level: 'EXPERT' as const, bio: 'Historiadora e viajante. Crio roteiros focados em história e cultura europeia.', destinations: ['Londres', 'Edimburgo', 'Amsterdã', 'Berlim'], languages: ['Português', 'Inglês', 'Francês'], totalSales: 723, averageRating: 4.8, responseTime: '< 2h', tripsCompleted: 38 },
        { id: 'pedro', travelerId: 'trav-pedro', level: 'AMBASSADOR' as const, bio: 'Artista e viajante. Meus roteiros combinam arte, gastronomia e praias da Espanha e Portugal.', destinations: ['Barcelona', 'Madrid', 'Lisboa', 'Porto', 'Sevilha'], languages: ['Português', 'Inglês', 'Espanhol'], totalSales: 1089, averageRating: 4.9, responseTime: '< 1h', tripsCompleted: 67 },
        { id: 'ana', travelerId: 'trav-ana', level: 'EXPERT' as const, bio: 'Chef de cozinha que viaja o mundo. Roteiros com foco em gastronomia italiana e mediterrânea.', destinations: ['Roma', 'Florença', 'Nápoles', 'Milão', 'Veneza'], languages: ['Português', 'Inglês', 'Italiano'], totalSales: 645, averageRating: 4.8, responseTime: '< 2h', tripsCompleted: 41 },
        { id: 'rafael', travelerId: 'trav-rafael', level: 'TRUSTED' as const, bio: 'Professor de geografia que explora a América do Sul de mochila.', destinations: ['Cusco', 'La Paz', 'Quito', 'Bogotá', 'Cartagena'], languages: ['Português', 'Inglês', 'Espanhol'], totalSales: 398, averageRating: 4.7, responseTime: '< 3h', tripsCompleted: 28 },
        { id: 'camila', travelerId: 'trav-camila', level: 'AMBASSADOR' as const, bio: 'Instrutora de yoga e viajante. Crio roteiros focados em bem-estar e experiências espirituais.', destinations: ['Bali', 'Chiang Mai', 'Rishikesh', 'Ubud', 'Koh Samui'], languages: ['Português', 'Inglês'], totalSales: 912, averageRating: 4.9, responseTime: '< 1h', tripsCompleted: 55 },
        { id: 'lucas', travelerId: 'trav-lucas', level: 'TRUSTED' as const, bio: 'Músico e viajante. Buenos Aires, tango e parrillas são minha especialidade.', destinations: ['Buenos Aires', 'Montevidéu', 'Santiago', 'Mendoza'], languages: ['Português', 'Espanhol'], totalSales: 321, averageRating: 4.6, responseTime: '< 4h', tripsCompleted: 22 },
        { id: 'marco', travelerId: 'trav-marco', level: 'TRUSTED' as const, bio: 'Mochileiro veterano. Roteiros econômicos pelo Sudeste Asiático.', destinations: ['Bali', 'Bangkok', 'Hanói', 'Siem Reap'], languages: ['Português', 'Inglês'], totalSales: 198, averageRating: 4.7, responseTime: '< 3h', tripsCompleted: 19 },
    ];
    for (const c of creatorData) {
        creators[c.id] = await prisma.creator.create({
            data: {
                id: c.id, travelerId: c.travelerId, verificationLevel: c.level,
                bio: c.bio, destinations: c.destinations, languages: c.languages,
                totalSales: c.totalSales, averageRating: c.averageRating,
                responseTime: c.responseTime, tripsCompleted: c.tripsCompleted,
                instagramUrl: c.instagram, youtubeUrl: c.youtube,
            },
        });
    }
    console.log('✅ Creators created');

    // ─── DESTINATIONS ───
    const destinationData = [
        { name: 'Paris', country: 'França', emoji: '🗼', popular: true },
        { name: 'Tóquio', country: 'Japão', emoji: '🗾', popular: true },
        { name: 'Nova York', country: 'Estados Unidos', emoji: '🗽', popular: true },
        { name: 'Roma', country: 'Itália', emoji: '🏛️', popular: true },
        { name: 'Londres', country: 'Reino Unido', emoji: '🎡', popular: true },
        { name: 'Barcelona', country: 'Espanha', emoji: '⛪', popular: true },
        { name: 'Bali', country: 'Indonésia', emoji: '🌺', popular: true },
        { name: 'Buenos Aires', country: 'Argentina', emoji: '💃', popular: true },
        { name: 'Cusco', country: 'Peru', emoji: '🏔️', popular: true },
        { name: 'El Calafate', country: 'Argentina', emoji: '🧊', popular: false },
        { name: 'Arraial do Cabo', country: 'Brasil', emoji: '🏖️', popular: true },
        { name: 'Fernando de Noronha', country: 'Brasil', emoji: '🐢', popular: true },
        { name: 'Santorini', country: 'Grécia', emoji: '🏘️', popular: true },
        { name: 'Machu Picchu', country: 'Peru', emoji: '🏔️', popular: true },
        { name: 'Cancún', country: 'México', emoji: '🌮', popular: true },
        { name: 'Dubai', country: 'Emirados Árabes', emoji: '🏙️', popular: true },
        { name: 'Maldivas', country: 'Maldivas', emoji: '🏝️', popular: true },
        { name: 'Cairo', country: 'Egito', emoji: '🏛️', popular: false },
    ];
    for (const d of destinationData) {
        await prisma.destination.create({ data: d });
    }
    console.log('✅ Destinations created');

    // ─── PACKAGES ─── (continued in seedPackages)
    await seedPackages();
    console.log('✅ Packages created');

    // ─── ITINERARIES ───
    await seedItineraries();
    console.log('✅ Itineraries created');

    // ─── REVIEWS ───
    await seedReviews();
    console.log('✅ Reviews created');

    console.log('🎉 Seed completed!');
}

async function seedPackages() {
    const pkgs = [
        {
            id: 'pkg-1', agencyId: 'cvc', title: 'Paris Romântica - 7 Dias Inesquecíveis',
            destination: 'Paris', country: 'França',
            description: 'Descubra a cidade luz em um pacote completo com os principais pontos turísticos e experiências inesquecíveis.',
            fullDescription: 'Paris em 7 dias é o equilíbrio perfeito entre romance e cultura. Você caminha sob os arcos da Torre Eiffel iluminada, navega pelo Sena ao pôr do sol, explora as obras-primas do Louvre com guia em português e se perde nas ruelas de Montmartre ouvindo acordeão. O pacote inclui hotel 4 estrelas no coração do Marais.',
            emotionalIntro: 'Imagine caminhar de mãos dadas pelas margens do Sena enquanto a Torre Eiffel se ilumina ao fundo.',
            duration: 7, priceMin: 8500, priceMax: 12000,
            includes: ['Passagens aéreas ida e volta', 'Hotel 4 estrelas no centro', 'Café da manhã incluído', 'Transfer aeroporto-hotel', 'City tour pela cidade', 'Ingresso Torre Eiffel'],
            highlights: ['Torre Eiffel com acesso prioritário', 'Cruzeiro pelo Rio Sena', 'Visita ao Museu do Louvre', 'Passeio por Montmartre'],
            badge: 'BESTSELLER' as const, rating: 4.8, reviewCount: 234, featured: true,
            hasFreeCancellation: true, recentPurchases: 24, priceComparison: 'below', priceDiscount: 15,
            categories: ['cultural', 'romantic'],
            inclusions: { flight: true, hotel: { stars: 4, meals: ['Café da manhã'] }, tours: ['Torre Eiffel', 'Cruzeiro Sena', 'City tour'], extras: ['Transfer aeroporto'] },
            routeDetails: { mainStop: 'Torre Eiffel', pickupLocations: ['Louvre', 'Champs-Élysées', 'Montmartre', 'Notre-Dame'], transport: { type: 'Ônibus panorâmico', duration: '20 minutos' } },
            includedItems: ['Passagens aéreas internacionais', 'Hospedagem hotel 4 estrelas (6 noites)', 'Café da manhã continental', 'Transfer aeroporto-hotel', 'City tour guiado em português', 'Ingresso Torre Eiffel com acesso prioritário', 'Cruzeiro pelo Rio Sena', 'Seguro viagem internacional'],
            notRecommendedFor: ['Viajantes que buscam aventura radical', 'Quem prefere roteiros sem grupo'],
            importantInfo: ['Passaporte com validade mínima de 6 meses', 'Visto não é necessário para brasileiros'],
            perfectFor: ['Casais em lua de mel', 'Quem quer conhecer Paris pela primeira vez'],
            images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800', 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800'],
            dates: [{ start: '2026-03-15', end: '2026-03-22', price: 8500, slots: 20 }, { start: '2026-05-10', end: '2026-05-17', price: 9800, slots: 15 }],
        },
        {
            id: 'pkg-2', agencyId: 'decolar', title: 'Tóquio Futurista - 10 Dias',
            destination: 'Tóquio', country: 'Japão',
            description: 'Mergulhe na cultura japonesa: dos templos milenares aos bairros ultramodernos de Tóquio.',
            duration: 10, priceMin: 12000, priceMax: 18000,
            includes: ['Passagens aéreas', 'Hotel 4 estrelas', 'Café da manhã', 'JR Pass 7 dias', 'Tours guiados', 'Seguro viagem'],
            highlights: ['Templo Senso-ji', 'Shibuya Crossing', 'Monte Fuji', 'Akihabara'],
            badge: 'FEATURED' as const, rating: 4.9, reviewCount: 189, featured: true,
            hasFreeCancellation: true, recentPurchases: 18, priceComparison: 'average',
            categories: ['cultural', 'adventure'],
            inclusions: { flight: true, hotel: { stars: 4, meals: ['Café da manhã'] }, tours: ['Templo Senso-ji', 'Shibuya tour', 'Monte Fuji'], extras: ['JR Pass 7 dias'] },
            images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800'],
            dates: [{ start: '2026-04-01', end: '2026-04-11', price: 12000, slots: 15 }],
        },
        {
            id: 'pkg-3', agencyId: 'hurb', title: 'Maldivas All-Inclusive - 6 Dias',
            destination: 'Maldivas', country: 'Maldivas',
            description: 'Resort 5 estrelas sobre as águas cristalinas. Experiência de luxo com tudo incluído.',
            duration: 6, priceMin: 15000, priceMax: 25000,
            includes: ['Passagens aéreas', 'Resort 5 estrelas water villa', 'Todas as refeições', 'Snorkeling', 'Spa', 'Transfer speedboat'],
            highlights: ['Water villa sobre o oceano', 'Snorkeling com tubarões', 'Spa sobre as águas', 'Jantar na praia'],
            badge: 'LUXURY' as const, rating: 4.9, reviewCount: 156, featured: true,
            hasFreeCancellation: true, isAllInclusive: true, recentPurchases: 12, priceComparison: 'above',
            categories: ['luxury', 'beach'],
            inclusions: { flight: true, hotel: { stars: 5, meals: ['Café da manhã', 'Almoço', 'Jantar'] }, tours: ['Snorkeling', 'Sunset cruise'], extras: ['Spa', 'Transfer speedboat'] },
            images: ['https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800', 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800'],
            dates: [{ start: '2026-06-01', end: '2026-06-07', price: 15000, slots: 8 }],
        },
        {
            id: 'pkg-4', agencyId: 'azul-viagens', title: 'Arraial do Cabo - Weekend Paradisíaco',
            destination: 'Arraial do Cabo', country: 'Brasil',
            description: 'O Caribe brasileiro a poucas horas do Rio. Praias de água cristalina e passeios de barco.',
            duration: 3, priceMin: 1200, priceMax: 2500,
            includes: ['Transporte ida e volta', 'Pousada com café', 'Passeio de barco', 'Mergulho'],
            highlights: ['Prainhas do Pontal', 'Gruta Azul', 'Praia do Farol', 'Mergulho'],
            badge: 'VALUE' as const, rating: 4.6, reviewCount: 312, featured: false,
            hasFreeCancellation: true, recentPurchases: 45, priceComparison: 'below', priceDiscount: 20,
            categories: ['beach', 'adventure'],
            inclusions: { flight: false, hotel: { stars: 3, meals: ['Café da manhã'] }, tours: ['Passeio de barco', 'Mergulho'], extras: ['Transfer de ônibus'] },
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],
            dates: [{ start: '2026-03-07', end: '2026-03-10', price: 1200, slots: 30 }],
        },
        {
            id: 'pkg-5', agencyId: 'cvc', title: 'Roma e Toscana - 9 Dias Inesquecíveis',
            destination: 'Roma', country: 'Itália',
            description: 'Do Coliseu às vinícolas da Toscana. Arte, história e gastronomia italiana em um só pacote.',
            duration: 9, priceMin: 9500, priceMax: 14000,
            includes: ['Passagens aéreas', 'Hotel 4 estrelas', 'Café da manhã', 'Tours guiados', 'Degustação de vinhos'],
            highlights: ['Coliseu e Fórum Romano', 'Vaticano e Capela Sistina', 'Vinícolas da Toscana', 'Florença'],
            badge: 'BESTSELLER' as const, rating: 4.8, reviewCount: 267, featured: true,
            hasFreeCancellation: true, recentPurchases: 31, priceComparison: 'below', priceDiscount: 10,
            categories: ['cultural', 'gastronomy'],
            inclusions: { flight: true, hotel: { stars: 4, meals: ['Café da manhã'] }, tours: ['Coliseu', 'Vaticano', 'Toscana'], extras: ['Degustação de vinhos'] },
            images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'],
            dates: [{ start: '2026-04-15', end: '2026-04-24', price: 9500, slots: 18 }],
        },
    ];

    for (const pkg of pkgs) {
        await prisma.package.create({
            data: {
                id: pkg.id, agencyId: pkg.agencyId, title: pkg.title,
                destination: pkg.destination, country: pkg.country,
                description: pkg.description, fullDescription: pkg.fullDescription,
                emotionalIntro: pkg.emotionalIntro, duration: pkg.duration,
                priceMin: pkg.priceMin, priceMax: pkg.priceMax,
                includes: pkg.includes, highlights: pkg.highlights || [],
                badge: pkg.badge, rating: pkg.rating, reviewCount: pkg.reviewCount,
                featured: pkg.featured, hasFreeCancellation: pkg.hasFreeCancellation ?? false,
                isAllInclusive: pkg.isAllInclusive ?? false,
                recentPurchases: pkg.recentPurchases ?? 0,
                priceComparison: pkg.priceComparison,
                priceDiscount: pkg.priceDiscount ?? 0,
                categories: pkg.categories || [],
                inclusions: pkg.inclusions, routeDetails: pkg.routeDetails,
                includedItems: pkg.includedItems || [],
                notRecommendedFor: pkg.notRecommendedFor || [],
                importantInfo: pkg.importantInfo || [],
                perfectFor: pkg.perfectFor || [],
                images: { create: pkg.images.map((url: string, i: number) => ({ url, order: i })) },
                pricingWindows: {
                    create: (pkg.dates || []).map((d: any) => ({
                        startDate: new Date(d.start), endDate: new Date(d.end),
                        price: d.price, availableSlots: d.slots,
                    })),
                },
            },
        });
    }
}

async function seedItineraries() {
    const itins = [
        {
            id: 'itin-1', creatorId: 'diego', title: 'Paris Econômica - 10 dias por R$ 6.000',
            destination: 'Paris', country: 'França',
            description: 'Roteiro completo com planilha de gastos, hospedagens baratas, restaurantes locais e atrações gratuitas.',
            price: 49.90, duration: 10, rating: 4.9, reviewCount: 456, featured: true,
            highlights: ['Visita à Torre Eiffel com subida ao topo', 'Passeio pelo Museu do Louvre e Mona Lisa', 'Cruzeiro noturno pelo Rio Sena', 'Exploração de Montmartre e Sacré-Cœur', 'Dia em Versailles e seus jardins'],
            inclusions: ['Planilha', 'Mapa'],
            estimatedSpending: { min: 5500, max: 7000, currency: 'BRL', breakdown: [{ category: '🏨 Hospedagem', amount: 'R$ 2.000 - 2.800', description: 'Hostels e hotéis econômicos' }, { category: '🍽️ Alimentação', amount: 'R$ 1.500 - 2.000', description: 'Mercados locais e bistrôs' }, { category: '🚇 Transporte', amount: 'R$ 800 - 1.000', description: 'Passe de metrô e caminhadas' }, { category: '🎭 Atrações', amount: 'R$ 1.200 - 1.200', description: 'Museus e pontos turísticos' }] },
            images: ['https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800', 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
        },
        {
            id: 'itin-2', creatorId: 'mariana', title: 'Tóquio Autêntica - 15 dias de Cultura',
            destination: 'Tóquio', country: 'Japão',
            description: 'Descubra o Japão além dos pontos turísticos: templos escondidos, mercados locais e experiências únicas.',
            price: 79.90, duration: 15, rating: 4.8, reviewCount: 312, featured: true,
            highlights: ['Exploração dos templos de Asakusa e Meiji', 'Travessia do cruzamento de Shibuya', 'Dia completo em Akihabara', 'Visita ao Monte Fuji', 'Experiência em onsen tradicional'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Frases'],
            estimatedSpending: { min: 12000, max: 18000, currency: 'BRL', breakdown: [{ category: '🏨 Hospedagem', amount: 'R$ 4.500 - 7.000', description: 'Hostels, capsule hotels e ryokans' }, { category: '🍽️ Alimentação', amount: 'R$ 3.000 - 4.500', description: 'Ramen, izakayas e konbinis' }] },
            images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'],
        },
        {
            id: 'itin-3', creatorId: 'carlos', title: 'Nova York: Roteiro Completo 7 dias',
            destination: 'Nova York', country: 'Estados Unidos',
            description: 'De Manhattan ao Brooklyn, explore NYC como um morador local.',
            price: 59.90, duration: 7, rating: 4.7, reviewCount: 234, featured: true,
            highlights: ['Brooklyn Bridge ao pôr do sol', 'Empire State Building', 'Central Park', 'Metropolitan Museum'],
            inclusions: ['Planilha', 'Mapa'],
            estimatedSpending: { min: 8000, max: 14000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800'],
        },
        {
            id: 'itin-4', creatorId: 'julia', title: 'Londres Histórica - 5 dias Essenciais',
            destination: 'Londres', country: 'Reino Unido',
            description: 'Roteiro focado em história, museus gratuitos, pubs tradicionais e mirantes.',
            price: 44.90, duration: 5, rating: 4.8, reviewCount: 189, featured: false,
            highlights: ['Torre de Londres', 'Troca da Guarda', 'British Museum', 'London Eye', 'Camden Market'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Museus'],
            estimatedSpending: { min: 6000, max: 10000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800'],
        },
        {
            id: 'itin-5', creatorId: 'pedro', title: 'Barcelona e Praias - 12 dias de Sol',
            destination: 'Barcelona', country: 'Espanha',
            description: 'Combine cultura, arquitetura de Gaudí e praias paradisíacas.',
            price: 69.90, duration: 12, rating: 4.9, reviewCount: 421, featured: true,
            highlights: ['Sagrada Família', 'Ramblas e Boqueria', 'Barceloneta', 'Montserrat', 'Tour de tapas'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
            estimatedSpending: { min: 9000, max: 14000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', 'https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=800'],
        },
        {
            id: 'itin-6', creatorId: 'ana', title: 'Roma Imperial - 8 dias entre Ruínas e Gelatos',
            destination: 'Roma', country: 'Itália',
            description: 'Do Coliseu ao Vaticano, passando por trattorias escondidas e os melhores gelatos de Roma.',
            price: 59.90, duration: 8, rating: 4.8, reviewCount: 278, featured: true,
            highlights: ['Coliseu e Fórum Romano', 'Basílica de São Pedro', 'Fontana di Trevi', 'Aula de pasta', 'Pompeia'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
            estimatedSpending: { min: 7000, max: 11000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'],
        },
        {
            id: 'itin-7', creatorId: 'rafael', title: 'Machu Picchu e Vale Sagrado - 9 dias',
            destination: 'Cusco', country: 'Peru',
            description: 'Trilha Inca, aclimatação em Cusco, Vale Sagrado e a cidadela sagrada.',
            price: 54.90, duration: 9, rating: 4.7, reviewCount: 167, featured: true,
            highlights: ['Trilha Inca 4 dias', 'Nascer do sol em Machu Picchu', 'Vale Sagrado', 'Salineras de Maras'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Trilha'],
            estimatedSpending: { min: 5000, max: 8500, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1587595431973-160d0d163571?w=800', 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800'],
        },
        {
            id: 'itin-8', creatorId: 'camila', title: 'Bali Espiritual - 14 dias de Paz',
            destination: 'Bali', country: 'Indonésia',
            description: 'Templos milenares, arrozais, praias e retiros de yoga.',
            price: 74.90, duration: 14, rating: 4.9, reviewCount: 389, featured: true,
            highlights: ['Tegallalang', 'Monte Batur', 'Uluwatu', 'Retiro de yoga', 'Nusa Islands', 'Tirta Empul', 'Tanah Lot'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Templos'],
            estimatedSpending: { min: 6000, max: 9500, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800'],
        },
        {
            id: 'itin-9', creatorId: 'lucas', title: 'Buenos Aires: Tango, Carne e Cultura - 6 dias',
            destination: 'Buenos Aires', country: 'Argentina',
            description: 'San Telmo, La Boca, Recoleta e as melhores parrillas.',
            price: 39.90, duration: 6, rating: 4.6, reviewCount: 145, featured: false,
            highlights: ['La Boca e Caminito', 'Tango em San Telmo', 'Parrilla em Puerto Madero', 'Recoleta', 'Ateneo Grand Splendid'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
            estimatedSpending: { min: 3500, max: 6000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=800', 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800'],
        },
    ];

    for (const it of itins) {
        await prisma.itinerary.create({
            data: {
                id: it.id, creatorId: it.creatorId, title: it.title,
                destination: it.destination, country: it.country,
                description: it.description, price: it.price, duration: it.duration,
                rating: it.rating, reviewCount: it.reviewCount, featured: it.featured,
                highlights: it.highlights, inclusions: it.inclusions,
                estimatedSpending: it.estimatedSpending,
                images: { create: it.images.map((url: string, i: number) => ({ url, order: i })) },
            },
        });
    }
}

async function seedReviews() {
    const reviews = [
        { travelerId: 'trav-rev1', packageId: 'pkg-1', rating: 5, comment: 'Viagem perfeita! A CVC cuidou de tudo. Hotel maravilhoso no coração de Paris. Recomendo demais!', verified: true, userName: 'Maria S.', userLocation: 'São Paulo, SP', userAvatar: '#FF6B6B', userInitial: 'M' },
        { travelerId: 'trav-rev2', packageId: 'pkg-1', rating: 4, comment: 'Boa experiência no geral. O city tour poderia ser mais longo, mas o hotel e os voos foram excelentes.', verified: true, userName: 'João P.', userLocation: 'Rio de Janeiro, RJ', userAvatar: '#4ECDC4', userInitial: 'J' },
        { travelerId: 'trav-rev3', packageId: 'pkg-1', rating: 5, comment: 'Melhor viagem da minha vida! Paris é encantadora.', verified: true, userName: 'Ana L.', userLocation: 'Curitiba, PR', userAvatar: '#45B7D1', userInitial: 'A' },
        { travelerId: 'trav-rev1', itineraryId: 'itin-1', rating: 5, comment: 'Roteiro incrível! Economizei muito seguindo as dicas do Diego. Super detalhado.', verified: true, userName: 'Maria S.', userLocation: 'São Paulo, SP', userAvatar: '#FF6B6B', userInitial: 'M' },
        { travelerId: 'trav-rev2', itineraryId: 'itin-1', rating: 5, comment: 'A planilha de gastos é sensacional. Tudo organizado dia a dia. Vale cada centavo.', verified: true, userName: 'João P.', userLocation: 'Rio de Janeiro, RJ', userAvatar: '#4ECDC4', userInitial: 'J' },
        { travelerId: 'trav-rev3', itineraryId: 'itin-2', rating: 5, comment: 'A Mariana conhece o Japão como ninguém. Dicas de lugares que nenhum turista conhece!', verified: true, userName: 'Ana L.', userLocation: 'Curitiba, PR', userAvatar: '#45B7D1', userInitial: 'A' },
    ];

    for (const r of reviews) {
        await prisma.review.create({ data: r });
    }
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
