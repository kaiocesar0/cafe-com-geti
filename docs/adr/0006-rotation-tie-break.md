# ADR-0006 — Empate no próximo da vez

## Status

Aceito

## Contexto

Dois funcionários podem ter o mesmo **total contribuído** de um item.

## Decisão

1. Menor total contribuído vence.
2. Empate: quem está **devendo há mais tempo** — maior intervalo desde a última contribuição daquele item (quem nunca trouxe conta como o mais antigo).
3. Se os dois **nunca** trouxeram aquele item: **ordem de cadastro** do funcionário.

## Consequências

- Data da contribuição importa no desempate, não só a quantidade.
- Lançar histórico com data (RF-08) alimenta essa regra.
