"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo, use } from "react";
import {
    Target, DollarSign, Package, Star, CalendarDays, CreditCard, Plane, Building2,
    Ticket, Bus, Lightbulb, Utensils, ListChecks, Camera, Crown, Wallet, Backpack,
    Users, Heart, Mountain, Landmark, ChefHat, Leaf, Dumbbell, Ship, Globe, Sparkles,
    Sun, BookOpen, Music, ArrowLeft, Trash2, AlertTriangle, CheckCircle2,
    PlaneTakeoff, PlaneLanding, MessageSquare, BarChart3, Tag, ImageIcon,
    CalendarCheck, Layers, ShieldCheck, Upload, FileCheck, RefreshCw, Check,
    ChevronDown, ChevronUp, TrendingUp, MapPin, Clock, ExternalLink, Receipt, Wifi,
} from "lucide-react";
import { getItineraryById, createItinerary, updateItinerary, uploadFile, uploadFiles } from "../../../../lib/api";
import {
    acceptAttributeFor,
    validateUploadFile,
    prepareUploadFile,
    uploadHint,
} from "../../../../lib/uploadContexts";
import MoneyInput from "../../../../components/MoneyInput";
import TimeInput from "../../../../components/TimeInput";
import { useDollarRate } from "../../../../hooks/useDollarRate";
import ItineraryPreview from "../../../../components/ItineraryPreview";

function isVideoUploadUrl(url: string): boolean {
    return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url || "");
}

function hasActivityContent(activity: any): boolean {
    return !!(
        String(activity?.title || "").trim()
        || String(activity?.description || "").trim()
        || String(activity?.location || "").trim()
        || String(activity?.mapLink || "").trim()
    );
}

function normalizeDayForSubmit(day: any, index: number) {
    return {
        ...day,
        dayNumber: index + 1,
        activities: Array.isArray(day?.activities)
            ? day.activities.filter(hasActivityContent)
            : [],
    };
}

/* ─── Constants ─── */
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
    "Egito": ["Cairo","Alexandria","Luxor","Aswan","Hurghada","Sharm el-Sheikh","Giza"],
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
    "Israel": ["Tel Aviv","Jerusalém","Haifa","Eilat","Nazaré","Mar Morto"],
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
    "República Dominicana": ["Santo Domingo","Punta Cana","Puerto Plata","La Romana","Samaná","Jarabacoa"],
    "Jamaica": ["Kingston","Montego Bay","Negril","Ocho Rios","Port Antonio"],
    "Tanzânia": ["Dar es Salaam","Zanzibar","Arusha","Moshi","Serengeti","Ngorongoro"],
    "Quênia": ["Nairóbi","Mombasa","Nakuru","Kisumu","Masai Mara","Amboseli"],
    "Etiópia": ["Adis Abeba","Lalibela","Axum","Gondar","Bahir Dar"],
    "Gana": ["Acra","Kumasi","Cape Coast","Tamale"],
    "Senegal": ["Dakar","Saint-Louis","Ziguinchor","Touba"],
    "Nigéria": ["Lagos","Abuja","Kano","Ibadan","Port Harcourt"],
};

const STYLE_OPTIONS = [
    { key: "economico", Icon: Wallet,    label: "Econômico" },
    { key: "moderado",  Icon: BarChart3, label: "Moderado" },
    { key: "luxo",      Icon: Crown,     label: "Luxo" },
];
const CATEGORY_OPTIONS = [
    { key: "cultura",     Icon: Landmark, label: "Cultura" },
    { key: "gastronomia", Icon: ChefHat,  label: "Gastronomia" },
    { key: "natureza",    Icon: Leaf,     label: "Natureza" },
    { key: "esportes",    Icon: Dumbbell, label: "Esportes" },
    { key: "cruzeiros",   Icon: Ship,     label: "Cruzeiros" },
    { key: "eurotrip",    Icon: Globe,    label: "Eurotrip" },
    { key: "relax",       Icon: Sparkles, label: "Relax" },
    { key: "praia",       Icon: Sun,      label: "Praia" },
    { key: "historico",   Icon: BookOpen, label: "Histórico" },
    { key: "festivais",   Icon: Music,    label: "Festivais" },
    { key: "mochilao",   Icon: Backpack,  label: "Mochilão" },
    { key: "familia",    Icon: Users,     label: "Família" },
    { key: "romantico",  Icon: Heart,     label: "Romântico" },
    { key: "aventura",   Icon: Mountain,  label: "Aventura" },
];
const MODULE_OPTIONS = [
    { key: "itinerario",   Icon: CalendarDays, label: "Itinerário por dia",   desc: "Roteiro dia a dia completo" },
    { key: "voo",          Icon: Plane,        label: "Meu voo",              desc: "Sugestões de voo" },
    { key: "hospedagem",   Icon: Building2,    label: "Hospedagens",          desc: "Hotéis e hospedagens sugeridas" },
    { key: "passeios",     Icon: Ticket,       label: "Passeios & Atrações",  desc: "Atrações e passeios imperdíveis" },
    { key: "transporte",   Icon: Bus,          label: "Transporte",           desc: "Dicas de locomoção" },
    { key: "dicas",        Icon: Lightbulb,    label: "Dicas exclusivas",     desc: "Dicas do criador" },
    { key: "restaurantes", Icon: Utensils,     label: "Restaurantes",         desc: "Onde comer" },
    { key: "checklist",    Icon: ListChecks,   label: "Checklist interativo", desc: "O que levar e preparar" },
    { key: "gasto",        Icon: CreditCard,   label: "Estimativa de gastos por pessoa",  desc: "Quanto você vai gastar" },
];
const CHECKLIST_CATS = ["documentos", "mala", "pre-viagem", "finanças", "apps úteis", "outros"];
type SectionKey = "identity" | "commerce" | "modules" | "highlights" | "itinerary" | "spending" | "flight" | "accommodations" | "attractions" | "transport" | "tips" | "restaurants" | "checklist" | "postpurchase" | "media";
interface SectionDef { key: SectionKey; icon: string; title: string; subtitle?: string; required?: boolean; }
const SECTIONS: SectionDef[] = [
    { key: "identity",      icon: "🎯", title: "Identidade e Indexação",    subtitle: "Título, destino e categorias — o que o viajante vê primeiro na vitrine",            required: true },
    { key: "commerce",      icon: "💰", title: "Estrutura Comercial",        subtitle: "Defina o preço do seu roteiro",                                                        required: true },
    { key: "modules",       icon: "📦", title: "Módulos do Roteiro",         subtitle: "O que está incluído — o comprador decide com base nos módulos ativos",               required: true },
    { key: "highlights",    icon: "⭐", title: "Destaques da Viagem",        subtitle: "Os momentos únicos que diferenciam seu roteiro dos demais",                          required: false },
    { key: "itinerary",     icon: "🗓️", title: "Itinerário Estruturado",    subtitle: "O coração do roteiro — dia a dia detalhado que o viajante vai seguir",              required: true },
    { key: "spending",      icon: "💳", title: "Estimativa de Gastos por Pessoa", subtitle: "Preenchida manualmente para apresentar os custos reais de cada módulo aos viajantes - aumenta a conversão" },
    { key: "flight",        icon: "✈️", title: "Meu Voo",                   subtitle: "Sugestões de voo para o destino — aumenta a confiança do comprador" },
    { key: "accommodations",icon: "🏨", title: "Hospedagens",                subtitle: "Hotéis e hospedagens recomendadas — item mais consultado antes da compra" },
    { key: "attractions",   icon: "🎫", title: "Passeios & Atrações",        subtitle: "Passeios imperdíveis com horários, preços e dicas de experiência" },
    { key: "transport",     icon: "🚌", title: "Transporte",                 subtitle: "Como se locomover no destino — metrô, passes e dicas de mobilidade" },
    { key: "tips",          icon: "💡", title: "Dicas Exclusivas",           subtitle: "Segredos e dicas práticas que só quem foi sabe — seu grande diferencial" },
    { key: "restaurants",   icon: "🍴", title: "Restaurantes & Gastronomia", subtitle: "Onde comer bem — experiências gastronômicas autênticas e locais" },
    { key: "checklist",     icon: "✅", title: "Checklist",                  subtitle: "Lista de preparação que o viajante usa antes e durante a viagem" },
    { key: "media",         icon: "📸", title: "Fotos e Vídeos",             subtitle: "Imagens reais da sua viagem — fotos autênticas aumentam a conversão" },
];
/* ─── Empty state definitions per section ─── */
const EMPTY_STATES: Partial<Record<SectionKey, { icon: string; title: string; desc: string; cta: string }>> = {
    highlights:     { icon: "⭐", title: "Quais foram os momentos inesquecíveis?", desc: "Liste as experiências únicas que só seu roteiro oferece — é o que chama atenção na vitrine.", cta: "+ Adicionar destaque" },
    itinerary:      { icon: "🗓️", title: "Construa o roteiro dia a dia", desc: "Um itinerário detalhado é o principal argumento de venda. Viajantes decidem com base nisso.", cta: "+ Adicionar primeiro dia" },
    flight:         { icon: "✈️", title: "Como foi o voo para esse destino?", desc: "Sugestões de voo com preços reais ajudam o viajante a planejar o orçamento completo.", cta: "+ Informar voo" },
    accommodations: { icon: "🏨", title: "Que hospedagem você recomendaria a um amigo?", desc: "Hospedagens bem descritas aumentam 3x a confiança de compra. Fale o que só quem esteve lá sabe.", cta: "+ Adicionar hospedagem" },
    attractions:    { icon: "🎫", title: "Quais atrações são absolutamente imperdíveis?", desc: "Passeios com preços, horários e dicas exclusivas são os mais valorizados pelos compradores.", cta: "+ Adicionar atração" },
    transport:      { icon: "🚌", title: "Como você se locomoveu no destino?", desc: "Dicas de transporte real economizam horas de pesquisa — e justificam o preço do seu roteiro.", cta: "+ Adicionar transporte" },
    tips:           { icon: "💡", title: "Quais segredos só você sabe?", desc: "Dicas exclusivas são seu maior diferencial. Viajantes pagam mais por roteiros com insights locais reais. Mínimo de 2 dicas exclusivas.", cta: "+ Adicionar dica" },
    restaurants:    { icon: "🍴", title: "Onde você comeu melhor nessa viagem?", desc: "Restaurantes autênticos e fora do circuito turístico são o que viajantes mais buscam.", cta: "+ Adicionar restaurante" },
    checklist:      { icon: "✅", title: "O que o viajante precisa levar e preparar?", desc: "Um checklist completo aumenta a satisfação pós-compra e reduz dúvidas de suporte. Adicione no mínimo 5 itens.", cta: "+ Adicionar item" },
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
// Tipos de custo (transparência graduada). Mantemos os imports leves
// para evitar tree-shaking issues em arquivos client-only do Next.
type CostDisclosureType = "not_informed" | "estimated" | "verified";
type CostProofStatus = "none" | "uploaded" | "pending_review" | "approved" | "rejected";
interface CostProofFile { url: string; name?: string; mimeType?: string; size?: number; uploadedAt?: string; }
interface ModuleCostInfo {
    amount?: string | null;
    currency?: string;
    disclosureType: CostDisclosureType;
    notes?: string;
    proofFiles?: CostProofFile[];
    proofStatus?: CostProofStatus;
    updatedAt?: string;
}
interface ModuleSpending { value: string; currency: string; }

interface Accommodation { name: string; address: string; mapLink: string; description: string; nights: string; rating: string; externalLink: string; tips: string; startDate: string; endDate: string; spending?: ModuleSpending; cost?: ModuleCostInfo; }
interface Transport { description: string; passTypes: string; notes: string; startDate: string; endDate: string; spending?: ModuleSpending; cost?: ModuleCostInfo; }
interface ChecklistItem { category: string; item: string; isDefault: boolean; }
interface BreakdownItem { category: string; min: string; max: string; currency: string; }
interface RestaurantItem { name: string; cuisine: string; location: string; description: string; hours: string; hoursStart: string; externalLink: string; tips: string; startDate: string; endDate: string; spending?: ModuleSpending; cost?: ModuleCostInfo; }
interface AttractionItem { name: string; type: string; location: string; mapLink: string; description: string; hours: string; duration: string; externalLink: string; tips: string; startDate: string; endDate: string; price?: string; spending?: ModuleSpending; cost?: ModuleCostInfo; }
interface ExtraSpendingItem { id: string; category: string; title: string; description: string; value: string; currency: string; cost?: ModuleCostInfo; }
interface SpendingEntry { moduleKey: string; label: string; icon: string; priceValue: string; priceCurrency: string; receiptUrl: string; originCity?: string; }
const SPENDING_MODULE_MAP: Record<string, { label: string; icon: string }> = {
    voo: { label: "Passagem Aérea", icon: "✈️" },
    hospedagem: { label: "Hospedagem", icon: "🏨" },
    passeios: { label: "Passeios & Atrações", icon: "🎫" },
    transporte: { label: "Transporte Local", icon: "🚌" },
    restaurantes: { label: "Alimentação", icon: "🍽️" },
};
const ATTRACTION_TYPES = ["Museu", "Monumento", "Parque", "Tour", "Mirante", "Igreja", "Palácio", "Praia", "Trilha", "Show / Espetáculo", "Parque Temático", "Mercado", "Passeio de Barco", "Outro"];
interface FlightLeg { airline: string; originCity: string; originAirport: string; destinationAirport: string; departureDate: string; arrivalDate: string; stops: number; }
const EMPTY_FLIGHT_LEG: FlightLeg = { airline: "", originCity: "", originAirport: "", destinationAirport: "", departureDate: "", arrivalDate: "", stops: 0 };
const CUISINE_OPTIONS = ["Ramen", "Sushi", "Tempura", "Izakaya", "Yakitori", "Italiana", "Francesa", "Brasileira", "Mexicana", "Indiana", "Tailandesa", "Fast Food", "Café", "Padaria", "Bistrô", "Fine Dining", "Street Food", "Vegetariana", "Frutos do Mar", "Outro"];

const SPENDING_CATS = ["🏨 Hospedagem", "🍽️ Alimentação", "🚌 Transporte", "🎫 Atrações", "🎁 Extras"];
const CURRENCIES = [
    { code: "AED", symbol: "د.إ", name: "Dirham dos Emirados", emoji: "🇦🇪" },
    { code: "ARS", symbol: "$", name: "Peso Argentino", emoji: "🇦🇷" },
    { code: "AUD", symbol: "A$", name: "Dólar Australiano", emoji: "🇦🇺" },
    { code: "BOB", symbol: "Bs", name: "Boliviano", emoji: "🇧🇴" },
    { code: "BRL", symbol: "R$", name: "Real Brasileiro", emoji: "🇧🇷" },
    { code: "CAD", symbol: "C$", name: "Dólar Canadense", emoji: "🇨🇦" },
    { code: "CHF", symbol: "Fr", name: "Franco Suíço", emoji: "🇨🇭" },
    { code: "CLP", symbol: "$", name: "Peso Chileno", emoji: "🇨🇱" },
    { code: "CNY", symbol: "¥", name: "Yuan Chinês", emoji: "🇨🇳" },
    { code: "COP", symbol: "$", name: "Peso Colombiano", emoji: "🇨🇴" },
    { code: "CRC", symbol: "₡", name: "Colón Costarriquenho", emoji: "🇨🇷" },
    { code: "CUP", symbol: "$", name: "Peso Cubano", emoji: "🇨🇺" },
    { code: "DOP", symbol: "RD$", name: "Peso Dominicano", emoji: "🇩🇴" },
    { code: "EGP", symbol: "£", name: "Libra Egípcia", emoji: "🇪🇬" },
    { code: "EUR", symbol: "€", name: "Euro", emoji: "🇪🇺" },
    { code: "GBP", symbol: "£", name: "Libra Esterlina", emoji: "🇬🇧" },
    { code: "GTQ", symbol: "Q", name: "Quetzal Guatemalteco", emoji: "🇬🇹" },
    { code: "IDR", symbol: "Rp", name: "Rúpia Indonésia", emoji: "🇮🇩" },
    { code: "INR", symbol: "₹", name: "Rúpia Indiana", emoji: "🇮🇳" },
    { code: "JPY", symbol: "¥", name: "Iene Japonês", emoji: "🇯🇵" },
    { code: "KES", symbol: "KSh", name: "Xelim Queniano", emoji: "🇰🇪" },
    { code: "MAD", symbol: "د.م.", name: "Dirham Marroquino", emoji: "🇲🇦" },
    { code: "MXN", symbol: "$", name: "Peso Mexicano", emoji: "🇲🇽" },
    { code: "MYR", symbol: "RM", name: "Ringgit Malaio", emoji: "🇲🇾" },
    { code: "NZD", symbol: "NZ$", name: "Dólar Neozelandês", emoji: "🇳🇿" },
    { code: "NOK", symbol: "kr", name: "Coroa Norueguesa", emoji: "🇳🇴" },
    { code: "PEN", symbol: "S/", name: "Sol Peruano", emoji: "🇵🇪" },
    { code: "PHP", symbol: "₱", name: "Peso Filipino", emoji: "🇵🇭" },
    { code: "PYG", symbol: "Gs", name: "Guarani Paraguaio", emoji: "🇵🇾" },
    { code: "SGD", symbol: "S$", name: "Dólar de Singapura", emoji: "🇸🇬" },
    { code: "THB", symbol: "฿", name: "Baht Tailandês", emoji: "🇹🇭" },
    { code: "TRY", symbol: "₺", name: "Lira Turca", emoji: "🇹🇷" },
    { code: "USD", symbol: "$", name: "Dólar Americano", emoji: "🇺🇸" },
    { code: "UYU", symbol: "$U", name: "Peso Uruguaio", emoji: "🇺🇾" },
    { code: "VND", symbol: "₫", name: "Dong Vietnamita", emoji: "🇻🇳" },
    { code: "ZAR", symbol: "R", name: "Rand Sul-africano", emoji: "🇿🇦" },
];

function getDurationLabel(d: number) {
    if (d <= 3) return "Fim de semana";
    if (d <= 7) return "1 semana";
    if (d <= 15) return "15 dias";
    return "+20 dias";
}

/** Extrai número e unidade de uma string de duração ("2h", "30min", "1.5h" etc.) */
function parseDuration(val: string): { num: string; unit: "h" | "min" | "d" } {
    if (!val) return { num: "", unit: "h" };
    const dMatch = val.match(/^([\d.,]+)\s*d/i);
    if (dMatch) return { num: dMatch[1], unit: "d" };
    const minMatch = val.match(/^([\d.,]+)\s*m/i);
    if (minMatch) return { num: minMatch[1], unit: "min" };
    const hMatch = val.match(/^([\d.,]+)/);
    return { num: hMatch?.[1] || "", unit: "h" };
}

/* ─── Blocos do quality score ───────────────────────────────────────────
 *
 *  Bloco                         Máx
 *  ─────────────────────────── ──────
 *  1. Identidade & Indexação      22
 *  2. Comercial                   10
 *  3. Imagens de capa              8
 *  4. Itinerário dia a dia        20
 *  5. Módulos de conteúdo         20
 *  6. Estimativa de gasto          5
 *  7. Confiança & Qualidade       15
 *                               ─────
 *  Total                         100
 *
 *  Quanto maior o score, maior a chance de aparecer na Home
 *  e entre os primeiros das buscas no aplicativo VAMO.
 * ─────────────────────────────────────────────────────────────────────── */
function calcQualityBlocks(data: any): { label: string; earned: number; max: number; criteria: { text: string; done: boolean }[] }[] {
    // ─── Bloco 1: Identidade & Indexação (20 pts) ───
    // Lê cidade/país do array locations (como a UI salva) com fallback nos campos legados
    const loc0 = (data.locations ?? [])[0];
    const city    = (loc0?.cities?.[0] || data.destination || "").trim();
    const country = (loc0?.country     || data.country     || "").trim();

    const b1Criteria = [
        { text: "Título do roteiro preenchido",        done: !!(data.title?.trim()),                                pts: 5 },
        { text: "Cidade de destino informada",         done: !!city,                                               pts: 3 },
        { text: "País de destino informado",           done: !!country,                                            pts: 2 },
        { text: "Descrição preenchida",                done: !!(data.description?.trim()),                         pts: 2 },
        { text: "Descrição com 150+ caracteres",       done: (data.description?.trim().length ?? 0) >= 150,       pts: 2 },
        { text: "Estilo de viagem selecionado (1+)",   done: (data.travelStyles?.length ?? 0) >= 1,               pts: 3 },
        { text: "Categoria temática selecionada (1+)", done: (data.categories?.length ?? 0) >= 1,                 pts: 3 },
    ];
    const b1 = b1Criteria.reduce((s, c) => s + (c.done ? c.pts : 0), 0);

    // ─── Bloco 2: Preço & Comercial (10 pts) ───
    // Binário: preço definido = 10/10. Sem critérios legados.
    const priceOk = (data.price ?? 0) > 0;
    const b2Criteria = [
        { text: "Preço de venda definido", done: priceOk, pts: 10 },
    ];
    const b2 = priceOk ? 10 : 0;

    // ─── Bloco 3: Fotos de capa (8 pts) ───
    const coverPhotos = (data.highlightPhotos ?? []).filter(Boolean);
    const galleryImgs = (data.images ?? []).filter(Boolean);
    const totalImgs   = new Set([...coverPhotos, ...galleryImgs]).size;
    const b3Criteria = [
        { text: "Pelo menos 1 foto de capa adicionada", done: totalImgs >= 1, pts: 5 },
        { text: "3 fotos de capa (ideal)",              done: totalImgs >= 3, pts: 3 },
    ];
    const b3 = b3Criteria.reduce((s, c) => s + (c.done ? c.pts : 0), 0);

    // ─── Bloco 4: Roteiro dia a dia (20 pts) — score baseado na duração real ───
    const days: any[]  = data.days ?? [];
    const duration     = Math.max(data.duration ?? 1, 1); // duração definida em Identidade
    const daysCreated  = days.length;
    const allDaysDone  = daysCreated >= duration; // preencheu todos os dias da viagem
    const totalActs    = days.reduce((acc: number, d: any) => acc + (d.activities?.length ?? 0), 0);
    const avgActs      = daysCreated > 0 ? totalActs / daysCreated : 0;
    const daysWithDesc = days.filter((d: any) => d.description?.trim()).length;
    const actsWithTime = days.some((d: any) => d.activities?.some((a: any) => a.time?.trim()));

    const daysLabel = allDaysDone
        ? `${daysCreated}/${duration} dias preenchidos ✓`
        : `${daysCreated}/${duration} dias preenchidos`;

    const b4Criteria = [
        { text: "Ao menos 1 dia de roteiro criado",                                    done: daysCreated >= 1,             pts: 4 },
        { text: daysLabel,                                                              done: allDaysDone,                  pts: 6 },
        { text: "Todos os dias com descrição",                                         done: daysCreated > 0 && daysWithDesc === daysCreated, pts: 4 },
        { text: "Ao menos 1 atividade por dia (média)",                               done: avgActs >= 1,                  pts: 4 },
        { text: "Horários definidos nas atividades",                                   done: actsWithTime,                  pts: 2 },
    ];
    const b4 = b4Criteria.reduce((s, c) => s + (c.done ? c.pts : 0), 0);

    // ─── Bloco 5: Módulos de conteúdo (15 pts) ───
    const b5Criteria = [
        { text: "Hospedagem recomendada adicionada",   done: (data.accommodations?.length ?? 0) >= 1,                      pts: 3 },
        { text: "Passeio/atração adicionado",          done: (data.attractions?.length ?? 0) >= 1,                         pts: 3 },
        { text: "Restaurante recomendado adicionado",  done: (data.restaurants?.length ?? 0) >= 1,                         pts: 3 },
        { text: "Dicas de transporte local",           done: (data.transports?.length ?? 0) >= 1,                          pts: 3 },
        { text: "Dicas gerais de viagem (1+)",         done: (data.generalTips ?? []).filter((t: string) => t?.trim()).length >= 1, pts: 2 },
        { text: "Checklist de viagem adicionado",      done: (data.checklistItems?.length ?? 0) >= 1,                      pts: 1 },
    ];
    const b5 = b5Criteria.reduce((s, c) => s + (c.done ? c.pts : 0), 0);

    // ─── Bloco 6: Estimativa de gastos por pessoa (5 pts) ───
    const b6Criteria = [
        { text: "Estimativa de gastos preenchida", done: !!(data.hasSpending), pts: 5 },
    ];
    const b6 = b6Criteria.reduce((s, c) => s + (c.done ? c.pts : 0), 0);

    // ─── Bloco 7: Confiança & Qualidade (12 pts) ───
    // Ajuste: total geral = 20+10+8+20+15+5+12 = 90 → com cap de 100 é seguro
    const b7Criteria = [
        { text: "Comprovante de viagem enviado",        done: !!(data.travelProofUrl?.trim()),                       pts: 7 },
        { text: "Destaques do roteiro preenchidos (2+)", done: (data.highlights ?? []).filter(Boolean).length >= 2,  pts: 5 },
    ];
    const b7 = b7Criteria.reduce((s, c) => s + (c.done ? c.pts : 0), 0);

    return [
        { label: "Identidade & Indexação",          earned: b1, max: 20, criteria: b1Criteria },
        { label: "Preço & Comercial",               earned: b2, max: 10, criteria: b2Criteria },
        { label: "Fotos de capa",                   earned: b3, max: 8,  criteria: b3Criteria },
        { label: "Roteiro dia a dia",               earned: b4, max: 20, criteria: b4Criteria },
        { label: "Módulos de conteúdo",             earned: b5, max: 15, criteria: b5Criteria },
        { label: "Estimativa de gastos por pessoa", earned: b6, max: 5,  criteria: b6Criteria },
        { label: "Confiança & Qualidade",           earned: b7, max: 12, criteria: b7Criteria },
    ];
}
function calcQuality(data: any): number {
    return Math.min(
        calcQualityBlocks(data).reduce((s, b) => s + b.earned, 0),
        100
    );
}



/* ─── Section icon map (Lucide SVG — replaces emoji strings) ─── */
const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
    identity:       <Target size={15} strokeWidth={2} />,
    commerce:       <DollarSign size={15} strokeWidth={2} />,
    modules:        <Package size={15} strokeWidth={2} />,
    highlights:     <Star size={15} strokeWidth={2} />,
    itinerary:      <CalendarDays size={15} strokeWidth={2} />,
    spending:       <CreditCard size={15} strokeWidth={2} />,
    flight:         <Plane size={15} strokeWidth={2} />,
    accommodations: <Building2 size={15} strokeWidth={2} />,
    attractions:    <Ticket size={15} strokeWidth={2} />,
    transport:      <Bus size={15} strokeWidth={2} />,
    tips:           <Lightbulb size={15} strokeWidth={2} />,
    restaurants:    <Utensils size={15} strokeWidth={2} />,
    checklist:      <ListChecks size={15} strokeWidth={2} />,
    postpurchase:   <Package size={15} strokeWidth={2} />,
    media:          <Camera size={15} strokeWidth={2} />,
};

/* ─── Empty-state icon map (Lucide SVG) ─── */
const EMPTY_STATE_ICONS: Partial<Record<SectionKey, React.ReactNode>> = {
    highlights:     <Star size={38} strokeWidth={1.2} />,
    itinerary:      <CalendarDays size={38} strokeWidth={1.2} />,
    flight:         <Plane size={38} strokeWidth={1.2} />,
    accommodations: <Building2 size={38} strokeWidth={1.2} />,
    attractions:    <Ticket size={38} strokeWidth={1.2} />,
    transport:      <Bus size={38} strokeWidth={1.2} />,
    tips:           <Lightbulb size={38} strokeWidth={1.2} />,
    restaurants:    <Utensils size={38} strokeWidth={1.2} />,
    checklist:      <ListChecks size={38} strokeWidth={1.2} />,
    media:          <Camera size={38} strokeWidth={1.2} />,
};

/* ─── Quality block icon map (Lucide SVG) ─── */
const QUALITY_ICONS: Record<string, React.ReactNode> = {
    "Identidade & Indexação": <Tag size={12} strokeWidth={2} />,
    "Preço & Comercial":      <DollarSign size={12} strokeWidth={2} />,
    "Fotos de capa":          <ImageIcon size={12} strokeWidth={2} />,
    "Roteiro dia a dia":      <CalendarCheck size={12} strokeWidth={2} />,
    "Módulos de conteúdo":    <Layers size={12} strokeWidth={2} />,
    "Estimativa de gastos por pessoa":    <Receipt size={12} strokeWidth={2} />,
    "Confiança & Qualidade":  <ShieldCheck size={12} strokeWidth={2} />,
};

/* ═══════════════════════════════════════════ */
export default function RoteiroEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const isNew = id === "new" || id === "novo";
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ─── Cotações (definidas pelo admin em /admin/conversao) ─── */
    const { dollarRate, formattedRate, rates } = useDollarRate();
    /** Converte um valor em qualquer moeda para número na moeda base do mercado (AUD) usando as taxas do admin. */
    const convertToBaseNumber = (value: string | number, currency: string): number => {
        const n = typeof value === "number" ? value : parseFloat(value);
        if (isNaN(n) || n <= 0) return 0;
        if (currency === "AUD") return n;
        const rate = rates[currency];
        if (rate === undefined || rate <= 0) return 0;
        return n * rate;
    };
    const toBase = (value: string, currency: string): string | null => {
        const aud = convertToBaseNumber(value, currency);
        if (aud <= 0 || currency === "AUD") return null;
        return aud.toLocaleString("pt-BR", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
    };

    /* ─── UI state ─── */
    const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["identity"]));
    const [activeSection, setActiveSection] = useState<SectionKey>("identity");
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [dirty, setDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [itineraryStatus, setItineraryStatus] = useState<"DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE">("DRAFT");
    const [approvalNote, setApprovalNote] = useState<string | null>(null);

    /* ─── Bloco 1: Identidade ─── */
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [destination, setDestination] = useState("");
    const [country, setCountry] = useState("");
    const [locations, setLocations] = useState<{ country: string; cities: string[] }[]>([]);
    const [duration, setDuration] = useState(1);
    const [description, setDescription] = useState("");
    const [travelStyles, setTravelStyles] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [travelProofUrl, setTravelProofUrl] = useState("");
    const [productType, setProductType] = useState("DIGITAL");

    /* ─── Bloco 2: Comercial ─── */
    const [price, setPrice] = useState(0);
    const [currency, setCurrency] = useState("AUD");
    const [promoPrice, setPromoPrice] = useState<number | null>(null);
    const [installments, setInstallments] = useState<number | null>(null);
    const [immediateAccess, setImmediateAccess] = useState(true);
    const [lifetimeAccess, setLifetimeAccess] = useState(true);
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
    const [flightTips, setFlightTips] = useState<string[]>([]);
    const [newFlightTip, setNewFlightTip] = useState("");
    const [flightTotalPrice, setFlightTotalPrice] = useState("");
    const [flightPriceCurrency, setFlightPriceCurrency] = useState("AUD");
    /** Round-trip de cost/spending do módulo voo (preenchidos via mobile). */
    const [flightSpending, setFlightSpending] = useState<ModuleSpending | undefined>(undefined);
    const [flightCost, setFlightCost] = useState<ModuleCostInfo | undefined>(undefined);
    /** Gastos extras do módulo "Gastos Extras" (preenchidos via mobile). */
    const [extraSpendingItems, setExtraSpendingItems] = useState<ExtraSpendingItem[]>([]);

    /* ─── Bloco 7: Checklist ─── */
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [newCheckItem, setNewCheckItem] = useState("");
    const [newCheckCat, setNewCheckCat] = useState("documentos");

    /* ─── Bloco 8: Pós-compra ─── */
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

    /* ─── Gastos Manuais ─── */
    const [spendingEntries, setSpendingEntries] = useState<SpendingEntry[]>([]);

    /* ─── Fotos & Vídeos ─── */
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [highlightPhotos, setHighlightPhotos] = useState<string[]>(['', '', '']);

    /* ─── Preview Data ─── */
    // Rating começa em 0 — não usar 5 como default. Roteiro sem avaliações
    // exibe "Novo" no preview (via getRouteRatingDisplay), não nota falsa.
    const [rating, setRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);

    /* ─── Estimated Spending (computed from manual entries for preview) ─── */
    /* Total na moeda base (AUD) é calculado dinamicamente usando as taxas atuais do admin (hook useDollarRate).
       Este valor NÃO é persistido no banco — apenas os manualEntries com moeda original são salvos. */
    const estimatedSpending = useMemo(() => {
        const total = spendingEntries.reduce((s, e) => s + convertToBaseNumber(e.priceValue, e.priceCurrency), 0);
        if (total === 0) return { min: 0, max: 0, manualEntries: [] };
        return { min: Math.round(total), max: Math.round(total), manualEntries: spendingEntries };
    }, [spendingEntries, rates]);

    /* ─── Inclusions dinâmicas para a prévia ─── */
    const previewInclusions = useMemo(() => {
        const list: string[] = [];
        if (days.length > 0)
            list.push(`📅 Roteiro dia a dia · ${days.length} dia${days.length > 1 ? "s" : ""}`);
        if (accommodations.length > 0)
            list.push(`🏨 ${accommodations.length} hospedagem${accommodations.length > 1 ? "s" : ""} recomendada${accommodations.length > 1 ? "s" : ""}`);
        if (attractions.length > 0)
            list.push(`🎫 ${attractions.length} passeio${attractions.length > 1 ? "s" : ""} e atração${attractions.length > 1 ? "ões" : ""}`);
        if (restaurants.length > 0)
            list.push(`🍽️ ${restaurants.length} restaurante${restaurants.length > 1 ? "s" : ""} recomendado${restaurants.length > 1 ? "s" : ""}`);
        if (transports.length > 0)
            list.push(`🚌 Dicas de transporte local`);
        if (generalTips.some(t => t.trim()))
            list.push(`💡 Dicas exclusivas de viagem`);
        if (flightOutbound.airline)
            list.push(`✈️ Informações de voo`);
        if (checklistItems.length > 0)
            list.push(`✅ Checklist interativo de viagem`);
        // Inclusions manuais adicionadas pelo criador
        inclusionItems.filter(Boolean).forEach(inc => { if (!list.some(l => l.includes(inc))) list.push(inc); });
        return list;
    }, [days, accommodations, attractions, restaurants, transports, generalTips, flightOutbound, checklistItems, inclusionItems]);

    /* ─── Quality score ─── */
    const hasSpending = spendingEntries.some(e => parseFloat(e.priceValue) > 0);
    const _scoreData = {
        title, subtitle, destination, country, description, duration, price,
        travelStyles, categories, highlights: highlightItems, inclusions: inclusionItems,
        days, hasSpending, promoPrice, installments,
        images, highlightPhotos, travelProofUrl,
        locations, // ← array estruturado de locais (cidade/país real)
        accommodations, restaurants, attractions, transports, generalTips,
        checklistItems,
    };
    const qualityScore = calcQuality(_scoreData);
    const qualityBlocks = calcQualityBlocks(_scoreData);
    const qualityLabel = qualityScore >= 80 ? "Pronto para publicar" : qualityScore >= 60 ? "Quase lá" : qualityScore >= 30 ? "Em construção" : "Rascunho inicial";
    const qualityColor = qualityScore >= 80 ? "#22c55e" : qualityScore >= 60 ? "#f59e0b" : qualityScore >= 30 ? "#f97316" : "#94a3b8";

    /* ─── Toast auto-dismiss ─── */
    useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

    /* ─── Mark dirty ─── */
    const markDirty = useCallback(() => setDirty(true), []);

    /* ─── Load data ─── */
    useEffect(() => {
        if (isNew) {
            setTitle(""); setSubtitle("");
            setDestination(""); setCountry("");
            setLocations([]);
            setDuration(1); setDescription("");
            setTravelStyles([]); setCategories([]);
            setProductType("DIGITAL");
            setPrice(0); setCurrency("AUD");
            setPromoPrice(null); setInstallments(null);
            setImmediateAccess(true); setLifetimeAccess(true);
            setFeatured(false); setActiveModules([]);
            setHighlightItems([]); setInclusionItems([]);
            setImages([""]); setAllowShare(true);
            setRating(0); setReviewCount(0);
            setItineraryStatus("DRAFT"); setApprovalNote(null);
            setTravelProofUrl("");
            setDays([]); setAccommodations([]); setTransports([]);
            setChecklistItems([]);
            setLoading(false);
            return;
        }
        getItineraryById(id)
            .then((data: any) => {
                setTitle(data.title || ""); setSubtitle(data.subtitle || "");
                setDestination(data.destination || ""); setCountry(data.country || "");
                // Load structured locations (new format), or convert legacy flat arrays
                if (data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
                    setLocations(data.locations);
                } else if ((data.extraCountries?.length || 0) > 0 || (data.extraCities?.length || 0) > 0) {
                    const maxLen = Math.max((data.extraCountries || []).length, (data.extraCities || []).length);
                    const locs: { country: string; cities: string[] }[] = [];
                    for (let i = 0; i < maxLen; i++) {
                        const c = (data.extraCountries || [])[i] || "";
                        const d = (data.extraCities || [])[i];
                        locs.push({ country: c, cities: d ? [d] : [] });
                    }
                    setLocations(locs);
                } else {
                    setLocations([]);
                }
                setDuration(data.duration || 1); setDescription(data.description || "");
                setTravelStyles(data.travelStyles || []); setCategories(data.categories || []);
                setProductType(data.productType || "DIGITAL");
                setPrice(data.price || 0); setCurrency(data.currency || "AUD");
                setPromoPrice(data.promoPrice || null); setInstallments(data.installments || null);
                setImmediateAccess(data.immediateAccess ?? true); setLifetimeAccess(data.lifetimeAccess ?? true);
                setFeatured(data.featured || false);
                setActiveModules(data.activeModules || []);
                setHighlightItems(data.highlights || []); setInclusionItems(data.inclusions || []);
                setImages(Array.isArray(data.images) ? data.images.map((img: any) => typeof img === "string" ? img : img.url) : [""]);
                setAllowShare(data.allowShare ?? true);
                setRating(data.rating || 0); setReviewCount(data.reviewCount || 0);
                setItineraryStatus((data.status || "DRAFT") as "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE");
                setApprovalNote(data.approvalNote || null);
                setTravelProofUrl(data.travelProofUrl || "");
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
                setAccommodations((data.accommodations || []).map((a: any) => {
                    const totalPrice = a.totalPrice || "";
                    const nights = a.nights || "1";
                    const total = parseFloat(totalPrice);
                    const n = parseInt(nights) || 1;
                    const calcedPrice = (totalPrice && total > 0) ? (total / n).toFixed(2) : (a.priceValue || a.priceRange || "");
                    return {
                        name: a.name || "", address: a.address || a.neighborhood || "", mapLink: a.mapLink || "",
                        description: a.description || "",
                        nights,
                        rating: a.rating?.toString() || "", externalLink: a.externalLink || "", tips: a.tips || "",
                        startDate: a.startDate || "", endDate: a.endDate || "",
                        // Preserva campos de custo vindos do mobile/backend (round-trip safety)
                        spending: a.spending,
                        cost: a.cost,
                    };
                }));
                // Transports
                setTransports((data.transports || []).map((t: any) => ({
                    description: t.description || "", passTypes: t.passTypes || "",
                    notes: t.notes || "",
                    startDate: t.startDate || "", endDate: t.endDate || "",
                    spending: t.spending,
                    cost: t.cost,
                })));
                // Checklists
                setChecklistItems((data.checklists || []).map((c: any) => ({
                    category: c.category || "documentos", item: c.item || "", isDefault: c.isDefault ?? true,
                })));
                // Flight
                if (data.flightInfo) {
                    const mapLeg = (l: any): FlightLeg => ({
                        airline: l?.airline || "",
                        originCity: l?.originCity || "",
                        originAirport: l?.originAirport || "",
                        destinationAirport: l?.destinationAirport || "",
                        departureDate: l?.departureDate || l?.departure || "",
                        arrivalDate: l?.arrivalDate || l?.arrival || "",
                        stops: l?.stops || 0,
                    });
                    setFlightOutbound(mapLeg(data.flightInfo.outbound));
                    setFlightReturn(mapLeg(data.flightInfo.return));
                    setFlightTotalPrice(data.flightInfo.totalPrice || "");
                    setFlightPriceCurrency(data.flightInfo.priceCurrency || "AUD");
                    setFlightTips(data.flightInfo.tips || []);
                    // Round-trip: preserva cost/spending do módulo voo (criados via mobile)
                    setFlightSpending(data.flightInfo.spending || undefined);
                    setFlightCost(data.flightInfo.cost || undefined);
                }
                // Extra spending items (módulo "Gastos Extras" — preenchido via mobile)
                setExtraSpendingItems((data.extraSpendingItems || []) as ExtraSpendingItem[]);

                // Restaurants
                setRestaurants((data.restaurants || []).map((r: any) => {
                    const hoursRaw: string = r.hoursStart ? "" : (r.hours || "");
                    const parts = hoursRaw.split(/[-–—]+/).map((s: string) => s.trim());
                    return {
                        name: r.name || "", cuisine: r.cuisine || "", location: r.location || "",
                        description: r.description || "",
                        hours: r.hours || "",
                        hoursStart: r.hoursStart || parts[0] || "",
                        externalLink: r.externalLink || "", tips: r.tips || "",
                        startDate: r.startDate || "", endDate: r.endDate || "",
                        spending: r.spending,
                        cost: r.cost,
                    };
                }));
                // General Tips
                setGeneralTips(data.generalTips || []);
                // Attractions
                setAttractions((data.attractions || []).map((a: any) => {
                    // Parse saved "hours" string (e.g. "09:00 – 18:00") into start/end
                    const hoursRaw: string = a.hoursStart ? "" : (a.hours || "");
                    const parts = hoursRaw.split(/[-–—]+/).map((s: string) => s.trim());
                    return {
                        name: a.name || "", type: a.type || "", location: a.location || "", mapLink: a.mapLink || "",
                        description: a.description || "",
                        hours: a.hours || "",
                        duration: a.duration || "1h",
                        externalLink: a.externalLink || "", tips: a.tips || "",
                        startDate: a.startDate || "", endDate: a.endDate || "",
                        price: a.price,
                        spending: a.spending,
                        cost: a.cost,
                    };
                }));
                // Spending entries
                if (data.estimatedSpending?.manualEntries) {
                    setSpendingEntries(data.estimatedSpending.manualEntries.map((e: any) => ({
                        moduleKey: e.moduleKey || "", label: e.label || "", icon: e.icon || "",
                        priceValue: e.priceValue || "", priceCurrency: e.priceCurrency || "AUD",
                        receiptUrl: e.receiptUrl || "",
                    })));
                }
                // Media
                setMediaUrls(data.mediaUrls || []);
                setHighlightPhotos(data.highlightPhotos && data.highlightPhotos.length === 3 ? data.highlightPhotos : ['', '', '']);
            })
            .catch((err) => setToast({ msg: `Erro ao carregar: ${err.message}`, type: "error" }))
            .finally(() => setLoading(false));
    }, [id, isNew]);

    /* ─── Build payload ─── */
    const buildPayload = useCallback(() => {
        /* IMPORTANTE: os valores convertidos a AUD NÃO são salvos no banco. Só persistimos
           as entradas originais (valor + moeda escolhida pelo criador). A conversão para a
           moeda preferida do cliente acontece em tempo de exibição, usando a cotação atual
           do admin (useDollarRate → rates). */
        const validEntries = spendingEntries.filter(e => parseFloat(e.priceValue) > 0);
        const mainCountry = locations[0]?.country || "";
        const mainDestination = locations[0]?.cities[0] || "";
        return {
            title, subtitle, destination: mainDestination, country: mainCountry, locations, description,
            price: price.toString(), currency, duration: duration.toString(), featured,
            travelStyles, categories, productType, activeModules,
            promoPrice: promoPrice?.toString() || undefined,
            installments: installments?.toString() || undefined,
            immediateAccess, lifetimeAccess, allowShare,
            highlights: highlightItems, inclusions: inclusionItems,
            estimatedSpending: { manualEntries: validEntries },
            rating: rating.toString(), reviewCount: reviewCount.toString(),
            images: images.filter(Boolean),
            travelProofUrl,
            days: days.map(normalizeDayForSubmit),
            accommodations, transports, checklists: checklistItems,
            flightInfo: (flightOutbound.airline || flightReturn.airline) ? {
                outbound: flightOutbound,
                return: flightReturn,
                tips: flightTips.filter(t => t.trim()),
                // Round-trip: preserva os dados de custo do voo (set via mobile)
                spending: flightSpending,
                cost: flightCost,
            } : undefined,
            restaurants: restaurants.filter(r => r.name.trim()).map(r => ({
                ...r,
                hours: [r.hoursStart].filter(Boolean).join(" – ") || r.hours,
            })),
            generalTips: generalTips.filter(t => t.trim()),
            attractions: attractions.filter(a => a.name.trim()),
            extraSpendingItems,
            mediaUrls: mediaUrls.filter(Boolean),
            highlightPhotos: highlightPhotos.filter(Boolean),
        };
    }, [title, subtitle, destination, country, locations, description, price, currency, duration, featured, travelStyles, categories, productType, activeModules, promoPrice, installments, immediateAccess, lifetimeAccess, allowShare, highlightItems, inclusionItems, images, days, accommodations, transports, checklistItems, flightOutbound, flightReturn, flightTips, flightSpending, flightCost, restaurants, generalTips, attractions, extraSpendingItems, mediaUrls, highlightPhotos, rating, reviewCount, spendingEntries]);

    /* ─── Save ─── */
    const handleSave = async () => {
        // Derive destination/country from structured `locations` (the form only edits this).
        const firstLocation = locations[0];
        const effectiveCountry     = (firstLocation?.country || country || "").trim();
        const effectiveDestination = (firstLocation?.cities?.[0] || destination || "").trim();

        // Validation
        if (!title.trim() || !effectiveDestination || !effectiveCountry) {
            setToast({ msg: "Preencha título, destino (cidade) e país", type: "error" });
            return;
        }
        if (price <= 0) { setToast({ msg: "Defina um preço válido", type: "error" }); return; }
        if (categories.length < 1) { setToast({ msg: "Selecione pelo menos 1 categoria", type: "error" }); return; }
        if (!travelProofUrl) { setToast({ msg: "Anexe o arquivo de Comprovação de Viagem", type: "error" }); return; }
        if (days.length < Math.max(1, duration)) { setToast({ msg: `Cadastre ${Math.max(1, duration)} dia${duration > 1 ? "s" : ""} de roteiro`, type: "error" }); return; }
        if (activeModules.length < 1) { setToast({ msg: "Ative pelo menos 1 módulo", type: "error" }); return; }

        // Módulos ativos devem ter conteúdo preenchido
        // REGRA: mesma lógica usada em isSectionComplete e no score — single source of truth
        const flightHasData = !!(flightOutbound.originCity && flightOutbound.departureDate && flightOutbound.arrivalDate && flightReturn.originCity && flightReturn.departureDate && flightReturn.arrivalDate);
        const MODULE_CONTENT: Record<string, boolean> = {
            itinerario:  days.length > 0 && days.every(d => d.description?.trim() !== "" && d.activities?.length > 0 && d.activities.every((a: any) => a.title?.trim() !== "")),
            voo:         flightHasData,
            hospedagem:  accommodations.length > 0 && accommodations.every(a => a.name?.trim() !== ""),
            passeios:    attractions.length > 0 && attractions.every(a => a.name?.trim() !== ""),        // ← só nome obrigatório
            transporte:  transports.length > 0 && transports.every(t => t.description?.trim() !== "" && t.passTypes?.trim() !== ""),
            dicas:       generalTips.filter(t => t.trim() !== "").length >= 2,                           // ← mín. 2 dicas
            restaurantes: restaurants.length > 0 && restaurants.every(r => r.name?.trim() !== "" && r.location?.trim() !== ""),
            checklist:   checklistItems.filter(c => c.item?.trim() !== "").length >= 5,                   // ← mín. 5 itens
            gasto:       spendingEntries.length > 0 && spendingEntries.every(e => {
                if (parseFloat(e.priceValue) <= 0) return false;
                if (e.moduleKey === "voo" && !e.originCity?.trim()) return false;
                return true;
            }),
        };
        const MODULE_LABELS: Record<string, string> = {
            itinerario: "Itinerário por dia", voo: "Meu voo", hospedagem: "Hospedagens",
            passeios: "Passeios & Atrações", transporte: "Transporte", dicas: "Dicas exclusivas",
            restaurantes: "Restaurantes", checklist: "Checklist interativo", gasto: "Estimativa de gastos por pessoa",
        };

        // Debug: loga o estado de cada módulo ativo para facilitar diagnóstico
        // eslint-disable-next-line no-console
        console.log("[Validação] Estado dos módulos ativos:", activeModules.map(m => ({
            modulo: m, valido: MODULE_CONTENT[m],
            dados: m === "passeios" ? { total: attractions.length, itens: attractions.map(a => a.name) }
                 : m === "hospedagem" ? { total: accommodations.length }
                 : m === "restaurantes" ? { total: restaurants.length }
                 : m === "dicas" ? { total: generalTips.filter(t => t.trim()).length }
                 : undefined,
        })));

        const moduloVazio = activeModules.find(m => MODULE_CONTENT[m] === false);
        if (moduloVazio) {
            setToast({ msg: `Preencha pelo menos 1 item em "${MODULE_LABELS[moduloVazio] || moduloVazio}"`, type: "error" });
            return;
        }

        setSaving(true);
        try {
            const payload = { ...buildPayload(), status: "PENDING_REVIEW" };
            // Help debugging in dev — surface the exact body we send
            // eslint-disable-next-line no-console
            console.log("[Save] Submitting itinerary payload:", payload);
            if (isNew) {
                const created = await createItinerary(payload);
                setToast({ msg: "✅ Roteiro enviado para aprovação! A equipe VAMO irá analisar em até 48h.", type: "success" });
                window.location.href = `/dashboard/roteiro/${created.id}`;
            } else {
                await updateItinerary(id, payload);
                // Se estava rejeitado e re-enviou, volta para PENDING_REVIEW
                if (itineraryStatus === "REJECTED" || itineraryStatus === "DRAFT") {
                    setItineraryStatus("PENDING_REVIEW");
                    setApprovalNote(null);
                }
                setToast({ msg: "✅ Roteiro re-enviado para aprovação!", type: "success" });
                setDirty(false);
            }
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error("[Save] Failed to submit itinerary:", err);
            const raw = err?.message || "Erro desconhecido";
            // Tradução de mensagens comuns do backend para algo mais útil ao usuário
            const friendly =
                raw.includes("token") ? "Não foi possível enviar (auth). Reinicie o backend para aplicar as últimas mudanças e tente novamente."
                : raw.toLowerCase().includes("missing required fields") ? `Faltam campos obrigatórios: ${raw.replace(/.*Missing required fields[:]?\s*/i, "")}`
                : raw.toLowerCase().includes("creator") ? "Nenhuma conta de roteirista disponível no banco. Rode o seed do backend (npm run db:seed)."
                : raw.toLowerCase().includes("failed to fetch") ? "Não foi possível conectar ao backend. Verifique se ele está rodando em http://localhost:3333."
                : raw;
            setToast({ msg: friendly, type: "error" });
        } finally { setSaving(false); }
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
        // Identity uses the structured `locations` array if filled, else falls back to legacy fields.
        const idLoc = locations[0];
        const idDest = (idLoc?.cities?.[0] || destination || "").trim();
        const idCtry = (idLoc?.country     || country     || "").trim();
        switch (key) {
            case "identity": return !!(title.trim() && idDest && idCtry && categories.length >= 1 && travelProofUrl);
            case "commerce": return price > 0;
            case "modules": return activeModules.length >= 1;
            case "itinerary": return days.length >= 3 && days.every(d => d.description?.trim() !== "" && d.activities?.length > 0 && d.activities.every(a => a.title?.trim() !== ""));
            case "spending": return spendingEntries.length > 0 && spendingEntries.every(e => {
                if (parseFloat(e.priceValue) <= 0) return false;
                if (e.moduleKey === "voo" && !e.originCity?.trim()) return false;
                return true;
            });
            case "flight": return !!(flightOutbound.originCity && flightOutbound.departureDate && flightOutbound.arrivalDate && flightReturn.originCity && flightReturn.departureDate && flightReturn.arrivalDate);
            case "highlights": return highlightItems.length > 0;
            case "accommodations": return accommodations.length > 0 && accommodations.every(a => a.name?.trim() !== "");
            case "attractions": return attractions.length > 0 && attractions.every(a => a.name?.trim() !== "");
            case "transport": return transports.length > 0 && transports.every(t => t.description?.trim() !== "" && t.passTypes?.trim() !== "");
            case "tips": return generalTips.filter(t => t.trim() !== "").length >= 2;
            case "restaurants": return restaurants.length > 0 && restaurants.every(r => r.name?.trim() !== "" && r.location?.trim() !== "");
            case "media": return mediaUrls.length > 0 || highlightPhotos.some(Boolean);
            case "checklist": return checklistItems.filter(c => c.item?.trim() !== "").length >= 5;
            case "postpurchase": return true;
            default: return false;
        }
    }, [title, destination, country, locations, travelProofUrl, categories, price, activeModules, days, checklistItems, flightOutbound, flightReturn, accommodations, attractions, transports, generalTips, restaurants, mediaUrls, highlightPhotos, highlightItems, spendingEntries]);

    /* ─── Chip toggle ─── */
    const toggleChip = (arr: string[], set: (v: string[]) => void, key: string, max: number) => {
        markDirty();
        if (arr.includes(key)) set(arr.filter(k => k !== key));
        else if (arr.length < max) set([...arr, key]);
    };

    /* ─── Data helpers ─── */
    const addDay = () => { markDirty(); setDays([...days, { dayNumber: days.length + 1, title: "", summary: "", description: "", activities: [] }]); };
    const removeDay = (i: number) => { markDirty(); setDays(days.filter((_, idx) => idx !== i)); };
    const updateDay = (i: number, f: string, v: any) => { markDirty(); const u = [...days]; u[i] = { ...u[i], [f]: v }; setDays(u); };
    const addActivity = (di: number) => { markDirty(); const u = [...days]; u[di].activities = [...u[di].activities, { title: "", description: "", time: "", duration: "", location: "", mapLink: "", type: "activity", icon: "📍", tips: "", category: "" }]; setDays(u); };
    const updateActivity = (di: number, ai: number, f: string, v: any) => { markDirty(); const u = [...days]; u[di].activities[ai] = { ...u[di].activities[ai], [f]: v }; setDays(u); };
    const removeActivity = (di: number, ai: number) => { markDirty(); const u = [...days]; u[di].activities.splice(ai, 1); setDays([...u]); };
    const addAccommodation = () => { markDirty(); setAccommodations([...accommodations, { name: "", address: "", mapLink: "", description: "", nights: "1", rating: "", externalLink: "", tips: "", startDate: "", endDate: "" }]); };
    const addTransport = () => { markDirty(); setTransports([...transports, { description: "", passTypes: "", notes: "", startDate: "", endDate: "" }]); };

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
        const icon = EMPTY_STATE_ICONS[sKey];
        return (
            <div style={{ textAlign: "center", padding: "36px 28px", background: "linear-gradient(135deg, rgba(40,201,191,0.04), rgba(40,201,191,0.01))", borderRadius: 16, border: "1.5px dashed rgba(40,201,191,0.3)", marginBottom: 16 }}>
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: "rgba(40,201,191,0.65)" }}>
                    {icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "var(--secondary)" }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 380, margin: "0 auto 20px", lineHeight: 1.6 }}>{s.desc}</div>
                {onCta && (
                    <button className="btn-add-item" onClick={onCta} style={{ fontSize: 13, padding: "9px 22px", background: "linear-gradient(135deg, #28C9BF, #1FA89F)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>
                        {s.cta}
                    </button>
                )}
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

                <div className="form-row" style={{ display: "none" }}>
                    {/* Standalone inputs have been removed. Using the structured 'locations' below. */}
                </div>

                {/* Países e cidades adicionais — estruturado */}
                {locations.map((loc, locIdx) => (
                    <div key={`loc-${locIdx}`} style={{ background: "var(--surface-light)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                        {/* País */}
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label" style={{ marginBottom: 4 }}>
                                    {locIdx === 0 ? "País *" : `País ${locIdx + 1}`}
                                </label>
                                <input
                                    className="form-input"
                                    value={loc.country}
                                    onChange={e => {
                                        const u = locations.map((l, i) => i === locIdx ? { ...l, country: e.target.value } : l);
                                        setLocations(u); markDirty();
                                    }}
                                    placeholder={locIdx === 0 ? "Digite ou selecione o país..." : "Digite o país..."}
                                    autoComplete="off"
                                />
                            </div>
                            {locations.length > 1 && (
                                <button
                                    className="btn-remove"
                                    style={{ marginBottom: 2 }}
                                    onClick={() => { setLocations(locations.filter((_, i) => i !== locIdx)); markDirty(); }}
                                >✕</button>
                            )}
                        </div>
                        {/* Cidades deste país */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            {loc.cities.map((city, cityIdx) => (
                                <div key={`city-${locIdx}-${cityIdx}`} style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px" }}>
                                    <input
                                        style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", width: Math.max(80, city.length * 8) }}
                                        value={city}
                                        onChange={e => {
                                            const u = locations.map((l, i) => i === locIdx
                                                ? { ...l, cities: l.cities.map((c, j) => j === cityIdx ? e.target.value : c) }
                                                : l);
                                            setLocations(u); markDirty();
                                        }}
                                        placeholder={locIdx === 0 && cityIdx === 0 ? "Cidade *" : "Cidade..."}
                                        autoComplete="off"
                                    />
                                    {!(locIdx === 0 && loc.cities.length === 1) && (
                                        <button
                                            onClick={() => {
                                                const u = locations.map((l, i) => i === locIdx
                                                    ? { ...l, cities: l.cities.filter((_, j) => j !== cityIdx) }
                                                    : l);
                                                setLocations(u); markDirty();
                                            }}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12, padding: "0 2px", lineHeight: 1 }}
                                        >✕</button>
                                    )}
                                </div>
                            ))}
                            <button
                                className="btn-add-item"
                                style={{ padding: "4px 12px", fontSize: 12 }}
                                onClick={() => {
                                    const u = locations.map((l, i) => i === locIdx ? { ...l, cities: [...l.cities, ""] } : l);
                                    setLocations(u); markDirty();
                                }}
                            >+ Cidade</button>
                        </div>
                    </div>
                ))}

                <div style={{ marginBottom: 16 }}>
                    <button className="btn-add-item" onClick={() => { setLocations([...locations, { country: "", cities: [] }]); markDirty(); }}>+ Adicionar País</button>
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
                            <s.Icon size={13} strokeWidth={2} /> {s.label}
                        </button>
                    ))}</div>
                </div>
                <div className="form-group">
                    <label className="form-label">Categorias Temáticas (mín 1, máx 5) — {categories.length}/5</label>
                    <div className="editor-chip-grid">{CATEGORY_OPTIONS.map(c => (
                        <button key={c.key} className={`editor-chip ${categories.includes(c.key) ? "active" : ""}`} onClick={() => toggleChip(categories, setCategories, c.key, 5)}>
                            <c.Icon size={13} strokeWidth={2} /> {c.label}
                        </button>
                    ))}</div>
                </div>
                <div className="form-group" style={{ marginTop: 20 }}>
                    <div className="form-helper" style={{ display: "flex", gap: 10, padding: "12px 14px", background: "rgba(249,115,22,0.08)", borderRadius: 10, borderLeft: "3px solid #f97316", marginBottom: 12, color: "var(--text-primary)" }}>
                        <AlertTriangle size={16} style={{ color: "#f97316", flexShrink: 0, marginTop: 2 }} />
                        <div><strong style={{ color: "#f97316" }}>Comprovação de Viagem</strong><br/>
                        Para garantir a autenticidade dos roteiros na plataforma VAMO, solicitamos o envio de pelo menos um comprovante que você esteve no destino (Ex: Bilhete aéreo em seu nome, recibo de hotel, fatura, passaporte carimbado). Este documento é mantido em <strong>sigilo pela moderação</strong> e <strong>não</strong> aparecerá publicamente.</div>
                    </div>
                    <label className="form-label">
                        Arquivo de Comprovação <span style={{ color: "#ef4444" }}>*</span>
                        <span style={{
                            marginLeft: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: 0.6, color: "#ef4444", background: "#fff1f2",
                            border: "1px solid #fecaca", borderRadius: 4, padding: "1px 6px",
                        }}>Obrigatório</span>
                    </label>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <label style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                            borderRadius: 8, border: travelProofUrl ? "2px solid var(--success)" : "2px dashed var(--primary)",
                            cursor: "pointer", fontSize: 13, fontWeight: 600,
                            background: travelProofUrl ? "var(--surface-light)" : "transparent",
                            color: travelProofUrl ? "var(--success)" : "var(--primary)",
                            transition: "all 0.2s",
                        }}>
                            {travelProofUrl
                                ? <><FileCheck size={14} strokeWidth={2} /> Arquivo Recebido</>
                                : <><Upload size={14} strokeWidth={2} /> Selecionar Arquivo</>}
                            <input
                                type="file"
                                accept={acceptAttributeFor('travelProof')}
                                style={{ display: "none" }}
                                onChange={async e => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                        const v = validateUploadFile(file, 'travelProof');
                                        if (!v.valid) {
                                            setToast({ msg: v.reason, type: "error" });
                                            return;
                                        }
                                        const prepared = await prepareUploadFile(file, 'travelProof');
                                        const url = await uploadFile(prepared);
                                        setTravelProofUrl(url); markDirty();
                                    } catch (err: any) {
                                        setToast({ msg: `Erro no upload: ${err.message}`, type: "error" });
                                    } finally {
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </label>
                        {travelProofUrl && (
                            <button
                                onClick={() => { setTravelProofUrl(""); markDirty(); }}
                                title="Remover comprovante"
                                style={{
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    width: 30, height: 30, padding: 0, borderRadius: 6,
                                    border: "1px solid #fecaca", background: "#fff1f2",
                                    color: "#ef4444", cursor: "pointer", fontSize: 14, flexShrink: 0,
                                }}
                            >✕</button>
                        )}
                    </div>
                </div>
            </>);

            /* ═══ BLOCO 2: COMERCIAL ═══ */
            case "commerce": return (<>
                <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Preço *</label>
                        <MoneyInput className="form-input" value={price || ""} onChangeNumber={n => { setPrice(Math.max(0, n)); markDirty(); }} />
                    </div>
                </div>
                <div className="editor-legal-notice" style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} strokeWidth={2} /> Aviso automático: &quot;Produto digital. Não inclui serviços turísticos.&quot;</div>
                <div className="form-helper" style={{ display: "flex", gap: 8, padding: "10px 14px", background: "rgba(40,201,191,0.06)", borderRadius: 8, borderLeft: "3px solid var(--primary)", marginTop: 8 }}>
                    <Wifi size={14} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12 }}><strong style={{ color: "var(--primary)" }}>Acesso Offline:</strong> Após a compra, o viajante poderá consultar o roteiro completo mesmo sem conexão com a internet.</div>
                </div>
            </>);

            /* ═══ BLOCO 3: MÓDULOS ═══ */
            case "modules": {
                const flightHasDataM = (flightOutbound.airline || flightOutbound.originCity || flightOutbound.originAirport || flightReturn.airline || flightReturn.originCity || flightReturn.originAirport);
                const MODULE_CONTENT_MAP: Record<string, boolean> = {
                    itinerario: days.some(d => d.activities?.length > 0),
                    voo:        !!flightHasDataM,
                    hospedagem: accommodations.length > 0,
                    passeios:   attractions.length > 0,
                    transporte: transports.length > 0,
                    dicas:      generalTips.length > 0,
                    restaurantes: restaurants.length > 0,
                    checklist:  checklistItems.length > 0,
                    gasto:      spendingEntries.some(e => parseFloat(e.priceValue) > 0),
                };
                return (<>
                    <span className="form-helper">Ative os módulos que serão incluídos no roteiro. Módulos ativos precisam ter ao menos 1 item preenchido.</span>
                    <div className="editor-module-grid">{MODULE_OPTIONS.map(m => {
                        const isActive = activeModules.includes(m.key);
                        const isEmpty = isActive && MODULE_CONTENT_MAP[m.key] === false;
                        return (
                            <div key={m.key} className={`editor-module-card ${isActive ? "active" : ""} ${isEmpty ? "editor-module-card-warn" : ""}`} onClick={() => toggleChip(activeModules, setActiveModules, m.key, 9)}>
                                <div className="editor-module-icon"><m.Icon size={18} strokeWidth={1.8} /></div>
                                <div className="editor-module-info">
                                    <span className="editor-module-label">{m.label}</span>
                                    <span className="editor-module-desc" style={isEmpty ? { display: "flex", alignItems: "center", gap: 4, color: "#f97316" } : {}}>
                                        {isEmpty ? <><AlertTriangle size={11} strokeWidth={2} /> Nenhum item preenchido</> : m.desc}
                                    </span>
                                </div>
                                <div className="editor-toggle" style={{ pointerEvents: "none" }}><input type="checkbox" checked={isActive} readOnly /><span className="editor-toggle-track" /><span className="editor-toggle-thumb" /></div>
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
                                <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>Dia {di + 1} — </span>
                                <input 
                                    className="editor-day-title-input" 
                                    value={day.title.replace(new RegExp(`^Dia ${di + 1}\\s*(?:-|—)?\\s*`, 'i'), '')} 
                                    onChange={e => updateDay(di, "title", e.target.value)} 
                                    placeholder="Coloque o título do dia aqui. Ex: Torre Eiffel e Trocadério" 
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <button className="btn-remove" onClick={() => removeDay(di)} title="Remover dia" style={{ display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={13} strokeWidth={2} /></button>
                        </div>
                        <div className="editor-day-body">
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: 11 }}>O que esperar nesse dia... *</label>
                                <textarea className="form-input" style={{ minHeight: 60 }} value={day.description} onChange={e => updateDay(di, "description", e.target.value)} placeholder="Ex: Manhã de passeios no centro e tarde livre" />
                            </div>
                            <div className="editor-activities">
                                <div className="editor-activities-label">Atividades ({day.activities.length})</div>
                                {day.activities.map((act, ai) => (
                                    <div className="editor-activity-card" key={ai}>
                                        <div className="editor-activity-row" style={{ width: '100%', display: 'flex' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: 11 }}>Horário</label>
                                                <TimeInput
                                                    className="editor-act-time"
                                                    value={act.time}
                                                    onCommit={v => updateActivity(di, ai, "time", v)}
                                                    placeholder="9:00 AM"
                                                />
                                            </div>
                                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: 11 }}>O que fazer *</label>
                                                <input className="editor-act-title form-input" value={act.title} onChange={e => updateActivity(di, ai, "title", e.target.value)} placeholder="Ex: Visita ao Museu do Louvre" />
                                            </div>
                                            {(() => {
                                                const { num, unit } = parseDuration(act.duration);
                                                return (
                                                    <div className="editor-act-dur-wrap">
                                                        <input
                                                            className="editor-act-dur-num"
                                                            type="number"
                                                            min={1}
                                                            max={unit === "h" ? 23 : unit === "d" ? 30 : 300}
                                                            value={num}
                                                            onChange={e => updateActivity(di, ai, "duration", `${e.target.value}${unit}`)}
                                                        />
                                                        <button
                                                            className="editor-act-dur-unit"
                                                            type="button"
                                                            title="Clique para alternar horas / minutos / dias"
                                                            onClick={() => updateActivity(di, ai, "duration", `${num}${unit === "min" ? "h" : unit === "h" ? "d" : "min"}`)}
                                                        >
                                                            {unit}
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                            <button className="btn-remove" onClick={() => removeActivity(di, ai)}>✕</button>
                                        </div>
                                        <div className="editor-activity-row" style={{ width: '100%', display: 'flex' }}>
                                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: 11 }}>Nome do local ou endereço</label>
                                                <input className="form-input" value={act.location} onChange={e => updateActivity(di, ai, "location", e.target.value)} placeholder="Ex: Rua Direita, 250" />
                                            </div>
                                        </div>
                                        <div className="editor-activity-row" style={{ width: '100%', display: 'flex' }}>
                                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: 11 }}>Link da localização (Google Maps)</label>
                                                <input className="form-input" value={act.mapLink || ""} onChange={e => updateActivity(di, ai, "mapLink", e.target.value)} placeholder="Ex: https://goo.gl/maps/..." />
                                            </div>
                                        </div>
                                        <div className="editor-activity-row" style={{ width: '100%', display: 'flex' }}>
                                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: 11 }}>Dica opcional</label>
                                                <textarea className="form-input" value={act.tips} onChange={e => updateActivity(di, ai, "tips", e.target.value)} placeholder="Ex: Tente chegar 20 minutos antes para evitar filas" style={{ minHeight: 40 }} rows={2} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button className="btn-add-item" onClick={() => addActivity(di)}>+ Atividade</button>
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn-add-item full-width" onClick={addDay}>+ Adicionar Dia</button>
                {days.length < 3 && <div className="editor-validation-alert" style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} strokeWidth={2} /> Mínimo de 3 dias necessários para publicar ({days.length}/3)</div>}
            </>);

            /* ═══ HOSPEDAGENS ═══ */
            case "accommodations": return (<>
                {accommodations.length === 0 && <EmptyState sKey="accommodations" onCta={addAccommodation} />}
                {accommodations.map((acc, i) => (
                    <div className="editor-activity-card" key={i} style={{ marginBottom: 10 }}>
                        <div className="editor-activity-row" style={{ alignItems: "flex-end" }}>
                            <div className="form-group" style={{ flex: 2, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Nome do hotel / hostel *</label>
                                <input className="form-input" value={acc.name} onChange={e => { const u = [...accommodations]; u[i].name = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Ex: Waldorf Astoria" />
                            </div>
                            <div className="form-group" style={{ width: 90, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Nota</label>
                                <input className="form-input" value={acc.rating} onChange={e => { const u = [...accommodations]; u[i].rating = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Ex: 8.5" />
                            </div>
                            <button className="btn-remove" style={{ marginBottom: 6 }} onClick={() => { setAccommodations(accommodations.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Nome do local ou endereço</label>
                                <input className="form-input" value={acc.address} onChange={e => { const u = [...accommodations]; u[i].address = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Ex: Rue de Rivoli, 228" />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Link da localização (Google Maps)</label>
                                <input className="form-input" value={acc.mapLink} onChange={e => { const u = [...accommodations]; u[i].mapLink = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Ex: https://goo.gl/maps/..." />
                            </div>
                        </div>
                        {/* Noites */}
                        <div className="editor-activity-row" style={{ flexWrap: "wrap", gap: 6 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Noites <span style={{ color: "#ef4444" }}>*</span></label>
                                <input
                                    className="form-input"
                                    type="number"
                                    min={1}
                                    value={acc.nights}
                                    placeholder="1"
                                    style={{ width: 80 }}
                                    onChange={e => {
                                        const u = [...accommodations];
                                        u[i].nights = e.target.value;
                                        setAccommodations(u); markDirty();
                                    }}
                                />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>O que torna essa hospedagem especial?</label>
                                <textarea className="form-input" value={acc.description} onChange={e => { const u = [...accommodations]; u[i].description = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Ex: A localização é excelente ao lado do metrô principal e o café da manhã..." style={{ minHeight: 50 }} rows={2} />
                            </div>
                        </div>
                        <div className="editor-activity-row" style={{ gap: 6 }}>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={11} strokeWidth={2} /> Check-in</label>
                                <input className="form-input" type="date" value={acc.startDate} onChange={e => { const u = [...accommodations]; u[i].startDate = e.target.value; setAccommodations(u); markDirty(); }} />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={11} strokeWidth={2} /> Check-out</label>
                                <input className="form-input" type="date" value={acc.endDate} onChange={e => { const u = [...accommodations]; u[i].endDate = e.target.value; setAccommodations(u); markDirty(); }} />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Link externo (Booking, Hostelworld...)</label>
                                <input className="form-input" value={acc.externalLink} onChange={e => { const u = [...accommodations]; u[i].externalLink = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Ex: https://booking.com/hotel/..." />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Dica extra</label>
                                <textarea className="form-input" value={acc.tips} onChange={e => { const u = [...accommodations]; u[i].tips = e.target.value; setAccommodations(u); markDirty(); }} placeholder="Ex: Peça o quarto no último andar para ter vista..." style={{ minHeight: 40 }} rows={2} />
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn-add-item" onClick={addAccommodation}>+ Hospedagem</button>
            </>);

            /* ═══ PASSEIOS & ATRAÇÕES ═══ */
            case "attractions": return (<>
                {attractions.length === 0 && <EmptyState sKey="attractions" onCta={() => { setAttractions([...attractions, { name: "", type: "", location: "", mapLink: "", description: "", hours: "", duration: "", externalLink: "", tips: "", startDate: "", endDate: "" }]); markDirty(); }} />}
                {attractions.map((att, i) => (
                    <div className="editor-activity-card" key={i} style={{ marginBottom: 12 }}>
                        <div className="editor-activity-row" style={{ alignItems: "flex-end" }}>
                            <div className="form-group" style={{ flex: 2, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Nome da atração *</label>
                                <input className="form-input" value={att.name} onChange={e => { const u = [...attractions]; u[i].name = e.target.value; setAttractions(u); markDirty(); }} placeholder="Ex: Torre Eiffel" />
                            </div>
                            <div className="form-group" style={{ width: 160, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Tipo</label>
                                <select className="form-input" value={att.type} onChange={e => { const u = [...attractions]; u[i].type = e.target.value; setAttractions(u); markDirty(); }}>
                                    <option value="">Tipo</option>
                                    {ATTRACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <button className="btn-remove" style={{ marginBottom: 6 }} onClick={() => { setAttractions(attractions.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Nome do local ou endereço</label>
                                <input className="form-input" value={att.location} onChange={e => { const u = [...attractions]; u[i].location = e.target.value; setAttractions(u); markDirty(); }} placeholder="Ex: Champ de Mars, 5 Ave..." />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Link do Google Maps</label>
                                <input className="form-input" value={att.mapLink} onChange={e => { const u = [...attractions]; u[i].mapLink = e.target.value; setAttractions(u); markDirty(); }} placeholder="Ex: https://goo.gl/maps/..." />
                            </div>
                        </div>
                        {/* Datas do passeio + Duração */}
                        <div className="editor-activity-row" style={{ gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
                            <div className="form-group" style={{ flex: 1, margin: 0, minWidth: 120 }}>
                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={11} strokeWidth={2} /> Data de Início</label>
                                <input className="form-input" type="date" value={att.startDate} onChange={e => { const u = [...attractions]; u[i].startDate = e.target.value; setAttractions(u); markDirty(); }} />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0, minWidth: 120 }}>
                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={11} strokeWidth={2} /> Data de Fim</label>
                                <input className="form-input" type="date" value={att.endDate} onChange={e => { const u = [...attractions]; u[i].endDate = e.target.value; setAttractions(u); markDirty(); }} />
                            </div>
                            {/* Tempo recomendado: número + h/min */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Duração</label>
                                {(() => {
                                    const { num, unit } = parseDuration(att.duration);
                                    return (
                                        <div className="editor-act-dur-wrap" style={{ width: "fit-content" }}>
                                            <input
                                                className="editor-act-dur-num"
                                                type="number"
                                                min={1}
                                                max={unit === "h" ? 23 : unit === "d" ? 30 : 300}
                                                value={num}
                                                onChange={e => { const u = [...attractions]; u[i].duration = `${e.target.value}${unit}`; setAttractions(u); markDirty(); }}
                                            />
                                            <button
                                                className="editor-act-dur-unit"
                                                type="button"
                                                title="Clique para alternar horas / minutos / dias"
                                                onClick={() => { const u = [...attractions]; u[i].duration = `${num}${unit === "min" ? "h" : unit === "h" ? "d" : "min"}`; setAttractions(u); markDirty(); }}
                                            >
                                                {unit}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Descrição / Por que recomendar *</label>
                                <textarea className="form-input" value={att.description} onChange={e => { const u = [...attractions]; u[i].description = e.target.value; setAttractions(u); markDirty(); }} placeholder="Ex: Uma vista imperdível..." style={{ minHeight: 50 }} rows={2} />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Link externo</label>
                                <input className="form-input" value={att.externalLink} onChange={e => { const u = [...attractions]; u[i].externalLink = e.target.value; setAttractions(u); markDirty(); }} placeholder="Ex: www.toureiffel.paris" />
                            </div>
                            <div className="form-group" style={{ margin: 0, width: 140 }}>
                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><DollarSign size={11} strokeWidth={2} /> Preço (opcional — mesma moeda da estimativa de gastos)</label>
                                <MoneyInput className="form-input" value={att.price || ""} onChangeText={s => { const u = [...attractions]; u[i].price = s; setAttractions(u); markDirty(); }} placeholder="Ex: 35,00" />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Dica de experiência</label>
                                <textarea className="form-input" value={att.tips} onChange={e => { const u = [...attractions]; u[i].tips = e.target.value; setAttractions(u); markDirty(); }} placeholder="Ex: Vá próximo ao pôr do sol..." style={{ minHeight: 40 }} rows={2} />
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn-add-item" onClick={() => { setAttractions([...attractions, { name: "", type: "", location: "", mapLink: "", description: "", hours: "", duration: "", externalLink: "", tips: "", startDate: "", endDate: "" }]); markDirty(); }}>+ Passeio / Atração</button>
            </>);

            /* ═══ TRANSPORTE ═══ */
            case "transport": return (<>
                {transports.length === 0 && <EmptyState sKey="transport" onCta={addTransport} />}
                {transports.map((t, i) => (
                    <div className="editor-activity-card" key={i} style={{ marginBottom: 10 }}>
                        <div className="editor-activity-row" style={{ alignItems: "flex-end" }}>
                            <div className="form-group" style={{ flex: 2, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Descrição do transporte / Passe *</label>
                                <input className="form-input" value={t.description} onChange={e => { const u = [...transports]; u[i].description = e.target.value; setTransports(u); markDirty(); }} placeholder="Ex: JR Pass (Japan Rail Pass)" />
                            </div>
                            <button className="btn-remove" style={{ marginBottom: 6 }} onClick={() => { setTransports(transports.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                        <div className="editor-activity-row" style={{ flexWrap: "wrap", gap: 6 }}>
                            <div className="form-group" style={{ flex: 2, minWidth: 120, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Tipo de passe / bilhete *</label>
                                <input className="form-input" value={t.passTypes} onChange={e => { const u = [...transports]; u[i].passTypes = e.target.value; setTransports(u); markDirty(); }} placeholder="Ex: Passe Semanal Nacional (7 dias)" />
                            </div>
                        </div>
                        <div className="editor-activity-row" style={{ gap: 6 }}>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={11} strokeWidth={2} /> Data</label>
                                <input className="form-input" type="date" value={t.startDate} onChange={e => { const u = [...transports]; u[i].startDate = e.target.value; setTransports(u); markDirty(); }} />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Notas e dicas adicionais</label>
                                <textarea className="form-input" value={t.notes} onChange={e => { const u = [...transports]; u[i].notes = e.target.value; setTransports(u); markDirty(); }} placeholder="Ex: Leve uma foto 3x4..." style={{ minHeight: 50 }} rows={2} />
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn-add-item" onClick={addTransport}>+ Opção de Transporte</button>
            </>);

            /* ═══ DICAS EXCLUSIVAS ═══ */
            case "tips": return (<>
                {generalTips.length === 0 && <EmptyState sKey="tips" />}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>Dicas adicionadas: {generalTips.filter(t => t.trim()).length}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: generalTips.filter(t => t.trim()).length >= 2 ? "#22c55e" : "#f97316", background: generalTips.filter(t => t.trim()).length >= 2 ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${generalTips.filter(t => t.trim()).length >= 2 ? "#BBF7D0" : "#FED7AA"}`, borderRadius: 20, padding: "2px 8px" }}>
                        {generalTips.filter(t => t.trim()).length >= 2 ? "✅ mín. 2 atingido" : "⚠ mín. 2 obrigatórias"}
                    </span>
                </div>
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
                {restaurants.length === 0 && <EmptyState sKey="restaurants" onCta={() => { setRestaurants([...restaurants, { name: "", cuisine: "", location: "", description: "", hours: "", hoursStart: "", externalLink: "", tips: "", startDate: "", endDate: "" }]); markDirty(); }} />}
                {restaurants.map((rest, i) => (
                    <div className="editor-activity-card" key={i} style={{ marginBottom: 12 }}>
                        <div className="editor-activity-row" style={{ alignItems: "flex-end" }}>
                            <div className="form-group" style={{ flex: 2, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Nome do restaurante *</label>
                                <input className="form-input" value={rest.name} onChange={e => { const u = [...restaurants]; u[i].name = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Ex: Le Jules Verne" />
                            </div>
                            <div className="form-group" style={{ width: 140, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Culinária</label>
                                <select className="form-input" value={rest.cuisine} onChange={e => { const u = [...restaurants]; u[i].cuisine = e.target.value; setRestaurants(u); markDirty(); }}>
                                    <option value="">Culinária</option>
                                    {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <button className="btn-remove" style={{ marginBottom: 6 }} onClick={() => { setRestaurants(restaurants.filter((_, idx) => idx !== i)); markDirty(); }}>✕</button>
                        </div>
                        <div className="editor-activity-row" style={{ flexWrap: "wrap", gap: 6 }}>
                            <div className="form-group" style={{ flex: 2, minWidth: 120, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Localização / Bairro *</label>
                                <input className="form-input" value={rest.location} onChange={e => { const u = [...restaurants]; u[i].location = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Ex: Montmartre" />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Descrição / Por que recomendar</label>
                                <textarea className="form-input" value={rest.description} onChange={e => { const u = [...restaurants]; u[i].description = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Ex: O melhor croque monsieur da cidade com vista incrível..." style={{ minHeight: 50 }} rows={2} />
                            </div>
                        </div>
                        <div className="editor-activity-row" style={{ gap: 6, alignItems: "flex-end" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Horário</label>
                                <TimeInput
                                    className="editor-act-time"
                                    value={rest.hoursStart}
                                    placeholder="11:00 AM"
                                    onCommit={v => { const u = [...restaurants]; u[i].hoursStart = v; setRestaurants(u); markDirty(); }}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Link externo (Google Maps, reserva)</label>
                                <input className="form-input" value={rest.externalLink} onChange={e => { const u = [...restaurants]; u[i].externalLink = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Ex: https://..." />
                            </div>
                        </div>
                        <div className="editor-activity-row" style={{ gap: 6 }}>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={11} strokeWidth={2} /> Data</label>
                                <input className="form-input" type="date" value={rest.startDate} onChange={e => { const u = [...restaurants]; u[i].startDate = e.target.value; setRestaurants(u); markDirty(); }} />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Dicas de experiência</label>
                                <textarea className="form-input" value={rest.tips} onChange={e => { const u = [...restaurants]; u[i].tips = e.target.value; setRestaurants(u); markDirty(); }} placeholder="Ex: Chegue cedo ou faça reserva, o local lota rápido..." style={{ minHeight: 40 }} rows={2} />
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn-add-item" onClick={() => { setRestaurants([...restaurants, { name: "", cuisine: "", location: "", description: "", hours: "", hoursStart: "", externalLink: "", tips: "", startDate: "", endDate: "" }]); markDirty(); }}>+ Restaurante</button>
            </>);

            /* ═══ FOTOS E VÍDEOS ═══ */
            case "media": return (<>
                {!highlightPhotos.some(Boolean) && mediaUrls.length === 0 && <EmptyState sKey="media" />}

                {/* Fotos em Destaque */}
                <div className="editor-subsection" style={{ marginBottom: 24 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}><Star size={14} strokeWidth={2} /> Fotos em Destaque (máx. 3)</h4>
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
                                            <Camera size={24} strokeWidth={1.5} style={{ color: "var(--text-tertiary)", marginBottom: 6 }} />
                                            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Destaque {i + 1}</span>
                                            <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>Clique para upload</span>
                                        </>
                                    )}
                                </label>
                                <input
                                    id={`highlight-upload-${i}`}
                                    type="file"
                                    accept={acceptAttributeFor('routeCoverMedia')}
                                    style={{ display: "none" }}
                                    onChange={async e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const v = validateUploadFile(file, 'routeCoverMedia');
                                            if (!v.valid) {
                                                setToast({ msg: v.reason, type: "error" });
                                                return;
                                            }
                                            const prepared = await prepareUploadFile(file, 'routeCoverMedia');
                                            const url = await uploadFile(prepared);
                                            const u = [...highlightPhotos];
                                            u[i] = url;
                                            setHighlightPhotos(u);
                                            markDirty();
                                        } catch (err: any) {
                                            setToast({ msg: `Erro no upload: ${err.message}`, type: "error" });
                                        } finally {
                                            e.target.value = '';
                                        }
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
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}><ImageIcon size={14} strokeWidth={2} /> Galeria da Viagem (máx. 10)</h4>
                    <span className="form-helper" style={{ marginBottom: 12, display: "block" }}>Faça upload das fotos e vídeos adicionais da sua experiência. {uploadHint('routeGalleryMedia')}.</span>
                    
                    {mediaUrls.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                            {mediaUrls.map((url, i) => (
                                <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                                    {isVideoUploadUrl(url) ? (
                                        <div style={{
                                            width: "100%", height: "100%", borderRadius: 8, border: "1px solid var(--border)",
                                            background: "#0f172a", color: "#fff", display: "flex", alignItems: "center",
                                            justifyContent: "center", position: "relative", overflow: "hidden",
                                        }}>
                                            <video src={url} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            <span style={{
                                                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                                                justifyContent: "center", background: "rgba(0,0,0,0.28)", fontSize: 22,
                                            }}>▶</span>
                                        </div>
                                    ) : (
                                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                                    )}
                                    <button 
                                        onClick={() => { setMediaUrls(mediaUrls.filter((_, idx) => idx !== i)); markDirty(); }}
                                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--warning)", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {mediaUrls.length < 10 && (
                        <div>
                            <input
                                type="file"
                                id="gallery-upload"
                                multiple
                                accept={acceptAttributeFor('routeGalleryMedia')}
                                style={{ display: "none" }}
                                onChange={async e => {
                                    const files = Array.from(e.target.files || []);
                                    if (!files.length) return;
                                    // Valida cada arquivo no contexto routeGalleryMedia (imagens + vídeos, até 100 MB).
                                    const failures: string[] = [];
                                    const accepted: File[] = [];
                                    for (const f of files) {
                                        const v = validateUploadFile(f, 'routeGalleryMedia');
                                        if (v.valid) accepted.push(f);
                                        else failures.push(`${f.name}: ${v.reason}`);
                                    }
                                    if (failures.length) {
                                        setToast({ msg: failures.join(' · '), type: "error" });
                                    }
                                    if (!accepted.length) { e.target.value = ''; return; }
                                    try {
                                        const prepared = await Promise.all(
                                            accepted.map(f => prepareUploadFile(f, 'routeGalleryMedia'))
                                        );
                                        const newUrls = await uploadFiles(prepared);
                                        const combined = [...mediaUrls, ...newUrls].slice(0, 10);
                                        setMediaUrls(combined);
                                        markDirty();
                                    } catch (err: any) {
                                        setToast({ msg: `Erro no upload: ${err.message}`, type: "error" });
                                    } finally {
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <label htmlFor="gallery-upload" className="btn-add-item" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", width: "100%" }}>
                                📤 Fazer Upload ({mediaUrls.length}/10)
                            </label>
                        </div>
                    )}
                    {mediaUrls.length >= 10 && <span className="form-helper" style={{ color: "var(--warning)" }}>Limite de 10 arquivos atingido.</span>}
                </div>
            </>);

            /* ═══ BLOCO 5: GASTO (manual por módulo ativo) ═══ */
            case "spending": {
                const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || code;
                const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

                // Sync spending entries with active modules that have spending
                const spendingModuleKeys = Object.keys(SPENDING_MODULE_MAP).filter(k => activeModules.includes(k));
                const needsSync = spendingModuleKeys.length !== spendingEntries.length || spendingModuleKeys.some(k => !spendingEntries.find(e => e.moduleKey === k));

                if (needsSync) {
                    const synced = spendingModuleKeys.map(k => {
                        const existing = spendingEntries.find(e => e.moduleKey === k);
                        if (existing) return existing;
                        const meta = SPENDING_MODULE_MAP[k];
                        return { moduleKey: k, label: meta.label, icon: meta.icon, priceValue: "", priceCurrency: "AUD", receiptUrl: "" };
                    });
                    // Defer state update to avoid render loop
                    setTimeout(() => { setSpendingEntries(synced); markDirty(); }, 0);
                }

                /* Total convertido na moeda base (AUD) usando taxas atuais do admin (somente para exibição) */
                const spTotal = spendingEntries.reduce((s, e) => s + convertToBaseNumber(e.priceValue, e.priceCurrency), 0);

                return (<>
                    <div className="form-helper" style={{ display: "flex", gap: 10, marginBottom: 16, padding: "10px 14px", background: "rgba(40,201,191,0.05)", borderRadius: 8, borderLeft: "3px solid var(--primary)" }}>
                        <TrendingUp size={15} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
                        <div><strong style={{ color: "var(--primary)" }}>Gasto Manual</strong> — Preencha o valor real gasto em cada categoria ativa do roteiro. Enviar o comprovante (nota fiscal, bilhete) não é obrigatório, mas aumenta o score do roteiro e ajuda a transmitir mais confiança aos viajantes.</div>
                    </div>
                    <div className="editor-legal-notice" style={{ display: "flex", gap: 10, padding: "10px 14px", background: "rgba(249, 115, 22, 0.06)", borderRadius: 8, borderLeft: "3px solid #f97316", marginBottom: 12 }}>
                        <AlertTriangle size={15} style={{ color: "#f97316", flexShrink: 0, marginTop: 1 }} />
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}><strong style={{ color: "#f97316" }}>Importante:</strong> Todos os valores informados nesta seção devem ser referentes ao custo <strong>por pessoa</strong>.</div>
                    </div>

                    {spendingModuleKeys.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text-secondary)" }}>
                            <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: "rgba(40,201,191,0.5)" }}><CreditCard size={36} strokeWidth={1.2} /></div>
                            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>Nenhum módulo com gasto ativo</div>
                            <div style={{ fontSize: 13 }}>Ative módulos como Voo, Hospedagem, Transporte, Passeios ou Restaurantes para lançar os gastos aqui.</div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {spendingEntries.map((entry, i) => (
                                <div className="editor-activity-card" key={entry.moduleKey} style={{ marginBottom: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, rgba(40,201,191,0.12), rgba(40,201,191,0.05))", border: "1px solid rgba(40,201,191,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#28C9BF", flexShrink: 0 }}>
                                            {entry.moduleKey === "voo" ? <Plane size={15} strokeWidth={1.8} /> :
                                             entry.moduleKey === "hospedagem" ? <Building2 size={15} strokeWidth={1.8} /> :
                                             entry.moduleKey === "passeios" ? <Ticket size={15} strokeWidth={1.8} /> :
                                             entry.moduleKey === "transporte" ? <Bus size={15} strokeWidth={1.8} /> :
                                             entry.moduleKey === "restaurantes" ? <Utensils size={15} strokeWidth={1.8} /> :
                                             <CreditCard size={15} strokeWidth={1.8} />}
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--secondary)" }}>{entry.label}</span>
                                    </div>
                                    <div className="editor-activity-row" style={{ gap: 6 }}>
                                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                            <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><DollarSign size={11} strokeWidth={2} /> Valor Gasto *</label>
                                            <MoneyInput
                                                className="form-input"
                                                value={entry.priceValue}
                                                placeholder="Ex: 1500,00"
                                                onChangeText={s => {
                                                    const u = [...spendingEntries];
                                                    u[i].priceValue = s;
                                                    setSpendingEntries(u); markDirty();
                                                }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ width: 100, margin: 0 }}>
                                            <label className="form-label" style={{ fontSize: 11 }}>Moeda</label>
                                            <select className="form-input" value={entry.priceCurrency} onChange={e => {
                                                const u = [...spendingEntries];
                                                u[i].priceCurrency = e.target.value;
                                                setSpendingEntries(u); markDirty();
                                            }}>
                                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.emoji} {c.code} - {c.name}</option>)}
                                            </select>
                                        </div>
                                        {parseFloat(entry.priceValue) > 0 && toBase(entry.priceValue, entry.priceCurrency) && (
                                            <span style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--surface-light)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap", alignSelf: "flex-end", marginBottom: 4 }}>
                                                ≈ {toBase(entry.priceValue, entry.priceCurrency)}
                                            </span>
                                        )}
                                        {entry.moduleKey === "voo" && (
                                            <div className="form-group" style={{ flex: 2, margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} strokeWidth={2} /> Cidade de Saída *</label>
                                                <input
                                                    className="form-input"
                                                    value={entry.originCity || ""}
                                                    placeholder="Ex: São Paulo"
                                                    onChange={e => {
                                                        const u = [...spendingEntries];
                                                        u[i].originCity = e.target.value;
                                                        setSpendingEntries(u); markDirty();
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="editor-activity-row">
                                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                            <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Receipt size={11} strokeWidth={2} /> Comprovante / Recibo do Gasto (Opcional)</label>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                <label htmlFor={`receipt-upload-${entry.moduleKey}`} style={{
                                                    display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                                                    borderRadius: 8, border: entry.receiptUrl ? "2px solid var(--success)" : "2px dashed var(--border)",
                                                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                                                    background: entry.receiptUrl ? "var(--surface-light)" : "transparent",
                                                    color: entry.receiptUrl ? "var(--success)" : "var(--text-secondary)",
                                                    transition: "all 0.2s",
                                                }}>
                                                    {entry.receiptUrl
                                                        ? <><FileCheck size={13} strokeWidth={2} /> Comprovante enviado</>
                                                        : <><Upload size={13} strokeWidth={2} /> Clique para upload</>}
                                                </label>
                                                <input
                                                    id={`receipt-upload-${entry.moduleKey}`}
                                                    type="file"
                                                    accept={acceptAttributeFor('costProof')}
                                                    style={{ display: "none" }}
                                                    onChange={async e => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        try {
                                                            const v = validateUploadFile(file, 'costProof');
                                                            if (!v.valid) {
                                                                setToast({ msg: v.reason, type: "error" });
                                                                return;
                                                            }
                                                            const prepared = await prepareUploadFile(file, 'costProof');
                                                            const url = await uploadFile(prepared);
                                                            const u = [...spendingEntries];
                                                            u[i].receiptUrl = url;
                                                            setSpendingEntries(u); markDirty();
                                                        } catch (err: any) {
                                                            setToast({ msg: `Erro no upload: ${err.message}`, type: "error" });
                                                        } finally {
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                                {entry.receiptUrl && (
                                                    <button
                                                        className="btn-remove"
                                                        onClick={() => { const u = [...spendingEntries]; u[i].receiptUrl = ""; setSpendingEntries(u); markDirty(); }}
                                                        title="Remover comprovante"
                                                    >✕</button>
                                                )}
                                            </div>
                                            {entry.receiptUrl && entry.receiptUrl.startsWith("blob:") && (
                                                <img src={entry.receiptUrl} alt="Comprovante" style={{ marginTop: 6, maxWidth: 200, maxHeight: 120, objectFit: "contain", borderRadius: 6, border: "1px solid var(--border)" }} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Resumo Total */}
                            {spTotal > 0 && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "linear-gradient(135deg, var(--primary), var(--accent, #6366f1))", borderRadius: 10, color: "#fff" }}>
                                    <span style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}><BarChart3 size={16} strokeWidth={2} /> Total Estimado</span>
                                    <span style={{ fontWeight: 800, fontSize: 18 }}>A$ {fmt(spTotal)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </>);
            }

            /* ═══ BLOCO 6: MEU VOO ═══ */
            case "flight": {
                const renderFlightLeg = (leg: FlightLeg, setLeg: (l: FlightLeg) => void, label: string, _icon: string) => (
                    <div className="editor-activity-card" style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                            {label === "Voo de Ida" ? <PlaneTakeoff size={14} strokeWidth={2} style={{ color: "#28C9BF" }} /> : <PlaneLanding size={14} strokeWidth={2} style={{ color: "#28C9BF" }} />}
                            {label}
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Companhia aérea</label>
                                <input className="form-input" value={leg.airline} onChange={e => { setLeg({ ...leg, airline: e.target.value }); markDirty(); }} placeholder="Ex: LATAM, Gol, Air France" />
                            </div>
                        </div>
                        <div className="editor-activity-row">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} strokeWidth={2} /> Cidade de Saída *</label>
                                <input className="form-input" value={leg.originCity} onChange={e => { setLeg({ ...leg, originCity: e.target.value }); markDirty(); }} placeholder="Ex: São Paulo, Rio de Janeiro, Brasília" />
                            </div>
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
                                <label className="form-label" style={{ fontSize: 11 }}>Data de Saída *</label>
                                <input className="form-input" type="date" value={leg.departureDate} onChange={e => { setLeg({ ...leg, departureDate: e.target.value }); markDirty(); }} />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Data de Chegada *</label>
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

                    {renderFlightLeg(flightOutbound, setFlightOutbound, "Voo de Ida", "")}
                    {renderFlightLeg(flightReturn, setFlightReturn, "Voo de Volta", "")}

                    <h4 style={{ margin: "20px 0 8px", fontSize: 14, display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}><MessageSquare size={14} strokeWidth={2} /> Dicas sobre o Voo</h4>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>Itens adicionados: {checklistItems.filter(c => c.item?.trim()).length}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: checklistItems.filter(c => c.item?.trim()).length >= 5 ? "#22c55e" : "#f97316", background: checklistItems.filter(c => c.item?.trim()).length >= 5 ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${checklistItems.filter(c => c.item?.trim()).length >= 5 ? "#BBF7D0" : "#FED7AA"}`, borderRadius: 20, padding: "2px 8px" }}>
                        {checklistItems.filter(c => c.item?.trim()).length >= 5 ? "✅ mín. 5 atingido" : "⚠ mín. 5 itens"}
                    </span>
                </div>
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
                    <Link href="/dashboard/roteiros" className="btn-back" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ArrowLeft size={15} strokeWidth={2.5} /> Voltar
                    </Link>
                    <h1 className="editor-title">{isNew ? "Novo Roteiro" : title || "Editar Roteiro"}</h1>
                </div>
                <div className="editor-header-right">
                    {/* Ring gauge — Força do Roteiro */}
                    <div className="score-gauge-root">
                        <div className="score-gauge-trigger">
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
                        {/* Breakdown tooltip */}
                        <div className="score-breakdown-tooltip">
                            <div className="score-breakdown-header">
                                <span style={{ fontWeight: 700, fontSize: 13 }}>Força do Roteiro</span>
                                <span style={{ fontSize: 12, color: qualityColor, fontWeight: 700 }}>{qualityScore}/100</span>
                            </div>
                            <p className="score-breakdown-hint">
                                Roteiros com score alto aparecem em destaque na Home e no topo das buscas do app.
                            </p>
                            {qualityBlocks.map((b) => {
                                const isComplete = b.earned === b.max;
                                const color = isComplete ? "#22c55e" : b.earned > 0 ? "#f97316" : "#94a3b8";
                                return (
                                    <div key={b.label} className="score-breakdown-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span className="score-breakdown-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {QUALITY_ICONS[b.label] ?? <BarChart3 size={12} strokeWidth={2} />}
                                            </span>
                                            <div className="score-breakdown-bar-wrap" style={{ flex: 1 }}>
                                                <div className="score-breakdown-label-row">
                                                    <span className="score-breakdown-label">{b.label}</span>
                                                    <span className="score-breakdown-pts" style={{ color }}>
                                                        {b.earned}/{b.max}
                                                    </span>
                                                </div>
                                                <div className="score-breakdown-bar-bg">
                                                    <div className="score-breakdown-bar-fill"
                                                        style={{ width: `${(b.earned / b.max) * 100}%`, background: color }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Critérios detalhados — só mostra se não completo */}
                                        {!isComplete && b.criteria && (
                                            <div style={{ marginLeft: 28, display: "flex", flexDirection: "column", gap: 3 }}>
                                                {b.criteria.map((c: { text: string; done: boolean }) => (
                                                    <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.done ? "#22c55e" : "#94a3b8" }}>
                                                        <span style={{ fontSize: 12, flexShrink: 0 }}>{c.done ? "✅" : "⚪"}</span>
                                                        <span style={{ textDecoration: c.done ? "line-through" : "none", opacity: c.done ? 0.6 : 1 }}>{c.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {saveStatus === "saving" && <span className="editor-dirty-badge" style={{ color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 4 }}><RefreshCw size={11} className="spin" /> Salvando...</span>}
                    {saveStatus === "saved"  && <span className="editor-dirty-badge" style={{ color: "#22c55e", display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={11} strokeWidth={3} /> Salvo</span>}
                    {saveStatus === "idle" && dirty && <span className="editor-dirty-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /> Não salvo</span>}
                    {/* Badge de status */}
                    {itineraryStatus === "PENDING_REVIEW" && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "4px 10px", borderRadius: 20, border: "1px solid #FDE68A", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Clock size={11} strokeWidth={2} /> Aguardando aprovação
                        </span>
                    )}
                    {itineraryStatus === "APPROVED" && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: 20, border: "1px solid #BBF7D0", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <CheckCircle2 size={11} strokeWidth={2} /> Aprovado
                        </span>
                    )}
                    {itineraryStatus === "REJECTED" && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: "#FEE2E2", color: "#991B1B", padding: "4px 10px", borderRadius: 20, border: "1px solid #FECACA", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <AlertTriangle size={11} strokeWidth={2} /> Recusado
                        </span>
                    )}
                    <button
                        className="editor-save-btn"
                        onClick={handleSave}
                        disabled={saving || itineraryStatus === "PENDING_REVIEW"}
                        title={itineraryStatus === "PENDING_REVIEW" ? "Aguardando análise da equipe VAMO" : ""}
                        style={itineraryStatus === "PENDING_REVIEW" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                    >
                        {saving
                            ? <><RefreshCw size={13} strokeWidth={2} className="spin" /> Enviando...</>
                            : itineraryStatus === "REJECTED"
                                ? <><RefreshCw size={13} strokeWidth={2} /> Corrigir e Reenviar</>
                                : itineraryStatus === "PENDING_REVIEW"
                                    ? <><Clock size={13} strokeWidth={2} /> Em análise...</>
                                    : <><Check size={13} strokeWidth={2.5} /> Enviar para Aprovação</>}
                    </button>
                </div>
            </div>

            {/* Banner de status — só mostra em REJECTED/APPROVED.
                PENDING_REVIEW recebe uma tela dedicada abaixo (sem campos editáveis). */}
            {itineraryStatus === "REJECTED" && approvalNote && (
                <div style={{ margin: "0 20px 0", padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
                    <AlertTriangle size={18} style={{ color: "#991B1B", flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <strong style={{ color: "#991B1B" }}>Roteiro recusado</strong>
                        <div style={{ marginTop: 4, color: "#7F1D1D" }}>Motivo: <em>{approvalNote}</em></div>
                        <div style={{ marginTop: 6, color: "#6B7280" }}>Corrija os pontos acima e clique em <strong>Corrigir e Reenviar</strong>.</div>
                    </div>
                </div>
            )}
            {itineraryStatus === "APPROVED" && (
                <div style={{ margin: "0 20px 0", padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <CheckCircle2 size={18} style={{ color: "#166534", flexShrink: 0 }} />
                    <div><strong style={{ color: "#166534" }}>Roteiro aprovado e disponível para venda!</strong> Os viajantes já podem encontrar e comprar seu roteiro.</div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                MODO LEITURA — quando aguarda aprovação, esconde editor
                e mostra apenas um card amplo + a prévia do roteiro.
                ═══════════════════════════════════════════════════════ */}
            {itineraryStatus === "PENDING_REVIEW" ? (
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start", padding: "0 20px 48px" }}>
                    {/* Card "Em análise" amplo (lado esquerdo) */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            position: "relative",
                            background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                            border: "1px solid #FDE68A",
                            borderRadius: 20,
                            padding: "40px 36px",
                            boxShadow: "0 4px 18px rgba(217,119,6,0.10)",
                            overflow: "hidden",
                        }}>
                            {/* Glow decorativo */}
                            <div aria-hidden style={{
                                position: "absolute", top: -60, right: -60, width: 220, height: 220,
                                borderRadius: "50%",
                                background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)",
                                pointerEvents: "none",
                            }} />

                            {/* Ícone + título */}
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, position: "relative" }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16,
                                    background: "linear-gradient(135deg, #F59E0B, #D97706)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", boxShadow: "0 6px 16px rgba(217,119,6,0.30)",
                                    flexShrink: 0,
                                }}>
                                    <Clock size={26} strokeWidth={2} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: "#92400E", letterSpacing: 1.4, textTransform: "uppercase" }}>
                                        Status atual
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#1A3263", letterSpacing: -0.4, marginTop: 2 }}>
                                        Roteiro em análise
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: 14, color: "#78350F", lineHeight: 1.65, marginBottom: 22, position: "relative" }}>
                                Sua submissão foi recebida. <strong>A equipe VAMO está conferindo</strong> o comprovante de viagem
                                e o conteúdo do roteiro. Você será notificado por e‑mail assim que a análise terminar.
                            </p>

                            {/* Steps */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24, position: "relative" }}>
                                {[
                                    { Icon: FileCheck,  label: "Submissão recebida", done: true },
                                    { Icon: ShieldCheck, label: "Análise em andamento", done: false, active: true },
                                    { Icon: CheckCircle2, label: "Publicação no app", done: false },
                                ].map((step, i) => (
                                    <div key={i} style={{
                                        background: step.active ? "#fff" : "rgba(255,255,255,0.55)",
                                        border: step.active ? "1.5px solid #F59E0B" : "1px solid #FDE68A",
                                        borderRadius: 12, padding: "12px 14px",
                                        display: "flex", alignItems: "center", gap: 10,
                                        opacity: step.done || step.active ? 1 : 0.55,
                                    }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8,
                                            background: step.done ? "#16A34A" : step.active ? "#F59E0B" : "#FCD34D",
                                            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
                                        }}>
                                            {step.done
                                                ? <Check size={14} strokeWidth={3} />
                                                : <step.Icon size={14} strokeWidth={2} />}
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A3263", lineHeight: 1.3 }}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Resumo rápido do roteiro submetido */}
                            <div style={{
                                background: "#fff", border: "1px solid #FEF3C7", borderRadius: 14,
                                padding: "16px 18px", position: "relative",
                            }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#92400E", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                                    O que você enviou
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#1A3263", marginBottom: 8, letterSpacing: -0.2 }}>
                                    {title || "(sem título)"}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 12, color: "#5A6B8C" }}>
                                    {(locations[0]?.cities[0] || destination) && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "3px 10px", borderRadius: 999 }}>
                                            <MapPin size={11} strokeWidth={2.2} /> {(locations[0]?.cities[0] || destination)}{(locations[0]?.country || country) ? `, ${locations[0]?.country || country}` : ""}
                                        </span>
                                    )}
                                    {duration > 0 && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "3px 10px", borderRadius: 999 }}>
                                            <CalendarDays size={11} strokeWidth={2.2} /> {duration} {duration === 1 ? "dia" : "dias"}
                                        </span>
                                    )}
                                    {price > 0 && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "3px 10px", borderRadius: 999 }}>
                                            <DollarSign size={11} strokeWidth={2.2} /> {currency} {price}
                                        </span>
                                    )}
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "3px 10px", borderRadius: 999 }}>
                                        <BarChart3 size={11} strokeWidth={2.2} /> Score {qualityScore}/100
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: 18, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
                                <Clock size={12} strokeWidth={2.4} />
                                <span>Tempo médio de análise: <strong>até 48h</strong>. A edição é bloqueada nesse período.</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview à direita */}
                    <div style={{
                        position: "sticky", top: 76, width: 420, flexShrink: 0,
                        maxHeight: "calc(100vh - 96px)", alignSelf: "flex-start",
                    }}>
                        {(itineraryStatus as string) === "PENDING_REVIEW" ? (
                            <div style={{
                                background: "linear-gradient(135deg, #FFF7ED, #FFFBEB)",
                                border: "1.5px solid #FED7AA",
                                borderRadius: 16,
                                padding: "48px 32px",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 16,
                            }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 32,
                                    background: "rgba(251,146,60,0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 28,
                                }}>
                                    ⏳
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: "#92400E" }}>
                                    Prévia indisponível
                                </div>
                                <div style={{ fontSize: 13, color: "#B45309", lineHeight: 1.6, maxWidth: 280 }}>
                                    Seu roteiro está <strong>em análise</strong> pela equipe VAMO.
                                    A prévia ficará visível novamente quando for aprovado.
                                </div>
                                <div style={{
                                    fontSize: 12, color: "#92400E",
                                    background: "rgba(251,146,60,0.1)",
                                    border: "1px solid #FED7AA",
                                    borderRadius: 8, padding: "8px 16px",
                                }}>
                                    ⏰ Tempo médio de análise: <strong>até 48h</strong>
                                </div>
                            </div>
                        ) : (
                            <ItineraryPreview
                                title={title}
                                subtitle={subtitle}
                                destination={locations[0]?.cities[0] || ""}
                                country={locations[0]?.country || ""}
                                locations={locations}
                                description={description}
                                price={price}
                                currency={currency}
                                duration={duration}
                                images={images}
                                rating={rating}
                                reviewCount={reviewCount}
                                highlights={highlightItems}
                                inclusions={previewInclusions}
                                estimatedSpending={estimatedSpending}
                                featured={featured}
                                accommodations={accommodations}
                                attractions={attractions}
                                transports={transports}
                                restaurants={restaurants}
                                extraSpendingItems={extraSpendingItems}
                                flightCost={flightCost}
                                flightSpending={flightSpending}
                            />
                        )}
                    </div>
                </div>
            ) : (
            /* ═══════════════════════════════════════════════════════
                MODO EDIÇÃO — sidebar + seções + preview
                ═══════════════════════════════════════════════════════ */
            <>
            {/* Body: sidebar + sections */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "0 20px 48px" }}>

                {/* ── Sticky Sidebar Nav ── */}
                <nav className="editor-nav" style={{
                    position: "sticky", top: 76, width: 220, flexShrink: 0,
                    maxHeight: "calc(100vh - 96px)", overflowY: "auto",
                    alignSelf: "flex-start",
                }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "var(--text-secondary)", padding: "2px 10px 10px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                        SEÇÕES DO ROTEIRO
                    </div>
                    {SECTIONS.filter(sec => {
                        const req = SECTION_MODULE_MAP[sec.key];
                        return !req || activeModules.includes(req);
                    }).map(sec => {
                        const complete = isSectionComplete(sec.key);
                        const isActive = activeSection === sec.key;
                        return (
                            <button key={sec.key} className={`editor-nav-item ${isActive ? "active" : ""}`} onClick={() => {
                                if (!openSections.has(sec.key)) toggleSection(sec.key);
                                setActiveSection(sec.key);
                                sectionRefs.current[sec.key]?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}>
                                <span className="editor-nav-icon">{SECTION_ICONS[sec.key]}</span>
                                <span className="editor-nav-label">{sec.title}</span>
                                <span className={`editor-nav-dot ${complete ? "complete" : ""}`} />
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
                                <span className="editor-section-icon">{SECTION_ICONS[sec.key]}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span className="editor-section-title">{sec.title}</span>
                                        {(sec.required || (SECTION_MODULE_MAP[sec.key] != null && activeModules.includes(SECTION_MODULE_MAP[sec.key] as string)))
                                            ? <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "rgba(249,115,22,0.10)", borderRadius: 6, padding: "2px 8px" }}>Obrigatório</span>
                                            : <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", background: "var(--surface-light)", borderRadius: 6, padding: "2px 8px" }}>Opcional</span>
                                        }
                                    </div>
                                    {sec.subtitle && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3, fontWeight: 400, lineHeight: 1.5 }}>{sec.subtitle}</div>}
                                </div>
                                <span className={`editor-section-status ${isSectionComplete(sec.key) ? "complete" : "pending"}`}>
                                    {isSectionComplete(sec.key) ? <Check size={10} strokeWidth={3} /> : "·"}
                                </span>
                                <span className="editor-section-arrow" style={{ display: "flex", alignItems: "center", color: "var(--text-tertiary)" }}>
                                    {openSections.has(sec.key) ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                                </span>
                            </button>
                            {openSections.has(sec.key) && <div className="editor-section-body">{renderSection(sec.key)}</div>}
                        </div>
                    ))}

                    {/* ── Final Submit Card ──
                        (este card só renderiza quando NÃO está em PENDING_REVIEW
                        — a tela de "em análise" trata esse estado acima.) */}
                    <div style={{
                        marginTop: 24,
                        padding: "28px 32px",
                        background: itineraryStatus === "APPROVED"
                            ? "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)"
                            : itineraryStatus === "REJECTED"
                                ? "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)"
                                : "linear-gradient(135deg, rgba(40,201,191,0.08) 0%, rgba(26,50,99,0.06) 100%)",
                        border: itineraryStatus === "APPROVED" ? "1px solid #BBF7D0"
                            : itineraryStatus === "REJECTED" ? "1px solid #FECACA"
                            : "1px solid rgba(40,201,191,0.18)",
                        borderRadius: 18,
                        boxShadow: "0 4px 16px rgba(26,50,99,0.05)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: itineraryStatus === "APPROVED" ? "#16A34A"
                                    : itineraryStatus === "REJECTED" ? "#DC2626"
                                    : "linear-gradient(135deg, #28C9BF, #1FA89F)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff",
                                boxShadow: "0 4px 12px rgba(40,201,191,0.25)",
                            }}>
                                {itineraryStatus === "APPROVED"
                                    ? <CheckCircle2 size={22} strokeWidth={2} />
                                    : itineraryStatus === "REJECTED"
                                        ? <AlertTriangle size={22} strokeWidth={2} />
                                        : <Sparkles size={22} strokeWidth={2} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 17, fontWeight: 800, color: "#1A3263", letterSpacing: -0.3 }}>
                                    {itineraryStatus === "APPROVED"
                                        ? "Roteiro publicado!"
                                        : itineraryStatus === "REJECTED"
                                            ? "Ajustes necessários"
                                            : "Tudo pronto?"}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.5 }}>
                                    {itineraryStatus === "APPROVED"
                                        ? "Seu roteiro está disponível para os viajantes no aplicativo."
                                        : itineraryStatus === "REJECTED"
                                            ? "Reveja os pontos sinalizados e reenvie quando estiver pronto."
                                            : "Revise os campos e envie o roteiro para que a equipe VAMO faça a análise."}
                                </div>
                            </div>
                        </div>

                        {itineraryStatus !== "APPROVED" && (
                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
                                <span style={{
                                    fontSize: 12, fontWeight: 700, color: "#1A3263",
                                    background: "#fff", border: "1px solid var(--border)",
                                    padding: "6px 12px", borderRadius: 999,
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                }}>
                                    <BarChart3 size={12} strokeWidth={2.4} /> Score {qualityScore}/100
                                </span>
                                <span style={{
                                    fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                }}>
                                    <ShieldCheck size={12} strokeWidth={2.4} /> Verificação leva até 48h
                                </span>
                            </div>
                        )}

                        <button
                            className="editor-save-btn"
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                width: "100%",
                                fontSize: 15,
                                padding: "14px 20px",
                                justifyContent: "center",
                            }}
                        >
                            {saving
                                ? <><RefreshCw size={16} strokeWidth={2} className="spin" /> Enviando...</>
                                : itineraryStatus === "REJECTED"
                                    ? <><RefreshCw size={16} strokeWidth={2} /> Corrigir e Reenviar</>
                                    : itineraryStatus === "APPROVED"
                                        ? <><Check size={16} strokeWidth={2.5} /> Publicar atualização</>
                                        : <><Check size={16} strokeWidth={2.5} /> Enviar para Aprovação</>}
                        </button>

                        {(saveStatus === "saved" || (saveStatus === "idle" && dirty)) && (
                            <div style={{
                                marginTop: 10, fontSize: 12, color: "var(--text-secondary)",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            }}>
                                {saveStatus === "saved"
                                    ? <><Check size={11} strokeWidth={3} style={{ color: "#22c55e" }} /> Rascunho salvo automaticamente</>
                                    : <><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8" }} /> Alterações ainda não enviadas</>}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sticky Preview Panel (Right) ── */}
                <div style={{
                    position: "sticky",
                    top: 76,
                    width: 420,
                    flexShrink: 0,
                    maxHeight: "calc(100vh - 96px)",
                    alignSelf: "flex-start",
                }}>
                    {(itineraryStatus as string) === "PENDING_REVIEW" ? (
                        <div style={{
                            background: "linear-gradient(135deg, #FFF7ED, #FFFBEB)",
                            border: "1.5px solid #FED7AA",
                            borderRadius: 16,
                            padding: "48px 32px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 16,
                        }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 32,
                                background: "rgba(251,146,60,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 28,
                            }}>
                                ⏳
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#92400E" }}>
                                Prévia indisponível
                            </div>
                            <div style={{ fontSize: 13, color: "#B45309", lineHeight: 1.6, maxWidth: 280 }}>
                                Seu roteiro está <strong>em análise</strong> pela equipe VAMO.
                                A prévia ficará visível novamente quando for aprovado.
                            </div>
                            <div style={{
                                fontSize: 12, color: "#92400E",
                                background: "rgba(251,146,60,0.1)",
                                border: "1px solid #FED7AA",
                                borderRadius: 8, padding: "8px 16px",
                            }}>
                                ⏰ Tempo médio de análise: <strong>até 48h</strong>
                            </div>
                        </div>
                    ) : (
                        <ItineraryPreview
                            title={title}
                            subtitle={subtitle}
                            destination={locations[0]?.cities[0] || ""}
                            country={locations[0]?.country || ""}
                            locations={locations}
                            description={description}
                            price={price}
                            currency={currency}
                            duration={duration}
                            images={images}
                            rating={rating}
                            reviewCount={reviewCount}
                            highlights={highlightItems}
                            inclusions={previewInclusions}
                            estimatedSpending={estimatedSpending}
                            featured={featured}
                            accommodations={accommodations}
                            attractions={attractions}
                            transports={transports}
                            restaurants={restaurants}
                            extraSpendingItems={extraSpendingItems}
                            flightCost={flightCost}
                            flightSpending={flightSpending}
                        />
                    )}
                </div>
            </div>
            </>
            )}
        </div>
    );
}
