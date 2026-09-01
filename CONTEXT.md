# Café com Geti — Contexto de Domínio

Sistema interno para controle de estoque de itens da copa e registro de contribuições dos funcionários. Acesso por link interno, sem login no MVP.

## Problema

O estoque é reabastecido por contribuições dos funcionários, mas não há visibilidade de quanto cada item dura nem de quem deve trazer o próximo. Os itens acabam e só então alguém percebe que precisa repor.

## Glossário

| Termo | Definição |
|---|---|
| **Funcionário** | Pessoa cadastrada. Tem **preferência de consumo** (café / leite / ambos) e flag **ativo**. |
| **Preferência de consumo** | Define em quais **filas de item** o funcionário ativo entra, via **tipo de item**. |
| **Tipo de item** | Classificação do item para a fila: `coffee` (quem toma café), `milk` (quem toma leite), `filter` (quem toma café). |
| **Item** | Produto cadastrado livremente (CRUD). Tem nome, unidade, **tipo**, estoque atual. |
| **Contribuição vigente** | Registro de algo trazido **agora**: aumenta estoque **e** o **total contribuído**. |
| **Contribuição passada** | Lançamento histórico (data + quem + quanto): entra só no **total contribuído** e no desempate. **Não** altera o estoque atual. |
| **Ajuste de estoque** | Contagem física ou baixa: altera só o estoque, não o ranking. |
| **Estoque** | Quantidade na prateleira. Sobe com contribuição vigente; muda com ajuste; ignora contribuição passada. |
| **Alerta de estoque baixo** | POST no **espaço do Google Chat** ao **persistir** mudança em que o estoque **cruzou 1 para baixo** (antes > 1, depois ≤ 1). Exemplos: 2→0, 3→1, 5→0. Não dispara ao abrir o app nem em 1→0. |
| **Fila de item** | Funcionários **ativos** cuja preferência cobre o **tipo** daquele item. |
| **Total contribuído** | Soma das unidades cadastradas daquele item (vigentes + passadas). 1 pacote = 1. |
| **Próximo da vez** | Na fila do item: menor total; empate = devendo há mais tempo; se ninguém nunca trouxe = ordem de cadastro. |
| **Espaço do Google Chat** | Grupo do workspace. Sem DM e sem logo/nome DPE no app. |

## Atores

- **Funcionário**: qualquer pessoa com o link; registra, consulta, cadastra itens/pessoas. Sem autenticação no MVP.
- **Quem configura**: env na Vercel (`DATABASE_URL`, webhook do Chat).

## Requisitos funcionais (MVP)

| # | Requisito |
|---|---|
| RF-01 | CRUD de funcionários: nome, preferência, ativo, ordem de cadastro |
| RF-02 | CRUD de itens: nome, unidade, tipo (café / leite / filtro), estoque |
| RF-03 | Contribuição vigente: quem + item + quantidade + data; sobe estoque e total |
| RF-04 | Ajuste de estoque (contagem / baixa), sem afetar ranking |
| RF-05 | Dashboard: estoque, próximo da vez por item, temas claro (default) e escuro |
| RF-06 | Próximo da vez pela regra de total + desempate |
| RF-07 | Histórico de contribuições (vigentes e passadas) |
| RF-08 | Lançar contribuições passadas sem alterar estoque |
| RF-09 | Alertar o grupo no Chat quando o estoque cruzar 1 para baixo, citando o próximo da vez |
| RF-10 | Editar e excluir contribuição (recalcula total; vigente desfaz/reaplica estoque) |
| RF-11 | Contagem no cadastro do item e −1/+1 no dashboard |
| RF-12 | Qualquer funcionário pode contribuir qualquer item (total soma; próximo só a fila) |

## Stack

Next.js (App Router) + shadcn/ui + Tailwind, **Drizzle**, Neon (branches **hml** + **production**), Vercel. Tokens de cor do DS (sem marca DPE). Fuso `America/Sao_Paulo`. Contrato: [docs/spec.md](docs/spec.md).

## Fora do MVP

- Login / papéis
- Mensagem privada no Chat
- Estimativa automática de consumo mensal
- Logo ou nome da Defensoria Pública SC no produto

## Decisões registradas

- [ADR-0001](docs/adr/0001-hybrid-stock.md) — estoque híbrido
- [ADR-0002](docs/adr/0002-no-auth-mvp.md) — sem login no MVP
- [ADR-0003](docs/adr/0003-postgres-vercel.md) — PostgreSQL + Vercel
- [ADR-0004](docs/adr/0004-per-item-rotation-by-quantity.md) — próximo da vez por quantidade
- [ADR-0005](docs/adr/0005-google-chat-space-alerts.md) — alerta no espaço do Chat
- [ADR-0006](docs/adr/0006-rotation-tie-break.md) — desempate
- [ADR-0007](docs/adr/0007-contribution-unit.md) — unidade = pacote
- [ADR-0008](docs/adr/0008-filter-queue-coffee-drinkers.md) — filtro = quem toma café
- [ADR-0009](docs/adr/0009-past-contributions-screen.md) — contribuições passadas
- [ADR-0010](docs/adr/0010-employee-active-flag.md) — flag ativo
- [ADR-0011](docs/adr/0011-chat-on-stock-reaches-one.md) — cruza 1 para baixo
- [ADR-0012](docs/adr/0012-neon.md) — Neon
- [ADR-0013](docs/adr/0013-visual-identity.md) — tokens sem marca DPE
- [ADR-0014](docs/adr/0014-next-shadcn.md) — Next + shadcn
- [ADR-0015](docs/adr/0015-item-crud-and-kind.md) — CRUD de item + tipo
- [ADR-0016](docs/adr/0016-light-dark-theme.md) — temas
- [ADR-0017](docs/adr/0017-edit-delete-contribution.md) — editar/excluir contribuição
- [ADR-0018](docs/adr/0018-stock-count-and-quick-delta.md) — contagem e −1
- [ADR-0019](docs/adr/0019-contribute-outside-queue.md) — contribuir fora da fila
- [ADR-0020](docs/adr/0020-timezone-sao-paulo.md) — fuso
- [ADR-0021](docs/adr/0021-spec-then-code.md) — spec antes do código
- [ADR-0022](docs/adr/0022-drizzle.md) — Drizzle
- [ADR-0023](docs/adr/0023-neon-hml-production-branches.md) — branches hml / production
