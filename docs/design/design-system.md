# VAMO Design System

Especificação completa do sistema de design do VAMO, extraída do código de produção (`src/theme/theme.ts`).

---

## 🎨 Paleta de Cores

### Cores Primárias (Brand)

```typescript
primary: '#28C9BF'        // Teal Principal (extraído do logo)
primaryLight: '#4DE6DC'   // Teal Claro
primaryDark: '#1FA89F'    // Teal Escuro
```

### Cores Secundárias

```typescript
secondary: '#1A3263'      // Azul Profundo (base do gradiente)
secondaryLight: '#2A4273'
secondaryDark: '#102040'
```

### Gradientes

#### Gradiente Principal (Logo)
```
Topo: #28C9BF (Teal)
Base: #1A3263 (Azul Profundo)
```

#### Outros Gradientes
- **Card Overlay:** `rgba(255,255,255,0.95)` → `rgba(248,249,250,1)`
- **Shimmer:** `rgba(255,255,255,0)` → `rgba(255,255,255,0.8)` → `rgba(255,255,255,0)`
- **Featured:** `rgba(40, 201, 191, 0.08)` → `rgba(26, 50, 99, 0.08)`
- **Premium:** `rgba(255, 90, 77, 0.06)` → `rgba(40, 201, 191, 0.06)`

### Backgrounds

```typescript
background: '#FFFFFF'           // Branco puro
surface: '#F8F9FA'             // Cinza muito claro
surfaceLight: '#FAFBFC'        // Cinza quase branco
glassSurface: 'rgba(255, 255, 255, 0.15)'  // Efeito vidro
```

### Texto

```typescript
text: {
  primary: '#1A3263'      // Azul Profundo para leitura
  secondary: '#5A6B8C'    // Azul acinzentado
  tertiary: '#98989D'     // Labels esmaecidos
  disabled: '#A0AAC0'     // Desabilitado
  inverse: '#FFFFFF'      // Branco sobre gradiente
  onPrimary: '#FFFFFF'    // Branco sobre teal
}
```

### Cores Semânticas

```typescript
success: '#28C9BF'    // Verde/Teal
error: '#FF5252'      // Vermelho
warning: '#FFB74D'    // Laranja
info: '#4FC3F7'       // Azul claro
verified: '#28C9BF'   // Teal (badge de verificação)
accent: '#FF5A4D'     // Coral accent
```

### Bordas

```typescript
border: '#E0E4EB'        // Borda padrão
borderLight: '#F0F2F5'   // Borda sutil
```

### Overlays

```typescript
overlay: {
  light: 'rgba(0, 0, 0, 0.4)'
  medium: 'rgba(0, 0, 0, 0.6)'
  heavy: 'rgba(0, 0, 0, 0.8)'
}
```

### Glassmorphism

```typescript
glass: {
  background: 'rgba(255, 255, 255, 0.1)'
  border: 'rgba(255, 255, 255, 0.2)'
}
```

### Estados

```typescript
state: {
  hover: 'rgba(40, 201, 191, 0.1)'    // Teal 10%
  pressed: 'rgba(40, 201, 191, 0.2)'  // Teal 20%
}
```

---

## ✍️ Tipografia

### Família de Fontes

```typescript
fontFamily: {
  regular: 'System'   // San Francisco (iOS) / Roboto (Android)
  medium: 'System'
  bold: 'System'
  heavy: 'System'
}
```

### Tamanhos

```typescript
sizes: {
  hero: 28        // Títulos principais grandes
  title: 24       // Títulos de seção
  heading: 20     // Cabeçalhos
  subheading: 18  // Subcabeçalhos
  body: 16        // Texto padrão
  caption: 14     // Legendas
  small: 12       // Texto pequeno
  tiny: 10        // Micro texto
}
```

### Pesos

```typescript
weights: {
  regular: '400'
  medium: '500'
  semibold: '600'
  bold: '700'
  heavy: '800'
}
```

### Line Heights

```typescript
lineHeights: {
  tight: 1.1      // Títulos - compacto, impactante
  balanced: 1.3   // Captions - balanceado
  normal: 1.5     // Body - legibilidade
  relaxed: 1.75   // Textos grandes
}
```

### Letter Spacing

```typescript
letterSpacing: {
  tight: -0.5     // Títulos - letras mais próximas
  normal: 0       // Body - padrão
  wide: 0.3       // Labels/captions - mais espaço
}
```

---

## 📏 Espaçamento

```typescript
spacing: {
  xxs: 4         // Espaçamento mínimo
  xs: 8          // Muito pequeno
  sm: 12         // Pequeno
  md: 16         // Médio (padrão)
  lg: 24         // Grande
  xl: 32         // Muito grande
  xxl: 48        // Extra grande
  xxxl: 64       // Enorme
  
  // Tokens especiais
  section: 40    // Entre seções
  cardGap: 16    // Entre cards
}
```

---

## 🔲 Border Radius

```typescript
borderRadius: {
  xs: 4          // Mínimo
  sm: 8          // Pequeno
  md: 12         // Médio (cards)
  lg: 16         // Grande
  xl: 20         // Muito grande
  xxl: 24        // Extra arredondado
  full: 9999     // Círculo/pílula
}
```

---

## 🌑 Sombras

### None (Sem sombra)
```typescript
shadowOpacity: 0
elevation: 0
```

### XS (Extra Small)
```typescript
shadowColor: '#1A3263'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.05
shadowRadius: 2
elevation: 1
```

### Small
```typescript
shadowColor: '#1A3263'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.08
shadowRadius: 4
elevation: 2
```

### Medium (Cards)
```typescript
shadowColor: '#1A3263'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.12
shadowRadius: 8
elevation: 4
```

### Large
```typescript
shadowColor: '#1A3263'
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.15
shadowRadius: 12
elevation: 8
```

### Button (Botões primários)
```typescript
shadowColor: '#28C9BF'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.25
shadowRadius: 8
elevation: 6
```

### Elevated (Modals, popovers)
```typescript
shadowColor: '#1A3263'
shadowOffset: { width: 0, height: 12 }
shadowOpacity: 0.18
shadowRadius: 16
elevation: 12
```

### Glow (Efeito de brilho)
```typescript
shadowColor: '#28C9BF'
shadowOffset: { width: 0, height: 0 }
shadowOpacity: 0.3
shadowRadius: 12
elevation: 0
```

---

## 🧩 Componentes Principais

### Buttons

#### Primary Button
- **Background:** Gradiente `#28C9BF` → `#1A3263`
- **Text:** `#FFFFFF` (text.inverse)
- **Border Radius:** `md` (12px)
- **Shadow:** `button`
- **Padding:** `md` (16px) vertical, `lg` (24px) horizontal
- **Font:** `bold`, `body` size

#### Secondary Button
- **Background:** Transparente
- **Border:** 2px solid `primary`
- **Text:** `primary`
- **Border Radius:** `md` (12px)
- **Shadow:** None
- **Padding:** `md` (16px) vertical, `lg` (24px) horizontal

### Cards

#### Package Card
- **Background:** `#FFFFFF`
- **Border Radius:** `lg` (16px)
- **Shadow:** `medium`
- **Padding:** `md` (16px)
- **Gap entre elementos:** `sm` (12px)

#### Itinerary Card
- **Background:** `#FFFFFF`
- **Border Radius:** `lg` (16px)
- **Shadow:** `small`
- **Padding:** `lg` (24px)
- **Border:** 1px solid `borderLight`

### Badges

#### Bestseller
- **Background:** `rgba(40, 201, 191, 0.1)`
- **Text:** `primary`
- **Border Radius:** `full` (9999px)
- **Padding:** `xxs` (4px) vertical, `sm` (12px) horizontal
- **Font:** `semibold`, `caption` size

#### Verification Badge
- **Background:** `verified`
- **Icon:** ✓ (checkmark)
- **Border Radius:** `full`
- **Size:** 20x20px

### Input Fields

- **Border:** 1px solid `border`
- **Border Radius:** `md` (12px)
- **Padding:** `md` (16px)
- **Font:** `body` size, `regular` weight
- **Background:** `surface`
- **Focus:** Border `primary`, shadow `xs`

---

## 🎬 Animações

### Timing Functions
- **Ease Out:** Para entradas (elementos aparecendo)
- **Ease In:** Para saídas (elementos desaparecendo)
- **Ease In Out:** Para mudanças de estado

### Durações Recomendadas
- **Rápido:** 150ms (hover states, highlights)
- **Médio:** 300ms (transições de tela, modals)
- **Lento:** 500ms (animações complexas, loading)

### Animações Comuns
- **Fade In:** `opacity: 0 → 1` em 300ms
- **Slide Up:** `translateY: 20 → 0` em 300ms
- **Scale:** `scale: 0.95 → 1` em 150ms (botões)

---

## 📱 Responsividade

### Breakpoints (Planejado para Web)
```typescript
breakpoints: {
  mobile: 0
  tablet: 768
  desktop: 1024
  wide: 1440
}
```

### Paddings por Tela
- **Mobile:** `md` (16px) nas laterais
- **Tablet:** `lg` (24px)
- **Desktop:** `xl` (32px)

---

## ✅ Uso no Código

```tsx
import { theme } from '../theme/theme';

// Exemplo: Botão Primário
<TouchableOpacity
  style={{
    background: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.button,
  }}
>
  <Text style={{
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.bold,
  }}>
    Reservar Agora
  </Text>
</TouchableOpacity>
```

---

## 🎯 Princípios de Design

1. **Consistência:** Use sempre os mesmos tokens para situações similares
2. **Hierarquia Visual:** Use tamanhos, pesos e cores para guiar o olhar
3. **Espaçamento Generoso:** Use `lg` ou `xl` para separar seções
4. **Contrast Ratio:** Mínimo 4.5:1 para texto normal (WCAG AA)
5. **Mobile-First:** Design para telas pequenas primeiro

---

## 📚 Referências

- **Código Fonte:** [`src/theme/theme.ts`](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/src/theme/theme.ts)
- **Descritivo Completo:** [`docs/DESCRITIVO_COMPLETO.md`](file:///Users/diegoartur/Documents/Diego%20Artur/codigos/VAMO/docs/DESCRITIVO_COMPLETO.md)

---

© 2026 VAMO — Design System v1.0
