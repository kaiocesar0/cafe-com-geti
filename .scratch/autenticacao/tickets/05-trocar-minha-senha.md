# 05: Trocar minha senha

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Admin e admin geral trocam a própria senha informando a atual e a nova (mínimo 8 caracteres). A troca mantém a sessão deste navegador, derruba as outras e passa a valer a senha nova. Senha atual errada falha sem mudar nada. Funcionário sem senha não tem essa operação.

**Blocked by:** 02: Entrar, sair e sessão

**Status:** ready-for-human

- [x] Troca da própria senha exige a senha atual e a nova (mínimo 8)
- [x] Mantém a sessão deste pote e mata as outras da mesma pessoa
- [x] Senha nova passa a valer no próximo login
- [x] Senha atual errada falha e o banco/sessões não mudam
- [x] Acerto na troca zera a trava de login deste navegador nesse username (se existir)
