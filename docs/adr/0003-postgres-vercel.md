# ADR-0003 — PostgreSQL gerenciado + Vercel

## Status

Aceito (provedor: Neon — ADR-0012)

## Contexto

Precisamos de persistência compartilhada, cron para checar estoque mesmo sem ninguém abrir o app, e deploy simples. SQLite na Vercel é frágil (filesystem efêmero).

## Decisão

- Banco: **PostgreSQL** no **Neon**.
- App: **Vercel**, com cron nativo se o alerta não puder depender só do request de quem salvou o estoque.

## Consequências

- Next.js full-stack na Vercel encaixa (Server Actions + Route Handler do webhook secreto).
- Segredos (webhook do Chat, `DATABASE_URL`) ficam em env da Vercel, nunca no cliente.
