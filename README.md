# 🚀 VAMO

> **VAMO torna viajar mais simples do que você imagina.**

**VAMO** é uma plataforma mobile-first que simplifica a tomada de decisão em viagens, conectando viajantes a agências de turismo verificadas e criadores independentes de roteiros.

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

### ✅ Concluído (Janeiro-Fevereiro 2026)
- Interface mobile completa com design premium
- Sistema de busca inteligente e filtros avançados
- Página de detalhes de pacotes com itinerário
- Sistema de reviews com fotos e verificação
- Seções colapsáveis para reduzir sobrecarga cognitiva
- Flow completo de booking (6 etapas)
- Sistema de favoritos com animações
- Seção "Continue sua busca" na Home
- Analytics service com eventos detalhados
- Price Alert e Worry-Free Block
- Indicadores de conforto no itinerário
- Backend com autenticação JWT e CRUD de pacotes
- Decision Assistant (quiz de 3 perguntas)

### 🔄 Em Desenvolvimento
- Integração frontend ↔ backend (migração de mock data para APIs)
- Dashboard para agências parceiras
- Sistema de pagamentos

### 🔮 Próximos Passos
- Sistema de reservas com gateway de pagamento
- Marketplace de roteiros independentes
- Dashboard para agências parceiras

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

### Planejadas
- 🔜 Integração frontend ↔ backend
- 🔜 Sistema de reservas online com pagamento
- 🔜 Marketplace de roteiros DIY
- 🔜 Programa de fidelidade
- 🔜 Notificações push
- 🔜 Chat com agências

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
