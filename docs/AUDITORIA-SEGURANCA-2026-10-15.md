# Auditoria de bugs e segurança — VAMO

Data: 15/10/2026. Escopo: código local do backend Express/Prisma, site Next.js, app Expo e pacote compartilhado, incluindo as alterações locais já existentes.

**Resultado:** há falhas de controle de acesso e de pagamentos que devem ser corrigidas antes de considerar o lançamento seguro. Esta revisão não certifica ausência de outras vulnerabilidades nem confirma qual versão está publicada.

Nenhum código de aplicação, dependência, dado real ou configuração de produção foi alterado. Os testes de reprodução usaram chaves fictícias, Prisma simulado e Stripe simulado; não fizeram compras, estornos ou acessos ao banco real. Os arquivos de ambiente foram inspecionados sem reproduzir credenciais. Não houve teste de carga, exploração dos serviços publicados ou inspeção dos painéis de hospedagem.

**Verificações realizadas**

- TypeScript: backend e site passaram em `tsc --noEmit`; mobile apresentou o erro descrito no item 14.
- Testes existentes: 290 passaram, zero falhas. Foram executados os testes unitários/de contrato em backend, shared e mobile; não o script `e2e-complete.ts`.
- Testes adicionais isolados confirmaram: token de arquivo aceito como login e como refresh; dados pagos e comprovante na resposta anônima; bypass de admin em desenvolvimento; segundo pagamento ignorado; webhook confirmado mesmo quando o estorno falha.
- `npm audit --omit=dev --json`: 57 entradas afetadas na árvore de dependências — 4 críticas, 35 altas, 16 moderadas e 2 baixas. Isso NÃO significa 57 vulnerabilidades distintas exploráveis no app: há propagação entre pacotes, ferramentas de build e condições específicas de exploração.
- Auditoria específica de `apps/backend`: 5 entradas — 1 crítica, 2 altas, 1 moderada e 1 baixa. O Multer instalado não foi listado nessa resposta do npm; sua vulnerabilidade foi confirmada separadamente por versão e aviso oficial.
- Os `.env` reais não estão rastreados no estado atual do Git. Isso não equivale a uma auditoria de todo o histórico de commits.

**Lista de bugs e vulnerabilidades**

1. **Crítica — token de arquivo permite atuar como o dono da conta. Confirmado por teste isolado.**

   O JWT criado para abrir um documento contém `travelerId` e `purpose: traveler-file`, mas os validadores gerais só verificam assinatura e presença de `travelerId`. Quem obtiver um link válido de arquivo pode reaproveitar seu token como Bearer em rotas de conta. Também confirmei que `/auth/traveler/refresh` emite um novo access token a partir desse token de arquivo. Não é necessário conhecer a chave de assinatura. A condição de exploração é obter um link válido pertencente à vítima.

   Evidências: `apps/backend/src/lib/auth.ts:22`, `:32`, `:40`; `apps/backend/src/middleware/traveler-auth.ts:27`; `apps/backend/src/middleware/auth.ts:66`; `apps/backend/src/routes/traveler-auth.ts:189`; geração do link em `apps/backend/src/routes/traveler-trip-center.ts:88`.

   Correção: validadores distintos para access, refresh e arquivo, com finalidade/audience obrigatórias e rejeição de outros tipos em TODAS as rotas. Rotacionar refresh tokens, registrar sessões e invalidar os tokens anteriores ao implantar a correção. Apenas acrescentar o campo no emissor não resolve.

2. **Crítica — roteiro pago é entregue pela API pública sem compra. Confirmado por teste isolado.**

   `GET /api/itineraries/:id` permite acesso anônimo a um roteiro ACTIVE e devolve dias, atividades, dicas, hospedagens, transportes, checklists e URLs de arquivos. Existe uma rota protegida `/purchased`, mas a rota pública já entrega o conteúdo que deveria depender da compra. O bloqueio visual no frontend não protege a resposta HTTP.

   Evidências: `apps/backend/src/routes/itineraries.ts:877`, `:970`, `:987`, `:998`. A listagem também entrega módulos JSON completos em `:92`.

   Correção: definir uma resposta pública com campos explicitamente permitidos e apenas prévias; entregar conteúdo integral após checar compra ou propriedade. Arquivos pagos precisam de storage privado e acesso autorizado, para que ocultar a URL na API não seja a única proteção.

3. **Crítica — comprovantes de viagem destinados ao admin são públicos. Confirmado por teste isolado.**

   A resposta anônima inclui `travelProofUrl`. O próprio editor descreve esse comprovante como “admin-only”, mas seu upload usa a infraestrutura pública. Documentos podem conter nome, código de reserva e outros dados pessoais, dependendo do arquivo enviado. Os objetos `cost` também são repassados sem retirar `proofFiles`.

   Evidências: `apps/backend/src/routes/itineraries.ts:962` e `:919`; `apps/mobile/app/new-itinerary.tsx:421` e `:1375`; `apps/backend/src/lib/storage.ts:64`. O payload pós-compra também inclui `travelProofUrl` em `apps/backend/src/routes/itineraries.ts:564`.

   Correção: retirar comprovantes administrativos de respostas públicas e de compradores; mover os arquivos para bucket privado e autorizar somente dono/admin. Migrar arquivos existentes e revogar as URLs públicas antigas — ocultar apenas o campo não remove a exposição anterior.

4. **Alta — atalhos de desenvolvimento operam sobre banco remoto. Condição local confirmada; bypass de admin reproduzido com banco simulado.**

   O `.env` local usa `NODE_ENV=development`, banco remoto e Stripe configurado, sem segredo de webhook. Nesse modo, um token fixo permite acesso administrativo; `/purchase` registra compra sem pagamento; e o webhook aceita JSON sem assinatura. O servidor usa `app.listen(PORT)` sem restringir explicitamente a interface. O alcance pela rede depende da exposição da máquina e do firewall; não foi testado. A documentação local informa que o banco em uso é o de produção.

   Evidências: `apps/backend/src/routes/admin.ts:25`; `apps/backend/src/routes/itineraries.ts:1832`; `apps/backend/src/routes/payments.ts:424`; `apps/backend/src/index.ts:166`; configuração local e `CLAUDE.md`.

   Correção: remover o bypass administrativo; exigir assinatura de webhook em qualquer ambiente; usar somente banco e Stripe de teste em desenvolvimento; bloquear inicialização com combinações inseguras. O fato de o servidor publicado usar `NODE_ENV=production` não protege o mesmo banco contra uma instância local permissiva.

5. **Alta — redefinir senha não encerra imediatamente sessões comprometidas. Confirmado por leitura do fluxo.**

   `passwordChangedAt` é checado somente na renovação. Access tokens continuam aceitos pelo prazo configurado, de 24 horas por padrão. Refresh tokens também são aceitos diretamente como Bearer pelo problema do item 1 e podem conservar acesso por até 7 dias por padrão. Logout remove a sessão do aparelho, sem revogar a credencial no servidor.

   Evidências: `apps/backend/src/routes/traveler-auth.ts:213` e `:351`; `apps/backend/src/middleware/traveler-auth.ts`; `apps/backend/src/lib/auth.ts:8`.

   Correção: verificar versão/revogação da sessão em cada autorização, encerrar sessões ao trocar senha, separar refresh de access e reduzir a duração do access token. Acrescentar “sair de todos os dispositivos”.

6. **Alta — dependências instaladas com vulnerabilidades conhecidas. Confirmado por inventário e avisos oficiais; exploração não executada.**

   O projeto fixa Next.js 16.1.6 e instala Multer 1.4.5-lts.2 e Nodemailer 6.10.1. O audit reporta Next como crítico e Nodemailer como alto. O Multer está no intervalo afetado por falhas que derrubam o processo ao analisar multipart malformado. Neste projeto, os uploads exigem autenticação; isso limita o acesso ao parser, mas o cadastro é aberto.

   Evidências: `apps/site/package.json`, `apps/backend/package.json`, `package-lock.json` e `npm ls multer stripe --workspace=apps/backend`.

   Referências primárias: [Multer: crash no parser multipart](https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm), [Multer: correção posterior de limpeza de uploads](https://github.com/expressjs/multer/security/advisories/GHSA-3pph-fpjx-jg34), [Next.js: DoS em Server Components](https://github.com/vercel/next.js/security/advisories/GHSA-q4gf-8mx6-v5v3).

   Correção: atualizar e validar os pacotes por workspace. O audit desta revisão indica Next 16.4.2 e Nodemailer 10.1.1 como candidatos de correção; o Multer deve usar versão atual corrigida, levando em conta os avisos posteriores à 2.3.0. Verificar novamente os avisos na implementação. Não aplicar automaticamente `npm audit fix --force`, pois as mudanças sugeridas para Expo/React Native e Nodemailer envolvem compatibilidade. A presença de um pacote afetado não prova que todas as suas CVEs sejam exploráveis nesta configuração.

7. **Alta — uploads podem exceder a memória disponível e derrubar a API. Confirmado pelo código; não houve teste de carga.**

   Com cloud storage ativo, `/uploads/multiple` usa `memoryStorage()` e admite 20 arquivos de até 100 MiB cada: aproximadamente 2 GiB em uma requisição, antes de overhead. O espelho da configuração do Render documenta 512 MB de RAM. O limite por quantidade de requisições não limita o volume total nem a simultaneidade de uploads. Qualquer traveler autenticado chega a essa rota.

   Evidências: `apps/backend/src/routes/uploads.ts:30`, `:56`, `:60`, `:187`; `render.yaml:9`.

   Correção: limitar bytes totais, quantidade, campos multipart e concorrência; estabelecer cota por usuário; preferir upload direto autorizado para storage ou streaming. Documentos privados de até 50 MiB também são carregados em memória e gravados como bytes no PostgreSQL, em `traveler-trip-center.ts`.

8. **Alta — dois checkouts podem cobrar duas vezes e gerar uma única compra. Tratamento do segundo pagamento reproduzido com Stripe simulado.**

   A criação da sessão só consulta se já existe venda; não há pedido pendente persistido nem idempotência na criação de Checkout Session. Duas abas, ou uma repetição antes da confirmação, podem criar sessões diferentes. Ao receber o segundo pagamento, o fulfillment encontra a primeira venda e retorna “já comprado”, sem comparar `paymentIntentId` nem estornar o segundo pagamento. O índice único evita duplicidade no banco, mas não duplicidade na cobrança.

   Evidências: `apps/backend/src/routes/payments.ts:151`, `:155`, `:295`, `:320`.

   Correção: registrar pedido/sessão e identificadores do provedor; reutilizar checkout pendente; deduplicar eventos e pagamentos separadamente; reconciliar e estornar pagamento adicional confirmado.

9. **Alta — falha de estorno é confirmada ao Stripe como sucesso. Confirmado por teste isolado.**

   Se um roteiro for pausado durante o checkout, o código tenta estornar. Se `refunds.create` falha, retorna `refunded=false`, mas o webhook captura `PurchaseBlockedError` e ainda responde HTTP 200 com `received=true`. Sem retry persistido, o comprador pode ficar sem roteiro e sem estorno automático.

   Evidências: `apps/backend/src/routes/payments.ts:73`, `:191`, `:464`, `:476`.

   Correção: persistir estorno pendente e tentar novamente por fila/worker; enquanto a falha não estiver registrada para processamento confiável, responder com falha transitória. Só confirmar que houve reembolso conforme o estado efetivo do provedor. [Documentação oficial de webhooks e entregas do Stripe](https://docs.stripe.com/webhooks).

10. **Alta — erros assíncronos em rotas de admin podem escapar do tratamento global. Confirmado por leitura; não foi provocado crash no servidor.**

    O projeto usa Express 4. O login de admin chama Prisma e bcrypt em um handler `async` sem `try/catch` ou wrapper. O payload só é checado por presença: um objeto no lugar de email/senha, ou uma falha de banco, pode rejeitar a Promise. Express 4 não encaminha automaticamente essa rejeição ao middleware global; no comportamento padrão de Node sem handler apropriado, ela pode encerrar o processo. Há o mesmo padrão em outras rotas administrativas.

    Evidências: `apps/backend/src/routes/admin.ts:66`, `:87`, `:409`, `:419`; middleware global em `apps/backend/src/index.ts`.

    Correção: validar payloads e centralizar wrappers que chamem `next(error)`; revisar todos os handlers assíncronos. [Tratamento de erros no Express](https://expressjs.com/en/guide/error-handling/).

11. **Média — valor da venda e comissão podem divergir do pagamento. Confirmado por leitura.**

    O checkout fixa o preço na criação da sessão, mas o fulfillment grava `itinerary.price` atual, não o valor confirmado pelo Stripe. Se o preço mudar e o roteiro voltar a ACTIVE antes de concluir uma sessão antiga, cobrança, registro de receita e comissão podem divergir. A moeda histórica também não possui uma fonte única utilizada por todos os relatórios.

    Evidências: `apps/backend/src/routes/payments.ts:199`, `:210`, `:211`, `:322`; `apps/backend/src/routes/creators.ts:168` fixa AUD nas transações.

    Correção: persistir preço, moeda e comissão no pedido; validar o pagamento contra esse pedido e usar os valores históricos em relatórios. Tratar moedas em unidades mínimas conforme as regras do provedor.

12. **Média — campos de confiança são aceitos do criador. Confirmado por leitura.**

    O criador pode enviar `featured=true`, inclusive numa atualização isolada que não entra em `hasContentUpdate`. Também pode enviar `cost.proofStatus='approved'` em objetos de custo que são persistidos integralmente. A apresentação compartilhada considera `proofStatus='approved'` como verificado pela VAMO. Alterar conteúdo normalmente força revisão, mas a aprovação geral do roteiro não reconstrói esses campos a partir de decisões administrativas confiáveis.

    Evidências: `apps/backend/src/routes/itineraries.ts:1096`, `:1369`, `:1564`, `:1709`; `packages/shared/itinerary/cost.ts:230`; decisão administrativa em `apps/backend/src/routes/admin.ts:635`.

    Correção: campos de destaque e decisões de comprovação devem ser escritos exclusivamente pelo backend/admin. Invalidar a aprovação de um comprovante quando seu conteúdo ou valor mudar. Validar payloads aninhados por schemas permitidos.

13. **Média — taxas de câmbio editadas podem sumir após deploy ou divergir entre instâncias. Confirmado por leitura; depende do storage da hospedagem.**

    As taxas são salvas em `data/currency-rates.json`. Sem disco persistente, a próxima instância volta aos valores fixos do código; com múltiplas instâncias, cada uma pode ter taxas diferentes. A configuração versionada não declara disco persistente. O estado atual do painel Render não foi inspecionado.

    Evidências: `apps/backend/src/routes/rates.ts:9`, `:58`, `:96`; `render.yaml`.

    Correção: salvar no PostgreSQL, com moeda-base, histórico, data e autor da alteração. Não permitir alterar a paridade da moeda-base de forma incoerente.

14. **Média — checagem TypeScript do mobile falha. Confirmado executando o compilador.**

    `VamoButton` passa `string | null` a `borderColor`, que espera `ColorValue | undefined`. Erro TS2322 em `apps/mobile/src/components/common/VamoButton.tsx:91`, com origem no valor atribuído em `:97`.

    Correção: usar `undefined` ou cor válida no caso sem borda e tipar a paleta de estilos. A falha de tipos não prova, por si só, crash em runtime: o export do Expo pode transpilar sem essa checagem.

15. **Média — renovação de sessão inconsistente durante o uso. Confirmado por leitura.**

    O request central do mobile dispara logout ao receber 401, sem tentar refresh. O AuthContext tenta renovar ao carregar a sessão, e a Central da Viagem tem lógica própria, mas isso não cobre o uso contínuo nas demais telas. No site, o refresh token é salvo, porém o cliente central não implementa renovação. Resultado: token expirado pode interromper ações mesmo quando ainda há refresh válido.

    Evidências: `apps/mobile/src/services/api.ts:163`; `apps/mobile/src/contexts/AuthContext.tsx:94` e `:179`; `apps/site/src/lib/api.ts:20`; `apps/site/src/lib/auth.ts:26`.

    Correção: uma renovação centralizada, compartilhada por requisições simultâneas, seguida de uma única repetição da chamada; encerrar sessão se a renovação realmente falhar. Fazer isso depois da correção dos tipos e revogação dos tokens.

**Lista de sugestões para segurança e estabilidade**

1. **Separar desenvolvimento, homologação e produção.** Bancos, buckets e credenciais distintos; chave Stripe de teste fora de produção; validação obrigatória das variáveis na inicialização. Evitar que ausência de `NODE_ENV` habilite comportamento permissivo.
2. **Reforçar o login administrativo.** MFA, política de senha mais forte, limites por conta e IP, sessões revogáveis e auditoria das ações. Hoje o limite geral de 100 chamadas/15 minutos também mistura navegação normal com tentativas de login; dimensionar os dois controles separadamente, com armazenamento compartilhado se houver múltiplas instâncias.
3. **Proteger sessões web.** Avaliar cookies HttpOnly/Secure/SameSite por uma arquitetura de sessão apropriada, com proteção CSRF quando usar cookies. Hoje o site/admin e Expo web guardam tokens acessíveis por JavaScript. No nativo, manter SecureStore, que já está implementado. Adicionar CSP aos frontends; Helmet no backend não configura o HTML servido pelo Next/Vercel.
4. **Organizar storage por sensibilidade.** Mídia pública, conteúdo pago e documentos pessoais em áreas distintas; URLs assinadas curtas, quotas, limpeza de órfãos e validação de arquivos. Confirmar RLS e permissões reais do Supabase com conta de privilégio mínimo — essas políticas não foram verificadas nesta revisão.
5. **Completar a contabilidade de pagamentos.** Pedido persistido, conciliação, tratamento de estornos e disputas, alertas de divergência e testes com Stripe de teste. O código revisado faz onboarding Connect, mas não foi encontrado fluxo de transferência/repasses; definir e validar o processo antes de prometer repasse automático.
6. **Criar uma barreira de qualidade no deploy.** Typecheck dos três workspaces, testes de autorização, fluxo de compra/estorno, verificação de dependências e detecção de segredos. Não há configuração `.github` neste checkout. Incluir os cenários desta auditoria como regressões com banco e provedor isolados.
7. **Melhorar operação e recuperação.** Health check que diferencie processo vivo de dependências indisponíveis; alertas de erro/memória/latência/webhooks; backups com restauração testada. E-mails críticos devem sair por fila/outbox persistida: tarefas disparadas sem aguardar podem se perder no reinício.
8. **Limitar consultas e validar entradas.** Paginação nas listagens, tamanho máximo de textos/arrays, schemas de rotas compartilhados e respostas 4xx consistentes. Preservar logs úteis sem guardar tokens, links assinados ou documentos pessoais.

**Ordem sugerida de execução**

Primeiro: itens 1–4, para conter exposição e acesso indevido. Em seguida: revogação de sessões, atualização de dependências, uploads e tratamento de erros. Antes de aceitar pagamentos reais: corrigir idempotência, estornos e registro financeiro. Finalizar com os bugs de estabilidade e uma rodada de testes em homologação, incluindo validação das configurações efetivamente publicadas.

**Proteções já presentes e que devem ser preservadas**

Bcrypt para senhas; JWT_SECRET obrigatório; redefinição por token aleatório armazenado como hash e consumido em transação; checagem de propriedade em compras/arquivos/customizações; transação e índice único para a venda; Helmet; rate limiting; validação da assinatura inicial de arquivos; verificação de assinatura do Stripe quando configurada; SecureStore no nativo. Essas proteções são úteis, mas não compensam os caminhos alternativos descritos acima.
