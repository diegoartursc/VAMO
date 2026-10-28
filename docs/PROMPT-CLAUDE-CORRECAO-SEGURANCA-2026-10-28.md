# Prompt para Claude/Fable — corrigir e reauditar a segurança do VAMO

Copie o texto abaixo para uma sessão do Claude/Fable com acesso ao repositório VAMO. O relatório complementar está em `docs/ANALISE-SEGURANCA-2026-10-28.md`.

---

Você vai executar a correção de segurança do VAMO e depois fazer uma nova auditoria adversarial do resultado. Implemente as mudanças, crie testes que demonstrem os ataques e verifique os fluxos legítimos. Não entregue apenas diagnóstico, plano ou recomendações. Não conclua “está OK” com base apenas em build, lint, npm audit ou testes que reproduzem a própria implementação.

## Contexto e limites autorizados

O VAMO é um monorepo: backend Express 4 + Prisma/PostgreSQL em `apps/backend`, site/admin Next.js em `apps/site`, app Expo/React Native em `apps/mobile` e lógica em `packages/shared`. Preserve a stack, funcionalidades, previews, acesso legítimo a compras, snapshots, identidade visual e regras de moeda/comissão compartilhadas. Corrija as causas, sem refatoração ampla.

Leia `AGENTS.md`, `CLAUDE.md`, `docs/ANALISE-SEGURANCA-2026-10-28.md`, os manifests e os arquivos afetados. Confira `git status` e o commit atual. A análise original usou o commit `25823d4`; linhas e diagnósticos precisam ser reconfirmados se o código mudou. Não sobrescreva trabalho existente.

**Instrução explícita para esta tarefa:** o boot automático definido em `CLAUDE.md`/hooks não deve iniciar uma API ou jobs conectados ao banco real durante testes de segurança. Primeiro prepare ambiente isolado e verifique os destinos sem revelar credenciais. Não execute `scripts/health.sh`, `audit-prod.ts`, seeds, scripts e2e, `npm start` ou comandos que alcancem produção como parte dos testes. O `npm start` do backend aplica migrations. Nunca use `.env` real implicitamente nos testes.

Use Prisma e Stripe simulados para os testes unitários/HTTP e, se necessário, um banco de teste descartável separado, sem acesso a dados reais. Assinaturas Stripe podem ser geradas offline com segredos sintéticos. Proíba saída de rede real para banco, SMTP, storage e provedor nos testes. Não imprima senhas, tokens, chaves, URLs de documentos ou valores de ambiente.

Está autorizado implementar e validar correções locais, testes, migrations aditivas geradas offline, ferramentas de migração em dry-run e documentação. Não faça push, merge, deploy, cobrança, estorno, transferência, rotação de segredo real ou escrita em banco/bucket de produção. Prepare esses passos concretamente, com diff, inventário redigido, validação, rollback e uma lista final de operações que dependem de autorização. Continue todo o trabalho independente enquanto houver dependência externa.

Não use `prisma migrate dev`, `migrate reset`, `db push`, seed, `git reset --hard`, `push --force` ou reescrita de histórico. Migrations devem ser SQL offline versionado e revisado. Não remova registros financeiros, usuários ou conteúdo para “resolver” segurança. Não aplique `npm audit fix --force` nem faça downgrade/migração ampla de Expo às cegas.

## Método obrigatório

1. Reconfirme cada SEC abaixo e monte uma tabela de estado. Diferencie reproduzido, confirmado por leitura, condicional, já corrigido e não aplicável, com evidência.
2. Antes de alterar cada causa, escreva um teste negativo que falhe por causa da brecha atual, usando o middleware/handler/parser real quando aplicável. Rode e registre a falha esperada. Não substitua a autorização real por um mock que já devolve 401.
3. Implemente em grupos pequenos, com contratos explícitos e atualizações coordenadas dos clientes.
4. Rode os mesmos testes e também os fluxos positivos. Preserve os testes existentes; não relaxe assertions, apague cenários ou introduza skips para ficar verde.
5. Ao terminar, faça uma segunda auditoria com foco em caminhos alternativos e falhas das próprias correções. Use um subagente revisor com contexto novo, se disponível; ele deve revisar o diff e tentar invalidar as conclusões antes de ver sua declaração de sucesso. Se não houver subagente, faça uma passagem separada sem editar, registre suas limitações e execute novos ataques negativos.
6. Corrija todo novo achado relevante e repita a verificação afetada. Se depender de produção ou decisão de negócio indispensável, registre a pendência com precisão; não declare o sistema aprovado nessa dimensão.

## Correções exigidas

### 1. Tokens e sessões — SEC-01 e SEC-07

Arquivos iniciais: `apps/backend/src/lib/auth.ts`, `middleware/traveler-auth.ts`, `middleware/auth.ts`, `middleware/admin-auth.ts`, `routes/traveler-auth.ts`, `routes/admin.ts`, scripts de reset e clientes de sessão.

Hoje access, refresh e arquivo compartilham segredo e não têm validação obrigatória de finalidade nas rotas de sessão. O JWT de arquivo tem `travelerId`; o middleware aceita esse JWT como Bearer, e o refresh também aceita access/file. Access continua válido após troca de senha. Reset administrativo de traveler não atualiza `passwordChangedAt`; reset de admin não revoga JWT emitido.

Implemente emissão e validação específicas por finalidade, algoritmo permitido, issuer/audience e claims obrigatórias com tipos estritos. Tokens de arquivo devem ter escopo de um único arquivo/dono e expiração curta; não podem acessar conta, admin ou refresh. Auth opcional deve aplicar a mesma validação de sessão. Inclua todos os validadores manuais de `traveler-auth.ts` (GET/PATCH /me e `authTravelerIdFromHeader` no upload de avatar/capa), além dos middlewares; busque todos os consumidores de `verifyToken`/`jwt.verify`. Rejeite tokens legados sem finalidade com estratégia explícita de encerramento/relogin. Inclua estratégia de refresh rotativo, detecção de reuso e revogação de sessões; encerrar no servidor ao trocar senha e nos scripts, inclusive admin, e implementar logout coerente nos clientes. Não basta acrescentar `purpose` apenas na emissão.

Teste matriz access/refresh/file/admin em cada verificador e endpoint: tipo errado, assinatura errada, expirado, algoritmo/issuer/audience inválidos, claims faltantes, dono/arquivo trocados e sessão revogada. Inclua as duas implementações administrativas: `verifyAdmin` em `routes/admin.ts` e `middleware/admin-auth.ts`. Teste reset e logout com credenciais previamente emitidas, inclusive borda de segundo do timestamp e requisições simultâneas de refresh. Mostre que refresh válido funciona, token antigo/reutilizado não e arquivo legítimo continua abrindo para o dono.

### 2. Respostas públicas e documentos — SEC-02, SEC-03, SEC-04 e SEC-05

Arquivos iniciais: `routes/itineraries.ts`, `routes/creators.ts`, `routes/shares.ts`, `routes/my-trips.ts`, `routes/traveler-trip-center.ts`, `lib/storage.ts`, `routes/uploads.ts` e `src/index.ts`; verifique também snapshots, exports e clientes.

- O detalhe público de roteiro ACTIVE entrega dias/atividades/dicas/checklists/arquivos completos sem compra. A listagem também repassa módulos JSON. Defina DTOs separados para catálogo/prévia, dono, comprador e admin, com listas explícitas de campos. Preserve a prévia necessária ao marketplace e proteja conteúdo integral por compra/propriedade. Revise todos os endpoints alternativos e o storage de anexos pagos.
- `travelProofUrl` e `cost.proofFiles` administrativos vazam em respostas públicas/compradas e snapshots. Separe mídias públicas, conteúdo pago e documentos privados. Autorize comprovantes apenas a dono/admin. Sanitize profundamente campos aninhados e snapshots legados na leitura; não altere indiscriminadamente os snapshots históricos no banco. URL pública conhecida não pode continuar funcionando depois da migração.
- `/api/itineraries/dashboard/stats?creatorId=...` é anônimo e consulta outro criador, incluindo receita e rascunhos. Exija sessão e derive ownership do token/DB; não aceite um ID arbitrário como autorização. Administração deve ter fluxo próprio. Dados públicos de reputação precisam de DTO público distinto.
- O bloqueio literal de `TravelerFile` em `/uploads/itineraries/:filename` é burlado por dupla barra e encoding antes do `express.static`. Tire arquivos privados da raiz estática. Enquanto houver legado, autorização e resolução de caminho precisam usar a mesma forma canônica e falhar fechadas.

Crie testes com anônimo, usuário A, usuário B, comprador, criador dono e admin. Cheque status e o corpo completo: nenhum segredo deve aparecer em nenhuma profundidade, nem sob nome alternativo. Inclua rascunho/rejeitado/arquivado, listagem/destaque, detalhe, shares, snapshots antigos, exports e acesso direto ao objeto. Teste `/uploads/itineraries//arquivo.pdf`, `/uploads/%69tineraries/arquivo.pdf`, outras variantes de encoding e GET/HEAD. Teste links expirados e acesso ao arquivo de outra conta.

Prepare ferramenta de migração de documentos já públicos com dry-run padrão: classificação, referências, cópia verificada privada, troca de referência, revogação da origem e rollback. Não delete/mova documentos reais nesta execução. Registre a implantação/migração pendente como bloqueio de proteção efetiva dos objetos anteriores.

### 3. Ambientes e acesso administrativo — SEC-06, SEC-10 e SEC-16

- Remova a aceitação de `mock-admin-token` e a criação automática de SUPER_ADMIN via esse caminho. Teste que nenhuma combinação de `NODE_ENV`, IP ou header o habilita. Preserve login administrativo legítimo e bootstrap controlado, sem recriar seed de dados.
- Webhook deve exigir assinatura válida sobre corpo bruto em todos os ambientes que usam a integração real. Não aceite evento JSON não assinado por `NODE_ENV`. Compras demonstrativas devem ficar impossíveis contra banco/Stripe reais, mesmo com configuração de desenvolvimento ou flag acidental.
- Valide configuração antes de abrir listener/iniciar jobs; falhe fechado para combinações inseguras e documente os requisitos. Use credenciais/destinos separados; não confie só na etiqueta `NODE_ENV`. Atualize `.env.example` sem valores reais e mantenha instruções de inicialização coerentes.
- Valide tipos/tamanhos no login/seed admin antes de Prisma/bcrypt. No Express 4, encaminhe rejeições async ao error handler de forma consistente em handlers e middlewares. Não faça migração de framework para contornar esse problema. Teste senha objeto/array, e-mail inválido, corpo ausente, falha Prisma, falha bcrypt e serviço vivo após cada erro; nenhuma rejeição não tratada.
- `.claude/settings.json` tem um par de login/senha embutido no hook. Remova os valores e procure segredos no checkout e histórico com saída redigida. Não teste a credencial real nem a copie para relatório. Documente possível rotação/revogação se ainda válida/reutilizada; prepare o procedimento sem executar em produção ou reescrever Git.

### 4. Upload e dependências — SEC-08 e SEC-09

`routes/uploads.ts` combina memoryStorage cloud, 20 arquivos e 100 MiB por arquivo, permitindo aproximadamente 2 GiB por requisição, num serviço documentado com 512 MB.

Imponha limites no servidor de bytes por arquivo e agregado, quantidade, campos/partes, concorrência e quota. Faça rejeição precoce e limpeza ao abortar/falhar. Prefira streaming ou upload direto autorizado com restrições verificadas, preservando os formatos e a experiência legítima. Faça o orçamento de memória explícito; não use limite de frontend como defesa. Revise documentos da Central da Viagem e crescimento de storage/DB. Testes devem usar limites pequenos configuráveis e streams sintéticos, nunca cargas grandes na produção.

Multer `1.4.5-lts.2` instalado está afetado pelo aviso oficial GHSA-wc9g-mqfw-jrwm. Atualize para versão suportada que cubra os avisos atuais, incluindo os posteriores à 2.3.0, com validação de compatibilidade dos parsers/limpeza/assinatura de arquivo. Reexecute `npm audit --omit=dev --json` geral e por workspace. A consulta original encontrou 18 entradas no geral e 2 no backend, mas isso muda com o tempo. Zod/qs e dependências de ferramentas Expo precisam de triagem de alcance, atualizações compatíveis e evidência; não afirme que todo aviso corresponde a exploit no app. Confira versão instalada e lockfile, além do manifesto. Não restaure Next/Nodemailer antigos: já estavam em 16.4.3/10.2.1 na análise.

### 5. Dinheiro, estados e repasses — SEC-11, SEC-12, SEC-13 e SEC-15

Arquivos iniciais: `routes/payments.ts`, `jobs/payouts.ts`, `prisma/schema.prisma`, autorização pós-compra, relatórios do criador/admin e testes.

- O webhook só trata checkout pago e ignora estorno, disputa e reversão. Persista estados e IDs do provedor para conciliação, idempotência, eventos duplicados/fora de ordem, processamento confiável e retries. Vincule cada evento à venda/pagamento correto; não libere compra apenas por conteúdo de um JSON. Preserve validação de assinatura e checagem de identidade no retorno do checkout.
- Vendas já transferidas precisam de tratamento de estorno/disputa/reversão. Suspenda novos repasses de vendas em risco. Para recuperar transferência quando devida, trate valor proporcional, limites, saldo insuficiente, retries persistidos e alerta de intervenção. Siga a política de disputa: aceitar pode exigir reversão imediata; contestar depende do desfecho. Não reverta indiscriminadamente toda disputa criada. Se faltar uma decisão indispensável, prepare implementação segura e isole o ponto para decisão.
- A política de acesso após estorno total/parcial/disputa deve ser explícita, refletida no servidor e nos relatórios. Não apague a venda para esconder histórico. Estorno total não pode continuar sendo tratado como venda paga válida por simples existência da linha; parcial/disputa não podem causar exclusão indiscriminada de direitos sem política definida.
- `refundPaymentIntentIfNeeded` considera qualquer refund succeeded/pending como total devolvido, mesmo de 1 centavo. Calcule montante realmente devolvido/restante e valores pendentes/reservados; diferencie pendente, concluído e falhou. Trate concorrência, paginação e idempotência. Um refund total pendente é iniciação válida: persista-o, confirme recebimento com 2xx e acompanhe via eventos/conciliação; não crie outro refund nem provoque retry contínuo só por ainda estar pending. Distinga e-mails de início e de conclusão; o corpo atual já diz que o refund foi iniciado, mas o título antecipa conclusão.
- Congele e valide valor, moeda, comissão e destinatário no pedido/venda a partir da transação confirmada. O fulfillment não pode usar preço atual do roteiro para uma sessão antiga; payout não pode usar moeda atual do roteiro nem recalcular comissão vigente de uma venda histórica. Use unidades mínimas inteiras conforme a moeda. Preserve comissões legadas e faça plano explícito para dados antigos.
- A varredura de payout sempre pega as 50 vendas mais antigas sem transferência. Vendas estornadas/disputadas ou Connect incompleto ficam no início para sempre. Implemente paginação determinística/estados de tentativa para que inelegíveis não bloqueiem as seguintes.

Testes mínimos: checkout simultâneo; retorno + webhook repetidos; replay/ordem invertida; valor/moeda divergentes; preço alterado durante checkout; moeda e comissão alteradas depois; comissão histórica; falha antes/depois de persistir; refund parcial, total, pendente, falho e concorrente; disputa aberta/ganha/perdida; estorno antes/depois do repasse; reversão parcial/repetida/falha; restart do worker; mais de 50 inelegíveis antes de uma elegível. Nenhuma operação deve cobrar, estornar ou transferir dinheiro real.

**Preserve correções já existentes:** há idempotency key de checkout e detecção/estorno de PaymentIntent duplicado; falha de refund por roteiro indisponível já devolve 500 no webhook para retry; existe job de repasse. Não reintroduza bugs nem apresente essas proteções como ausentes. Amplie testes de integração das causas remanescentes.

### 6. Integridade de confiança — SEC-14

Criador pode enviar `featured` e `cost.proofStatus=approved`; o selo “Verified by VAMO” usa esse status.

Defina schemas/listas de escrita por papel, inclusive para JSON aninhado. Destaque e decisões de comprovação são exclusivos do admin/backend; desconsidere/rejeite valores enviados pelo criador. Invalide aprovação quando mudar valor, arquivo ou conteúdo associado. Teste payload completo, PATCH/PUT parcial, objetos aninhados, campo omitido, mudança após aprovação e caminho administrativo legítimo.

## Nova auditoria e critério de aceite

Depois das correções, procure caminhos alternativos de tomada de conta, IDOR, mass assignment, autorização por papel, exposição de documentos, XSS/URLs/PDF, uploads, abuso de recursos, segredos e falhas financeiras. Uma observação sem reprodução deve ser identificada como tal. localStorage não é prova de XSS, e ausência de SSRF encontrado não certifica ausência de SSRF.

Execute e registre:

- Typecheck dos três apps e shared conforme sua configuração real; lint/build relevantes em ambiente isolado. Não esconda erro com `ignoreBuildErrors`.
- Testes existentes e novos de segurança, com comandos, contagens e resultados; evidência “falha antes / passa depois”.
- Testes HTTP dos middlewares/rotas montadas, não só helpers puros. Separe criação do app do listener/jobs se necessário para permitir testes sem efeitos.
- Fluxos positivos: cadastro/login/refresh/logout, reset, admin, catálogo/prévia, edição/submissão/aprovação, compra, conteúdo autorizado, documento privado, upload e repasse simulado.
- Auditoria de dependências e busca de segredos sem revelar valores. Para cada aviso remanescente, documente pacote, alcance, mitigação e pendência; não confunda contagem npm com número de falhas exploráveis.
- Revisão independente do diff e dos testes. Corrija os achados e repita a verificação necessária.

Entregue `docs/SEGURANCA-POS-CORRECAO-<data>.md` com a tabela SEC-01 a SEC-16 contendo causa, mudança, arquivos/linhas atuais, teste que a comprova e status. Use somente: **corrigido e validado**, **já corrigido com evidência**, **condicional/não aplicável com justificativa**, **pendente de operação externa** ou **não corrigido**. Acrescente novos achados encontrados pela revisão.

Entregue também checklist de implantação: variáveis necessárias sem valores, ordem de migrations/deploy, encerramento dos tokens antigos, migração/revogação de documentos públicos, conciliação de pagamentos anteriores, verificação de RLS/buckets/headers/origens/proxy realmente publicados, smoke tests seguros e rollback que não reabra a brecha. Se os repositórios espelhados `VAMOsite`/`adminVAMO` ainda forem usados, identifique como sincronizar a correção; não altere outros repositórios ou faça publicação automaticamente.

Conclua com parecer objetivo em três dimensões:

1. **Código local:** aprovado ou reprovado nos cenários efetivamente testados, com limitações.
2. **Homologação:** validada ou pendente, indicando o que faltou executar.
3. **Produção:** validada, pendente de implantação/configuração ou reprovada; não inferir pelo estado local.

Só declare as brechas corrigidas quando houver evidências. Falta de credencial/ambiente é uma pendência, nunca um teste aprovado. Termine informando riscos residuais e operações exatas que exigem autorização, após deixar todo o trabalho local concreto e revisável. Não prometa segurança absoluta.
