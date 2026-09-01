# ADR-0002 — Sem autenticação no MVP

## Status

Aceito

## Contexto

Time pequeno, uso interno. Login atrasaria o MVP. Qualquer funcionário precisa registrar o que trouxe e ver o estoque.

## Decisão

App acessível por **link interno** (URL da Vercel, possivelmente não listada). Sem login, sem papéis.

Quem registra uma contribuição **escolhe o funcionário** na lista (não há “usuário logado”).

## Consequências

- Qualquer pessoa com o link pode alterar cadastros e estoque.
- Não há auditoria de “quem clicou”, só “em nome de quem foi a contribuição”.
- Auth pode entrar na fase 2 se o link vazar ou se a empresa exigir.
