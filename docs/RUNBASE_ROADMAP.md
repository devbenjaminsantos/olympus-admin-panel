# RunBase Roadmap

## Visao

RunBase e um sistema administrativo interno para gestao de clientes, planos e pedidos, com autenticacao segura, controle de acesso por roles e painel operacional baseado em dados reais.

O projeto possui frontend em Next.js, API em ASP.NET Core, Postgres gerenciado, RBAC, testes automatizados e deploy continuo.

## Decisao de Direcao

### Stack consolidada

- Frontend em Next.js, React e TypeScript.
- Backend em ASP.NET Core Web API e C#.
- Banco em Neon Postgres.
- Auth com JWT, refresh token e RBAC.
- Deploy via API containerizada e frontend na Vercel.
- CI/CD com GitHub Actions.

### Estrategia

O RunBase evolui de forma incremental, preservando os contratos de seguranca, as regras operacionais e a arquitetura em camadas ja consolidados.

## Roles

| Role    | Permissoes                                                                                     |
| ------- | ---------------------------------------------------------------------------------------------- |
| Admin   | Acesso total, incluindo usuarios, roles, planos, clientes, pedidos, dashboard e configuracoes. |
| Manager | Gerencia clientes, planos e pedidos. Visualiza dashboard. Nao gerencia usuarios Admin.         |
| Support | Visualiza clientes e pedidos. Atualiza status de pedidos.                                      |
| Viewer  | Acesso somente leitura ao dashboard e listas permitidas.                                       |

## Dominio Inicial

### Users

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `status`
- `createdAt`
- `updatedAt`

Regras:

- Usuario pode estar `Active` ou `Inactive`.
- Usuario inativo nao pode autenticar.
- Admin nao deve conseguir desativar a propria conta quando for o ultimo Admin ativo.

### Clients

- `id`
- `name`
- `email`
- `phone`
- `companyName`
- `status`
- `currentPlanId`
- `createdAt`
- `updatedAt`

Regras:

- Cliente pode estar `Active`, `Inactive` ou `Suspended`.
- Cliente pode existir sem plano ativo.
- Cliente pode ter multiplos pedidos.

### Plans

- `id`
- `name`
- `description`
- `price`
- `billingCycle`
- `isActive`
- `createdAt`
- `updatedAt`

Regras:

- Plano inativo nao pode ser usado em novos pedidos.
- Pedidos antigos preservam o valor contratado mesmo se o plano mudar depois.

### Orders

- `id`
- `clientId`
- `planId`
- `status`
- `amount`
- `notes`
- `createdAt`
- `updatedAt`

Regras:

- Status inicial recomendado: `Pending`.
- Status suportados no MVP: `Pending`, `Processing`, `Completed`, `Cancelled`, `Refunded`.
- Pedido deve registrar `amount` proprio para manter historico financeiro.

## Roadmap por Versões

### V0 - Repositorio e Direção

Objetivo: deixar claro que o projeto entrou na fase RunBase.

- [x] Registrar roadmap RunBase.
- [x] Atualizar README com a nova direcao.
- [x] Remover codigo legado apos consolidar a nova stack.
- [x] Definir estrutura inicial do monorepo.

Criterio de pronto:

- Qualquer pessoa abrindo o repo entende o que existe hoje, qual e o produto alvo e qual e a proxima etapa tecnica.

### V1 - Backend Foundation

Objetivo: criar a base ASP.NET Core Web API.

- [x] Criar solution `.NET`.
- [x] Criar projeto `RunBase.Api`.
- [x] Criar projetos de dominio/aplicacao se necessario, mantendo Clean Architecture leve.
- [x] Configurar Scalar para documentacao interativa da API.
- [x] Configurar health check.
- [x] Configurar connection string via environment variables.
- [x] Criar pipeline basico de build.

Estrutura sugerida:

```text
backend/
  src/
    RunBase.Api/
    RunBase.Application/
    RunBase.Domain/
    RunBase.Infrastructure/
  tests/
    RunBase.Application.Tests/
```

Criterio de pronto:

- API sobe localmente.
- Scalar abre.
- `/health` responde.
- Build passa via CLI.

### V2 - Auth, JWT e RBAC

Objetivo: implementar a base de seguranca antes dos CRUDs.

- [x] Criar entidade `User`.
- [x] Criar roles `Admin`, `Manager`, `Support`, `Viewer`.
- [x] Criar login.
- [x] Emitir JWT com claims de usuario e role.
- [x] Criar refresh token.
- [x] Criar logout/revoke.
- [x] Criar endpoint `/api/auth/me`.
- [x] Criar policies de autorizacao por role.
- [x] Criar seed de usuario Admin inicial.

Criterio de pronto:

- Usuario consegue logar e receber token.
- Token protege endpoints privados.
- Refresh token renova sessao.
- Logout invalida refresh token.
- Roles bloqueiam acesso indevido.

### V3 - Modulos Operacionais

Objetivo: implementar os CRUDs centrais do produto.

- [x] Users CRUD.
- [x] Clients CRUD.
- [x] Plans CRUD.
- [x] Definir estagios iniciais de plano: `Trial`, `Free`, `Plus`, `Premium`.
- [x] Orders CRUD.
- [x] Toggle de plano ativo/inativo.
- [x] Atualizacao de status de pedido.
- [x] Validacoes de regras de dominio.
- [x] Testes unitarios iniciais nos Services.

Criterio de pronto:

- Admin gerencia usuarios.
- Manager gerencia clientes, planos e pedidos.
- Support consegue atualizar status de pedidos.
- Viewer nao consegue alterar dados.
- Testes cobrem regras principais.

### V4 - Security & Privacy Foundation

Objetivo: pautar a V4 em cyberseguranca aplicada, protegendo dados sensiveis e reforcando confidencialidade, integridade e disponibilidade.

- [x] Trocar hasher temporario por hash de senha adequado.
- [x] Criar mascaramento para o email sensivel atualmente modelado.
- [x] Criar criptografia de dados sensiveis em repouso.
- [x] Negar visualizacao de dados sensiveis para todas as roles, com auditoria.
- [x] Criar audit log para tentativa de visualizacao de dados sensiveis.
- [x] Garantir que logs da aplicacao nao exponham dados sensiveis.
- [x] Preparar persistencia com EF Core/LINQ para prevenir SQL Injection.
- [x] Adicionar validacoes de entrada para DTOs publicos.
- [x] Adicionar rate limiting para login e endpoints sensiveis.
- [x] Criar gerador de dados sinteticos para clientes e assinaturas.
- [x] Marcar origem dos dados como `Demo`, `Manual` ou `Imported`.
- [x] Modelar campanhas de notificacao: promocao, cobranca a vencer e cobranca em atraso.
- [x] Migrar repositorio de Plans para EF Core com fallback em memoria.
- [x] Migrar repositorio de Orders para EF Core com fallback em memoria.
- [x] Migrar repositorio de Notification Campaigns para EF Core com fallback em memoria.
- [x] Migrar repositorio de Clients para EF Core preservando criptografia, lookup hash e fallback em memoria.
- [x] Migrar audit log sensivel para EF Core com fallback em memoria.
- [x] 6.1 - Migrar `Users` para EF Core com fallback em memoria.
- [x] 6.2 - Validar login, `/me`, RBAC e usuarios inativos com usuario persistido.
- [x] 6.3 - Migrar `Refresh Tokens` para EF Core com rotacao, revoke, logout e fallback em memoria.
- [x] 6.4 - Validacao final do fluxo completo: login, refresh, logout, roles, usuario inativo e ultimo admin ativo.

Criterio de pronto:

- Confidencialidade: Admin comum nao ve dados sensiveis completos por padrao.
- Integridade: alteracoes criticas ficam validadas e auditadas.
- Disponibilidade: endpoints sensiveis possuem protecoes basicas contra abuso.
- SQL Injection: persistencia futura segue uso de parametros, sem concatenacao de SQL.
- Ambiente demo tem clientes e assinaturas realistas sem dados reais.

### V5 - Frontend Foundation

Objetivo: criar o admin em Next.js consumindo a API real.

- [x] Criar app Next.js com TypeScript.
- [x] Configurar rotas protegidas.
- [x] Criar tela de login.
- [x] Criar layout administrativo.
- [x] Criar sidebar com itens baseados na role.
- [x] Criar client HTTP com tratamento de token e refresh.
- [x] Criar estados de loading, erro, vazio e permissao negada.

Estrutura sugerida:

```text
frontend/
  app/
  components/
  features/
  lib/
  types/
```

Criterio de pronto:

- Frontend autentica contra API real.
- Usuario sem token e redirecionado para login.
- Menu muda de acordo com a role.
- Nenhuma tela principal depende de mock fixo.

### V6 - Telas Principais

Objetivo: entregar o fluxo operacional completo.

- [x] Dashboard com metricas reais.
- [x] Users list/create/edit/status.
- [x] Clients list/create/edit/status.
- [x] Plans list/create/edit/toggle active.
- [x] Orders list/create/edit/status.
- [x] Settings do usuario logado.
- [x] Filtros e busca nas listas principais.

Criterio de pronto:

- Operacao basica pode ser feita de ponta a ponta pelo painel.
- Dashboard reflete dados reais.
- Erros da API aparecem de forma clara para o usuario.

### V7 - Cloud Database e Deploy

Objetivo: colocar o produto em ambiente cloud.

- [x] Criar migrations.
- [x] Configurar Neon Postgres.
- [x] Configurar deploy containerizado da API.
- [x] Configurar Vercel para frontend.
- [x] Configurar variaveis de ambiente.
- [x] Criar GitHub Actions para build, test e deploy.

Criterio de pronto:

- Push na branch principal executa pipeline.
- Backend e frontend fazem deploy automaticamente.
- Ambiente publicado usa banco Postgres gerenciado em cloud.

### V8 - Testes, Segurança e Qualidade

Objetivo: cobrir funcionalidades criticas, fluxos reais e brechas de seguranca com testes automatizados.

- [x] Revisar cobertura xUnit atual dos Services.
- [x] Criar primeira suite de integracao da API para health, login, headers, auth/RBAC, validacao e auditoria sensivel.
- [x] Ampliar xUnit para regras de seguranca, RBAC e auditoria sensivel.
- [x] Criar testes de integracao da API para auth, CRUDs e headers de seguranca.
- [x] Criar testes contra brechas comuns: requests invalidas, acesso sem token, role indevida, payload suspeito e dados sensiveis.
- [x] Configurar Vitest para utilitarios do frontend.
- [x] Criar testes Vitest para sessao, API client, guards e tratamento de erro.
- [x] Configurar Playwright.
- [x] Criar Playwright para login, dashboard e navegacao principal.
- [x] Criar Playwright para bloqueio por role e logout/refresh.
- [x] Integrar xUnit, Vitest e Playwright no GitHub Actions.
- [x] Documentar estrategia de testes e comandos principais em [`TESTING.md`](./TESTING.md).

Criterio de pronto:

- CI reprova regressao funcional ou quebra de seguranca basica.
- Fluxo principal esta coberto por testes automatizados.
- Tentativas comuns de acesso indevido e payload suspeito possuem teste.
- Frontend tem cobertura minima para utilitarios e fluxos criticos.

### V9 - Bootstrap de Conta Administrativa

Objetivo: substituir a credencial Admin automatica por uma configuracao inicial segura e realizada pelo proprietario.

- [x] Remover criacao automatica do Admin nos repositorios.
- [x] Criar consulta publica do estado de configuracao inicial.
- [x] Criar bootstrap atomico da primeira conta Admin.
- [x] Exigir chave de setup separada da senha de login.
- [x] Impedir escolha publica de role ou status.
- [x] Encerrar o bootstrap permanentemente apos a primeira conta real.
- [x] Substituir com seguranca o Admin seed legado sem remover os demais usuarios.
- [x] Revalidar existencia, status e role do usuario em tokens autenticados.
- [x] Integrar criacao inicial na tela de login.
- [x] Cobrir setup, concorrencia, login e fechamento do endpoint com testes.

Criterio de pronto:

- Nenhuma credencial de login e criada automaticamente.
- Somente uma conta inicial pode assumir a role Admin.
- Contas posteriores continuam sob controle do CRUD administrativo com RBAC.

### V10 - Organizations e Isolamento Multi-Tenant

Objetivo: criar a fronteira de dados por organizacao antes de ampliar credenciais e regras operacionais.

- [x] Criar entidade `Organization`.
- [ ] Criar entidade `Membership` entre usuario e organizacao.
- [ ] Mover roles operacionais de `User` para `Membership`.
- [ ] Criar capacidade `Owner` e proteger o ultimo Owner ativo.
- [ ] Permitir que um usuario participe de multiplas organizacoes com roles independentes.
- [ ] Criar contexto autenticado com organizacao e membership ativas.
- [ ] Criar troca segura de organizacao com reemissao ou renovacao do contexto.
- [ ] Adicionar `OrganizationId` em todas as entidades operacionais.
- [ ] Tornar repositories, Services, dashboard e auditoria tenant-aware.
- [ ] Adicionar indices, constraints e relacionamentos que impecam referencias entre tenants.
- [ ] Impedir que payloads, headers ou URLs definam um tenant sem membership valida.
- [ ] Retornar `404` para recursos pertencentes a outro tenant sem confirmar sua existencia.
- [ ] Criar duas organizacoes de teste com dados, usuarios e roles independentes.
- [ ] Cobrir leitura, escrita, relacionamentos e tentativas cruzadas com testes de integracao.
- [ ] Seguir o guia de arquitetura e aceitacao em [`MULTI_TENANCY.md`](./MULTI_TENANCY.md).

Criterio de pronto:

- Usuario autentica e opera somente dentro de uma membership ativa.
- Duas organizacoes podem possuir dados semelhantes sem colisao ou influencia mutua.
- Conhecer um ID de outro tenant nao permite consultar, alterar ou inferir o recurso.
- O isolamento e comprovado por testes automatizados contra acessos cruzados.

### V11 - Seguranca de Contas e Credenciais

Objetivo: fortalecer o ciclo de vida das contas e reduzir riscos relacionados a credenciais, sessoes e alteracoes administrativas criticas.

- [ ] Criar fluxo seguro de convite para novos usuarios.
- [ ] Criar recuperacao e redefinicao de senha com token de uso unico e expiracao curta.
- [ ] Permitir alteracao de senha pelo usuario autenticado mediante confirmacao da senha atual.
- [ ] Revogar refresh tokens e sessoes ativas apos redefinicao de senha ou desativacao da conta.
- [ ] Permitir que o usuario visualize e encerre suas sessoes ativas.
- [ ] Exigir autenticacao recente para alteracao de role, status ou credenciais.
- [ ] Impedir exposicao de tokens, senhas e segredos em logs, URLs e respostas da API.
- [ ] Auditar login, falhas de autenticacao, recuperacao de senha, revogacao de sessao e alteracoes de acesso.
- [ ] Cobrir os novos fluxos com testes unitarios, de integracao e E2E.

Criterio de pronto:

- Nenhuma credencial temporaria precisa ser compartilhada manualmente.
- Recuperacao de acesso invalida tokens anteriores e nao revela se uma conta existe.
- Alteracoes administrativas criticas exigem uma sessao autenticada recentemente.
- Eventos de autenticacao relevantes podem ser investigados sem expor dados sensiveis.

### V12 - Assinaturas e Regras de Dominio

Objetivo: transformar planos, clientes e pedidos em um fluxo de assinatura consistente, historico e auditavel.

- [ ] Criar `Subscription` como entidade propria entre cliente e plano.
- [ ] Permitir uma assinatura ativa por cliente e manter multiplas assinaturas historicas.
- [ ] Definir estados `Trial`, `Active`, `PastDue`, `Paused`, `Cancelled` e `Expired`.
- [ ] Registrar periodo atual, proxima cobranca, pausa, cancelamento e motivo da alteracao.
- [ ] Preservar snapshot de nome, estagio, ciclo e preco do plano contratado.
- [ ] Versionar ou arquivar planos sem alterar contratos historicos.
- [ ] Definir `Order` como registro comercial imutavel apos sua conclusao.
- [ ] Formalizar transicoes validas de status para pedidos e assinaturas.
- [ ] Registrar motivo para cancelamento, reembolso, pausa e suspensao.
- [ ] Aplicar controle de concorrencia e idempotencia nas mutacoes criticas.
- [ ] Auditar alteracoes em usuarios, clientes, planos, pedidos e assinaturas.
- [ ] Cobrir regras e transicoes com testes automatizados.

Criterio de pronto:

- O estado atual de cada assinatura pode ser explicado pelo seu historico.
- Mudancas em planos nao alteram contratos ou pedidos ja registrados.
- Transicoes invalidas, duplicadas ou concorrentes sao rejeitadas com seguranca.

### V13 - Central de Comunicacao

Objetivo: permitir comunicacoes operacionais e promocionais sem expor os dados de contato dos clientes aos operadores.

- [ ] Evoluir campanhas para os estados `Draft`, `PendingApproval`, `Scheduled`, `Processing`, `Completed` e `Cancelled`.
- [ ] Criar segmentacao por plano, status da assinatura e situacao de cobranca.
- [ ] Criar modelos para promocao, cobranca a vencer, atraso e comunicacoes operacionais.
- [ ] Permitir previa da mensagem e quantidade de destinatarios sem revelar contatos.
- [ ] Exigir aprovacao antes do agendamento de campanhas sensiveis ou em massa.
- [ ] Criar processamento assincro com fila, tentativas limitadas e idempotencia.
- [ ] Descriptografar o contato somente dentro do processo isolado de entrega.
- [ ] Registrar status de entrega, falha e motivo tecnico sem persistir o contato em texto aberto.
- [ ] Implementar supressao, descadastro e regras de consentimento.
- [ ] Auditar criacao, aprovacao, cancelamento e envio de campanhas.
- [ ] Cobrir segmentacao, aprovacao, privacidade e processamento com testes.

Criterio de pronto:

- Operadores conseguem comunicar-se com segmentos sem visualizar emails ou telefones completos.
- Todo envio possui origem, aprovacao, resultado e trilha de auditoria.
- Falhas de entrega podem ser tratadas sem duplicar mensagens.

### V14 - Inteligencia Operacional

Objetivo: transformar o dashboard em uma area de decisao e acompanhamento do trabalho diario.

- [ ] Tornar metricas clicaveis e vinculadas a listas filtradas.
- [ ] Criar fila de trabalho para cobrancas proximas, atrasos, trials expirando e campanhas pendentes.
- [ ] Adicionar filtros por periodo, plano, status e responsavel.
- [ ] Criar timeline operacional por cliente com eventos de assinatura, pedido e comunicacao.
- [ ] Adicionar tags, responsavel interno e motivos estruturados para suspensao ou cancelamento.
- [ ] Criar indicadores de receita recorrente, conversao de trial, inadimplencia e cancelamento.
- [ ] Permitir exportacoes controladas, mascaradas e auditadas quando autorizadas.
- [ ] Definir retencao, anonimizacao e exclusao logica para dados operacionais.
- [ ] Adicionar monitoramento e alertas para falhas de autenticacao, campanhas e processamento.
- [ ] Cobrir filtros, indicadores, filas e contratos de privacidade com testes.

Criterio de pronto:

- O dashboard conduz o operador diretamente aos itens que exigem acao.
- Indicadores podem ser rastreados ate dados operacionais consistentes.
- Consultas, exportacoes e historicos respeitam RBAC, mascaramento e auditoria.

## Estado Consolidado

As fundacoes de backend, frontend, seguranca, persistencia, cloud, testes e bootstrap administrativo foram concluidas ate a V9. As versoes V10 a V14 estao planejadas e ainda nao foram iniciadas. O proximo incremento e a V10, com foco em organizacoes, memberships e isolamento multi-tenant.

## Fora do Escopo Inicial

- Banco, container ou deploy dedicado por organizacao.
- Billing real com gateway de pagamento.
- Permissoes configuraveis por tela ou acao.
- Notificacoes em tempo real.
- Relatorios financeiros ou contabeis avancados.

Esses itens fazem sentido depois que o produto principal estiver confiavel.
