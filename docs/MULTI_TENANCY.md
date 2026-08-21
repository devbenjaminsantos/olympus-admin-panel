# RunBase Multi-Tenancy

## Status da Decisao

Este documento registra a direcao arquitetural planejada para transformar o RunBase em uma plataforma SaaS multi-tenant.

A implementacao da V10 foi iniciada pela entidade `Organization`, seu mapeamento EF Core e sua migration. Memberships e isolamento dos dados operacionais ainda nao foram implementados.

## Objetivo

Cada organizacao deve administrar seus proprios usuarios, clientes, planos, assinaturas, pedidos, campanhas e metricas sem acessar, alterar ou inferir informacoes pertencentes a outra organizacao.

A analogia adotada e a de conteineres independentes:

- Organizacao A opera dentro do seu proprio espaco logico.
- Organizacao B opera dentro de outro espaco logico.
- Nenhuma operacao de A pode atravessar a fronteira de B.

Inicialmente, esse isolamento sera logico, com banco e aplicacao compartilhados. Nao sera criado um banco, container de aplicacao ou deploy separado para cada organizacao.

## Principios

1. Toda entidade operacional pertence a uma organizacao.
2. A identidade do usuario e global; suas permissoes pertencem a uma membership.
3. O frontend nunca determina sozinho o tenant autorizado.
4. Toda leitura e escrita deve ser limitada pela organizacao autenticada.
5. Recursos de outro tenant nao devem ter sua existencia confirmada.
6. Jobs, caches, arquivos, metricas, exportacoes e logs tambem respeitam a fronteira do tenant.
7. O isolamento deve ser comprovado por testes automatizados, nao apenas por convencao de codigo.

## Modelo Central

```text
User
  +-- Membership
        +-- Organization
              +-- Clients
              +-- Plans
              +-- Subscriptions
              +-- Orders
              +-- Notification Campaigns
              +-- Audit Logs
```

### User

Representa a identidade global usada para autenticacao.

Responsabilidades:

- Email normalizado globalmente unico.
- Password hash.
- Estado geral da conta.
- Sessoes e refresh tokens.
- Dados de seguranca da identidade.

O usuario nao possui uma role global de operacao.

### Organization

Representa o tenant e a fronteira principal de dados.

Campos iniciais sugeridos:

- `Id`
- `Name`
- `Slug`
- `Status`
- `CreatedAt`
- `UpdatedAt`

O nome pode se repetir. O `Slug`, caso seja usado em URLs, deve ser globalmente unico e nao deve conceder acesso por si so.

Estados iniciais:

- `Active`: organizacao autorizada a operar.
- `Suspended`: operacao bloqueada sem remover seu historico.

### Membership

Representa a relacao entre um usuario e uma organizacao.

Campos iniciais sugeridos:

- `Id`
- `UserId`
- `OrganizationId`
- `Role`
- `Status`
- `IsOwner`
- `JoinedAt`

Restricoes iniciais:

- Um usuario possui no maximo uma membership por organizacao.
- O mesmo usuario pode participar de varias organizacoes.
- A role pode ser diferente em cada organizacao.
- Toda organizacao deve manter ao menos um Owner ativo.
- Um Admin nao pode remover, rebaixar ou substituir o Owner sem um fluxo autorizado.

## Roles por Organizacao

| Papel | Responsabilidade |
| --- | --- |
| Owner | Controla a organizacao, membros e configuracoes criticas. |
| Admin | Administra a operacao do tenant, respeitando os limites do Owner. |
| Manager | Gerencia clientes, planos, assinaturas e pedidos. |
| Support | Consulta clientes e atua nos estados operacionais permitidos. |
| Viewer | Possui acesso somente leitura aos recursos autorizados. |

`Owner` e uma capacidade especial da membership. Ela nao deve se tornar uma permissao global da plataforma.

Operadores da infraestrutura do RunBase tambem nao recebem acesso automatico aos dados sensiveis das organizacoes.

## Identidade e Credenciais

As credenciais pertencem ao usuario global, nao a uma organizacao especifica.

Comportamentos esperados:

- O mesmo email nao cria duas identidades diferentes.
- Um convite para um email ja cadastrado cria uma nova membership apos aceite.
- O mesmo usuario pode criar ou integrar mais de uma organizacao, conforme os limites definidos.
- Duas pessoas podem escolher a mesma senha; hashes com salt devem permanecer diferentes.
- Senhas nao sao comparadas entre usuarios e nao identificam tenants.
- Uma credencial valida nao concede acesso a uma organizacao sem membership ativa.

## Contexto Autenticado

Depois do login, o usuario seleciona ou confirma a organizacao ativa. O contexto emitido pela API deve identificar:

```text
sub: user-id
organization_id: organization-id
membership_id: membership-id
role: Manager
```

Ao trocar de organizacao, a API valida a membership e emite um novo contexto autenticado.

Regras:

- Um `OrganizationId` recebido em payload, query string ou header nao e prova de autorizacao.
- A API deve resolver o tenant a partir da identidade autenticada e de uma membership ativa.
- O token da organizacao A nao pode ser reutilizado como contexto da organizacao B.
- Alteracoes de membership, role ou status devem invalidar ou revalidar o contexto afetado.

## Isolamento de Dados

Entidades operacionais devem possuir `OrganizationId`, incluindo:

- Clients.
- Plans.
- Subscriptions.
- Orders.
- Notification Campaigns.
- Audit Logs.
- Jobs e registros de processamento.

Toda consulta por identificador deve combinar o recurso com o tenant autenticado:

```csharp
entity.Id == requestedId &&
entity.OrganizationId == currentOrganizationId
```

O `OrganizationId` de novas entidades deve ser atribuido no backend. O frontend nao escolhe a organizacao proprietaria de um recurso.

### Persistencia

O isolamento deve existir em mais de uma camada:

- Servico de contexto do tenant autenticado.
- Repositories e Services tenant-aware.
- Filtros globais do EF Core como defesa adicional onde forem adequados.
- Indices e unicidade compostos por `OrganizationId`.
- Foreign keys compostas para impedir relacionamentos entre tenants.
- Auditoria contendo o tenant responsavel pelo evento.

Exemplo: um pedido da organizacao A nao pode referenciar um cliente da organizacao B, mesmo que uma validacao da aplicacao seja esquecida.

Jobs em segundo plano devem receber um tenant explicito e validado. Processos administrativos sem tenant nao podem consultar entidades operacionais por padrao.

### Respostas HTTP

- Recurso inexistente no tenant atual: `404 Not Found`.
- Recurso existente em outro tenant: `404 Not Found`.
- Membership ausente ou inativa para o contexto solicitado: acesso negado.
- Tentativa cruzada relevante: auditada sem registrar dados sensiveis do recurso alvo.

Essa regra reduz enumeracao e evita confirmar que um identificador pertence a outra organizacao.

## Fluxo Inicial

1. Usuario cria sua identidade.
2. Usuario confirma as credenciais exigidas.
3. Usuario cria uma organizacao.
4. A API cria sua membership como Owner.
5. Owner convida integrantes da equipe.
6. Integrante cria ou vincula sua identidade.
7. Convite aceito ativa a membership com a role definida.

A criacao de usuario, organizacao e primeira membership deve ser atomica sempre que fizer parte da mesma operacao. Falhas nao podem deixar uma organizacao sem Owner ou registros parciais.

## Matriz de Aceitacao Inicial

O primeiro teste funcional utilizara duas organizacoes independentes.

| Cenario | Resultado esperado |
| --- | --- |
| Mesmo email tenta criar outra identidade | Nao cria um segundo User. |
| Mesmo usuario cria duas organizacoes | Permitido dentro do limite definido. |
| Mesmo usuario integra duas organizacoes | Possui memberships e roles independentes. |
| Email existente recebe convite de outro tenant | Vincula a identidade existente somente apos aceite. |
| Email de cliente se repete em tenants diferentes | Permitido. |
| Email de cliente se repete no mesmo tenant | Segue a restricao comercial definida. |
| Token da organizacao A consulta ID da B | Retorna `404` sem dados do recurso. |
| Token da organizacao A altera ou remove recurso da B | Operacao negada e auditada. |
| Payload de A envia `OrganizationId` de B | Valor nao e aceito como contexto autorizado. |
| Usuario pertence a A e B | Precisa trocar explicitamente o contexto ativo. |
| Role muda apenas na organizacao A | Permissoes na organizacao B permanecem inalteradas. |
| Membership e desativada | Novos requests e renovacoes daquele contexto sao negados. |

## Cobertura Minima de Seguranca

Os testes automatizados devem tentar atravessar tenants em:

- Listagem.
- Busca por ID.
- Criacao com tenant adulterado.
- Atualizacao.
- Alteracao de status.
- Exclusao.
- Relacionamentos entre entidades.
- Dashboard e agregacoes.
- Exportacoes.
- Campanhas e jobs.
- Audit logs.
- Refresh e troca de organizacao.

O contrato de seguranca principal e:

> Nenhum usuario pode consultar, alterar, excluir, exportar ou inferir dados de outro tenant, mesmo possuindo um ID valido, um token valido para outro contexto ou um payload manipulado.

## Decisoes Ainda Abertas

- Limite inicial de organizacoes criadas por usuario.
- Limite de integrantes por organizacao.
- Regras de transferencia de ownership.
- Expiracao e reenvio de convites.
- Uso do `Slug` nas URLs do frontend.
- Politica futura de chave criptografica por tenant.
- Necessidade futura de isolamento fisico para clientes com requisitos especiais.

Essas decisoes devem ser fechadas em pequenos incrementos durante a V10, antes de ampliar os CRUDs para o novo modelo.
