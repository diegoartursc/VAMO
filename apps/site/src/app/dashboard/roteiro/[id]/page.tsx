"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, use } from "react";
import { getItineraryById, createItinerary, updateItinerary } from "../../../../lib/api";
import { useDollarRate } from "../../../../hooks/useDollarRate";

/* ─── Constants ─── */
const COUNTRIES = [
    "Afeganistão","África do Sul","Albânia","Alemanha","Andorra","Angola","Antígua e Barbuda","Arábia Saudita","Argélia","Argentina","Armênia","Austrália","Áustria","Azerbaijão",
    "Bahamas","Bahrein","Bangladesh","Barbados","Belarus","Bélgica","Belize","Benin","Botsuana","Brasil","Brunei","Bulgária","Burkina Faso","Burundi",
    "Cabo Verde","Camarões","Camboja","Canadá","Cazaquistão","Chade","Chile","China","Chipre","Colômbia","Comores","Congo","Coreia do Norte","Coreia do Sul","Costa do Marfim","Costa Rica","Croácia","Cuba",
    "Dinamarca","Djibuti","Dominica",
    "Egito","El Salvador","Emirados Árabes Unidos","Equador","Eritreia","Eslováquia","Eslovênia","Espanha","Eswatini","Estados Unidos","Estônia","Etiópia",
    "Fiji","Filipinas","Finlândia","França",
    "Gabão","Gâmbia","Gana","Geórgia","Granada","Grécia","Guatemala","Guiana","Guiné","Guiné Equatorial","Guiné-Bissau",
    "Haiti","Honduras","Hungria",
    "Iêmen","Índia","Indonésia","Irã","Iraque","Irlanda","Islândia","Israel","Itália",
    "Jamaica","Japão","Jordânia",
    "Kuwait","Quirguistão",
    "Laos","Lesoto","Letônia","Líbano","Libéria","Líbia","Liechtenstein","Lituânia","Luxemburgo",
    "Madagascar","Malásia","Malawi","Maldivas","Mali","Malta","Marrocos","Maurício","Mauritânia","México","Moçambique","Moldova","Mônaco","Mongólia","Montenegro","Myanmar",
    "Namíbia","Nauru","Nepal","Nicarágua","Níger","Nigéria","Noruega","Nova Zelândia",
    "Omã",
    "Países Baixos","Palau","Panamá","Papua Nova Guiné","Paquistão","Paraguai","Peru","Polônia","Portugal",
    "Qatar",
    "Reino Unido","República Centro-Africana","República Checa","República Dominicana","Romênia","Ruanda","Rússia",
    "Samoa","San Marino","Santa Lúcia","São Cristóvão e Névis","São Tomé e Príncipe","São Vicente e Granadinas","Senegal","Serra Leoa","Sérvia","Singapura","Síria","Somália","Sri Lanka","Sudão","Sudão do Sul","Suécia","Suíça","Suriname",
    "Tadjiquistão","Tailândia","Tanzânia","Timor-Leste","Togo","Tonga","Trinidad e Tobago","Tunísia","Turcomenistão","Turquia","Tuvalu",
    "Ucrânia","Uganda","Uruguai","Uzbequistão",
    "Vanuatu","Venezuela","Vietnã",
    "Zâmbia","Zimbábue",
].sort((a, b) => a.localeCompare(b, 'pt'));

const CITIES_BY_COUNTRY: Record<string, string[]> = {
    "Brasil": ["São Paulo","Rio de Janeiro","Brasília","Salvador","Fortaleza","Belo Horizonte","Manaus","Curitiba","Recife","Porto Alegre","Belém","Goiânia","Florianópolis","Natal","Maceió","São Luís","Campo Grande","Teresina","João Pessoa","Aracaju","Porto Velho","Cuiabá","Macapá","Rio Branco","Boa Vista","Foz do Iguaçu","Gramado","Búzios","Bonito","Lençóis Maranhenses","Chapada Diamantina","Fernando de Noronha","Ouro Preto","Paraty","Trancoso","Jericoacoara","Arraial do Cabo"],
    "Argentina": ["Buenos Aires","Córdoba","Rosario","Mendoza","La Plata","Mar del Plata","San Miguel de Tucumán","Salta","Santa Fe","Bariloche","El Calafate","Ushuaia","Puerto Iguazú","Jujuy"],
    "Chile": ["Santiago","Valparaíso","Concepción","Antofagasta","Viña del Mar","Temuco","Puerto Montt","San Pedro de Atacama","Punta Arenas","Puerto Natales","Torres del Paine"],
    "Colômbia": ["Bogotá","Medellín","Cali","Barranquilla","Cartagena","Santa Marta","Bucaramanga","Manizales","Pereira","Armenia","Leticia","San Andrés"],
    "Peru": ["Lima","Cusco","Arequipa","Trujillo","Chiclayo","Iquitos","Puno","Huancayo","Machu Picchu","Nazca"],
    "México": ["Cidade do México","Guadalajara","Monterrey","Cancún","Puebla","Tijuana","Mérida","Oaxaca","San Cristóbal de las Casas","Playa del Carmen","Tulum","Los Cabos","Puerto Vallarta","Guanajuato","Querétaro"],
    "Estados Unidos": ["Nova York","Los Angeles","Chicago","Houston","Phoenix","Filadélfia","San Antonio","San Diego","Dallas","São Francisco","Seattle","Boston","Miami","Washington D.C.","Las Vegas","Denver","Atlanta","Orlando","Nashville","Nova Orleans","Portland","Minneapolis","Detroit","Honolulu","Anchorage"],
    "Canadá": ["Toronto","Vancouver","Montreal","Calgary","Ottawa","Edmonton","Quebec","Winnipeg","Halifax","Victoria","Banff","Whistler"],
    "Portugal": ["Lisboa","Porto","Faro","Braga","Coimbra","Évora","Sintra","Albufeira","Lagos","Funchal","Ponta Delgada","Óbidos","Aveiro","Setúbal"],
    "Espanha": ["Madrid","Barcelona","Sevilha","Valencia","Málaga","Bilbao","Granada","Toledo","Santiago de Compostela","San Sebastián","Córdoba","Palma de Mallorca","Ibiza","Tenerife","Las Palmas","Salamanca","Segóvia","Burgos","Pamplona","Alicante"],
    "França": ["Paris","Marselha","Lyon","Toulouse","Nice","Nantes","Bordeaux","Strasbourg","Montpellier","Lille","Rennes","Tours","Cannes","Monaco","Versalhes","Mont-Saint-Michel","Annecy"],
    "Itália": ["Roma","Milão","Nápoles","Turim","Palermo","Gênova","Bolonha","Florença","Bari","Veneza","Verona","Catânia","Amalfi","Positano","Cinque Terre","Siena","Pisa","Pompeia","Ravena","Assis"],
    "Alemanha": ["Berlim","Hamburgo","Munique","Colônia","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dortmund","Essen","Bremen","Dresden","Heidelberg","Nuremberg","Rothenburg ob der Tauber"],
    "Reino Unido": ["Londres","Birmingham","Manchester","Leeds","Glasgow","Liverpool","Edinburgh","Bristol","Cardiff","Belfast","Oxford","Cambridge","Bath","York","Brighton","Stonehenge"],
    "Grécia": ["Atenas","Tessalônica","Patras","Heraklion","Larissa","Santorini","Mykonos","Rhodes","Corfu","Zakynthos","Delphi","Meteora","Olympia"],
    "Turquia": ["Istambul","Ancara","Izmir","Bursa","Antalya","Adana","Capadócia","Pamukkale","Éfeso","Bodrum","Marmaris","Fethiye"],
    "Japão": ["Tóquio","Osaka","Nagoya","Sapporo","Fukuoka","Kobe","Kioto","Kawasaki","Saitama","Hiroshima","Sendai","Nara","Nikko","Hakone","Kamakura"],
    "Tailândia": ["Bangkok","Chiang Mai","Phuket","Pattaya","Hat Yai","Koh Samui","Krabi","Ayutthaya","Chiang Rai","Kanchanaburi"],
    "Indonésia": ["Jacarta","Surabaya","Bandung","Medan","Semarang","Bali","Yogyakarta","Lombok","Komodo","Raja Ampat"],
    "Austrália": ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Hobart","Darwin","Cairns","Byron Bay","Uluru","Great Barrier Reef"],
    "Egito": ["Cairo","Alexandria","Luxor","Aswan","Hurghada","Sharm el-Sheikh","Giza","Petra"],
    "Marrocos": ["Casablanca","Rabat","Marrakech","Fes","Tânger","Agadir","Essaouira","Chefchaouen","Meknes","Ouarzazate"],
    "África do Sul": ["Joanesburgo","Cidade do Cabo","Durban","Pretória","Port Elizabeth","Bloemfontein","Knysna","Stellenbosch","Kruger"],
    "China": ["Pequim","Xangai","Guangzhou","Shenzhen","Chengdu","Xian","Hangzhou","Suzhou","Guilin","Lhasa","Hong Kong","Macau"],
    "Índia": ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Jaipur","Agra","Varanasi","Goa","Kerala","Udaipur","Jodhpur","Amritsar","Rishikesh"],
    "Emirados Árabes Unidos": ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras al-Khaimah"],
    "Cuba": ["Havana","Santiago de Cuba","Trinidad","Varadero","Viñales","Cienfuegos"],
    "Rússia": ["Moscou","São Petersburgo","Novosibirsk","Ecaterimburgo","Kazan","Nijni Novgorod","Vladivostok","Sochi"],
    "Vietnã": ["Ho Chi Minh","Hanói","Da Nang","Hội An","Huế","Nha Trang","Sapa","Halong Bay","Phú Quốc"],
    "Singapura": ["Singapura"],
    "Nova Zelândia": ["Auckland","Wellington","Christchurch","Queenstown","Rotorua","Dunedin","Milford Sound"],
    "Irlanda": ["Dublin","Cork","Galway","Limerick","Waterford","Killarney","Dingle"],
    "Países Baixos": ["Amsterdã","Rotterdam","Haia","Utrecht","Eindhoven","Groningen","Delft","Haarlem"],
    "Suíça": ["Zurique","Genebra","Basileia","Berna","Lausanne","Lucerna","Interlaken","Zermatt"],
    "Áustria": ["Viena","Salzburgo","Innsbruck","Graz","Linz","Hallstatt"],
    "República Checa": ["Praga","Brno","Ostrava","Cesky Krumlov","Karlovy Vary"],
    "Hungria": ["Budapeste","Debrecen","Miskolc","Pécs","Győr","Eger"],
    "Polônia": ["Varsóvia","Cracóvia","Gdansk","Wroclaw","Poznań","Lodz","Auschwitz"],
    "Suécia": ["Estocolmo","Gotemburgo","Malmö","Uppsala","Kiruna","Abisko"],
    "Noruega": ["Oslo","Bergen","Trondheim","Stavanger","Tromsø","Flam","Geiranger"],
    "Dinamarca": ["Copenhague","Aarhus","Odense","Aalborg","Roskilde"],
    "Finlândia": ["Helsinque","Tampere","Turku","Oulu","Rovaniemi","Levi"],
    "Islândia": ["Reykjavik","Akureyri","Vik","Selfoss","Husavik"],
    "Israel": ["Tel Aviv","Jerusalém","Haifa","Eilat","Nazaré","Mar Morto","Petra"],
    "Jordânia": ["Amã","Petra","Wadi Rum","Aqaba","Jerash","Madaba"],
    "Arábia Saudita": ["Riade","Jeddah","Meca","Medina","AlUla","Diriyah"],
    "Sri Lanka": ["Colombo","Kandy","Galle","Sigiriya","Ella","Mirissa","Anuradhapura"],
    "Nepal": ["Katmandu","Pokhara","Chitwan","Bhaktapur","Patan","Lukla","Namche Bazaar"],
    "Camboja": ["Phnom Penh","Siem Reap","Angkor Wat","Sihanoukville","Battambang"],
    "Malásia": ["Kuala Lumpur","Penang","Langkawi","Kota Kinabalu","Malacca","Cameron Highlands"],
    "Filipinas": ["Manila","Cebu","Davao","Boracay","El Nido","Palawan","Siargao"],
    "Laos": ["Vientiane","Luang Prabang","Vang Vieng","Pakse","Si Phan Don"],
    "Mianmar": ["Yangon","Mandalay","Bagan","Inle Lake","Ngapali"],
    "Costa Rica": ["San José","Liberia","La Fortuna","Manuel Antonio","Monteverde","Guanacaste","Tortuguero"],
    "Panamá": ["Cidade do Panamá","Bocas del Toro","Boquete","San Blas"],
    "Guatemala": ["Cidade da Guatemala","Antígua","Flores","Lago Atitlán","Chichicastenango"],
    "Cuba": ["Havana","Trinidad","Varadero","Viñales","Santiago de Cuba","Cienfuegos"],
    "República Dominicana": ["Santo Domingo","Punta Cana","Puerto Plata","La Romana","Samaná","Jarabacoa"],
    "Jamaica": ["Kingston","Montego Bay","Negril","Ocho Rios","Port Antonio"],
    "Tanzânia": ["Dar es Salaam","Zanzibar","Arusha","Moshi","Serengeti","Ngorongoro"],
    "Quênia": ["Nairóbi","Mombasa","Nakuru","Kisumu","Masai Mara","Amboseli"],
    "Etiópia": ["Adis Abeba","Lalibela","Axum","Gondar","Bahir Dar"],
    "Gana": ["Acra","Kumasi","Cape Coast","Tamale"],
    "Senegal": ["Dakar","Saint-Louis","Ziguinchor","Touba"],
    "Nigéria": ["Lagos","Abuja","Kano","Ibadan","Port Harcourt"],
    "Cuba": ["Havana","Trinidad","Varadero","Viñales","Santiago de Cuba"],
};
const STYLE_OPTIONS = [
    { key: "luxo", icon: "👑", label: "Luxo" },
    { key: "economico", icon: "💵", label: "Econômico" },
    { key: "mochilao", icon: "🎒", label: "Mochilão" },
    { key: "familia", icon: "👨‍👩‍👧‍👦", label: "Família" },
    { key: "romantico", icon: "💕", label: "Romântico" },
    { key: "aventura", icon: "🧗", label: "Aventura" },
];
const CATEGORY_OPTIONS = [
    { key: "cultura", icon: "🏛️", label: "Cultura" },
    { key: "gastronomia", icon: "🍽️", label: "Gastronomia" },
    { key: "natureza", icon: "🌿", label: "Natureza" },
    { key: "esportes", icon: "⚽", label: "Esportes" },
    { key: "cruzeiros", icon: "🚢", label: "Cruzeiros" },
    { key: "eurotrip", icon: "✈️", label: "Eurotrip" },
    { key: "relax", icon: "🧘", label: "Relax" },
    { key: "praia", icon: "🏖️", label: "Praia" },
    { key: "historico", icon: "📜", label: "Histórico" },
];
const MODULE_OPTIONS = [
    { key: "itinerario", icon: "🗓️", label: "Itinerário por dia", desc: "Roteiro dia a dia completo" },
    { key: "voo", icon: "✈️", label: "Meu voo", desc: "Sugestões de voo" },
    { key: "hospedagem", icon: "🏨", label: "Hospedagens", desc: "Hotéis e hospedagens sugeridas" },
    { key: "passeios", icon: "🎫", label: "Passeios & Atrações", desc: "Atrações e passeios imperdíveis" },
    { key: "transporte", icon: "🚌", label: "Transporte", desc: "Dicas de locomoção" },
    { key: "dicas", icon: "💡", label: "Dicas exclusivas", desc: "Dicas do criador" },
    { key: "restaurantes", icon: "🍴", label: "Restaurantes", desc: "Onde comer" },
    { key: "checklist", icon: "✅", label: "Checklist interativo", desc: "O que levar e preparar" },
    { key: "gasto", icon: "💳", label: "Estimativa de gasto", desc: "Quanto você vai gastar" },
];
const CHECKLIST_CATS = ["documentos", "mala", "pre-viagem", "custom"];
type SectionKey = "identity" | "commerce" | "modules" | "highlights" | "itinerary" | "spending" | "flight" | "accommodations" | "attractions" | "transport" | "tips" | "restaurants" | "checklist" | "postpurchase" | "media";
interface SectionDef { key: SectionKey; icon: string; title: string; subtitle?: string; required?: boolean; }
const SECTIONS: SectionDef[] = [
    { key: "identity",      icon: "🎯", title: "Identidade e Indexação",    subtitle: "Título, destino e categorias — o que o viajante vê primeiro na vitrine",            required: true },
    { key: "commerce",      icon: "💰", title: "Estrutura Comercial",        subtitle: "Defina o preço do seu roteiro",                                                        required: true },
    { key: "modules",       icon: "📦", title: "Módulos do Roteiro",         subtitle: "O que está incluído — o comprador decide com base nos módulos ativos",               required: true },
    { key: "highlights",    icon: "⭐", title: "Destaques da Viagem",        subtitle: "Os momentos únicos que diferenciam seu roteiro dos demais" },
    { key: "itinerary",     icon: "🗓️", title: "Itinerário Estruturado",    subtitle: "O coração do roteiro — dia a dia detalhado que o viajante vai seguir",              required: true },
    { key: "spending",      icon: "💳", title: "Estimativa de Gasto",        subtitle: "Calculada automaticamente a partir dos preços preenchidos nos módulos" },
    { key: "flight",        icon: "✈️", title: "Meu Voo",                   subtitle: "Sugestões de voo para o destino — aumenta a confiança do comprador" },
    { key: "accommodations",icon: "🏨", title: "Hospedagens",                subtitle: "Hotéis e hospedagens recomendadas — item mais consultado antes da compra" },
    { key: "attractions",   icon: "🎫", title: "Passeios & Atrações",        subtitle: "Passeios imperdíveis com horários, preços e dicas de experiência" },
    { key: "transport",     icon: "🚌", title: "Transporte",                 subtitle: "Como se locomover no destino — metrô, passes e dicas de mobilidade" },
    { key: "tips",          icon: "💡", title: "Dicas Exclusivas",           subtitle: "Segredos e dicas práticas que só quem foi sabe — seu grande diferencial" },
    { key: "restaurants",   icon: "🍴", title: "Restaurantes & Gastronomia", subtitle: "Onde comer bem — experiências gastronômicas autênticas e locais" },
    { key: "checklist",     icon: "✅", title: "Checklist",                  subtitle: "Lista de preparação que o viajante usa antes e durante a viagem" },
    { key: "media",         icon: "📸", title: "Fotos e Vídeos",             subtitle: "Imagens reais da sua viagem — fotos autênticas aumentam a conversão" },
    { key: "postpurchase",  icon: "⚙️", title: "Configuração Pós-compra",   subtitle: "Permissões e acessos liberados após a compra do roteiro" },
];
/* ─── Empty state definitions per section ─── */
const EMPTY_STATES: Partial<Record<SectionKey, { icon: string; title: string; desc: string; cta: string }>> = {
    highlights:     { icon: "⭐", title: "Quais foram os momentos inesquecíveis?", desc: "Liste as experiências únicas que só seu roteiro oferece — é o que chama atenção na vitrine.", cta: "+ Adicionar destaque" },
    itinerary:      { icon: "🗓️", title: "Construa o roteiro dia a dia", desc: "Um itinerário detalhado é o principal argumento de venda. Viajantes decidem com base nisso.", cta: "+ Adicionar primeiro dia" },
    flight:         { icon: "✈️", title: "Como foi o voo para esse destino?", desc: "Sugestões de voo com preços reais ajudam o viajante a planejar o orçamento completo.", cta: "+ Informar voo" },
    accommodations: { icon: "🏨", title: "Que hospedagem você recomendaria a um amigo?", desc: "Hospedagens bem descritas aumentam 3x a confiança de compra. Fale o que só quem esteve lá sabe.", cta: "+ Adicionar hospedagem" },
    attractions:    { icon: "🎫", title: "Quais atrações são absolutamente imperdíveis?", desc: "Passeios com preços, horários e dicas exclusivas são os mais valorizados pelos compradores.", cta: "+ Adicionar atração" },
    transport:      { icon: "🚌", title: "Como você se locomoveu no destino?", desc: "Dicas de transporte real economizam horas de pesquisa — e justificam o preço do seu roteiro.", cta: "+ Adicionar transporte" },
    tips:           { icon: "💡", title: "Quais segredos só você sabe?", desc: "Dicas exclusivas são seu maior diferencial. Viajantes pagam mais por roteiros com insights locais reais.", cta: "+ Adicionar dica" },
    restaurants:    { icon: "🍴", title: "Onde você comeu melhor nessa viagem?", desc: "Restaurantes autênticos e fora do circuito turístico são o que viajantes mais buscam.", cta: "+ Adicionar restaurante" },
    checklist:      { icon: "✅", title: "O que o viajante precisa levar e preparar?", desc: "Um checklist completo aumenta a satisfação pós-compra e reduz dúvidas de suporte.", cta: "+ Adicionar item" },
    media:          { icon: "📸", title: "Mostre como foi essa viagem de verdade", desc: "Fotos reais e autênticas transmitem confiança. Roteiros com imagens convertem muito mais.", cta: "+ Adicionar foto" },
};

/* Map: which module key activates which editor section */
const SECTION_MODULE_MAP: Partial<Record<SectionKey, string>> = {
    itinerary: "itinerario",
    spending: "gasto",
    flight: "voo",
    accommodations: "hospedagem",
    attractions: "passeios",
    transport: "transporte",
    tips: "dicas",
    restaurants: "restaurantes",
    checklist: "checklist",
};

interface Activity { title: string; description: string; time: string; duration: string; location: string; mapLink?: string; type: string; icon: string; tips: string; category: string; }
interface Day { dayNumber: number; title: string; summary: string; description: string; activities: Activity[]; }
interface Accommodation { name: string; address: string; mapLink: string; description: string; priceValue: string; priceCurrency: string; rating: string; externalLink: string; tips: string; }
interface Transport { description: string; passTypes: string; priceValue: string; priceCurrency: string; notes: string; }
interface ChecklistItem { category: string; item: string; isDefault: boolean; }
interface BreakdownItem { category: string; min: string; max: string; currency: string; }
interface RestaurantItem { name: string; cuisine: string; location: string; description: string; priceValue: string; priceCurrency: string; hours: string; externalLink: string; tips: string; }
interface AttractionItem { name: string; type: string; location: string; mapLink: string; description: string; ticketValue: string; ticketCurrency: string; hours: string; duration: string; externalLink: string; tips: string; }
const ATTRACTION_TYPES = ["Museu", "Monumento", "Parque", "Tour", "Mirante", "Igreja", "Palácio", "Praia", "Trilha", "Show / Espetáculo", "Parque Temático", "Mercado", "Passeio de Barco", "Outro"];
interface FlightLeg { airline: string; originAirport: string; destinationAirport: string; departureDate: string; arrivalDate: string; stops: number; }
const EMPTY_FLIGHT_LEG: FlightLeg = { airline: "", originAirport: "", destinationAirport: "", departureDate: "", arrivalDate: "", stops: 0 };
const CUISINE_OPTIONS = ["Ramen", "Sushi", "Tempura", "Izakaya", "Yakitori", "Italiana", "Francesa", "Brasileira", "Mexicana", "Indiana", "Tailandesa", "Fast Food", "Café", "Padaria", "Bistrô", "Fine Dining", "Street Food", "Vegetariana", "Frutos do Mar", "Outro"];

const DEFAULT_CREATOR_ID = "creator-diego-001";
const SPENDING_CATS = ["🏨 Hospedagem", "🍽️ Alimentação", "🚌 Transporte", "🎫 Atrações", "🎁 Extras"];
const CURRENCIES = [
    { code: "BRL", symbol: "R$" }, { code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" }, { code: "JPY", symbol: "¥" }, { code: "ARS", symbol: "$" },
    { code: "CLP", symbol: "$" }, { code: "COP", symbol: "$" }, { code: "MXN", symbol: "$" },
    { code: "PEN", symbol: "S/" }, { code: "CHF", symbol: "Fr" }, { code: "AUD", symbol: "A$" },
    { code: "CAD", symbol: "C$" }, { code: "THB", symbol: "฿" }, { code: "INR", symbol: "₹" },
    { code: "CNY", symbol: "¥" }, { code: "MYR", symbol: "RM" }, { code: "SGD", symbol: "S$" },
    { code: "NZD", symbol: "NZ$" }, { code: "ZAR", symbol: "R" }, { code: "TRY", symbol: "₺" },
    { code: "AED", symbol: "د.إ" }, { code: "IDR", symbol: "Rp" }, { code: "PHP", symbol: "₱" },
    { code: "VND", symbol: "₫" }, { code: "CRC", symbol: "₡" }, { code: "CUP", symbol: "$" },
    { code: "DOP", symbol: "RD$" }, { code: "UYU", symbol: "$U" }, { code: "BOB", symbol: "Bs" },
    { code: "PYG", symbol: "Gs" }, { code: "GTQ", symbol: "Q" }, { code: "MAD", symbol: "د.م." },
    { code: "EGP", symbol: "£" }, { code: "KES", symbol: "KSh" },
];

function getDurationLabel(d: number) {
    if (d <= 3) return "Fim de semana";
    if (d <= 7) return "1 semana";
    if (d <= 15) return "15 dias";
    return "+20 dias";
}

function calcQuality(data: any): number {
    let s = 0;
    const c = (v: any, p: number) => { if (v && (typeof v !== "string" || v.trim())) s += p; };
    const a = (v: any[], p: number) => { if (v && v.length > 0) s += p; };
    c(data.title, 8); c(data.destination, 8); c(data.country, 5); c(data.description, 8);
    c(data.subtitle, 5); c(data.duration, 3); c(data.price, 10);
    a(data.travelStyles, 8); a(data.categories, 8);
    a(data.activeModules, 5); a(data.highlights, 5); a(data.inclusions, 5);
    a(data.days, 10);
    if (data.days && data.days.length >= 3) s += 5;
    if (data.hasSpending) s += 5;
    c(data.productType, 2); c(data.promoPrice, 2);
    return Math.min(s, 100);
}

/* ═══════════════════════════════════════════ */
export default function RoteiroEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const isNew = id === "new";
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ─── Cotação do dólar (definida pelo admin) ─── */
    const { dollarRate, formattedRate } = useDollarRate();
    const toBRL = (value: string, currency: string): string | null => {
        const n = parseFloat(value);
        if (isNaN(n) || n <= 0 || currency === "BRL") return null;
        const RATES: Record<string, number> = { USD: dollarRate };
        const rate = RATES[currency];
        if (!rate) return null;
        return (n * rate).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    };

    /* ─── UI state ─── */
    const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["identity"]));
    const [activeSection, setActiveSection] = useState<SectionKey>("identity");
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [dirty, setDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

    /* ─── Bloco 1: Identidade ─── */
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [destination, setDestination] = useState("");
    const [country, setCountry] = useState("");
    const [extraCities, setExtraCities] = useState<string[]>([]);
    const [extraCountries, setExtraCountries] = useState<string[]>([]);
    const [duration, setDuration] = useState(1);
    const [description, setDescription] = useState("");
    const [travelStyles, setTravelStyles] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [productType, setProductType] = useState("DIGITAL");

    /* ─── Bloco 2: Comercial ─── */
    const [price, setPrice] = useState(0);
    const [currency, setCurrency] = useState("BRL");
    const [promoPrice, setPromoPrice] = useState<number | null>(null);
    const [installments, setInstallments] = useState<number | null>(null);
    const [immediateAccess, setImmediateAccess] = useState(true);
    const [lifetimeAccess, setLifetimeAccess] = useState(true);
    const [offlineDownload, setOfflineDownload] = useState(true);
    const [featured, setFeatured] = useState(false);

    /* ─── Bloco 3: Módulos ─── */
    const [activeModules, setActiveModules] = useState<string[]>([]);

    /* ─── Bloco 4: Itinerário ─── */
    const [days, setDays] = useState<Day[]>([]);
    const [images, setImages] = useState<string[]>([""]);
    const [highlightItems, setHighlightItems] = useState<string[]>([]);
    const [newHighlight, setNewHighlight] = useState("");
    const [inclusionItems, setInclusionItems] = useState<string[]>([]);
    const [newInclusion, setNewInclusion] = useState("");

    /* ─── Bloco 5: Gasto (auto-calculado) ─── */

    /* ─── Bloco 6: Meu Voo ─── */
    const [flightOutbound, setFlightOutbound] = useState<FlightLeg>({ ...EMPTY_FLIGHT_LEG });
    const [flightReturn, setFlightReturn] = useState<FlightLeg>({ ...EMPTY_FLIGHT_LEG });
    const [flightTotalPrice, setFlightTotalPrice] = useState("");
    const [flightPriceCurrency, setFlightPriceCurrency] = useState("BRL");
    const [flightTips, setFlightTips] = useState<string[]>([]);
    const [newFlightTip, setNewFlightTip] = useState("");

    /* ─── Bloco 7: Checklist ─── */
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [newCheckItem, setNewCheckItem] = useState("");
    const [newCheckCat, setNewCheckCat] = useState("documentos");

    /* ─── Bloco 8: Pós-compra ─── */
    const [allowPdf, setAllowPdf] = useState(false);
    const [allowShare, setAllowShare] = useState(true);

    /* ─── Hospedagem & Transporte ─── */
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
    const [transports, setTransports] = useState<Transport[]>([]);

    /* ─── Restaurantes & Dicas Gerais ─── */
    const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
    const [generalTips, setGeneralTips] = useState<string[]>([]);
    const [newGeneralTip, setNewGeneralTip] = useState("");

    /* ─── Passeios & Atrações ─── */
    const [attractions, setAttractions] = useState<AttractionItem[]>([]);

    /* ─── Fotos & Vídeos ─── */
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [highlightPhotos, setHighlightPhotos] = useState<string[]>(['', '', '']);

    /* ─── Quality score ─── */
    const hasSpending = [...accommodations, ...transports, ...restaurants, ...attractions].some(item => parseFloat((item as any).priceValue || (item as any).ticketValue) > 0);
    const qualityScore = calcQuality({ title, subtitle, destination, country, description, duration, price, travelStyles, categories, activeModules, highlights: highlightItems, inclusions: inclusionItems, days, hasSpending, productType, promoPrice });
    const qualityLabel = qualityScore >= 80 ? "Pronto para publicar" : qualityScore >= 60 ? "Quase lá" : qualityScore >= 30 ? "Em construção" : "Rascunho inicial";
    const qualityColor = qualityScore >= 80 ? "#22c55e" : qualityScore >= 60 ? "#f59e0b" : qualityScore >= 30 ? "#f97316" : "#94a3b8";

    /* ─── Toast auto-dismiss ─── */
    useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

    /* ─── Mark dirty ─── */
    const markDirty = useCallback(() => setDirty(true), []);

    /* ─── Load data ─── */
    useEffect(() => {
        if (isNew) return;
        getItineraryById(id)
            .then((data: any) => {
                setTitle(data.title || ""); setSubtitle(data.subtitle || "");
                setDestination(data.destination || ""); setCountry(data.country || "");
                setExtraCities(data.extraCities || []); setExtraCountries(data.extraCountries || []);
                setDuration(data.duration || 1); setDescription(data.description || "");
                setTravelStyles(data.travelStyles || []); setCategories(data.categories || []);
                setProductType(data.productType || "DIGITAL");
                setPrice(data.price || 0); setCurrency(data.currency || "BRL");
                setPromoPrice(data.promoPrice || null); setInstallments(data.installments || null);
                setImmediateAccess(data.immediateAccess ?? true); setLifetimeAccess(data.lifetimeAccess ?? true);
                setOfflineDownload(data.offlineDownload ?? true); setFeatured(data.featured || false);
                setActiveModules(data.activeModules || []);
                setHighlightItems(data.highlights || []); setInclusionItems(data.inclusions || []);
                setImages(Array.isArray(data.images) ? data.images.map((img: any) => typeof img === "string" ? img : img.url) : [""]);
                setAllowPdf(data.allowPdf ?? false); setAllowShare(data.allowShare ?? true);
                // Days
                setDays((data.days || []).map((d: any) => ({
                    dayNumber: d.dayNumber, title: d.title || "", summary: d.summary || "", description: d.description || "",
                    activities: (d.activities || []).map((a: any) => ({
                        title: a.title || "", description: a.description || "", time: a.time || "", duration: a.duration || "",
                        location: a.location || "", type: a.type || "activity", icon: a.icon || "📍",
                        tips: a.tips || "",
                        category: a.category || "", mapLink: a.mapLink || "",
                    })),
                })));
                // Accommodations
                setAccommodations((data.accommodations || []).map((a: any) => ({
                    name: a.name || "", address: a.address || a.neighborhood || "", mapLink: a.mapLink || "",
                    description: a.description || "",
                    priceValue: a.priceValue || a.priceRange || "", priceCurrency: a.priceCurrency || "BRL",
                    rating: a.rating?.toString() || "", externalLink: a.externalLink || "", tips: a.tips || "",
                })));
                // Transports
                setTransports((data.transports || []).map((t: any) => ({
                    description: t.description || "", passTypes: t.passTypes || "",
                    priceValue: t.priceValue || t.estimatedPrice || "", priceCurrency: t.priceCurrency || "BRL",
                    notes: t.notes || "",
                })));
                // Checklists
                setChecklistItems((data.checklists || []).map((c: any) => ({
                    category: c.category || "documentos", item: c.item || "", isDefault: c.isDefault ?? true,
                })));
                // Flight
                if (data.flightInfo) {
                    const mapLeg = (l: any): FlightLeg => ({
                        airline: l?.airline || "",
                        originAirport: l?.originAirport || "",
                        destinationAirport: l?.destinationAirport || "",
                        departureDate: l?.departureDate || l?.departure || "",
                        arrivalDate: l?.arrivalDate || l?.arrival || "",
                        stops: l?.stops || 0,
                    });
                    setFlightOutbound(mapLeg(data.flightInfo.outbound));
                    setFlightReturn(mapLeg(data.flightInfo.return));
                    setFlightTotalPrice(data.flightInfo.totalPrice || "");
                    setFlightPriceCurrency(data.flightInfo.priceCurrency || "BRL");
                    setFlightTips(data.flightInfo.tips || []);
                }
                // Restaurants
                setRestaurants((data.restaurants || []).map((r: any) => ({
                    name: r.name || "", cuisine: r.cuisine || "", location: r.location || "",
                    description: r.description || "", priceValue: r.priceValue || r.priceRange || "",
                    priceCurrency: r.priceCurrency || "BRL",
                    hours: r.hours || "", externalLink: r.externalLink || "", tips: r.tips || "",
                })));
                // General Tips
                setGeneralTips(data.generalTips || []);
                // Attractions
                setAttractions((data.attractions || []).map((a: any) => ({
                    name: a.name || "", type: a.type || "", location: a.location || "", mapLink: a.mapLink || "",
                    description: a.description || "", ticketValue: a.ticketValue || a.ticketPrice || "",
                    ticketCurrency: a.ticketCurrency || "BRL",
                    hours: a.hours || "", duration: a.duration || "",
                    externalLink: a.externalLink || "", tips: a.tips || "",
                })));
                // Media
                setMediaUrls(data.mediaUrls || []);
                setHighlightPhotos(data.highlightPhotos && data.highlightPhotos.length === 3 ? data.highlightPhotos : ['', '', '']);
            })
            .catch((err) => setToast({ msg: `Erro ao carregar: ${err.message}`, type: "error" }))
            .finally(() => setLoading(false));
    }, [id, isNew]);

    /* ─── Build payload ─── */
    const buildPayload = useCallback(() => {
        // Auto-compute spending breakdown from module data
        const calcSpendingCat = (items: Array<{v: string; c: string}>) => {
            const byCur: Record<string, number[]> = {};
            items.forEach(({ v, c }) => { const n = parseFloat(v); if (!isNaN(n) && n > 0) { if (!byCur[c]) byCur[c] = []; byCur[c].push(n); } });
            return Object.entries(byCur).map(([currency, vals]) => ({ currency, min: Math.min(...vals), max: vals.reduce((s, x) => s + x, 0) }));
        };
        const spendingSections = [
            { label: "🏨 Hospedagem", items: accommodations.map(a => ({ v: a.priceValue, c: a.priceCurrency })) },
            { label: "🚌 Transporte", items: transports.map(t => ({ v: t.priceValue, c: t.priceCurrency })) },
            { label: "🍽️ Alimentação", items: restaurants.map(r => ({ v: r.priceValue, c: r.priceCurrency })) },
            { label: "🎫 Atrações", items: attractions.map(a => ({ v: a.ticketValue, c: a.ticketCurrency })) },
        ];
        const autoBreakdown: BreakdownItem[] = spendingSections.flatMap(sec =>
            calcSpendingCat(sec.items).map(({ currency, min, max }) => ({ category: `${sec.label} (${currency})`, min: min.toString(), max: max.toString(), currency }))
        );
        const spMin = autoBreakdown.reduce((s, b) => s + (parseFloat(b.min) || 0), 0);
        const spMax = autoBreakdown.reduce((s, b) => s + (parseFloat(b.max) || 0), 0);
        return {
            creatorId: DEFAULT_CREATOR_ID, title, subtitle, destination, country, extraCities, extraCountries, description,
            price: price.toString(), currency, duration: duration.toString(), featured,
            travelStyles, categories, productType, activeModules,
            promoPrice: promoPrice?.toString() || undefined,
            installments: installments?.toString() || undefined,
            immediateAccess, lifetimeAccess, offlineDownload, allowPdf, allowShare,
            highlights: highlightItems, inclusions: inclusionItems,
            estimatedSpending: { min: spMin, max: spMax, breakdown: autoBreakdown },
            images: images.filter(Boolean),
            days: days.map((d, i) => ({ ...d, dayNumber: i + 1 })),
            accommodations, transports, checklists: checklistItems,
            flightInfo: (flightOutbound.airline || flightReturn.airline) ? {
                outbound: flightOutbound,
                return: flightReturn,
                totalPrice: flightTotalPrice,
                priceCurrency: flightPriceCurrency,
                tips: flightTips.filter(t => t.trim()),
            } : undefined,
            restaurants: restaurants.filter(r => r.name.trim()),
            generalTips: generalTips.filter(t => t.trim()),
            attractions: attractions.filter(a => a.name.trim()),
            mediaUrls: mediaUrls.filter(Boolean),
            highlightPhotos: highlightPhotos.filter(Boolean),
        };
    }, [title, subtitle, destination, country, extraCities, extraCountries, description, price, currency, duration, featured, travelStyles, categories, productType, activeModules, promoPrice, installments, immediateAccess, lifetimeAccess, offlineDownload, allowPdf, allowShare, highlightItems, inclusionItems, images, days, accommodations, transports, checklistItems, flightOutbound, flightReturn, flightTotalPrice, flightPriceCurrency, flightTips, restaurants, generalTips, attractions, mediaUrls, highlightPhotos]);

    /* ─── Save ─── */
    const handleSave = async () => {
        // Validation
        if (!title || !destination || !country) { setToast({ msg: "Preencha título, destino e país", type: "error" }); return; }
        if (price <= 0) { setToast({ msg: "Defina um preço válido", type: "error" }); return; }
        if (categories.length < 1) { setToast({ msg: "Selecione pelo menos 1 categoria", type: "error" }); return; }
        if (days.length < 3) { setToast({ msg: "Cadastre pelo menos 3 dias", type: "error" }); return; }
        if (activeModules.length < 1) { setToast({ msg: "Ative pelo menos 1 módulo", type: "error" }); return; }

        // Módulos ativos devem ter conteúdo preenchido
        const flightHasData = (flightOutbound.airline || flightOutbound.originAirport || flightReturn.airline || flightReturn.originAirport);
        const MODULE_CONTENT: Record<string, boolean> = {
            itinerario: days.some(d => d.activities?.length > 0),
            voo:        !!flightHasData,
            hospedagem: accommodations.length > 0,
            passeios:   attractions.length > 0,
            transporte: transports.length > 0,
            dicas:      generalTips.length > 0,
            restaurantes: restaurants.length > 0,
            checklist:  checklistItems.length > 0,
            gasto:      true, // calculado automaticamente
        };
        const MODULE_LABELS: Record<string, string> = {
            itinerario: "Itinerário por dia", voo: "Meu voo", hospedagem: "Hospedagens",
            passeios: "Passeios & Atrações", transporte: "Transporte", dicas: "Dicas exclusivas",
            restaurantes: "Restaurantes", checklist: "Checklist interativo", gasto: "Estimativa de gasto",
        };
        const moduloVazio = activeModules.find(m => MODULE_CONTENT[m] === false);
        if (moduloVazio) {
            setToast({ msg: `Preencha pelo menos 1 item em "${MODULE_LABELS[moduloVazio] || moduloVazio}"`, type: "error" });
            return;
        }

        setSaving(true);
        try {
            const payload = buildPayload();
            if (isNew) {
                const created = await createItinerary(payload);
                setToast({ msg: "Roteiro criado com sucesso!", type: "success" });
                window.location.href = `/dashboard/roteiro/${created.id}`;
            } else {
                await updateItinerary(id, payload);
                setToast({ msg: "Alterações salvas!", type: "success" });
                setDirty(false);
            }
        } catch (err: any) { setToast({ msg: err.message, type: "error" }); }
        finally { setSaving(false); }
    };

    /* ─── Auto-save ─── */
    useEffect(() => {
        if (isNew) return;
        autoSaveRef.current = setInterval(() => {
            if (dirty) {
                setSaveStatus("saving");
                updateItinerary(id, buildPayload())
                    .then(() => { setDirty(false); setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2500); })
                    .catch(() => { setSaveStatus("idle"); });
            }
        }, 30000);
        return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
    }, [id, isNew, dirty, buildPayload]);

    /* ─── Section helpers ─── */
    const toggleSection = (key: SectionKey) => { setOpenSections(p => { const n = new Set(p); if (n.has(key)) n.delete(key); else n.add(key); return n; }); };
    const isSectionComplete = useCallback((key: SectionKey): boolean => {
        switch (key) {
            case "identity": return !!(title && destination && country && categories.length >= 1);
            case "commerce": return price > 0;
            case "modules": return activeModules.length >= 1;
            case "itinerary": return days.length >= 3;
            case "spending": return [...accommodations, ...transports, ...restaurants, ...attractions].some(item => parseFloat((item as any).priceValue || (item as any).ticketValue) > 0);
            case "flight": return !!(flightOutbound.airline || flightReturn.airline);
            case "highlights": return highlightItems.length > 0;
            case "accommodations": return accommodations.length > 0;
            case "attractions": return attractions.length > 0;
            case "transport": return transports.length > 0;
            case "tips": return generalTips.length > 0;
            case "restaurants": return restaurants.length > 0;
            case "media": return mediaUrls.length > 0 || highlightPhotos.some(Boolean);
            case "checklist": return checklistItems.length > 0;
            case "postpurchase": return true;
            default: return false;
        }
    }, [title, destination, country, categories, price, activeModules, days, checklistItems, flightOutbound, flightReturn, accommodations, attractions, transports, generalTips, restaurants, mediaUrls, highlightPhotos, highlightItems]);

    /* ─── Chip toggle ─── */
    const toggleChip = (arr: string[], set: (v: string[]) => void, key: string, max: number) => {
        markDirty();
        if (arr.includes(key)) set(arr.filter(k => k !== key));
        else if (arr.length < max) set([...arr, key]);
    };

    /* ─── Data helpers ─── */
    const addDay = () => { markDirty(); setDays([...days, { dayNumber: days.length + 1, title: `Dia ${days.length + 1}`, summary: "", description: "", activities: [] }]); };
    const removeDay = (i: number) => { markDirty(); setDays(days.filter((_, idx) => idx !== i)); };
    const updateDay = (i: number, f: string, v: any) => { markDirty(); const u = [...days]; u[i] = { ...u[i], [f]: v }; setDays(u); };
    const addActivity = (di: number) => { markDirty(); const u = [...days]; u[di].activities = [...u[di].activities, { title: "", description: "", time: "", duration: "", location: "", mapLink: "", type: "activity", icon: "📍", tips: "", category: "" }]; setDays(u); };
    const updateActivity = (di: number, ai: number, f: string, v: any) => { markDirty(); const u = [...days]; u[di].activities[ai] = { ...u[di].activities[ai], [f]: v }; setDays(u); };
    const removeActivity = (di: number, ai: number) => { markDirty(); const u = [...days]; u[di].activities.splice(ai, 1); setDays([...u]); };
    const addAccommodation = () => { markDirty(); setAccommodations([...accommodations, { name: "", address: "", mapLink: "", description: "", priceValue: "", priceCurrency: "BRL", rating: "", externalLink: "", tips: "" }]); };
    const addTransport = () => { markDirty(); setTransports([...transports, { description: "", passTypes: "", priceValue: "", priceCurrency: "BRL", notes: "" }]); };

    /* ─── Loading ─── */
    if (loading) return (
        <div className="editor-skeleton">
            <div className="editor-skeleton-bar short" /><div className="editor-skeleton-bar medium" />
            <div className="editor-skeleton-section" /><div className="editor-skeleton-section" />
        </div>
    );

    /* ─── Empty state helper ─── */
    const EmptyState = ({ sKey, onCta }: { sKey: SectionKey; onCta?: () => void }) => {
        const s = EMPTY_STATES[sKey]; if (!s) return null;
        return (
            <div style={{ textAlign: "center", padding: "32px 24px", background: "var(--surface-light)", borderRadius: 14, border: "1.5px dashed var(--border)", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 360, margin: "0 auto 18px", lineHeight: 1.5 }}>{s.desc}</div>
                {onCta && <button className="btn-add-item" onClick={onCta} style={{ fontSize: 13, padding: "8px 20px" }}>{s.cta}</button>}
            </div>
        );
    };

    /* ─── Render section content ─── */
    const renderSection = (key: SectionKey) => {
        switch (key) {
            /* ═══ BLOCO 1: IDENTIDADE ═══ */
            case "identity": return (<>
                <div className="form-group">
                    <label className="form-label">Título do Roteiro *</label>
                    <input className="form-input" value={title} onChange={e => { setTitle(e.target.value); markDirty(); }} placeholder='Ex: "Japão Autêntico: 15 dias de gastronomia, templos e cultura viva"' />
                </div>
                <datalist id="countries-list">
                    {COUNTRIES.map(c => <option key={c} value={c} />)}
                </datalist>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">País *</label>
                        <input
                            className="form-input"
                            list="countries-list"
                            value={country}
                            onChange={e => { setCountry(e.target.value); setDestination(""); markDirty(); }}
                            placeholder="Digite ou selecione o país..."
                            autoComplete="off"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cidade Principal *</label>
                        <datalist id={`cities-main-list`}>
                            {(CITIES_BY_COUNTRY[country] || []).map(c => <option key={c} value={c} />)}
                        </datalist>
                        <input
                            className="form-input"
                            list="cities-main-list"
                            value={destination}
                            onChange={e => { setDestination(e.target.value); markDirty(); }}
                            placeholder={country ? `Cidades de ${country}...` : "Digite a cidade..."}
                            autoComplete="off"
                        />
                    </div>
                </div>

                {/* Países adicionais */}
                {extraCountries.length > 0 && extraCountries.map((ec, i) => (
                    <div className="form-row" key={`ec-${i}`} style={{ alignItems: "flex-end" }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">País adicional {i + 1}</label>
                            <datalist id={`countries-extra-${i}`}>
                                {COUNTRIES.map(c => <option key={c} value={c} />)}
                            </datalist>
                            <input
                                className="form-input"
                                list={`countries-extra-${i}`}
                                value={ec}
                                onChange={e => { const u = [...extraCountries]; u[i] = e.target.value; setExtraCountries(u); markDirty(); }}
                                placeholder="Digite ou selecione..."
                                autoComplete="off"
                            />
                        </div>
                        <button className="btn-remove" style={{ marginBottom: 8 }} onClick={() => { setExtraCountries(extraCountries.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                    </div>
                ))}

                {/* Cidades adicionais */}
                {extraCities.length > 0 && extraCities.map((city, i) => {
                    // Associa ao país extra correspondente (ou ao país principal se não houver extra)
                    const relatedCountry = extraCountries[i] || country;
                    const citySuggestions = CITIES_BY_COUNTRY[relatedCountry] || [];
                    return (
                        <div className="form-row" key={`city-${i}`} style={{ alignItems: "flex-end" }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Cidade adicional {i + 1}</label>
                                <datalist id={`cities-extra-${i}`}>
                                    {citySuggestions.map(c => <option key={c} value={c} />)}
                                </datalist>
                                <input
                                    className="form-input"
                                    list={`cities-extra-${i}`}
                                    value={city}
                                    onChange={e => { const u = [...extraCities]; u[i] = e.target.value; setExtraCities(u); markDirty(); }}
                                    placeholder={relatedCountry ? `Cidades de ${relatedCountry}...` : "Digite a cidade..."}
                                    autoComplete="off"
                                />
                            </div>
                            <button className="btn-remove" style={{ marginBottom: 8 }} onClick={() => { setExtraCities(extraCities.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                    );
                })}

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <button className="btn-add-item" onClick={() => { setExtraCountries([...extraCountries, ""]); markDirty(); }}>+ País</button>
                    <button className="btn-add-item" onClick={() => { setExtraCities([...extraCities, ""]); markDirty(); }}>+ Cidade</button>
                </div>

                <div className="form-group" style={{ maxWidth: 200 }}>
                    <label className="form-label">Duração (dias) *</label>
                    <input className="form-input" type="number" value={duration} onChange={e => { setDuration(parseInt(e.target.value) || 1); markDirty(); }} min={1} />
                </div>
                <div className="form-group">
                    <label className="form-label">Sobre o Roteiro</label>
                    <textarea className="form-input" style={{ minHeight: 120 }} value={description} onChange={e => { setDescription(e.target.value); markDirty(); }} placeholder="Venda seu roteiro: que experiência única você viveu? Que dor você resolve para o viajante? Por que esse roteiro é diferente de tudo que ele encontra no Google?" />
                    <span className="form-helper">{description.length} caracteres</span>
                </div>
                <div className="form-group">
                    <label className="form-label">Estilo de Experiência (máx 3) — {travelStyles.length}/3</label>
                    <div className="editor-chip-grid">{STYLE_OPTIONS.map(s => (
                        <button key={s.key} className={`editor-chip ${travelStyles.includes(s.key) ? "active" : ""}`} onClick={() => toggleChip(travelStyles, setTravelStyles, s.key, 3)}>
                            {s.icon} {s.label}
                        </button>
                    ))}</div>
                </div>
                <div className="form-group">
                    <label className="form-label">Categorias Temáticas (mín 1, máx 5) — {categories.length}/5</label>
                    <div className="editor-chip-grid">{CATEGORY_OPTIONS.map(c => (
                        <button key={c.key} className={`editor-chip ${categories.includes(c.key) ? "active" : ""}`} onClick={() => toggleChip(categories, setCategories, c.key, 5)}>
                            {c.icon} {c.label}
                        </button>
                    ))}</div>
                </div>
            </>);

            /* ═══ BLOCO 2: COMERCIAL ═══ */
            case "commerce": return (<>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Preço *</label>
                        <input className="form-input" type="number" value={price || ""} onChange={e => { setPrice(parseFloat(e.target.value) || 0); markDirty(); }} step={0.01} min={0} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Promoção</label>
                        <input className="form-input" type="number" value={promoPrice ?? ""} onChange={e => { setPromoPrice(e.target.value ? parseFloat(e.target.value) : null); markDirty(); }} placeholder="Preço promocional" />
                    </div>
                </div>
                <div className="editor-legal-notice">⚠️ Aviso automático: &quot;Produto digital. Não inclui serviços turísticos.&quot;</div>
            </>);

            /* ═══ BLOCO 3: MÓDULOS ═══ */
            case "modules": {
                const flightHasDataM = (flightOutbound.airline || flightOutbound.originAirport || flightReturn.airline || flightReturn.originAirport);
                const MODULE_CONTENT_MAP: Record<string, boolean> = {
                    itinerario: days.some(d => d.activities?.length > 0),
                    voo:        !!flightHasDataM,
                    hospedagem: accommodations.length > 0,
                    passeios:   attractions.length > 0,
                    transporte: transports.length > 0,
                    dicas:      generalTips.length > 0,
                    restaurantes: restaurants.length > 0,
                    checklist:  checklistItems.length > 0,
                    gasto:      true,
                };
                return (<>
                    <span className="form-helper">Ative os módulos que serão incluídos no roteiro. Módulos ativos precisam ter ao menos 1 item preenchido.</span>
                    <div className="editor-module-grid">{MODULE_OPTIONS.map(m => {
                        const isActive = activeModules.includes(m.key);
                        const isEmpty = isActive && MODULE_CONTENT_MAP[m.key] === false;
                        return (
                            <div key={m.key} className={`editor-module-card ${isActive ? "active" : ""} ${isEmpty ? "editor-module-card-warn" : ""}`} onClick={() => toggleChip(activeModules, setActiveModules, m.key, 9)}>
                                <div className="editor-module-icon">{m.icon}</div>
                                <div className="editor-module-info">
                                    <span className="editor-module-label">{m.label}</span>
                                    <span className="editor-module-desc">{isEmpty ? "⚠️ Nenhum item preenchido" : m.desc}</span>
                                </div>
                                <label className="editor-toggle" onClick={e => e.stopPropagation()}><input type="checkbox" checked={isActive} readOnly /><span className="editor-toggle-track" /><span className="editor-toggle-thumb" /></label>
                            </div>
                        );
                    })}</div>
                </>);
            }

            /* ═══ DESTAQUES DA VIAGEM ═══ */
            case "highlights": return (<>
                {highlightItems.length === 0 && <EmptyState sKey="highlights" />}
                <div className="editor-tag-list" style={{ marginBottom: 12 }}>
                    {highlightItems.map((h, i) => (
                        <span key={i} className="editor-tag">
                            {h}
                            <button onClick={() => { setHighlightItems(highlightItems.filter((_, idx) => idx !== i)); markDirty(); }}>×</button>
                        </span>
                    ))}
                </div>
                <div className="editor-tag-input-row">
                    <input className="form-input" value={newHighlight} onChange={e => setNewHighlight(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newHighlight.trim()) { setHighlightItems([...highlightItems, newHighlight.trim()]); setNewHighlight(""); markDirty(); } }} placeholder="Ex: Jantar em restaurante com vista para o Monte Fuji ao entardecer..." />
                    <button className="btn-add-item" onClick={() => { if (newHighlight.trim()) { setHighlightItems([...highlightItems, newHighlight.trim()]); setNewHighlight(""); markDirty(); } }}>+</button>
                </div>
            </>);

            /* ═══ BLOCO 4: ITINERÁRIO ═══ */
            case "itinerary": return (<>
                {days.length === 0 && <EmptyState sKey="itinerary" onCta={addDay} />}
                {days.map((day, di) => (
                    <div className="editor-day-card" key={di}>
                        <div className="editor-day-header">
                            <div className="editor-day-number">
                                <div className="editor-day-badge">{di + 1}</div>
                                <input className="editor-day-title-input" value={day.title} onChange={e => updateDay(di, "title", e.target.value)} placeholder={`Título do Dia ${di + 1}`} />
                            </div>
                            <button className="btn-remove" onClick={() => removeDay(di)}>🗑️</button>
                        </div>
                        <div className="editor-day-body">
                            <div className="form-group">
                                <textarea className="form-input" style={{ minHeight: 60 }} value={day.description} onChange={e => updateDay(di, "description", e.target.value)} placeholder="O que esperar nesse dia..." />
                            </div>
                            <div className="editor-activities">
                                <div className="editor-activities-label">Atividades ({day.activities.length})</div>
                                {day.activities.map((act, ai) => (
                                    <div className="editor-activity-card" key={ai}>
                                        <div className="editor-activity-row" style={{ width: '100%', display: 'flex' }}>
                                            <input className="editor-act-time" value={act.time} onChange={e => updateActivity(di, ai, "time", e.target.value)} placeholder="09:00" />
                                            <input className="editor-act-title form-input" value={act.title} onChange={e => updateActivity(di, ai, "title", e.target.value)} placeholder="O que fazer" style={{ flex: 1 }} />
                                            <input className="editor-act-dur" value={act.duration} onChange={e => updateActivity(di, ai, "duration", e.target.value)} placeholder="2h" />
                                            <button className="btn-remove" onClick={() => removeActivity(di, ai)}>✕</button>
                                        </div>
                                        <div className="editor-activity-row" style={{ width: '100%', display: 'flex' }}>
                                            <input className="form-input" value={act.location} onChange={e => updateActivity(di, ai, "location", e.target.value)} placeholder="📍 Nome do local ou endereço..." style={{ flex: 1, width: '100%' }} />
                                        </div>
                                        <div className="editor-activity-row" style={{ width: '100%', display: 'flex' }}>
                                            <input className="form-input" value={act.mapLink || ""} onChange={e => updateActivity(di, ai, "mapLink", e.target.value)} placeholder="🔗 URL da localização (Google Maps)" style={{ flex: 1, width: '100%' }} />
                                        </div>
                                        <div className="editor-activity-row" style={{ width: '100%', display: 'flex' }}>
                                            <textarea className="form-input" value={act.tips} onChange={e => updateActivity(di, ai, "tips", e.target.value)} placeholder="💡 Dica opcional..." style={{ minHeight: 40, flex: 1, width: '100%' }} />
                                        </div>
                                    </div>
                                ))}
                                <button className="btn-add-item" onClick={() => addActivity(di)}>+ Atividade</button>
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn-add-item full-width" onClick={addDay}>+ Adicionar Dia</button>
                {days.length < 3 && <div className="editor-validation-alert">⚠️ Mínimo de 3 dias necessários para publicar ({days.length}/3)</div>}
            </>);

            /* ═══ HOSPEDAGENS ═══ */
            case "accommodations": return (<>
                {accommodations.length === 0 && <EmptyState sKey="accommodations" onCta={addAccommodation} />}
                {accommodations.map((acc, i) => (
                    <div className="editor-activity-card" key={i} style={{ marginBottom: 10 }}>
                        <div className="editor-activity-row">
                            <input className="form-input" value={acc.name} onChange={e => { const u = [...accommodations]; u[i].name = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Nome do hotel / hostel" style={{ flex: 2 }} />
                            <input className="form-input" value={acc.rating} onChange={e => { const u = [...accommodations]; u[i].rating = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Nota (ex: 8.5)" style={{ width: 90 }} />
                            <button className="btn-remove" onClick={() => { setAccommodations(accommodations.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={acc.address} onChange={e => { const u = [...accommodations]; u[i].address = e.target.value; setAccommodations(u); markDirty(); }} placeholder="📍 Nome do local ou endereço..." style={{ flex: 1 }} />
                        </div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={acc.mapLink} onChange={e => { const u = [...accommodations]; u[i].mapLink = e.target.value; setAccommodations(u); markDirty(); }} placeholder="🔗 URL da localização (Google Maps)" style={{ flex: 1 }} />
                        </div>
                        <div className="editor-activity-row" style={{ flexWrap: "wrap", gap: 6 }}>
                            <input className="form-input" type="number" value={acc.priceValue} onChange={e => { const u = [...accommodations]; u[i].priceValue = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Preço/noite" style={{ width: 110 }} />
                            <select className="form-input" value={acc.priceCurrency} onChange={e => { const u = [...accommodations]; u[i].priceCurrency = e.target.value; setAccommodations(u); markDirty(); }} style={{ width: 90 }}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                            {toBRL(acc.priceValue, acc.priceCurrency) && (
                                <span title={`Cotação: USD 1 = R$ ${formattedRate}`} style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--surface-light)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap", alignSelf: "center" }}>
                                    ≈ {toBRL(acc.priceValue, acc.priceCurrency)}
                                </span>
                            )}
                        </div>
                        <div className="editor-activity-row">
                            <textarea className="form-input" value={acc.description} onChange={e => { const u = [...accommodations]; u[i].description = e.target.value; setAccommodations(u); markDirty(); }} placeholder="O que torna essa hospedagem especial? Localização, café da manhã, atmosfera? Fale o que só quem esteve lá sabe." style={{ minHeight: 50 }} rows={2} />
                        </div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={acc.externalLink} onChange={e => { const u = [...accommodations]; u[i].externalLink = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Link externo (Booking, Hostelworld...)" />
                        </div>
                        <div className="editor-activity-row">
                            <textarea className="form-input" value={acc.tips} onChange={e => { const u = [...accommodations]; u[i].tips = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Dica: peça o quarto com vista para o jardim, chegue cedo para garantir vaga..." style={{ minHeight: 40 }} rows={2} />
                        </div>
                    </div>
                ))}
                <button className="btn-add-item" onClick={addAccommodation}>+ Hospedagem</button>
            </>);

            /* ═══ PASSEIOS & ATRAÇÕES ═══ */
            case "attractions": return (<>
                {attractions.length === 0 && <EmptyState sKey="attractions" onCta={() => { setAttractions([...attractions, { name: "", type: "", location: "", mapLink: "", description: "", ticketValue: "", ticketCurrency: "BRL", hours: "", duration: "", externalLink: "", tips: "" }]); markDirty(); }} />}
                {attractions.map((att, i) => (
                    <div className="editor-activity-card" key={i} style={{ marginBottom: 12 }}>
                        <div className="editor-activity-row">
                            <input className="form-input" value={att.name} onChange={e => { const u = [...attractions]; u[i].name = e.target.value; setAttractions(u); markDirty(); }} placeholder="Nome da atração *" style={{ flex: 2 }} />
                            <select className="form-input" value={att.type} onChange={e => { const u = [...attractions]; u[i].type = e.target.value; setAttractions(u); markDirty(); }} style={{ width: 160 }}>
                                <option value="">Tipo</option>
                                {ATTRACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button className="btn-remove" onClick={() => { setAttractions(attractions.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={att.location} onChange={e => { const u = [...attractions]; u[i].location = e.target.value; setAttractions(u); markDirty(); }} placeholder="📍 Nome do local ou endereço..." style={{ flex: 1 }} />
                        </div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={att.mapLink} onChange={e => { const u = [...attractions]; u[i].mapLink = e.target.value; setAttractions(u); markDirty(); }} placeholder="🔗 URL da localização (Google Maps)" style={{ flex: 1 }} />
                        </div>
                        <div className="editor-activity-row" style={{ flexWrap: "wrap", gap: 6 }}>
                            <input className="form-input" type="number" value={att.ticketValue} onChange={e => { const u = [...attractions]; u[i].ticketValue = e.target.value; setAttractions(u); markDirty(); }} placeholder="Preço ingresso" style={{ width: 120 }} />
                            <select className="form-input" value={att.ticketCurrency} onChange={e => { const u = [...attractions]; u[i].ticketCurrency = e.target.value; setAttractions(u); markDirty(); }} style={{ width: 90 }}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                            {toBRL(att.ticketValue, att.ticketCurrency) && (
                                <span title={`Cotação: USD 1 = R$ ${formattedRate}`} style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--surface-light)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap", alignSelf: "center" }}>
                                    ≈ {toBRL(att.ticketValue, att.ticketCurrency)}
                                </span>
                            )}
                        </div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={att.hours} onChange={e => { const u = [...attractions]; u[i].hours = e.target.value; setAttractions(u); markDirty(); }} placeholder="Horário (ex: 09:00 – 18:00)" />
                            <input className="form-input" value={att.duration} onChange={e => { const u = [...attractions]; u[i].duration = e.target.value; setAttractions(u); markDirty(); }} placeholder="Tempo recomendado (ex: 2–3h)" style={{ width: 200 }} />
                        </div>
                        <div className="editor-activity-row">
                            <textarea className="form-input" value={att.description} onChange={e => { const u = [...attractions]; u[i].description = e.target.value; setAttractions(u); markDirty(); }} placeholder="Descrição / Por que recomendar *" style={{ minHeight: 50 }} rows={2} />
                        </div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={att.externalLink} onChange={e => { const u = [...attractions]; u[i].externalLink = e.target.value; setAttractions(u); markDirty(); }} placeholder="Link externo (site oficial, TripAdvisor, Google Maps)" />
                        </div>
                        <div className="editor-activity-row">
                            <textarea className="form-input" value={att.tips} onChange={e => { const u = [...attractions]; u[i].tips = e.target.value; setAttractions(u); markDirty(); }} placeholder="💡 Dica de experiência" style={{ minHeight: 40 }} rows={2} />
                        </div>
                    </div>
                ))}
                <button className="btn-add-item" onClick={() => { setAttractions([...attractions, { name: "", type: "", location: "", mapLink: "", description: "", ticketValue: "", ticketCurrency: "BRL", hours: "", duration: "", externalLink: "", tips: "" }]); markDirty(); }}>+ Passeio / Atração</button>
            </>);

            /* ═══ TRANSPORTE ═══ */
            case "transport": return (<>
                {transports.length === 0 && <EmptyState sKey="transport" onCta={addTransport} />}
                {transports.map((t, i) => (
                    <div className="editor-activity-card" key={i} style={{ marginBottom: 10 }}>
                        <div className="editor-activity-row">
                            <input className="form-input" value={t.description} onChange={e => { const u = [...transports]; u[i].description = e.target.value; setTransports(u); markDirty(); }} placeholder="Ex: Passe de metrô semanal Paris" style={{ flex: 2 }} />
                            <button className="btn-remove" onClick={() => { setTransports(transports.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                        <div className="editor-activity-row" style={{ flexWrap: "wrap", gap: 6 }}>
                            <input className="form-input" value={t.passTypes} onChange={e => { const u = [...transports]; u[i].passTypes = e.target.value; setTransports(u); markDirty(); }} placeholder="Tipo de passe / bilhete" style={{ flex: 2, minWidth: 120 }} />
                            <input className="form-input" type="number" value={t.priceValue} onChange={e => { const u = [...transports]; u[i].priceValue = e.target.value; setTransports(u); markDirty(); }} placeholder="Preço" style={{ width: 110 }} />
                            <select className="form-input" value={t.priceCurrency} onChange={e => { const u = [...transports]; u[i].priceCurrency = e.target.value; setTransports(u); markDirty(); }} style={{ width: 90 }}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                            {toBRL(t.priceValue, t.priceCurrency) && (
                                <span title={`Cotação: USD 1 = R$ ${formattedRate}`} style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--surface-light)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap", alignSelf: "center" }}>
                                    ≈ {toBRL(t.priceValue, t.priceCurrency)}
                                </span>
                            )}
                        </div>
                        <div className="editor-activity-row">
                            <textarea className="form-input" value={t.notes} onChange={e => { const u = [...transports]; u[i].notes = e.target.value; setTransports(u); markDirty(); }} placeholder="Notas e dicas adicionais" style={{ minHeight: 50 }} rows={2} />
                        </div>
                    </div>
                ))}
                <button className="btn-add-item" onClick={addTransport}>+ Opção de Transporte</button>
            </>);

            /* ═══ DICAS EXCLUSIVAS ═══ */
            case "tips": return (<>
                {generalTips.length === 0 && <EmptyState sKey="tips" />}
                {generalTips.map((tip, i) => (
                    <div className="editor-checklist-item" key={i}>
                        <span style={{ flex: 1 }}>{tip}</span>
                        <button className="btn-remove" onClick={() => { setGeneralTips(generalTips.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                    </div>
                ))}
                <div className="editor-tag-input-row">
                    <input className="form-input" value={newGeneralTip} onChange={e => setNewGeneralTip(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newGeneralTip.trim()) { setGeneralTips([...generalTips, newGeneralTip.trim()]); setNewGeneralTip(""); markDirty(); } }} placeholder="Ex: Evite filas comprando o ingresso online com 3 dias de antecedência — economia de 2h na entrada..." />
                    <button className="btn-add-item" onClick={() => { if (newGeneralTip.trim()) { setGeneralTips([...generalTips, newGeneralTip.trim()]); setNewGeneralTip(""); markDirty(); } }}>+</button>
                </div>
            </>);

            /* ═══ RESTAURANTES ═══ */
            case "restaurants": return (<>
                {restaurants.length === 0 && <EmptyState sKey="restaurants" onCta={() => { setRestaurants([...restaurants, { name: "", cuisine: "", location: "", description: "", priceValue: "", priceCurrency: "BRL", hours: "", externalLink: "", tips: "" }]); markDirty(); }} />}
                {restaurants.map((rest, i) => (
                    <div className="editor-activity-card" key={i} style={{ marginBottom: 12 }}>
                        <div className="editor-activity-row">
                            <input className="form-input" value={rest.name} onChange={e => { const u = [...restaurants]; u[i].name = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Nome do restaurante *" style={{ flex: 2 }} />
                            <select className="form-input" value={rest.cuisine} onChange={e => { const u = [...restaurants]; u[i].cuisine = e.target.value; setRestaurants(u); markDirty(); }} style={{ width: 140 }}>
                                <option value="">Culinária</option>
                                {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button className="btn-remove" onClick={() => { setRestaurants(restaurants.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                        <div className="editor-activity-row" style={{ flexWrap: "wrap", gap: 6 }}>
                            <input className="form-input" value={rest.location} onChange={e => { const u = [...restaurants]; u[i].location = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Localização / Bairro *" style={{ flex: 2, minWidth: 120 }} />
                            <input className="form-input" type="number" value={rest.priceValue} onChange={e => { const u = [...restaurants]; u[i].priceValue = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Preço/pessoa" style={{ width: 110 }} />
                            <select className="form-input" value={rest.priceCurrency} onChange={e => { const u = [...restaurants]; u[i].priceCurrency = e.target.value; setRestaurants(u); markDirty(); }} style={{ width: 90 }}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                            {toBRL(rest.priceValue, rest.priceCurrency) && (
                                <span title={`Cotação: USD 1 = R$ ${formattedRate}`} style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--surface-light)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap", alignSelf: "center" }}>
                                    ≈ {toBRL(rest.priceValue, rest.priceCurrency)}
                                </span>
                            )}
                        </div>
                        <div className="editor-activity-row">
                            <textarea className="form-input" value={rest.description} onChange={e => { const u = [...restaurants]; u[i].description = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Descrição / Por que recomendar" style={{ minHeight: 50 }} rows={2} />
                        </div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={rest.hours} onChange={e => { const u = [...restaurants]; u[i].hours = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Horário (ex: 17:00 - 23:00)" />
                            <input className="form-input" value={rest.externalLink} onChange={e => { const u = [...restaurants]; u[i].externalLink = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Link externo (Google Maps, reserva)" />
                        </div>
                        <div className="editor-activity-row">
                            <textarea className="form-input" value={rest.tips} onChange={e => { const u = [...restaurants]; u[i].tips = e.target.value; setRestaurants(u); markDirty(); }} placeholder="💡 Dicas de experiência" style={{ minHeight: 40 }} rows={2} />
                        </div>
                    </div>
                ))}
                <button className="btn-add-item" onClick={() => { setRestaurants([...restaurants, { name: "", cuisine: "", location: "", description: "", priceValue: "", priceCurrency: "BRL", hours: "", externalLink: "", tips: "" }]); markDirty(); }}>+ Restaurante</button>
            </>);

            /* ═══ FOTOS E VÍDEOS ═══ */
            case "media": return (<>
                {!highlightPhotos.some(Boolean) && mediaUrls.length === 0 && <EmptyState sKey="media" />}

                {/* Fotos em Destaque */}
                <div className="editor-subsection" style={{ marginBottom: 24 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--text-secondary)" }}>⭐ Fotos em Destaque (máx. 3)</h4>
                    <span className="form-helper" style={{ marginBottom: 12, display: "block" }}>As 3 fotos principais que representam sua viagem. Aparecerão em destaque no roteiro.</span>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {highlightPhotos.map((preview, i) => (
                            <div key={i} style={{ position: "relative" }}>
                                <label htmlFor={`highlight-upload-${i}`} style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    width: 140, height: 140, borderRadius: 12,
                                    border: preview ? "2px solid var(--primary)" : "2px dashed var(--border)",
                                    cursor: "pointer", overflow: "hidden",
                                    backgroundColor: preview ? "transparent" : "var(--surface-light)",
                                    transition: "border-color 0.2s",
                                }}>
                                    {preview ? (
                                        <img src={preview} alt={`Destaque ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <>
                                            <span style={{ fontSize: 26, marginBottom: 6 }}>📷</span>
                                            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Destaque {i + 1}</span>
                                            <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>Clique para upload</span>
                                        </>
                                    )}
                                </label>
                                <input
                                    id={`highlight-upload-${i}`}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const url = URL.createObjectURL(file);
                                        const u = [...highlightPhotos];
                                        u[i] = url;
                                        setHighlightPhotos(u);
                                        markDirty();
                                    }}
                                />
                                {preview && (
                                    <button
                                        onClick={() => { const u = [...highlightPhotos]; u[i] = ""; setHighlightPhotos(u); markDirty(); }}
                                        style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                                    >✕</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Galeria da Viagem */}
                <div className="editor-subsection">
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--text-secondary)" }}>📸 Galeria da Viagem (máx. 10)</h4>
                    <span className="form-helper" style={{ marginBottom: 12, display: "block" }}>Fotos e vídeos adicionais da sua experiência. Cole a URL ou link direto do arquivo.</span>
                    {mediaUrls.map((url, i) => (
                        <div className="editor-tag-input-row" key={i} style={{ marginBottom: 6 }}>
                            <input className="form-input" value={url} onChange={e => { const u = [...mediaUrls]; u[i] = e.target.value; setMediaUrls(u); markDirty(); }} placeholder="URL da foto ou vídeo..." />
                            {url && <img src={url} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                            <button className="btn-remove" onClick={() => { setMediaUrls(mediaUrls.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                    ))}
                    {mediaUrls.length < 10 && (
                        <button className="btn-add-item" onClick={() => { setMediaUrls([...mediaUrls, ""]); markDirty(); }}>
                            + Foto / Vídeo ({mediaUrls.length}/10)
                        </button>
                    )}
                    {mediaUrls.length >= 10 && <span className="form-helper" style={{ color: "var(--warning)" }}>Limite de 10 arquivos atingido.</span>}
                </div>
            </>);

            /* ═══ BLOCO 5: GASTO (auto-calculado) ═══ */
            case "spending": {
                const calcCat = (items: Array<{ v: string; c: string }>) => {
                    const byCur: Record<string, number[]> = {};
                    items.forEach(({ v, c }) => { const n = parseFloat(v); if (!isNaN(n) && n > 0) { if (!byCur[c]) byCur[c] = []; byCur[c].push(n); } });
                    return Object.entries(byCur).map(([cur, vals]) => ({ cur, min: Math.min(...vals), max: vals.reduce((s, x) => s + x, 0) }));
                };
                const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || code;
                const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                const spendingCats = [
                    { icon: "🏨", label: "Hospedagem", items: accommodations.map(a => ({ v: a.priceValue, c: a.priceCurrency })) },
                    { icon: "🚌", label: "Transporte", items: transports.map(t => ({ v: t.priceValue, c: t.priceCurrency })) },
                    { icon: "🍽️", label: "Alimentação", items: restaurants.map(r => ({ v: r.priceValue, c: r.priceCurrency })) },
                    { icon: "🎫", label: "Atrações", items: attractions.map(a => ({ v: a.ticketValue, c: a.ticketCurrency })) },
                ];
                const hasData = spendingCats.some(cat => cat.items.some(i => parseFloat(i.v) > 0));
                return (<>
                    <div className="form-helper" style={{ marginBottom: 16, padding: "10px 14px", background: "var(--surface-light)", borderRadius: 8, borderLeft: "3px solid var(--primary)" }}>
                        💡 <strong>Cálculo automático</strong> — os valores são gerados a partir dos preços preenchidos nos módulos de Hospedagens, Transporte, Restaurantes e Atrações. Mínimo = item mais barato; Máximo = soma de todos os itens da categoria.
                    </div>
                    {!hasData ? (
                        <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text-secondary)" }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
                            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>Nenhum valor preenchido ainda</div>
                            <div style={{ fontSize: 13 }}>Preencha os campos de preço nos módulos de Hospedagens, Transporte, Restaurantes e Atrações para ver a estimativa aqui.</div>
                        </div>
                    ) : (
                        <div className="editor-breakdown-list">
                            {spendingCats.map(cat => {
                                const results = calcCat(cat.items);
                                if (results.length === 0) return null;
                                return results.map(({ cur, min, max }) => (
                                    <div key={`${cat.label}-${cur}`} style={{ display: "flex", alignItems: "center", padding: "12px 14px", background: "var(--surface-light)", borderRadius: 8, marginBottom: 8, gap: 12 }}>
                                        <span style={{ fontSize: 20, width: 28 }}>{cat.icon}</span>
                                        <span style={{ flex: 2, fontWeight: 500, fontSize: 14 }}>{cat.label}</span>
                                        <span style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--border)", borderRadius: 4, padding: "2px 6px", fontFamily: "monospace" }}>{cur}</span>
                                        <div style={{ flex: 1, textAlign: "right" }}>
                                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>Mínimo (item mais barato)</div>
                                            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--success)" }}>{getCurrencySymbol(cur)} {fmt(min)}</span>
                                        </div>
                                        <div style={{ flex: 1, textAlign: "right" }}>
                                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>Máximo (soma total)</div>
                                            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)" }}>{getCurrencySymbol(cur)} {fmt(max)}</span>
                                        </div>
                                    </div>
                                ));
                            })}
                        </div>
                    )}
                </>);
            }

            /* ═══ BLOCO 6: MEU VOO ═══ */
            case "flight": {
                const renderFlightLeg = (leg: FlightLeg, setLeg: (l: FlightLeg) => void, label: string, icon: string) => (
                    <div className="editor-activity-card" style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--text-secondary)" }}>{icon} {label}</div>
                        <div className="editor-activity-row">
                            <input className="form-input" value={leg.airline} onChange={e => { setLeg({ ...leg, airline: e.target.value }); markDirty(); }} placeholder="Companhia aérea (ex: LATAM, Gol, Air France)" style={{ flex: 1 }} />
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Aeroporto de Origem</label>
                                <input className="form-input" value={leg.originAirport} onChange={e => { setLeg({ ...leg, originAirport: e.target.value }); markDirty(); }} placeholder="Ex: GRU — São Paulo/Guarulhos" />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Aeroporto de Destino</label>
                                <input className="form-input" value={leg.destinationAirport} onChange={e => { setLeg({ ...leg, destinationAirport: e.target.value }); markDirty(); }} placeholder="Ex: CDG — Paris/Charles de Gaulle" />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Data de Saída</label>
                                <input className="form-input" type="date" value={leg.departureDate} onChange={e => { setLeg({ ...leg, departureDate: e.target.value }); markDirty(); }} />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Data de Chegada</label>
                                <input className="form-input" type="date" value={leg.arrivalDate} onChange={e => { setLeg({ ...leg, arrivalDate: e.target.value }); markDirty(); }} />
                            </div>
                            <div className="form-group" style={{ flex: 0, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Paradas</label>
                                <input className="form-input" type="number" value={leg.stops} onChange={e => { setLeg({ ...leg, stops: parseInt(e.target.value) || 0 }); markDirty(); }} min={0} style={{ width: 80 }} />
                            </div>
                        </div>
                    </div>
                );
                return (<>
                    {!flightOutbound.airline && !flightReturn.airline && <EmptyState sKey="flight" />}

                    {/* Preço único ida + volta */}
                    <div className="editor-activity-card" style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💳 Valor da Passagem (Ida + Volta)</div>
                        <div className="editor-activity-row">
                            <input className="form-input" type="number" value={flightTotalPrice} onChange={e => { setFlightTotalPrice(e.target.value); markDirty(); }} placeholder="Valor total pago pela passagem" style={{ flex: 1 }} />
                            <select className="form-input" value={flightPriceCurrency} onChange={e => { setFlightPriceCurrency(e.target.value); markDirty(); }} style={{ width: 90 }}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                            {toBRL(flightTotalPrice, flightPriceCurrency) && (
                                <span title={`Cotação: USD 1 = R$ ${formattedRate}`} style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--surface-light)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap", alignSelf: "center" }}>
                                    ≈ {toBRL(flightTotalPrice, flightPriceCurrency)}
                                </span>
                            )}
                        </div>
                    </div>

                    {renderFlightLeg(flightOutbound, setFlightOutbound, "Voo de Ida", "🛫")}
                    {renderFlightLeg(flightReturn, setFlightReturn, "Voo de Volta", "🛬")}

                    <h4 style={{ margin: "20px 0 8px", fontSize: 14 }}>💬 Dicas sobre o Voo</h4>
                    {flightTips.map((tip, i) => (
                        <div className="editor-checklist-item" key={i}>
                            <span style={{ flex: 1 }}>{tip}</span>
                            <button className="btn-remove" onClick={() => { setFlightTips(flightTips.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                    ))}
                    <div className="editor-tag-input-row">
                        <input className="form-input" value={newFlightTip} onChange={e => setNewFlightTip(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newFlightTip.trim()) { setFlightTips([...flightTips, newFlightTip.trim()]); setNewFlightTip(""); markDirty(); } }} placeholder="Ex: Voo noturno é a melhor opção — dormi no avião e cheguei descansado de manhã" />
                        <button className="btn-add-item" onClick={() => { if (newFlightTip.trim()) { setFlightTips([...flightTips, newFlightTip.trim()]); setNewFlightTip(""); markDirty(); } }}>+</button>
                    </div>
                </>);
            }

            /* ═══ BLOCO 7: CHECKLIST ═══ */
            case "checklist": return (<>
                {checklistItems.length === 0 && <EmptyState sKey="checklist" />}
                <div className="editor-checklist-add">
                    <select className="form-input" value={newCheckCat} onChange={e => setNewCheckCat(e.target.value)} style={{ width: 140 }}>
                        {CHECKLIST_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className="form-input" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCheckItem.trim()) { setChecklistItems([...checklistItems, { category: newCheckCat, item: newCheckItem.trim(), isDefault: true }]); setNewCheckItem(""); markDirty(); } }} placeholder="Novo item..." />
                    <button className="btn-add-item" onClick={() => { if (newCheckItem.trim()) { setChecklistItems([...checklistItems, { category: newCheckCat, item: newCheckItem.trim(), isDefault: true }]); setNewCheckItem(""); markDirty(); } }}>+</button>
                </div>
                {CHECKLIST_CATS.map(cat => {
                    const items = checklistItems.filter(c => c.category === cat); if (items.length === 0) return null; return (
                        <div key={cat} style={{ marginBottom: 12 }}>
                            <div className="form-label" style={{ textTransform: "capitalize" }}>{cat}</div>
                            {items.map((item, i) => {
                                const gi = checklistItems.indexOf(item); return (
                                    <div className="editor-checklist-item" key={i}>
                                        <span>{item.item}</span>
                                        <button className="btn-remove" onClick={() => { setChecklistItems(checklistItems.filter((_, idx) => idx !== gi)); markDirty(); }}>✕</button>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

            </>);

            /* ═══ BLOCO 7: PÓS-COMPRA ═══ */
            case "postpurchase": return (<>
                {[
                    { label: "📥 Download offline", desc: "Usuário pode baixar para usar sem internet", val: offlineDownload, set: setOfflineDownload },
                    { label: "📄 Exportar PDF", desc: "Permitir exportar como PDF", val: allowPdf, set: setAllowPdf },
                    { label: "🔗 Compartilhar", desc: "Permitir compartilhar com amigos", val: allowShare, set: setAllowShare },
                    { label: "♾️ Acesso vitalício", desc: "Sem prazo de expiração", val: lifetimeAccess, set: setLifetimeAccess },
                ].map(t => (
                    <div className="editor-toggle-row" key={t.label}>
                        <div className="editor-toggle-info"><span className="editor-toggle-label">{t.label}</span><span className="editor-toggle-desc">{t.desc}</span></div>
                        <label className="editor-toggle"><input type="checkbox" checked={t.val} onChange={e => { t.set(e.target.checked); markDirty(); }} /><span className="editor-toggle-track" /><span className="editor-toggle-thumb" /></label>
                    </div>
                ))}
            </>);

            default: return <p>Seção em construção...</p>;
        }
    };

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    return (
        <div className="editor-page">
            {toast && <div className={`editor-toast ${toast.type}`}>{toast.msg}</div>}

            {/* Header */}
            <div className="editor-header">
                <div className="editor-header-left">
                    <Link href="/dashboard/roteiros" className="btn-back">← Voltar</Link>
                    <h1 className="editor-title">{isNew ? "Novo Roteiro" : title || "Editar Roteiro"}</h1>
                </div>
                <div className="editor-header-right">
                    {/* Ring gauge — Força do Roteiro */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
                            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="4" />
                            <circle cx="22" cy="22" r="18" fill="none" stroke={qualityColor} strokeWidth="4"
                                strokeDasharray={`${(qualityScore / 100) * 113} 113`}
                                strokeLinecap="round"
                                transform="rotate(-90 22 22)"
                                style={{ transition: "stroke-dasharray 0.5s ease" }}
                            />
                            <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill={qualityColor}>{qualityScore}%</text>
                        </svg>
                        <div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.2 }}>Força do Roteiro</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: qualityColor, lineHeight: 1.3 }}>{qualityLabel}</div>
                        </div>
                    </div>
                    {saveStatus === "saving" && <span className="editor-dirty-badge" style={{ color: "var(--text-secondary)" }}>☁️ Salvando...</span>}
                    {saveStatus === "saved"  && <span className="editor-dirty-badge" style={{ color: "#22c55e" }}>✅ Salvo</span>}
                    {saveStatus === "idle" && dirty && <span className="editor-dirty-badge">● Não salvo</span>}
                    <button className="editor-save-btn" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Publicar Roteiro"}</button>
                </div>
            </div>

            {/* Body: sidebar + sections */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "0 20px 48px" }}>

                {/* ── Sticky Sidebar Nav ── */}
                <nav style={{
                    position: "sticky", top: 76, width: 216, flexShrink: 0,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 14, padding: "10px 6px",
                    maxHeight: "calc(100vh - 96px)", overflowY: "auto",
                    alignSelf: "flex-start",
                }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "var(--text-secondary)", padding: "2px 10px 8px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                        SEÇÕES DO ROTEIRO
                    </div>
                    {SECTIONS.filter(sec => {
                        const req = SECTION_MODULE_MAP[sec.key];
                        return !req || activeModules.includes(req);
                    }).map(sec => {
                        const complete = isSectionComplete(sec.key);
                        const isActive = activeSection === sec.key;
                        return (
                            <button key={sec.key} onClick={() => {
                                if (!openSections.has(sec.key)) toggleSection(sec.key);
                                setActiveSection(sec.key);
                                sectionRefs.current[sec.key]?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }} style={{
                                display: "flex", alignItems: "center", gap: 7, width: "100%",
                                textAlign: "left", padding: "7px 10px", borderRadius: 9, border: "none",
                                background: isActive ? "var(--primary-light, rgba(0,180,120,0.10))" : "transparent",
                                color: isActive ? "var(--primary)" : "var(--text-primary)",
                                cursor: "pointer", fontSize: 12.5,
                                fontWeight: isActive ? 600 : 400, transition: "all 0.15s",
                            }}>
                                <span style={{ fontSize: 13, flexShrink: 0 }}>{sec.icon}</span>
                                <span style={{ flex: 1, lineHeight: 1.3 }}>{sec.title}</span>
                                <span style={{
                                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                                    background: complete ? "#22c55e" : "var(--border)",
                                    boxShadow: complete ? "0 0 5px #22c55e66" : "none",
                                    transition: "background 0.3s",
                                }} />
                            </button>
                        );
                    })}
                </nav>

                {/* ── Main sections ── */}
                <div className="editor-sections" style={{ flex: 1, minWidth: 0 }}>
                    {SECTIONS.filter(sec => {
                        const requiredModule = SECTION_MODULE_MAP[sec.key];
                        if (!requiredModule) return true;
                        return activeModules.includes(requiredModule);
                    }).map(sec => (
                        <div key={sec.key} ref={el => { sectionRefs.current[sec.key] = el; }} className={`editor-section ${openSections.has(sec.key) ? "open" : ""} ${activeSection === sec.key ? "active" : ""}`}>
                            <button className="editor-section-header" onClick={() => { toggleSection(sec.key); setActiveSection(sec.key); }}>
                                <span className="editor-section-icon">{sec.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span className="editor-section-title">{sec.title}</span>
                                        {sec.required
                                            ? <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "rgba(249,115,22,0.10)", borderRadius: 4, padding: "1px 6px" }}>Obrigatório</span>
                                            : <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", background: "var(--surface-light)", borderRadius: 4, padding: "1px 6px" }}>Opcional</span>
                                        }
                                    </div>
                                    {sec.subtitle && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, fontWeight: 400, lineHeight: 1.4 }}>{sec.subtitle}</div>}
                                </div>
                                <span className={`editor-section-status ${isSectionComplete(sec.key) ? "complete" : "pending"}`}>{isSectionComplete(sec.key) ? "✓" : "·"}</span>
                                <span className="editor-section-arrow">{openSections.has(sec.key) ? "▲" : "▼"}</span>
                            </button>
                            {openSections.has(sec.key) && <div className="editor-section-body">{renderSection(sec.key)}</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
