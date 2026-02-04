# Services

Esta pasta está preparada para conter os serviços de integração com backend.

## Estrutura Sugerida

Quando conectar com a API:

```
src/services/
├── api.ts           # Configuração do cliente HTTP (Axios/Fetch)
├── auth.ts          # Autenticação e tokens
├── packages.ts      # Endpoints de pacotes
├── itineraries.ts   # Endpoints de roteiros
├── creators.ts      # Endpoints de criadores
└── reviews.ts       # Endpoints de avaliações
```

## Exemplo

```typescript
// api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

export default api;
```

```typescript
// packages.ts
import api from './api';

export const getPackages = async () => {
  const response = await api.get('/packages');
  return response.data;
};
```

---

**Status:** 📦 Preparado para uso futuro
