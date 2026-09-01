# ADR-0022 — Drizzle como ORM

## Status

Aceito

## Contexto

Next + Neon + Vercel. Regras de domínio (próximo da vez, cruzar 1, vigente vs passada) são funções TypeScript + transação, não CRUD aninhado. Prisma Studio e migrate mais “produto” não compensam o peso/cerimônia neste MVP.

## Decisão

**Drizzle** + `drizzle-kit` para schema em TypeScript e migrations. Driver serverless da Neon no servidor Next. Sem Prisma.

## Consequências

- Schema e tipos no mesmo lugar (`.ts`).
- Inspeção de dados pelo console do Neon, não Prisma Studio.
- Spec deixa de tratar Drizzle como premissa não grilled.
