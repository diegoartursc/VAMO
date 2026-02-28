# VAMO — Plataforma de Decisão em Viagens

## Visão Geral

**VAMO** é uma plataforma mobile-first que simplifica a tomada de decisão em viagens, conectando viajantes a **agências de turismo verificadas** e a **criadores independentes de roteiros**.

Diferente de marketplaces tradicionais focados apenas em preço, o VAMO foi desenhado para reduzir **ansiedade, insegurança e sobrecarga de escolhas**, entregando clareza, confiança e orientação ao usuário desde o primeiro contato.

> **VAMO torna viajar mais simples do que você imagina.**

---

## O Problema

Planejar uma viagem envolve decisões complexas que afastam muitos usuários da compra:

- Excesso de opções sem curadoria
- Medo de golpes e fraudes online
- Falta de transparência sobre preços e inclusões
- Dificuldade em entender logística, documentos e restrições
- Falta de tempo para planejar
- Ausência de suporte confiável antes e depois da compra

Esses fatores geram **paralisia de decisão**, mesmo em usuários com alto interesse em viajar.

---

## A Solução

O VAMO resolve esse problema oferecendo **dois caminhos claros de viagem**, dentro de uma única experiência confiável:

### 1. Pacotes de Agências Verificadas
Para usuários que buscam segurança e comodidade.

- Parcerias com agências tradicionais e confiáveis
- Pacotes completos (voos, hospedagem, transfers, passeios)
- Informações detalhadas e sem taxas ocultas
- Reviews reais com compra verificada
- Contato direto com a agência

### 2. Marketplace de Roteiros Independentes
Para usuários que preferem flexibilidade e personalização.

- Roteiros criados por viajantes experientes e creators
- Conteúdos baseados em viagens reais
- Economia em relação a pacotes fechados
- Mapas, planilhas, dicas e checklists práticos
- Monetização direta para criadores

---

## Diferencial Estratégico: Ecossistema de Aquisição Cruzada

O VAMO opera como um **ecossistema de crescimento orgânico**, conectando três interesses:

1. **Viajantes**, que buscam confiança e clareza  
2. **Agências**, que desejam leads mais qualificados  
3. **Criadores**, que querem monetizar sua audiência  

Criadores divulgam seus roteiros e trazem novos usuários para o app.  
Esses usuários, ao navegar pela plataforma, também consomem e compram pacotes de agências.

Esse modelo cria um **ciclo virtuoso**:
- Criadores atuam como mídia orgânica
- O app cresce sem depender exclusivamente de anúncios pagos
- Agências ganham visibilidade adicional sem custo fixo

---

## Princípios do Produto

### Confiança em Primeiro Lugar
- Apenas parceiros e creators verificados
- Badges de certificação visíveis
- Reviews com reserva confirmada
- Políticas claras de cancelamento
- Prova social contextual

### Simplicidade como Experiência Central
- Interface mobile-first
- Jornadas claras e previsíveis
- Conteúdo organizado em seções colapsáveis
- Linguagem humana e direta
- Educação contextual integrada à navegação

### Transparência Total
- Detalhamento completo do que está incluído
- Informações logísticas claras
- Comparabilidade visual entre opções
- Sem taxas ocultas

---

## Funcionalidades Principais

### Descoberta
- Busca inteligente por destino
- Filtros avançados (preço, duração, rating, tipo)
- Destaques e categorias rápidas
- Curadoria visual de pacotes

### Análise de Pacote
- Galeria rica de imagens
- Card de preço destacado
- Card de itinerário com mapa e logística
- Seções expansíveis para reduzir carga cognitiva
- Reviews com fotos e selo de verificação

### Conversão
- Contato direto com a agência
- Solicitação de reserva guiada
- Suporte humano integrado
- Checklist pós-reserva personalizado

---

## Arquitetura Técnica (Monorepo)

O VAMO é estruturado em três aplicações principais:

1. **APP Mobile (Viajantes)**
   - **Tecnologia:** React Native + Expo (Expo Router)
   - **Linguagem:** TypeScript
   - **Foco:** Experiência nativa premium, descoberta e compra.

2. **SITE (Criadores e Agências)**
   - **Tecnologia:** Next.js (App Router) + Tailwind CSS
   - **Foco:** Dashboard de gestão (CRUD de pacotes/roteiros), landing pages para atração de fornecedores, SEO.

3. **Backend API (Infraestrutura Central)**
   - **Tecnologia:** Node.js + Express + PostgreSQL (Prisma ORM)
   - **Deploy Integrado:** Conecta tanto o APP quanto o SITE a uma base de dados única.
   - **Pagamentos (futuro):** Stripe / Mercado Pago

**Storage:** AWS S3  
**Auth:** JWT / OAuth

Estrutura modular, escalável e orientada a MVP evolutivo.

---

## Modelo de Monetização

### Comissões sobre Pacotes
- Comissão variável conforme ticket médio
- Cobrança apenas em vendas confirmadas
- Sem mensalidades para agências

#### Estrutura de Comissionamento

| Valor do Pacote       | Comissão VAMO | Repasse Agência |
|-----------------------|---------------|-----------------|
| Até R$ 5.000          | 8%            | 92%             |
| R$ 5.001 - R$ 15.000  | 10%           | 90%             |
| Acima R$ 15.000       | 12%           | 88%             |

### Marketplace de Roteiros
- Comissão sobre venda de roteiros digitais
- Pagamento direto a creators
- Incentivo à produção de conteúdo de qualidade

### Receitas Futuras
- Destaques patrocinados
- Parcerias estratégicas (seguro, câmbio, transfers)
- Serviços premium

---

## Público-Alvo

### Primário
- Adultos de 25 a 45 anos
- De qualquer classe social
- Primeira viagem internacional ou viagens ocasionais
- Buscam segurança, clareza e bom custo-benefício

### Secundário
- Viajantes experientes
- Criadores de conteúdo de viagem
- Famílias e grupos

---

## Roadmap Resumido

### ✅ Fase 1: MVP Visual (Concluído - Janeiro 2026)
- Interface mobile completa
- Sistema de busca e filtros
- Página de detalhes com itinerário
- Reviews e avaliações
- Dados mockados

### 🔄 Fase 2: Integração Backend (Q1 2026)
- APIs RESTful
- Autenticação de usuários
- Persistência de dados
- Sistema de favoritos

### 🔮 Fase 3: Reservas e Pagamentos (Q2 2026)
- Gateway de pagamento
- Sistema de escrow
- Email automation
- Dashboard para agências

### 🔮 Fase 4: Marketplace de Roteiros (Q3 2026)
- Upload de roteiros
- Sistema de tier/certificação
- Pagamentos para creators

### 🔮 Fase 5: Features Avançadas (Q4 2026+)
- Notificações push
- Chat com agências
- Programa de fidelidade
- Automação e IA

---

## Documentação Relacionada

- 📊 [Resumo Executivo](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/RESUMO_EXECUTIVO.md) - Para investidores e pesquisa de mercado
- 🔧 [Estratégia de Integração com Agências](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/ESTRATEGIA_INTEGRACAO_AGENCIAS.md) - Guia técnico de integração
- 🎨 [Design System](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/design/design_system.md) - Especificações visuais

---

© 2026 VAMO — Todos os direitos reservados  
Produto proprietário
