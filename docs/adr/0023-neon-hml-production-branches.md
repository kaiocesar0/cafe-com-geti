# ADR-0023 — Branches Neon: hml e production

## Status

Aceito

## Contexto

Um único `DATABASE_URL` servia local e produção. Precisamos de dados isolados: homologação vs produção real.

## Decisão

**Um projeto Neon**, **duas branches**:

| Branch | Uso |
|---|---|
| `production` | Vercel **Production** (app real da copa) |
| `hml` | Desenvolvimento local (`.env.local`) e Vercel **Preview** (opcional) |

No Neon, cada branch é um Postgres isolado (copy-on-write a partir do pai). Não são dois projetos separados.

- Local: `npx neon checkout hml` → `.neon` aponta para `hml`, `DATABASE_URL` no `.env.local`
- Vercel Production: `DATABASE_URL` da branch `production` (painel Neon ou `neon connection-string production`)
- Vercel Preview: `DATABASE_URL` da branch `hml` (mesmos dados de teste que o dev local)

## Consequências

- `npm run db:push` afeta só a branch linkada no momento (ver `.neon`).
- Antes de subir schema em prod: testar em `hml`.
- `neon.ts` define TTL de 30 dias para branches não-default criadas no futuro.
