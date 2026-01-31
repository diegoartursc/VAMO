# VAMO - Descritivo Geral e Detalhado do App

## 📱 Visão Geral

**VAMO** é um marketplace de viagens híbrido que conecta viajantes a agências de turismo verificadas e criadores independentes de roteiros. A plataforma elimina a complexidade do planejamento de viagens através de uma experiência mobile-first intuitiva, transparente e confiável.

**Slogan:** *"VAMO torna viajar mais simples do que você imagina"*

---

## 🎯 Proposta de Valor

### O Problema que Resolvemos

Viajar é percebido como complexo e estressante devido a:
- **Paralisia de Decisão** - Muitas opções, pouca orientação
- **Falta de Confiança** - Medo de golpes online
- **Ansiedade de Preço** - Incerteza sobre melhores ofertas
- **Sobrecarga Logística** - Confusão com vistos, vacinas, documentos
- **Vácuo de Suporte** - Medo de problemas durante a viagem
- **Escassez de Tempo** - Planejamento demanda muitas horas
- **Percepção de Inacessibilidade** - Crença que viagens são caras demais

### Nossa Solução

Plataforma única que oferece **dois modelos de viagem**:

#### 🏢 Pacotes de Agências Verificadas
Para quem busca segurança e comodidade:
- Parceria com agências tradicionais (CVC, Decolar, Hurb, Azul Viagens)
- Pacotes completos: passagens + hotel + transfers + tours
- Garantia de reembolso e suporte 24/7
- Tudo incluído, zero preocupação

#### 🎒 Marketplace de Roteiros Independentes
Para viajantes que querem flexibilidade:
- Roteiros criados por viajantes experientes
- Economia de até 40% comparado a pacotes
- Personalização total do itinerário
- Planilhas, mapas e dicas exclusivas

---

## 🚀 Diferenciais Competitivos

### 1. Confiança em Primeiro Lugar
- ✅ Apenas agências e criadores **verificados**
- ✅ Sistema de **badges de certificação**
- ✅ Reviews com **compra verificada**
- ✅ Prova social em tempo real ("24 pessoas compraram hoje")
- ✅ Políticas de cancelamento **transparentes**

### 2. Simplicidade como Experiência Central
- 📱 Interface **mobile-first** otimizada
- 🎯 Jornada clara: **Escolher → Pagar → Viajar**
- 📊 Seções **colapsáveis** para reduzir sobrecarga cognitiva
- 🧭 Guias educacionais integrados ("Como funciona")
- 💬 Linguagem direta e humana

### 3. Transparência Total
- 💰 **Comparação de preços** automática
- 📋 Checklist pós-reserva **personalizado**
- 🔍 Informações logísticas claras (vistos, vacinas)
- 🛡️ **Sem taxas ocultas**
- 📊 Detalhamento completo do que está incluído

### 4. Design Premium
- 🎨 Paleta **Teal-to-Blue** gradient vibrante
- ✨ Animações suaves e micro-interações
- 📸 Imagens de alta qualidade
- 🎭 Glassmorphism e elementos modernos
- 👌 UI/UX polida e profissional

---

## 📱 Funcionalidades Implementadas

### 🏠 Home Screen
**Status:** ✅ Completo

- **Hero Section** com busca principal
  - Autocomplete de destinos
  - Seletor de datas (calendário)
  - Contador de viajantes
  - CTA "Buscar pacotes"

- **Categorias Rápidas**
  - Estadias, Voos, Carros, Pacotes
  - Navegação por tabs

- **Pacotes em Destaque**
  - Cards premium com badges
  - "Bestseller", "Flash Sale", "Verified"
  - Scroll horizontal

- **Como Funciona** (Scaffolding educacional)
  - 3 passos visuais: Escolher → Pagar → Viajar
  - Ícones descritivos
  - Texto explicativo

### 🔍 Search & Filters
**Status:** ✅ Completo

- **Busca Inteligente**
  - Pesquisa por destino, país ou cidade
  - Sugestões em tempo real
  - Busca global no header

- **Filtros Avançados**
  - Faixa de preço (slider)
  - Duração da viagem
  - Tipo de acomodação (hotel, resort, pousada)
  - Agências específicas
  - Rating mínimo
  - All-inclusive
  - Cancelamento gratuito

- **Ordenação**
  - Menor preço
  - Melhor avaliado
  - Mais vendidos
  - Mais recentes

### 📦 Página de Pacotes
**Status:** ✅ Completo

- **Feed Infinito**
  - Scroll infinito com lazy loading
  - Skeleton loading durante carregamento
  - Pull-to-refresh

- **Package Cards**
  - Imagem de destaque com carousel
  - Badge de tipo (Bestseller, New, etc.)
  - Título e destino
  - Rating com estrelas
  - Preço "A partir de..."
  - Badges de benefícios (Voo incluído, All-inclusive)
  - CTA "Ver detalhes"

### 📄 Detalhes do Pacote
**Status:** ✅ Completo

Tela mais completa e rica do app:

#### Header
- **Galeria de Imagens**
  - Scroll horizontal com múltiplas fotos
  - Indicadores de posição
  - Fullscreen ao clicar

- **Badge da Agência**
  - Logo e nome
  - Selo de verificação
  - Link para perfil da agência

#### Informações Principais
- **Título** do pacote
- **Destino** e país
- **Rating** com quantidade de avaliações
- **Duração** em dias

#### Card de Preço
- "A partir de R$ X.XXX"
- Por pessoa
- Destaque visual (gradiente)

#### 🆕 **Card de Itinerário** (Recém-implementado)
- **Mapa** da região com pontos
- **Parada principal**
- **Locais de busca** (lista de opções)
- **Transporte** (tipo e duração)
- **Atividade principal** (descrição e tempo)
- **Locais de retorno**
- **Preço e botão "Disponibilidade"**

#### Seções Expansíveis (CollapsibleSection)
Reduzem sobrecarga cognitiva através de accordion:

1. **📍 Itinerário**
   - Botão "Ver itinerário completo"
   - Navegação para tela dedicada

2. **✨ Destaques** (Aberto por padrão)
   - Lista dos principais atrativos
   - Ícones decorativos

3. **📝 Descrição Completa**
   - Texto detalhado do pacote
   - Marketing copy da agência

4. **✅ Inclui**
   - Lista completa de inclusões
   - Passagens, hotel, transfers, tours, etc.

5. **❌ Não Indicado Para**
   - Restrições e contraindicações
   - Menores, gestantes, mobilidade reduzida

6. **ℹ️ Informações Importantes**
   - Horários de encontro
   - O que levar
   - Condições climáticas
   - Documentação necessária

#### Reviews Section
- **Header de Avaliações**
  - Quantidade total
  - Botões de ordenação e filtro

- **Cards de Review**
  - Avatar do usuário
  - Nome e localização
  - Data da viagem
  - Selo "Reserva verificada"
  - Rating com estrelas
  - Galeria de fotos (scroll horizontal)
  - Texto do comentário
  - Opção "Traduzir" para reviews em outros idiomas

- **Paginação**
  - Mostra 2 reviews inicialmente
  - Botão "Ver todas as X avaliações"

#### Support Sections
- **Política de Cancelamento**
  - Data limite
  - Condições de reembolso

- **Precisa de Ajuda?**
  - Central de Ajuda
  - Contato com suporte
  - Links para chat/email

- **Descubra Mais**
  - Outros pacotes no mesmo destino
  - Cross-selling

#### Footer Actions
- **Botão "Entrar em Contato"**
  - Modal com opções: Ligar, WhatsApp, Email
  - Integração com apps nativos

- **Informações da Agência**
  - Texto sobre a parceria VAMO

### 🧳 Minhas Viagens (My Trips)
**Status:** 🔄 Em desenvolvimento

Planejado para incluir:
- Viagens confirmadas
- Viagens passadas
- Wishlist / Favoritos
- Status de reservas

### ⚙️ Configurações
**Status:** 🔄 Planejado

Funcionalidades futuras:
- Perfil do usuário
- Preferências de viagem
- Notificações
- Idioma
- Moeda
- Dark mode

---

## 🎨 Design System

### Paleta de Cores

```typescript
colors: {
  primary: '#14b8a6',        // Teal vibrante
  primaryDark: '#0e7c6f',    // Teal escuro
  secondary: '#0ea5e9',      // Blue
  background: '#FFFFFF',      // Branco puro
  surface: '#F8F9FA',        // Cinza muito claro
  surfaceLight: '#F1F3F5',   // Cinza ainda mais claro
  
  text: {
    primary: '#1A1A1A',      // Quase preto
    secondary: '#6B7280',    // Cinza médio
    inverse: '#FFFFFF',      // Branco
  },
  
  success: '#10B981',        // Verde
  warning: '#F59E0B',        // Laranja
  error: '#EF4444',          // Vermelho
  info: '#3B82F6',           // Azul
}
```

### Tipografia

```typescript
typography: {
  sizes: {
    title: 28,      // Títulos principais
    heading: 20,    // Subtítulos
    body: 16,       // Texto padrão
    caption: 14,    // Legendas
    small: 12,      // Pequeno
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}
```

### Espaçamento

```typescript
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}
```

### Border Radius

```typescript
borderRadius: {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,     // Pílulas
}
```

### Sombras

```typescript
shadows: {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }
}
```

---

## 🏗️ Arquitetura Técnica

### Stack de Tecnologia

#### Mobile App
```
- Framework: React Native + Expo
- Linguagem: TypeScript
- Navegação: Expo Router (file-based)
- Estado: React Hooks (useState, useContext)
- UI: Custom components + React Native core
- Ícones: Emojis nativos + Unicode
```

#### Website Institucional (Futuro)
```
- Framework: Next.js 14
- Linguagem: TypeScript
- Estilo: Tailwind CSS
- Deploy: Vercel
- SEO: Otimizado para Google
```

#### Backend (Planejado)
```
- API: Node.js + Express
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT + OAuth
- Pagamentos: Stripe / Mercado Pago
- Storage: AWS S3 (imagens)
- Email: SendGrid
```

### Estrutura de Pastas

```
VAMO/
├── app/                          # Expo Router (navegação)
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Home screen
│   │   ├── packages.tsx         # Pacotes feed
│   │   ├── my-trips.tsx         # Minhas viagens
│   │   └── _layout.tsx          # Tab bar config
│   ├── package/
│   │   └── [id].tsx             # Detalhes do pacote
│   └── _layout.tsx              # Root layout
│
├── src/
│   ├── components/              # Componentes reutilizáveis
│   │   ├── cards/
│   │   │   ├── PackageCard.tsx
│   │   │   ├── ItineraryCard.tsx
│   │   │   └── PackageCardSkeleton.tsx
│   │   ├── badges/
│   │   │   └── PackageBadge.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterModal.tsx
│   │   └── CollapsibleSection.tsx
│   │
│   ├── data/                    # Dados mockados (MVP)
│   │   ├── mockPackages.ts      # Pacotes
│   │   ├── mockReviews.ts       # Avaliações
│   │   └── mockDestinations.ts  # Destinos
│   │
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # Interfaces globais
│   │
│   └── theme/                   # Design system
│       └── theme.ts             # Cores, tipografia, etc.
│
├── assets/                      # Imagens, fontes, etc.
│
└── package.json
```

### Principais Tipos (TypeScript)

```typescript
// Package (Pacote de viagem)
interface Package {
  id: string;
  title: string;
  destination: string;
  country: string;
  agency: Agency;
  price: {
    min: number;
    max: number;
    currency: 'BRL';
  };
  images: string[];
  duration: number;
  includes: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  description: string;
  highlights: string[];
  badge?: 'bestseller' | 'flash' | 'luxury' | 'value' | 'new';
  
  // Novidades
  itinerary?: ItineraryDetails;
  hasFreeCancellation?: boolean;
  isAllInclusive?: boolean;
  recentPurchases?: number;
  priceDiscount?: number;
}

// Agency (Agência parceira)
interface Agency {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  contactUrl: string;
  whatsapp?: string;
}

// Review (Avaliação)
interface Review {
  id: string;
  packageId: string;
  user: {
    name: string;
    initial: string;
    location: string;
    avatar: string;
  };
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  photos?: string[];
  language?: string;
}

// Itinerary Details
interface ItineraryDetails {
  mainStop: string;
  pickupLocations: string[];
  transport: {
    type: string;
    duration: string;
  };
  mainActivity: {
    location: string;
    activity: string;
    duration: string;
  };
  returnLocations: string[];
  mapImageUrl?: string;
}
```

---

## 📊 Dados Mockados Atuais

### Pacotes Disponíveis (8 destinos)

1. **Paris Romântica** - 7 dias - R$ 8.500
   - Agência: CVC
   - Rating: 4.8 ⭐
   - Badge: Bestseller
   - Itinerário completo ✅

2. **Caribe All Inclusive - Cancún** - 5 dias - R$ 6.500
   - Agência: Decolar
   - Rating: 4.9 ⭐
   - Badge: Value
   - All-inclusive

3. **Europa Clássica** - 15 dias - R$ 15.000
   - Agência: CVC
   - 5 países
   - Rating: 4.7 ⭐

4. **Fernando de Noronha Completo** - 5 dias - R$ 4.500
   - Agência: Hurb
   - Rating: 4.9 ⭐
   - Brasil

5. **Nova York** - 6 dias - R$ 7.500
   - Agência: Azul Viagens
   - Rating: 4.6 ⭐

6. **Machu Picchu e Cusco** - 6 dias - R$ 5.500
   - Agência: Decolar
   - Rating: 4.8 ⭐
   - Featured

7. **Dubai Luxo** - 7 dias - R$ 9.500
   - Agência: Hurb
   - Rating: 4.7 ⭐

8. **Patagônia Argentina** - 8 dias - R$ 8.000
   - Agência: CVC
   - Rating: 4.9 ⭐

### Reviews
- Total: ~50 reviews mockadas
- Distribuição: 2-8 reviews por pacote
- Mix de idiomas (PT, EN, ES)
- Fotos incluídas em ~30%
- Todos marcados como "verificados"

---

## 🔄 Fluxo do Usuário

### 1. Descoberta
```
App abre → Home Screen
  ↓
Vê pacotes em destaque
Ou usa busca rápida
  ↓
Aplica filtros (preço, destino, duração)
  ↓
Navega pelo feed infinito
```

### 2. Análise de Pacote
```
Clica em "Ver detalhes"
  ↓
Visualiza galeria de fotos
  ↓
Lê descrição e destaques
  ↓
Expande seções de interesse:
  - O que está incluído
  - Itinerário
  - Reviews
  ↓
Checa card de itinerário
  ↓
Lê avaliações de outros viajantes
```

### 3. Decisão (Futuro)
```
Decide reservar
  ↓
Clica "Solicitar Reserva"
  ↓
Preenche formulário
  ↓
Sistema envia para agência
  ↓
Agência confirma
  ↓
Usuário recebe confirmação
```

---

## 🚀 Roadmap de Desenvolvimento

### ✅ **Fase 1: MVP Visual** (Concluída)
**Status:** 100% completo - Jan 2026

- [x] Design system completo
- [x] Home screen com busca
- [x] Feed de pacotes
- [x] Filtros e ordenação
- [x] Página de detalhes completa
- [x] Sistema de reviews
- [x] Card de itinerário
- [x] Seções colapsáveis
- [x] Dados mockados ricos

### 🔄 **Fase 2: Integração Backend** (Em planejamento)
**Estimativa:** Fev-Mar 2026

- [ ] Configurar backend (Node.js + PostgreSQL)
- [ ] APIs RESTful
  - GET /packages
  - GET /packages/:id
  - GET /packages/:id/reviews
  - POST /bookings
- [ ] Autenticação de usuários (JWT)
- [ ] Sistema de favoritos
- [ ] Persistência de buscas

### 🔮 **Fase 3: Reservas e Pagamentos** (Futuro)
**Estimativa:** Abr-Mai 2026

- [ ] Integração Stripe/Mercado Pago
- [ ] Sistema de escrow
- [ ] Confirmação de reservas
- [ ] Email automation
- [ ] Dashboard para agências
- [ ] Tracking de comissões

### 🔮 **Fase 4: Marketplace de Roteiros** (Futuro)
**Estimativa:** Jun-Jul 2026

- [ ] Upload de roteiros (creators)
- [ ] Sistema de pagamento para creators
- [ ] Rating e reviews de roteiros
- [ ] Download de arquivos (PDF, planilhas)
- [ ] Sistema de tier/certificação

### 🔮 **Fase 5: Features Avançadas** (Futuro)
**Estimativa:** Ago+ 2026

- [ ] Notificações push
- [ ] Chat ao vivo com agências
- [ ] Comparador de preços
- [ ] Quiz de personalidade (encontrar viagem ideal)
- [ ] Programa de pontos/fidelidade
- [ ] Integração com calendário
- [ ] Lembretes de documentação
- [ ] Compartilhamento social

---

## 🎯 KPIs e Métricas Planejadas

### Funil de Conversão
```
Visitantes únicos
  ↓ (60%)
Visualizaram ≥1 pacote
  ↓ (40%)
Abriram página de detalhes
  ↓ (25%)
Leram reviews
  ↓ (30%)
Clicaram "Solicitar Reserva"
  ↓ (70%)
Completaram formulário
  ↓ (80%)
Agência confirmou
  = VENDA CONCLUÍDA
```

### Métricas de Produto
- **Time on Page** (detalhes): >2min (objetivo)
- **Scroll Depth**: >70%
- **Review Read Rate**: >50%
- **Filter Usage**: >30%
- **Search Usage**: >60%

### Métricas de Negócio
- **Taxa de Conversão**: 3-5% (objetivo)
- **Ticket Médio**: R$ 7.000
- **Comissão Média**: R$ 700 (10%)
- **LTV do Cliente**: R$ 14.000 (2 viagens)

---

## 💼 Modelo de Monetização

### 1. Comissão sobre Pacotes de Agências
**Estrutura:**
- 8% para pacotes até R$ 5.000
- 10% para pacotes R$ 5.001 - R$ 15.000
- 12% para pacotes acima de R$ 15.000

**Exemplo:**
- Pacote Paris R$ 8.500 × 10% = **R$ 850 comissão**
- 100 vendas/mês = **R$ 85.000/mês**

### 2. Taxa de Marketplace (Roteiros)
**Estrutura:**
- 20% sobre venda de roteiros independentes

**Exemplo:**
- Roteiro vendido por R$ 299 × 20% = **R$ 60 comissão**
- 50 vendas/mês = **R$ 3.000/mês**

### 3. Featured Listings (Futuro)
- Agências pagam para destaque
- R$ 500-2.000/mês por pacote em destaque

### 4. Parcerias Estratégicas (Futuro)
- Seguros de viagem (5-10% comissão)
- Câmbio (1-2% spread)
- Transfer/táxi (10-15% comissão)

---

## 🌍 Mercado e Competidores

### Comparação com Concorrentes

| Feature | VAMO | Decolar | CVC | Hurb | Airbnb Exp |
|---------|------|---------|-----|------|------------|
| Pacotes de agências | ✅ | ✅ | ✅ | ✅ | ❌ |
| Roteiros independentes | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| Foco em simplicidade | ✅✅ | ❌ | ⚠️ | ⚠️ | ✅ |
| Reviews verificados | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Mobile-first | ✅ | ⚠️ | ❌ | ✅ | ✅ |
| Transparência total | ✅✅ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Educação do usuário | ✅✅ | ❌ | ❌ | ❌ | ❌ |

### Vantagem Competitiva
**VAMO é o único que combina:**
1. Confiabilidade de grandes agências
2. Flexibilidade de roteiros independentes
3. Educação ativa para reduzir ansiedade
4. Experiência mobile premium

---

## 👥 Público-Alvo

### Primário
- **Idade:** 25-45 anos
- **Classe:** Qualquer classe social
- **Perfil:** Primeira viagem internacional ou viajantes casuais (1-2x/ano)
- **Necessidade:** Confiabilidade + Bom custo-benefício
- **Dor:** Medo de errar + Falta de tempo para planejar

### Secundário
- Viajantes experientes (roteiros customizados)
- Criadores de conteúdo de viagem
- Famílias e grupos (logística completa)

---

## 📱 Capturas de Tela

### Home Screen
- Hero com busca principal
- Categorias (Estadias, Voos, Carros, Pacotes)
- Pacotes em destaque (scroll horizontal)
- "Como funciona" educacional

### Feed de Pacotes
- Cards premium com imagens
- Badges de destaque
- Preços e ratings
- Botão "Ver detalhes"

### Detalhes do Pacote
- Galeria de fotos
- Informações completas
- Card de itinerário com mapa
- Seções expansíveis
- Reviews com fotos
- CTAs de contato

---

## 🔐 Segurança e Privacidade (Planejado)

### Dados do Usuário
- Criptografia end-to-end
- Conformidade LGPD
- Política de privacidade clara
- Opt-in para marketing

### Pagamentos
- PCI-DSS compliant
- Tokenização de cartões
- 3D Secure
- Detecção de fraude

---

## 🚀 Como Executar

### Pré-requisitos
```bash
Node.js 18+
npm ou yarn
Expo CLI
iOS Simulator ou Android Emulator
```

### Instalação
```bash
# Clone o repositório
git clone [repo-url]
cd VAMO

# Instale dependências
npm install

# Execute o app
npx expo start

# Opções:
# - Pressione 'i' para iOS
# - Pressione 'a' para Android
# - Escaneie QR code com Expo Go app
```

### Scripts Disponíveis
```bash
npm start          # Inicia Expo dev server
npm run android    # Abre no Android
npm run ios        # Abre no iOS
npm run web        # Abre versão web
```

---

## 📞 Contato e Suporte

### Para Agências Interessadas em Parceria
- Email: parcerias@vamo.app
- Site: www.vamo.app/parceiros

### Para Criadores de Roteiros
- Email: creators@vamo.app
- Portal: www.vamo.app/seja-creator

### Suporte ao Cliente
- Email: suporte@vamo.app
- WhatsApp: +55 11 XXXX-XXXX
- Chat ao vivo (em breve)

---

## 📄 Licença e Propriedade

**Status:** Produto proprietário  
**Copyright:** © 2026 VAMO - Todos os direitos reservados

---

## 🎯 Conclusão

**VAMO** não é apenas mais um app de viagens. É uma **plataforma de simplificação** que democratiza o acesso a experiências de viagem através de:

✅ **Confiança** - Apenas parceiros verificados  
✅ **Simplicidade** - UX focada em reduzir ansiedade  
✅ **Transparência** - Sem taxas ocultas, tudo claro  
✅ **Flexibilidade** - Pacotes prontos OU roteiros customizados  
✅ **Comunidade** - Reviews reais de viajantes reais  

Com um MVP funcional, design premium e roadmap claro, VAMO está pronto para se tornar a **referência em planejamento de viagens no Brasil**.

---

**Versão do Documento:** 2.0  
**Última Atualização:** Janeiro 2026  
**Status do Projeto:** MVP Completo / Backend em Planejamento
