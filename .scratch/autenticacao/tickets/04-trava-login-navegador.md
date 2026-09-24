# 04: Trava de login no navegador

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Cinco erros seguidos do mesmo username neste navegador travam esse par por 15 minutos, inclusive com a senha certa em seguida. Outro navegador (outro pote) entra. Outro username no mesmo navegador não trava junto. Acerto zera a trava. Apagar o cookie zera. Cookie adulterado não zera. A mensagem continua “credenciais inválidas”. Sessão já aberta não cai por causa da trava.

**Blocked by:** 02: Entrar, sair e sessão

**Status:** ready-for-human

- [x] Cinco erros seguidos travam esse username neste pote por 15 minutos, inclusive com senha certa
- [x] Outro pote entra com o mesmo username enquanto o primeiro está travado
- [x] Outro username no mesmo pote não trava junto
- [x] Acerto zera a trava deste pote nesse username
- [x] Apagar o cookie zera; cookie adulterado não zera
- [x] Contador não expira sozinho antes da quinta falha; ao fim dos 15 minutos o contador zera
- [x] Username inexistente não grava tentativa; mensagem permanece “credenciais inválidas”
- [x] Sessão já aberta não cai por causa da trava
