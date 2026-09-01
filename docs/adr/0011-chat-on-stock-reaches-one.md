# ADR-0011 — Alerta ao cruzar 1 para baixo

## Status

Aceito

## Contexto

Abrir o app não deve notificar. Pular o valor 1 (ex.: 2→0) ainda é “acabou / está acabando”.

## Decisão

No servidor, ao persistir mudança de estoque (ajuste ou contribuição vigente):

- disparar se `estoqueAnterior > 1` **e** `estoqueNovo <= 1`;
- não disparar em GET, refresh ou cron de “ainda está baixo”;
- 1→0 **não** dispara (já tinha cruzado antes, ou já estava no limiar);
- 3→1, 2→0, 5→0 **disparam**;
- 5→2 **não** dispara.

O texto no espaço do Chat nomeia o item, a quantidade nova e o **próximo da vez**.

## Consequências

- Comparar before/after na mesma transação.
- Reposição (0→5) depois 5→0 gera um **novo** alerta — correto.
- Cron da Vercel não é necessário para este alerta.
