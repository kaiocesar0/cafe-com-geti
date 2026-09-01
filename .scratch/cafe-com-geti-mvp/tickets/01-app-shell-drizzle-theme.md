# 01: App shell Next, Drizzle, tema e tokens

> **Difficulty:** Heavy: **suggested model:** Opus (Claude Code) / Grok 4.6 ou o modelo de raciocínio mais forte disponível (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Quem abre o link vê o app **Café com Geti** (não a marca DPE), navega um layout vazio mas usável no celular, troca tema **claro (default) / escuro**, e o projeto já fala com o **Neon** via **Drizzle** (migration inicial pode ser só o mínimo para o app subir). `robots` / noindex. Variáveis `DATABASE_URL` só no servidor.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] Next.js App Router + shadcn/ui + Tailwind sobe localmente
- [x] Tokens de cor do DS aplicados ao tema shadcn; sem logo/nome da Defensoria
- [x] Toggle claro/escuro; default claro; preferência em localStorage
- [x] Drizzle + drizzle-kit + driver serverless Neon configurados; migrate/push documentado
- [x] App não envia segredos ao cliente; página não deve ser indexada por buscadores
