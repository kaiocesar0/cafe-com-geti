# 06: Fila e próximo da vez no banco

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** O próximo da vez lido das linhas do banco segue a mesma regra da função pura: menor total contribuído (vigente e passada), desempate por quem está devendo há mais tempo, e ordem de cadastro se ninguém nunca trouxe. Inativar um funcionário tira essa pessoa de todas as filas. Quem toma só leite não é o próximo do café nem do filtro, mesmo com total alto. Atualizar nome e preferência persiste, e a fila acompanha a preferência nova.

**Blocked by:** 02: Contribuição vigente e passada

**Status:** ready-for-agent

- [ ] Inativar um funcionário tira essa pessoa de todas as filas e o próximo da vez lido do banco muda
- [ ] Quem toma só leite não é o próximo de café nem de filtro, mesmo com total alto
- [ ] Menor total, desempate por tempo e ordem de cadastro batem com a regra pura, a partir das linhas do banco, contando vigente e passada
- [ ] Atualizar nome e preferência persiste, e a fila acompanha a preferência nova
