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

    // ─── MY TRIPS (purchases, itinerary sales, saved items) ───
    await seedMyTrips();
    console.log('✅ My Trips data created');

    console.log('🎉 Seed completed!');
}

async function seedPackages() {
    const pkgs = [
        {
            id: 'pkg-1', agencyId: 'cvc', title: 'Paris Romântica - 7 Dias Inesquecíveis',
            destination: 'Paris', country: 'França',
            description: 'Descubra a cidade luz em um pacote completo com os principais pontos turísticos e experiências inesquecíveis.',
            fullDescription: 'Viva a experiência completa na Cidade Luz com este pacote exclusivo de 7 dias. Explore os monumentos mais icônicos, passeie pelos charmosos bairros parisienses, saboreie a gastronomia francesa e mergulhe na rica história e cultura da capital francesa. Nosso roteiro cuidadosamente planejado equilibra visitas guiadas aos principais pontos turísticos com tempo livre para você descobrir seus próprios tesouros escondidos. Acomodação central em hotel 4 estrelas garante conforto e praticidade para explorar a cidade a pé ou de metrô.',
            emotionalIntro: 'Imagine começar o dia com um café au lait numa calçada parisiense, ver a Torre Eiffel iluminada ao anoitecer e passear de mãos dadas pelas margens do Sena enquanto o sol se põe sobre a Cidade Luz.',
            duration: 7, priceMin: 8500, priceMax: 12000,
            includes: ['Passagens aéreas ida e volta', 'Hotel 4 estrelas no centro', 'Café da manhã incluído', 'Transfer aeroporto-hotel', 'City tour pela cidade', 'Ingresso Torre Eiffel'],
            highlights: ['Torre Eiffel com acesso prioritário', 'Cruzeiro pelo Rio Sena', 'Visita ao Museu do Louvre', 'Passeio por Montmartre'],
            badge: 'BESTSELLER' as const, rating: 4.8, reviewCount: 234, featured: true,
            hasFreeCancellation: true, recentPurchases: 24, priceComparison: 'below', priceDiscount: 15,
            categories: ['cultural', 'romantic'],
            inclusions: { flight: true, hotel: { stars: 4, meals: ['Café da manhã'] }, tours: ['Torre Eiffel', 'Cruzeiro Sena', 'City tour'], extras: ['Transfer aeroporto'] },
            routeDetails: { mainStop: 'Torre Eiffel', pickupLocations: ['Louvre', 'Champs-Élysées', 'Montmartre', 'Notre-Dame', 'Arc de Triomphe', 'Musée d\'Orsay', 'Sacré-Cœur', 'Latin Quarter'], transport: { type: 'Ônibus panorâmico', duration: '20 minutos' } },
            includedItems: [
                'Passagens aéreas internacionais (ida e volta)',
                'Transfer privativo aeroporto-hotel-aeroporto',
                'Hospedagem em hotel 4 estrelas no centro de Paris',
                'Café da manhã buffet todos os dias',
                'Ingresso para Torre Eiffel com acesso prioritário',
                'Cruzeiro turístico no Rio Sena (1 hora)',
                'City tour guiado em português (dia inteiro)',
                'Visita ao Museu do Louvre com guia',
                'Seguro viagem internacional',
                'Kit de boas-vindas e material informativo',
                'Assistência 24h em português',
            ],
            notRecommendedFor: [
                'Pessoas com dificuldade de locomoção (muitas escadas e caminhadas)',
                'Menores de 5 anos (roteiro intenso)',
                'Pessoas que não gostam de ambientes com muitos turistas',
            ],
            importantInfo: [
                'Passaporte com validade mínima de 6 meses',
                'Visto não é necessário para brasileiros (permanência até 90 dias)',
                'Recomendamos contratar seguro viagem com cobertura mínima de €30.000',
                'Clima: leve roupas para temperaturas entre 5°C e 25°C conforme a estação',
                'Alguns museus fecham às terças-feiras',
                'Reserve com antecedência para garantir melhores tarifas aéreas',
            ],
            perfectFor: [
                'Casais em lua de mel',
                'Quem quer conhecer Paris pela primeira vez',
                'Vai para a Europa pela primeira vez',
                'Quer ver os clássicos sem se preocupar com logística',
                'Prefere tudo organizado com conforto',
            ],
            images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1600', 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=1600', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600'],
            dates: [{ start: '2026-03-15', end: '2026-03-22', price: 8500, slots: 20 }, { start: '2026-05-10', end: '2026-05-17', price: 9800, slots: 15 }],
        },
        {
            id: 'pkg-2', agencyId: 'decolar', title: 'Caribe All Inclusive - Cancún',
            destination: 'Cancún', country: 'México',
            description: 'Resort all inclusive no paraíso caribenho com praias de água cristalina.',
            duration: 5, priceMin: 6500, priceMax: 11000,
            includes: ['Passagens aéreas', 'Resort all inclusive', 'Todas as refeições', 'Bebidas', 'Transfer'],
            highlights: ['Praias de água cristalina', 'Passeio a Chichén Itzá', 'Snorkeling em recifes', 'Xcaret Park'],
            badge: 'VALUE' as const, rating: 4.9, reviewCount: 567, featured: true,
            hasFreeCancellation: true, recentPurchases: 42, priceComparison: 'below', priceDiscount: 20,
            categories: ['beach', 'luxury'],
            inclusions: { flight: true, hotel: { stars: 5, meals: ['Café da manhã', 'Almoço', 'Jantar'] }, tours: ['Chichén Itzá', 'Xcaret'], extras: ['Transfer'] },
            images: ['https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=1600', 'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?w=1600', 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1600'],
            dates: [{ start: '2026-04-05', end: '2026-04-10', price: 6500, slots: 25 }],
        },
        {
            id: 'pkg-3', agencyId: 'cvc', title: 'Europa Clássica - 15 Dias',
            destination: 'Multi-destinos', country: 'Europa',
            description: 'Circuito completo pela Europa: Paris, Roma, Londres e Barcelona em 15 dias.',
            duration: 15, priceMin: 15000, priceMax: 22000,
            includes: ['Passagens aéreas', 'Hotéis 4 estrelas', 'Café da manhã diário', 'Trem entre cidades', 'Tours guiados'],
            highlights: ['Torre Eiffel', 'Coliseu', 'Big Ben', 'Sagrada Família'],
            badge: 'FEATURED' as const, rating: 4.7, reviewCount: 345, featured: true,
            hasFreeCancellation: true, recentPurchases: 15, priceComparison: 'average',
            categories: ['cultural', 'adventure'],
            inclusions: { flight: true, hotel: { stars: 4, meals: ['Café da manhã'] }, tours: ['City tours em 4 cidades'], extras: ['Eurail Pass'] },
            images: ['https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600', 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=1600', 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1600'],
            dates: [{ start: '2026-06-01', end: '2026-06-16', price: 15000, slots: 12 }],
        },
        {
            id: 'pkg-4', agencyId: 'azul-viagens', title: 'Fernando de Noronha Completo',
            destination: 'Fernando de Noronha', country: 'Brasil',
            description: 'Explore o paraíso brasileiro com praias cristalinas e vida marinha.',
            duration: 5, priceMin: 5500, priceMax: 7000,
            includes: ['Voo Recife - Noronha ida e volta', 'Pousada com café da manhã', 'Taxa de preservação', 'Passeio de barco', 'Mergulho com snorkel'],
            highlights: ['Baía do Sancho', 'Praia do Leão', 'Mergulho com golfinhos', 'Trilha do Atalaia'],
            badge: 'BESTSELLER' as const, rating: 4.9, reviewCount: 423, featured: false,
            hasFreeCancellation: false, recentPurchases: 18, priceComparison: 'average',
            categories: ['beach', 'adventure', 'nature'],
            inclusions: { flight: true, hotel: { stars: 3, meals: ['Café da manhã'] }, tours: ['Passeio de barco', 'Mergulho'], extras: ['Taxa ambiental'] },
            images: ['https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1600', 'https://images.unsplash.com/photo-1606146485303-b7e66e6b2e93?w=1600', 'https://images.unsplash.com/photo-1518485547484-e28ef52e7df2?w=1600'],
            dates: [{ start: '2026-05-01', end: '2026-05-06', price: 5500, slots: 10 }],
        },
        {
            id: 'pkg-5', agencyId: 'hurb', title: 'Nova York - A Cidade que Nunca Dorme',
            destination: 'Nova York', country: 'Estados Unidos',
            description: 'De Manhattan ao Brooklyn, explore a cidade que nunca dorme.',
            duration: 6, priceMin: 7500, priceMax: 12000,
            includes: ['Passagens aéreas', 'Hotel em Manhattan', 'Café da manhã', 'City tour', 'Ingresso Top of the Rock'],
            highlights: ['Times Square', 'Central Park', 'Estátua da Liberdade', 'Brooklyn Bridge'],
            badge: 'FEATURED' as const, rating: 4.7, reviewCount: 289, featured: true,
            hasFreeCancellation: true, recentPurchases: 33, priceComparison: 'average',
            categories: ['cultural', 'urban'],
            inclusions: { flight: true, hotel: { stars: 4, meals: ['Café da manhã'] }, tours: ['City tour', 'Estátua da Liberdade'], extras: ['MetroCard 7 dias'] },
            images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600', 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1600', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600'],
            dates: [{ start: '2026-04-20', end: '2026-04-26', price: 7500, slots: 20 }],
        },
        {
            id: 'pkg-6', agencyId: 'decolar', title: 'Machu Picchu e Cusco Místico',
            destination: 'Cusco', country: 'Peru',
            description: 'Descubra o Império Inca: Cusco, Vale Sagrado e a cidadela de Machu Picchu.',
            duration: 6, priceMin: 4500, priceMax: 7500,
            includes: ['Passagens aéreas', 'Hotéis 3 estrelas', 'Café da manhã', 'Ingresso Machu Picchu', 'Trem panorâmico'],
            highlights: ['Machu Picchu ao nascer do sol', 'Vale Sagrado dos Incas', 'Plaza de Armas de Cusco', 'Salineras de Maras'],
            badge: 'BESTSELLER' as const, rating: 4.8, reviewCount: 198, featured: true,
            hasFreeCancellation: true, recentPurchases: 27, priceComparison: 'below', priceDiscount: 10,
            categories: ['adventure', 'cultural', 'nature'],
            inclusions: { flight: true, hotel: { stars: 3, meals: ['Café da manhã'] }, tours: ['Machu Picchu', 'Vale Sagrado'], extras: ['Trem panorâmico'] },
            images: ['https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600', 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1600', 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=1600'],
            dates: [{ start: '2026-05-15', end: '2026-05-21', price: 4500, slots: 15 }],
        },
        {
            id: 'pkg-7', agencyId: 'hurb', title: 'Dubai Luxo e Tradição',
            destination: 'Dubai', country: 'Emirados Árabes',
            description: 'Arranha-céus futuristas, deserto dourado e luxo incomparável.',
            duration: 7, priceMin: 10000, priceMax: 16000,
            includes: ['Passagens aéreas', 'Hotel 5 estrelas', 'Café da manhã', 'Safari no deserto', 'Ingresso Burj Khalifa'],
            highlights: ['Burj Khalifa', 'Dubai Mall', 'Safari no deserto', 'Palm Jumeirah'],
            badge: 'LUXURY' as const, rating: 4.8, reviewCount: 156, featured: true,
            hasFreeCancellation: true, recentPurchases: 14, priceComparison: 'above',
            categories: ['luxury', 'urban'],
            inclusions: { flight: true, hotel: { stars: 5, meals: ['Café da manhã'] }, tours: ['Safari', 'City tour'], extras: ['Transfer aeroporto'] },
            images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600', 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1600'],
            dates: [{ start: '2026-06-10', end: '2026-06-17', price: 10000, slots: 12 }],
        },
        {
            id: 'pkg-8', agencyId: 'cvc', title: 'Patagônia Argentina Aventura',
            destination: 'El Calafate', country: 'Argentina',
            description: 'Glaciares imponentes, lagos azuis e natureza selvagem na Patagônia.',
            duration: 8, priceMin: 8000, priceMax: 12500,
            includes: ['Passagens aéreas', 'Hotel 3 estrelas', 'Café da manhã', 'Passeio Glaciar Perito Moreno', 'Navegação pelos icebergs'],
            highlights: ['Glaciar Perito Moreno', 'Lago Argentino', 'El Chaltén e Monte Fitz Roy', 'Navegação entre icebergs'],
            badge: 'FEATURED' as const, rating: 4.7, reviewCount: 134, featured: false,
            hasFreeCancellation: true, recentPurchases: 9, priceComparison: 'average',
            categories: ['adventure', 'nature'],
            inclusions: { flight: true, hotel: { stars: 3, meals: ['Café da manhã'] }, tours: ['Perito Moreno', 'Navegação'], extras: ['Transfer'] },
            images: ['https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=1600', 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1600', 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=1600'],
            dates: [{ start: '2026-07-01', end: '2026-07-09', price: 8000, slots: 10 }],
        },
        {
            id: 'pkg-9', agencyId: 'decolar', title: 'Paris Essencial - Weekend Perfeito',
            destination: 'Paris', country: 'França',
            description: 'Paris em 4 dias: os essenciais para quem tem pouco tempo.',
            duration: 4, priceMin: 5500, priceMax: 8000,
            includes: ['Passagens aéreas', 'Hotel 3 estrelas', 'Café da manhã', 'City tour express'],
            highlights: ['Torre Eiffel', 'Louvre', 'Arco do Triunfo', 'Montmartre'],
            badge: 'VALUE' as const, rating: 4.6, reviewCount: 178, featured: false,
            hasFreeCancellation: true, recentPurchases: 21, priceComparison: 'below', priceDiscount: 12,
            categories: ['cultural', 'romantic'],
            inclusions: { flight: true, hotel: { stars: 3, meals: ['Café da manhã'] }, tours: ['City tour'], extras: [] },
            images: ['https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=1600', 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=1600', 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=1600'],
            dates: [{ start: '2026-04-01', end: '2026-04-05', price: 5500, slots: 25 }],
        },
        {
            id: 'pkg-10', agencyId: 'hurb', title: 'Paris Completa - Experiência de Luxo',
            destination: 'Paris', country: 'França',
            description: 'Paris em 10 dias de luxo com gastronomia premium e hotel 5 estrelas.',
            duration: 10, priceMin: 12000, priceMax: 18000,
            includes: ['Passagens em classe executiva', 'Hotel 5 estrelas', 'Todas as refeições', 'Tours privados', 'Transfer limousine'],
            highlights: ['Jantar na Torre Eiffel', 'Tour privado pelo Louvre', 'Dia em Versailles', 'Degustação de champagne'],
            badge: 'LUXURY' as const, rating: 4.9, reviewCount: 89, featured: true,
            hasFreeCancellation: true, recentPurchases: 6, priceComparison: 'above',
            categories: ['luxury', 'romantic', 'gastronomy'],
            inclusions: { flight: true, hotel: { stars: 5, meals: ['Café da manhã', 'Almoço', 'Jantar'] }, tours: ['Tour privado Louvre', 'Versailles', 'Tour gastronômico'], extras: ['Transfer limousine', 'Champagne'] },
            images: ['https://images.unsplash.com/photo-1471623320832-752e8bbf8413?w=1600', 'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=1600', 'https://images.unsplash.com/photo-1500039436846-25ae2f11882e?w=1600'],
            dates: [{ start: '2026-05-20', end: '2026-05-30', price: 12000, slots: 8 }],
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
            images: ['https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=1600', 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=1600', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600'],
        },
        {
            id: 'itin-2', creatorId: 'mariana', title: 'Tóquio Autêntica - 15 dias de Cultura',
            destination: 'Tóquio', country: 'Japão',
            description: 'Descubra o Japão além dos pontos turísticos: templos escondidos, mercados locais e experiências únicas.',
            price: 79.90, duration: 15, rating: 4.8, reviewCount: 312, featured: true,
            highlights: ['Exploração dos templos de Asakusa e Meiji', 'Travessia do cruzamento de Shibuya', 'Dia completo em Akihabara', 'Visita ao Monte Fuji', 'Experiência em onsen tradicional'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Frases'],
            estimatedSpending: { min: 12000, max: 18000, currency: 'BRL', breakdown: [{ category: '🏨 Hospedagem', amount: 'R$ 4.500 - 7.000', description: 'Hostels, capsule hotels e ryokans' }, { category: '🍽️ Alimentação', amount: 'R$ 3.000 - 4.500', description: 'Ramen, izakayas e konbinis' }] },
            images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600', 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=1600'],
        },
        {
            id: 'itin-3', creatorId: 'carlos', title: 'Nova York: Roteiro Completo 7 dias',
            destination: 'Nova York', country: 'Estados Unidos',
            description: 'De Manhattan ao Brooklyn, explore NYC como um morador local.',
            price: 59.90, duration: 7, rating: 4.7, reviewCount: 234, featured: true,
            highlights: ['Brooklyn Bridge ao pôr do sol', 'Empire State Building', 'Central Park', 'Metropolitan Museum'],
            inclusions: ['Planilha', 'Mapa'],
            estimatedSpending: { min: 8000, max: 14000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600', 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1600', 'https://images.unsplash.com/photo-1519121785383-3229633bb75b?w=1600'],
        },
        {
            id: 'itin-4', creatorId: 'julia', title: 'Londres Histórica - 5 dias Essenciais',
            destination: 'Londres', country: 'Reino Unido',
            description: 'Roteiro focado em história, museus gratuitos, pubs tradicionais e mirantes.',
            price: 44.90, duration: 5, rating: 4.8, reviewCount: 189, featured: false,
            highlights: ['Torre de Londres', 'Troca da Guarda', 'British Museum', 'London Eye', 'Camden Market'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Museus'],
            estimatedSpending: { min: 6000, max: 10000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600', 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=1600', 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1600'],
        },
        {
            id: 'itin-5', creatorId: 'pedro', title: 'Barcelona e Praias - 12 dias de Sol',
            destination: 'Barcelona', country: 'Espanha',
            description: 'Combine cultura, arquitetura de Gaudí e praias paradisíacas.',
            price: 69.90, duration: 12, rating: 4.9, reviewCount: 421, featured: true,
            highlights: ['Sagrada Família', 'Ramblas e Boqueria', 'Barceloneta', 'Montserrat', 'Tour de tapas'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
            estimatedSpending: { min: 9000, max: 14000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600', 'https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=1600', 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1600'],
        },
        {
            id: 'itin-6', creatorId: 'ana', title: 'Roma Imperial - 8 dias entre Ruínas e Gelatos',
            destination: 'Roma', country: 'Itália',
            description: 'Do Coliseu ao Vaticano, passando por trattorias escondidas e os melhores gelatos de Roma.',
            price: 59.90, duration: 8, rating: 4.8, reviewCount: 278, featured: true,
            highlights: ['Coliseu e Fórum Romano', 'Basílica de São Pedro', 'Fontana di Trevi', 'Aula de pasta', 'Pompeia'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
            estimatedSpending: { min: 7000, max: 11000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600', 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1600', 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1600'],
        },
        {
            id: 'itin-7', creatorId: 'rafael', title: 'Machu Picchu e Vale Sagrado - 9 dias',
            destination: 'Cusco', country: 'Peru',
            description: 'Trilha Inca, aclimatação em Cusco, Vale Sagrado e a cidadela sagrada.',
            price: 54.90, duration: 9, rating: 4.7, reviewCount: 167, featured: true,
            highlights: ['Trilha Inca 4 dias', 'Nascer do sol em Machu Picchu', 'Vale Sagrado', 'Salineras de Maras'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Trilha'],
            estimatedSpending: { min: 5000, max: 8500, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1587595431973-160d0d163571?w=1600', 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1600', 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=1600'],
        },
        {
            id: 'itin-8', creatorId: 'camila', title: 'Bali Espiritual - 14 dias de Paz',
            destination: 'Bali', country: 'Indonésia',
            description: 'Templos milenares, arrozais, praias e retiros de yoga.',
            price: 74.90, duration: 14, rating: 4.9, reviewCount: 389, featured: true,
            highlights: ['Tegallalang', 'Monte Batur', 'Uluwatu', 'Retiro de yoga', 'Nusa Islands', 'Tirta Empul', 'Tanah Lot'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Templos'],
            estimatedSpending: { min: 6000, max: 9500, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600', 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1600', 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=1600'],
        },
        {
            id: 'itin-9', creatorId: 'lucas', title: 'Buenos Aires: Tango, Carne e Cultura - 6 dias',
            destination: 'Buenos Aires', country: 'Argentina',
            description: 'San Telmo, La Boca, Recoleta e as melhores parrillas.',
            price: 39.90, duration: 6, rating: 4.6, reviewCount: 145, featured: false,
            highlights: ['La Boca e Caminito', 'Tango em San Telmo', 'Parrilla em Puerto Madero', 'Recoleta', 'Ateneo Grand Splendid'],
            inclusions: ['Planilha', 'Mapa', 'Guia de Restaurantes'],
            estimatedSpending: { min: 3500, max: 6000, currency: 'BRL' },
            images: ['https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1600', 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1600', 'https://images.unsplash.com/photo-1585417000260-7c1aac9ce8a9?w=1600'],
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
        {
            travelerId: 'trav-rev1',
            packageId: 'pkg-1',
            rating: 5,
            comment: 'A experiência foi surreal! A visita à Torre Eiffel com acesso prioritário foi incrível, as vistas de Paris são de tirar o fôlego. O guia foi muito atencioso e nos levou pelos melhores pontos da cidade. O único ponto a melhorar seria dar mais tempo livre para explorar Montmartre, que é simplesmente encantador.',
            verified: true,
            userName: 'Salomé',
            userLocation: 'Portugal',
            userAvatar: '#4A90E2',
            userInitial: 'S',
            images: { create: [{ url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400', order: 0 }, { url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400', order: 1 }, { url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400', order: 2 }, { url: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400', order: 3 }] },
            responses: { create: [{ text: 'Thank you for your lovely review! We are delighted to hear you had a brilliant adventure with Fabien and Cris and enjoyed the amazing views. We hope to welcome you again soon!' }] }
        },
        {
            travelerId: 'trav-rev2',
            packageId: 'pkg-1',
            rating: 4,
            comment: 'Experiência maravilhosa! Os guias foram muito atenciosos e o local é lindo. Único ponto negativo foi o tempo um pouco corrido, mas valeu muito a pena!',
            verified: true,
            userName: 'Ana Clara',
            userLocation: 'Brasil',
            userAvatar: '#9B59B6',
            userInitial: 'A',
            images: { create: [{ url: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400', order: 0 }, { url: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=400', order: 1 }] }
        },
        {
            travelerId: 'trav-rev3',
            packageId: 'pkg-1',
            rating: 5,
            comment: 'Recomendo muito a experiência, simplesmente inesquecível! Guia, transporte e equipamentos nota 10. Passeio incrível pela natureza.',
            verified: true,
            userName: 'William',
            userLocation: 'Brasil',
            userAvatar: '#E74C3C',
            userInitial: 'W'
        },
        {
            travelerId: 'trav-rev1',
            itineraryId: 'itin-1',
            rating: 5,
            comment: 'Roteiro incrível! Economizei muito seguindo as dicas do Diego. Super detalhado.',
            verified: true,
            userName: 'Maria S.',
            userLocation: 'São Paulo, SP',
            userAvatar: '#FF6B6B',
            userInitial: 'M'
        },
        {
            travelerId: 'trav-rev2',
            itineraryId: 'itin-1',
            rating: 5,
            comment: 'A planilha de gastos é sensacional. Tudo organizado dia a dia. Vale cada centavo.',
            verified: true,
            userName: 'João P.',
            userLocation: 'Rio de Janeiro, RJ',
            userAvatar: '#4ECDC4',
            userInitial: 'J'
        },
        {
            travelerId: 'trav-rev3',
            itineraryId: 'itin-2',
            rating: 5,
            comment: 'A Mariana conhece o Japão como ninguém. Dicas de lugares que nenhum turista conhece!',
            verified: true,
            userName: 'Ana L.',
            userLocation: 'Curitiba, PR',
            userAvatar: '#45B7D1',
            userInitial: 'A'
        }
    ];

    for (const r of reviews) {
        await prisma.review.create({ data: r });
    }
}

async function seedMyTrips() {
    // ─── UPCOMING PACKAGE PURCHASES ───
    await prisma.purchaseHistory.create({
        data: {
            travelerId: 'trav-diego', packageId: 'pkg-1',
            totalPrice: 8500, travelers: 2, status: 'CONFIRMED',
            bookingCode: 'VAMO-2026-001', paymentMethod: 'credit_card',
            contactName: 'Diego Artur', contactEmail: 'diego@vamo.com',
            adultsCount: 2, childrenCount: 0,
            travelDate: new Date('2026-03-15'), travelEndDate: new Date('2026-03-22'),
        },
    });
    await prisma.purchaseHistory.create({
        data: {
            travelerId: 'trav-diego', packageId: 'pkg-2',
            totalPrice: 6500, travelers: 1, status: 'CONFIRMED',
            bookingCode: 'VAMO-2026-002', paymentMethod: 'pix',
            contactName: 'Diego Artur', contactEmail: 'diego@vamo.com',
            adultsCount: 1, childrenCount: 0,
            travelDate: new Date('2026-07-10'), travelEndDate: new Date('2026-07-15'),
        },
    });
    await prisma.purchaseHistory.create({
        data: {
            travelerId: 'trav-diego', packageId: 'pkg-7',
            totalPrice: 10000, travelers: 2, status: 'PENDING',
            bookingCode: 'VAMO-2026-003', paymentMethod: 'credit_card',
            contactName: 'Diego Artur', contactEmail: 'diego@vamo.com',
            adultsCount: 2, childrenCount: 0,
            travelDate: new Date('2026-12-20'), travelEndDate: new Date('2026-12-27'),
        },
    });

    // ─── PAST PACKAGE PURCHASES ───
    await prisma.purchaseHistory.create({
        data: {
            travelerId: 'trav-diego', packageId: 'pkg-8',
            totalPrice: 8000, travelers: 1, status: 'COMPLETED',
            bookingCode: 'VAMO-2025-010', paymentMethod: 'credit_card',
            contactName: 'Diego Artur', contactEmail: 'diego@vamo.com',
            adultsCount: 1, childrenCount: 0,
            travelDate: new Date('2025-09-05'), travelEndDate: new Date('2025-09-13'),
        },
    });
    await prisma.purchaseHistory.create({
        data: {
            travelerId: 'trav-diego', packageId: 'pkg-3',
            totalPrice: 15000, travelers: 2, status: 'COMPLETED',
            bookingCode: 'VAMO-2025-008', paymentMethod: 'pix',
            contactName: 'Diego Artur', contactEmail: 'diego@vamo.com',
            adultsCount: 2, childrenCount: 0,
            travelDate: new Date('2025-06-01'), travelEndDate: new Date('2025-06-16'),
        },
    });
    await prisma.purchaseHistory.create({
        data: {
            travelerId: 'trav-diego', packageId: 'pkg-9',
            totalPrice: 5500, travelers: 1, status: 'COMPLETED',
            bookingCode: 'VAMO-2025-005', paymentMethod: 'credit_card',
            contactName: 'Diego Artur', contactEmail: 'diego@vamo.com',
            adultsCount: 1, childrenCount: 0,
            travelDate: new Date('2025-01-20'), travelEndDate: new Date('2025-01-24'),
        },
    });

    // ─── ITINERARY SALES (purchased itineraries) ───
    await prisma.itinerarySale.create({
        data: {
            travelerId: 'trav-diego', itineraryId: 'itin-1',
            price: 49.90, commission: 9.98,
            createdAt: new Date('2026-01-15'),
        },
    });
    await prisma.itinerarySale.create({
        data: {
            travelerId: 'trav-diego', itineraryId: 'itin-2',
            price: 79.90, commission: 15.98,
            createdAt: new Date('2026-02-01'),
        },
    });
    await prisma.itinerarySale.create({
        data: {
            travelerId: 'trav-diego', itineraryId: 'itin-8',
            price: 74.90, commission: 14.98,
            createdAt: new Date('2026-02-10'),
        },
    });

    // ─── SAVED ITEMS ───
    await prisma.savedItem.create({
        data: { travelerId: 'trav-diego', packageId: 'pkg-5' },
    });
    await prisma.savedItem.create({
        data: { travelerId: 'trav-diego', packageId: 'pkg-6' },
    });
    await prisma.savedItem.create({
        data: { travelerId: 'trav-diego', itineraryId: 'itin-5' },
    });
    await prisma.savedItem.create({
        data: { travelerId: 'trav-diego', itineraryId: 'itin-6' },
    });
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
