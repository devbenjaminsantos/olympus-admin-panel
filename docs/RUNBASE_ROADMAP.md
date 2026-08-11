# RunBase Roadmap

## Visao

RunBase sera um sistema administrativo interno para gestao de clientes, planos e pedidos, com autenticacao segura, controle de acesso por roles e painel operacional baseado em dados reais.

O projeto atual funciona como um prototipo funcional do produto: possui frontend administrativo, backend inicial, autenticacao, usuarios, pedidos, configuracoes e metricas. A nova fase transforma essa base em um produto mais robusto com Next.js, ASP.NET Core Web API, Postgres gerenciado em cloud, RBAC real e deploy containerizado.

O inicio da implementacao esta definido em [`RUNBASE_START.md`](./RUNBASE_START.md).

## Decisao de Direcao

### Estado atual

- Frontend estatico com HTML, CSS e JavaScript.
- Backend em Node.js/Express.
- Persistencia local com sql.js e suporte a MySQL.
- Modulos ja representados: auth, users, orders, settings, analytics e notifications.

### Estado alvo

- Frontend em Next.js, React e TypeScript.
- Backend em ASP.NET Core Web API e C#.
- Banco em Neon Postgres.
- Auth com JWT, refresh token e RBAC.
- Deploy via API containerizada e frontend na Vercel.
- CI/CD com GitHub Actions.

### Estrategia

O RunBase deve ser reconstruido de forma incremental, usando o produto atual como referencia de UX e regras operacionais. A prioridade nao e migrar cada arquivo existente, mas preservar o aprendizado do prototipo e criar uma base tecnica limpa para o produto final.

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

Documento de inicio: [`RUNBASE_START.md`](./RUNBASE_START.md).

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
- [x] Criar camada de mascaramento para email, telefone e documentos.
- [x] Criar criptografia de dados sensiveis em repouso.
- [x] Criar policy `SensitiveData.View`.
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
- [ ] Configurar Vitest para utilitarios do frontend.
- [ ] Criar testes Vitest para sessao, API client, guards e tratamento de erro.
- [ ] Configurar Playwright.
- [ ] Criar Playwright para login, dashboard e navegacao principal.
- [ ] Criar Playwright para bloqueio por role e logout/refresh.
- [ ] Integrar xUnit, Vitest e Playwright no GitHub Actions.
- [ ] Documentar estrategia de testes e comandos principais.

Criterio de pronto:

- CI reprova regressao funcional ou quebra de seguranca basica.
- Fluxo principal esta coberto por testes automatizados.
- Tentativas comuns de acesso indevido e payload suspeito possuem teste.
- Frontend tem cobertura minima para utilitarios e fluxos criticos.

## Ordem Recomendada de Execucao

1. Atualizar README e estrutura do repo para a fase RunBase.
2. Criar backend ASP.NET Core com health check e Scalar.
3. Implementar Auth e RBAC antes dos demais modulos.
4. Implementar Users, Clients, Plans e Orders.
5. Criar frontend Next.js com login e layout protegido.
6. Conectar telas reais aos endpoints.
7. Configurar testes e CI.
8. Publicar em Azure.

## Fora do Escopo Inicial

- Multiempresa/SaaS completo.
- Billing real com gateway de pagamento.
- Permissoes configuraveis por tela ou acao.
- Auditoria detalhada para todas as entidades.
- Notificacoes em tempo real.
- Relatorios avancados.

Esses itens fazem sentido depois que o produto principal estiver confiavel.
