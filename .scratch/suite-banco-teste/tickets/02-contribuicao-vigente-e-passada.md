# 02: Contribuição vigente e passada

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**What to build:** Registrar uma contribuição vigente aumenta o estoque da prateleira e o total contribuído. Registrar uma contribuição passada aumenta só o total; a prateleira fica igual. Quem está fora da fila pode registrar, e a quantidade entra no total. A suíte faz isso sem um request do Next e sem enviar alerta quando o estoque não cruzou 1.

**Blocked by:** 01: Trava do banco de teste

**Status:** ready-for-human

- [x] Contribuição vigente aumenta estoque e total contribuído
- [x] Contribuição passada aumenta só o total; o estoque da prateleira permanece
- [x] Funcionário fora da fila registra e a quantidade entra no total
- [x] Revalidar as telas não exige um request do Next
- [x] Esse caminho não dispara alerta quando o estoque não cruzou 1
