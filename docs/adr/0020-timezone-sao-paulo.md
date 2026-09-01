# ADR-0020 — Fuso America/Sao_Paulo

## Status

Aceito

## Contexto

Um escritório; “hoje” e desempate por data não podem depender do relógio do notebook de quem está em viagem.

## Decisão

Calendário de negócio: **`America/Sao_Paulo`**. Persistência em timestamptz (UTC); exibição e “hoje” convertidos para esse fuso. Datas só-dia (contribuição passada) interpretadas nesse fuso.

## Consequências

- Default do date picker = hoje em São Paulo, não UTC.
