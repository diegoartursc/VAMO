# Paris Romântica: O Pacote de Referência (Modelo)

Este documento estabelece o pacote **Paris Romântica (pkg-1)** como o padrão ouro para toda a estrutura de dados, fluxos de dashboard e exibição no aplicativo VAMO. 

> [!IMPORTANT]
> **Qualquer alteração ou novo pacote deve seguir esta estrutura.** Se o pacote Paris Romântica for alterado acidentalmente, utilize o backup em `backups/Paris Romântica - Estrutura Modelo/` para restauração.

## Por que este é o Modelo?

O pacote Paris Romântica foi o primeiro a implementar com sucesso:
1.  **Fluxo de 8 Etapas no Dashboard da Agência**: Estrutura completa de criação (Básicos, Duração, Perfil, Preço, Inclusões, Roteiro, Docs, Disponibilidade).
2.  **Informações de Bagagem**: Lógica de seleção de malas despachadas e aviso de inclusão de bagagem de mão padrão.
3.  **Avaliações Premium com Fotos**: Integração real entre o banco de dados e o componente de reviews no mobile, incluindo fotos de usuários e respostas da agência.
4.  **Itinerário Detalhado**: Cronograma dia a dia com atrações principais e destaques de experiência.

## Checklist de Padronização para Novos Pacotes

Para garantir que um novo pacote (ou um pacote existente) esteja no padrão "Paris", ele deve conter:

### 1. Dados Básicos e Perfil
- [ ] `emotionalIntro` bem definido.
- [ ] `description` curta e `fullDescription` detalhada.
- [ ] Listas de `perfectFor` (Para quem é) e `notRecommendedFor` (Para quem não é).

### 2. Inclusões e Bagagem
- [ ] Especificação clara de Hotel (estrelas e refeições).
- [ ] Marcas de `flight`, `tours` e `extras`.
- [ ] **Configuração de Bagagem**: No dashboard, deve refletir a lógica de malas de 23kg opcionais.

### 3. Roteiro e Itinerário
- [ ] `mainStop` (Atração Principal).
- [ ] `mainActivity` detalhada (Atividade, duração e indicadores de conforto).
- [ ] `pickupLocations` e `returnLocations`.

### 4. Prova Social (Garantia de Conversão)
- [ ] Pelo menos 3 avaliações reais vinculadas no Prisma.
- [ ] Pelo menos uma avaliação deve conter fotos (URLs de imagens reais).

## Estrutura Técnica de Referência

Para conferir o código "limpo" deste modelo, consulte:
- **Seed do Banco**: `apps/backend/prisma/seed.ts`
- **Mock Mobile**: `apps/mobile/src/data/mockPackages.ts`
- **Lógica de Reviews**: `apps/mobile/src/data/mockReviews.ts`
- **Renderização Mobile**: `apps/mobile/app/package/[id].tsx`

---
*Documento oficializado em: 28 de março de 2026*
