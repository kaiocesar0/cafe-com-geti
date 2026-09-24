# 06: Matriz de perfis

> **Difficulty:** Heavy: **suggested model:** Opus (Claude Code) / Opus or the strongest reasoning model available (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Admin cria e edita funcionário (nome, preferência, ativo) e promove só funcionário ativo a admin (username + senha inicial). Admin não edita outro admin nem admin geral; no próprio cadastro muda nome e preferência, e não muda ativo, perfil nem username. Admin geral altera nome, preferência e ativo dos outros; rebaixa a funcionário (apaga username, senha e sessões); promove admin a admin geral sem mexer em username nem senha; troca a senha de outro sem a atual e derruba todas as sessões dessa pessoa. Ninguém se rebaixa nem se inativa. O último admin geral ativo não é rebaixado nem inativado. Inativar bloqueia login; reativar entra com a senha antiga sem sessão antiga. Ação fora da matriz devolve “Sem permissão”. Perfil não altera fila nem preferência.

**Blocked by:** 03: Escrita só com sessão

**Status:** ready-for-agent

- [ ] Admin promove funcionário ativo (username + senha ≥ 8); inativo não promove; não cria admin geral direto
- [ ] Admin não edita, inativa nem rebaixa outro admin ou admin geral
- [ ] Admin altera o próprio nome e preferência; não altera o próprio ativo, perfil nem username
- [ ] Admin geral altera nome, preferência e ativo de outro admin ou admin geral
- [ ] Admin geral rebaixa outro admin ou admin geral (apaga username, hash e sessões)
- [ ] Admin geral promove admin a admin geral sem mexer em username nem senha
- [ ] Admin geral troca senha de outro sem a atual e mata todas as sessões dessa pessoa
- [ ] Ninguém rebaixa nem inativa a si mesmo; último admin geral ativo não é rebaixado nem inativado
- [ ] Inativar admin/admin geral apaga sessões e bloqueia login; reativar entra com senha antiga sem sessão antiga
- [ ] Ação autenticada fora da matriz devolve “Sem permissão” e o banco não muda
- [ ] Perfil não tira da fila nem muda preferência por si só
