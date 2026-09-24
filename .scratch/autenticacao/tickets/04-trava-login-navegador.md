# 04: Trava de login no navegador

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Cinco erros seguidos do mesmo username neste navegador travam esse par por 15 minutos, inclusive com a senha certa em seguida. Outro navegador (outro pote) entra. Outro username no mesmo navegador não trava junto. Acerto zera a trava. Apagar o cookie zera. Cookie adulterado não zera. A mensagem continua “credenciais inválidas”. Sessão já aberta não cai por causa da trava.

**Blocked by:** 02: Entrar, sair e sessão

**Status:** ready-for-agent

- [ ] Cinco erros seguidos travam esse username neste pote por 15 minutos, inclusive com senha certa
- [ ] Outro pote entra com o mesmo username enquanto o primeiro está travado
- [ ] Outro username no mesmo pote não trava junto
- [ ] Acerto zera a trava deste pote nesse username
- [ ] Apagar o cookie zera; cookie adulterado não zera
- [ ] Contador não expira sozinho antes da quinta falha; ao fim dos 15 minutos o contador zera
- [ ] Username inexistente não grava tentativa; mensagem permanece “credenciais inválidas”
- [ ] Sessão já aberta não cai por causa da trava
