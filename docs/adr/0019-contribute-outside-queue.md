# ADR-0019 — Contribuição fora da fila

## Status

Aceito

## Contexto

Quem só toma leite pode mesmo assim trazer café do mercado.

## Decisão

Qualquer funcionário cadastrado pode registrar contribuição de **qualquer** item. A quantidade **soma no total** daquele item (ranking). **Próximo da vez** continua restrito à **fila** (ativos cuja preferência cobre o tipo). Quem só toma leite nunca é o próximo do café, mesmo tendo trazido mais café.

## Consequências

- UI não filtra a lista de “quem trouxe” pelo tipo do item.
- Relatórios de “quem mais trouxe X” incluem quem não consome X.
