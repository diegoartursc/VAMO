# 🚀 VAMO

> **VAMO torna viajar mais simples do que você imagina.**

**VAMO** é uma plataforma mobile-first que conecta viajantes a **criadores independentes de roteiros digitais**. Permite explorar, comprar e acessar roteiros curados com informações detalhadas de viagem.

> 📌 **Status MVP (Abril 2026):** Foco exclusivo em **Roteiros de Criadores**. Funcionalidades de pacotes de agências estão em pausa.

---

## ✨ O Diferencial

Diferente de marketplaces tradicionais focados apenas em preço, o VAMO elimina **ansiedade, insegurança e sobrecarga de escolhas** através de:

- ✅ Apenas parceiros **verificados**
- 🎯 Jornadas **claras e simples**
- 💎 **Transparência total** (sem taxas ocultas)
- 🤝 Ecossistema de **aquisição cruzada** (Agências + Creators + Viajantes)

---

## 🛠️ Stack Tecnológico

- **Mobile:** React Native + Expo
- **Linguagem:** TypeScript  
- **Navegação:** Expo Router (file-based)
- **Backend (planejado):** Node.js + PostgreSQL
- **Design:** Custom Design System (Teal-to-Blue gradient)

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npx expo start

# Opções:
# - Pressione 'w' para abrir no navegador
# - Pressione 'i' para iOS simulator
# - Pressione 'a' para Android emulator
# - Escaneie o QR code com Expo Go app
```

---

## 📚 Documentação

### Documentos Principais

- 📖 **[Descritivo Completo](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/DESCRITIVO_COMPLETO.md)** - Visão do produto e princípios
- 📊 **[Resumo Executivo](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/RESUMO_EXECUTIVO.md)** - Para investidores e mercado
- 🔧 **[Estratégia de Integração](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/ESTRATEGIA_INTEGRACAO_AGENCIAS.md)** - Guia técnico
- 🏆 **[Modelo de Referência (Paris)](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/product/MODELO_REFERENCIA.md)** - Padrão de dados e fluxo do projeto

### Documentação Técnica

- 🔧 [Estratégia de Integração](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/ESTRATEGIA_INTEGRACAO_AGENCIAS.md)
- 📊 [Status do Projeto](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/STATUS_PROJETO.md)
- 📝 [Changelog de Hoje (28/03/2026)](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/changelog/2026-03-28_bug_fixes.md)
- 📝 [Histórico do Changelog](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/changelog/)

---

## 📱 Status do Projeto

### ✅ Concluído — Roteiros (Foco MVP)
- Interface mobile completa com design premium
- **Página de detalhe de roteiros** com itinerário, estimativa de gastos e highlights
- Sistema de reviews com fotos e verificação
- Seções colapsáveis para reduzir sobrecarga cognitiva
- **Flow completo de compra de roteiros** (4 etapas)
- Sistema de favoritos com animações
- Seção "Continue sua busca" na Home
- Analytics service com eventos detalhados
- Badge de criador verificado
- Disclaimer de produto digital
- Backend com autenticação JWT e CRUD de roteiros
- Decision Assistant (quiz de 3 perguntas)
- Dashboard para criadores gerenciarem roteiros

### ⏸️ Pausado (Desenvolvido mas não é foco MVP)
- Página de detalhes de **pacotes de agências** (em pausa)
- Sistema de booking de pacotes (em pausa)
- Dashboard de agências (em pausa)

### 🔄 Em Desenvolvimento
- Integração frontend ↔ backend (migração de mock data para APIs de roteiros)
- Sistema de pagamentos para roteiros
- Melhorias no Discovery (recomendações, busca avançada)

### 🔮 Próximos Passos (Post-MVP)
- Sistema de reservas e pagamento real
- Autenticação de viajantes
- Programa de afiliados para criadores
- **[Futuro]** Funcionalidades de pacotes de agências

---

## 🏗️ Estrutura do Projeto

```
VAMO/
├── app/                    # Expo Router (navegação)
│   ├── (tabs)/            # Tab navigation
│   └── package/           # Detalhes do pacote
├── src/
│   ├── components/        # Componentes reutilizáveis
│   ├── data/             # Dados mockados (MVP)
│   ├── types/            # TypeScript interfaces
│   └── theme/            # Design system
├── docs/                  # Documentação
└── assets/               # Imagens e recursos
```

---

## 🎯 Principais Funcionalidades

### Implementadas
- ✅ Busca inteligente de destinos
- ✅ Filtros avançados (preço, duração, rating)
- ✅ Feed infinito de pacotes
- ✅ Galeria de imagens de alta qualidade
- ✅ Card de itinerário detalhado com indicadores de conforto
- ✅ Sistema de reviews verificados
- ✅ Badges de certificação
- ✅ Políticas de cancelamento claras
- ✅ Flow completo de booking (6 etapas)
- ✅ Sistema de favoritos com animações
- ✅ Decision Assistant (quiz personalizado)
- ✅ Analytics service completo
- ✅ Seção "Continue sua busca"
- ✅ Price Alert e notificações
- ✅ Backend API com JWT e Prisma

### Planejadas (MVP — Roteiros)
- 🔜 Integração frontend ↔ backend (APIs de roteiros)
- 🔜 Sistema de pagamento real (Stripe/Asaas)
- 🔜 Autenticação de viajantes
- 🔜 Notificações push
- 🔜 Chat com criadores

### Futuro (Post-MVP)
- 🔮 **[Pausado]** Pacotes de agências
- 🔮 Programa de fidelidade
- 🔮 Afiliação entre criadores

---

## 👥 Equipe e Contribuição

Este é um projeto proprietário. Para informações sobre colaborações ou parcerias, entre em contato.

---

## 📄 Licença

© 2026 VAMO — Todos os direitos reservados

---

## 🔗 Links Úteis

- [Descritivo Completo](./docs/DESCRITIVO_COMPLETO.md)
- [Estratégia de Integração](./docs/ESTRATEGIA_INTEGRACAO_AGENCIAS.md)
- [Modelo de Referência (Paris)](./docs/product/MODELO_REFERENCIA.md)
- [Design System](./docs/design/design_system.md)
