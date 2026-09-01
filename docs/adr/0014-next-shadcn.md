# ADR-0014 — Next.js App Router + shadcn

## Status

Aceito

## Contexto

CRUD, webhook secreto, Neon e um deploy. Vite exigiria API à parte sem ganho neste escopo.

## Decisão

**Next.js (App Router) + shadcn/ui + Tailwind.** Server Actions / Route Handlers para persistência e Google Chat. Um projeto na Vercel.

## Consequências

- Segredos só no servidor.
- UI com componentes shadcn tematizados pelos tokens do ADR-0013.
