# ADR-0024 — Avisos de estoque no Chat (0 / 1 / reposição)

## Status

Aceito (supersede [ADR-0011](0011-chat-on-stock-reaches-one.md))

## Contexto

O ADR-0011 só avisava ao cruzar 1 para baixo e silenciava 1→0. O grupo no Google Chat precisa saber quando chega a 1, quando acaba (0), e quando alguém repõe saindo de 0 ou de 1.

## Decisão

Após persistir mudança de estoque (ajuste, contagem, contribuição vigente, editar/excluir vigente), comparar before/after por item:

- `depois === 1` e `antes > 1` → estoque baixo (cita próximo da vez);
- `depois === 0` e `antes > 0` → acabou (cita próximo da vez; inclui 5→0 e 1→0);
- `antes <= 1` e `depois > antes` → reposição (item + quantidade; sem próximo da vez);
- caso contrário → silêncio.

Uma mensagem por item por gravação (estoque final). Criar item, excluir item, contribuição passada e GET não avisam.

Texto em pt-BR; unidade do cadastro (`unitLabel` + `s` se quantidade ≠ 1). `APP_URL` opcional no fim da mensagem (servidor; normalizar sem barra final). Webhook: `GOOGLE_CHAT_WEBHOOK_URL`. Falha do Chat não desfaz o save.

## Consequências

- 1→0 passa a avisar “acabou”.
- Reposição gera aviso; oscilar só acima de 1 permanece silencioso.
- ADR-0011 fica histórico.
