# 02: Entrar, sair e sessão

> **Difficulty:** Heavy: **suggested model:** Opus (Claude Code) / Opus or the strongest reasoning model available (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Admin e admin geral entram com username e senha. Login certo abre sessão (cookie opaco + linha no banco). **Sair** encerra só a sessão daquele navegador. A sessão vale 14 dias desde o último uso que a valida. Senha errada, username ausente e conta inativa devolvem “credenciais inválidas”. A suíte observa isso pelas operações de servidor, com pote de cookies em memória e relógio avançável.

**Blocked by:** 01: Perfil no funcionário e primeira conta

**Status:** ready-for-agent

- [ ] Login certo cria sessão no banco e cookie `httpOnly` com token opaco
- [ ] Senha errada, username ausente e conta inativa devolvem “credenciais inválidas”
- [ ] Username ausente não cria linha de tentativa no banco
- [ ] **Sair** apaga só a sessão daquele pote de cookies
- [ ] Sessão vence 14 dias após o último request que a valida; relógio avançado dispara o vencimento
- [ ] Cookie é `httpOnly`, `Secure`, `SameSite=Lax`
- [ ] Harness de teste substitui cookie do Next por pote em memória e oferece relógio avançável
