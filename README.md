# Café com Geti

App interno para controle de estoque e rodízio da copa.

## Stack

- Next.js (App Router) + shadcn/ui + Tailwind
- Drizzle ORM + Neon (PostgreSQL)
- Deploy na Vercel

## Ambientes (Neon)

| Branch | Onde usar |
|---|---|
| **`hml`** | Local (`npm run dev`) — branch ativa em `.neon` |
| **`production`** | Vercel **Production** |

```bash
# Desenvolvimento local (hml)
npx neon checkout hml -y
npm run db:push

# Ver connection string de prod (para colar na Vercel)
npx neon connection-string production
```

Na **Vercel**: em *Settings → Environment Variables*, `DATABASE_URL` da branch `production` só no ambiente **Production**; opcionalmente use `hml` em **Preview**.

## Setup local

1. `npx neon auth`
2. `npx neon link --project-id crimson-hill-72285250 --branch hml -y`
3. `npx neon deploy` (atualiza `.env.local`)
4. `AUTH_PEPPER` no `.env.local` (`openssl rand -base64 32`)
5. Opcional: `GOOGLE_CHAT_WEBHOOK_URL` no `.env.local`
6. Aplique o schema:

```bash
npm install
npm run db:push
npm run dev
```

## Primeira conta (admin geral)

O primeiro login é criado só na máquina de quem configura, para a senha não passar
por variável de ambiente da hospedagem:

```bash
npm run auth:create-first-admin
```

O script pede nome, preferência, username e senha, e grava um admin geral.
Username já usado falha sem sobrescrever.

## Banco (Drizzle)

- `npm run db:push` — aplica schema no Neon (desenvolvimento)
- `npm run db:generate` — gera migration a partir do schema
- `npm run db:migrate` — aplica migrations em `drizzle/`

## Testes

```bash
npm test
npm run typecheck
```

## Variáveis de ambiente (Vercel)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do Neon |
| `AUTH_PEPPER` | Sim | Segredo misturado na senha antes do hash; sem ele, gravar e conferir senha falha |
| `GOOGLE_CHAT_WEBHOOK_URL` | Não | Webhook do espaço do Google Chat |

Spec e decisões: `docs/spec.md`, `CONTEXT.md`, `docs/adr/`.
