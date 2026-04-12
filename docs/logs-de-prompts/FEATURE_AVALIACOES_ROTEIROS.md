# Feature: Sistema de Avaliações de Roteiros
**Data:** 2026-04-11  
**Status:** Pronto para implementar  
**Prioridade:** Alta

---

## Contexto da Feature

Usuários que compraram um roteiro precisam conseguir avaliá-lo com:
- Nota de 1 a 5 estrelas
- Texto descritivo da experiência
- Upload de fotos da viagem

As avaliações devem aparecer em dois lugares:
1. Na **página pública do roteiro** (`itinerary/[id].tsx`) — visível para todos
2. No **perfil/histórico do usuário** — seção "Minhas Avaliações"

---

## O que já existe (NÃO recriar)

- ✅ Schema do banco: modelos `Review`, `ReviewImage`, `ReviewResponse` já existem no `schema.prisma`
- ✅ Rota `GET /api/reviews` em `apps/backend/src/routes/reviews.ts`
- ✅ Componente `PremiumReviewsSection` em `apps/mobile/src/components/reviews/PremiumReviewsSection.tsx`
- ✅ Campo `rating` e `reviewCount` no modelo `Itinerary`
- ✅ Campo `photos` tratado no GET de reviews (via `ReviewImage`)

---

## Prompt para Claude Code

```
Implemente o sistema completo de avaliação de roteiros no projeto VAMO (monorepo Expo + Next.js + Express + Prisma/PostgreSQL).

## CONTEXTO DO PROJETO
- apps/mobile → React Native com Expo Router
- apps/backend → Express + Prisma
- apps/site → Next.js (dashboard do criador)
- O schema do banco JÁ TEM os modelos Review, ReviewImage, ReviewResponse prontos
- O GET /api/reviews já existe em apps/backend/src/routes/reviews.ts
- O componente PremiumReviewsSection já exibe avaliações na tela pública

## O QUE IMPLEMENTAR

### 1. BACKEND — apps/backend/src/routes/reviews.ts
Adicionar rota POST /api/reviews com:
- Autenticação via middleware traveler-auth (já existe em src/middleware/traveler-auth.ts)
- Validação: só pode avaliar se tiver uma ItinerarySale com travelerId + itineraryId (evitar avaliação sem compra)
- Validação: um traveler só pode avaliar um roteiro uma vez (checar duplicata)
- Campos recebidos: itineraryId, rating (1-5), comment, photos (array de URLs de strings)
- Após criar o Review, atualizar o campo rating e reviewCount do Itinerary com a média recalculada
- Após criar o Review, criar os ReviewImage para cada URL de foto recebida
- Também adicionar rota GET /api/reviews/my para retornar todas as avaliações do traveler autenticado

### 2. MOBILE — novo componente ReviewModal
Criar apps/mobile/src/components/reviews/ReviewModal.tsx com:
- Modal de tela cheia com animação de slide-up (usar Animated do React Native)
- Header com título "Avalie este Roteiro" e botão de fechar (X)
- Seção de estrelas: 5 estrelas tocáveis, destacando as selecionadas em amarelo (#F59E0B)
- Campo de texto (TextInput multiline) com placeholder "Conta como foi sua experiência com este roteiro..."
- Seção de fotos: botão "+ Adicionar fotos" usando expo-image-picker, exibir thumbnails das selecionadas com botão de remover
- Botão "Enviar Avaliação" (primary, largura total) — desabilitado se rating = 0
- Estado de loading durante envio
- Ao enviar com sucesso: fechar modal e mostrar feedback visual (toast de sucesso)
- Props: visible (boolean), onClose, itineraryId, itineraryTitle, onSuccess (callback)
- Usar o theme do projeto: import { theme } from '../../theme/theme'
- Usar o componente Icon: import { Icon } from '../common/Icons'

### 3. MOBILE — apps/mobile/app/purchased-itinerary/[id].tsx
Adicionar ao final da tela (antes do footer ou como seção):
- Se o usuário ainda NÃO avaliou: card com fundo suave convidando a avaliar ("Como foi sua experiência?"), com botão que abre o ReviewModal
- Se o usuário JÁ avaliou: card mostrando a nota que ele deu (estrelas) e um trecho do comentário
- Para verificar se já avaliou: chamar GET /api/reviews?itineraryId=X e checar se existe review com travelerId do usuário logado
- Importar e usar o ReviewModal criado no passo 2

### 4. MOBILE — apps/mobile/src/services/api.ts
Adicionar as funções:
- submitItineraryReview(itineraryId, rating, comment, photos): faz POST /api/reviews com auth header
- getMyReviews(): faz GET /api/reviews/my com auth header

### 5. MOBILE — apps/mobile/app/(tabs)/profile.tsx ou my-trips.tsx
Na tela de perfil ou minhas viagens, adicionar uma seção "Minhas Avaliações":
- Lista as avaliações que o usuário já fez (via GET /api/reviews/my)
- Cada item mostra: imagem do roteiro (thumbnail pequeno), título do roteiro, nota em estrelas, data, trecho do comentário
- Se não tiver avaliações ainda: estado vazio com texto "Você ainda não avaliou nenhum roteiro"

## REGRAS DE NEGÓCIO IMPORTANTES
1. Só pode avaliar roteiros que o traveler comprou (verificar via ItinerarySale)
2. Só pode avaliar uma vez por roteiro (unique check)
3. O campo `verified` do Review deve ser true automaticamente (pois foi validado via compra)
4. Após criar avaliação, recalcular itinerary.rating = média de todos os ratings + itinerary.reviewCount++
5. Fazer o mesmo para creator.averageRating (média de todos os itineraries do criador)

## PADRÃO DE CÓDIGO DO PROJETO
- TypeScript em todo o código
- Estilos com StyleSheet.create do React Native (não usar NativeWind/Tailwind no mobile)
- No backend, seguir o padrão dos outros routes (try/catch com res.json)
- Não usar bibliotecas novas que não estejam no package.json já existente
- TRAVELER_ID temporário = 'trav-diego' (hardcoded até auth ser implementado, igual ao padrão atual)
- Usar Ionicons para ícones de estrelas (já está no projeto)

## ARQUIVOS A CRIAR/MODIFICAR
| Arquivo | Ação |
|---|---|
| apps/backend/src/routes/reviews.ts | MODIFICAR — adicionar POST e GET /my |
| apps/mobile/src/components/reviews/ReviewModal.tsx | CRIAR |
| apps/mobile/app/purchased-itinerary/[id].tsx | MODIFICAR — adicionar seção de avaliação |
| apps/mobile/src/services/api.ts | MODIFICAR — adicionar submitItineraryReview e getMyReviews |
| apps/mobile/app/(tabs)/profile.tsx | MODIFICAR — adicionar seção Minhas Avaliações |

## NÃO FAZER
- Não criar migration do banco (schema já tem tudo)
- Não instalar bibliotecas novas sem verificar se já existem
- Não alterar o PremiumReviewsSection (já funciona para exibição)
- Não mudar o schema.prisma
```

---

## Notas de Arquitetura

- O upload de fotos retorna URLs porque o projeto usa armazenamento externo (provavelmente Supabase Storage ou similar). O modal deve usar `expo-image-picker` para selecionar da galeria e a URL gerada após upload vai para o campo `photos`.
- Se o projeto ainda não tiver fluxo de upload implementado, o ReviewModal pode receber as URIs locais temporariamente e a integração de upload pode ser feita em iteração futura.
- A autenticação ainda está parcialmente mockada no mobile (TRAVELER_ID hardcoded), então o backend deve aceitar o travelerId enviado no body temporariamente também.

---

## Resultado Esperado

Ao final da implementação, o fluxo completo deve funcionar:

```
Comprou roteiro → purchased-itinerary/[id] → botão "Avaliar"
→ ReviewModal abre → usuário preenche → POST /api/reviews
→ Modal fecha → toast "Avaliação enviada!"
→ itinerary/[id] (público) → PremiumReviewsSection mostra a nova avaliação
→ profile ou my-trips → seção "Minhas Avaliações" lista o histórico
```
