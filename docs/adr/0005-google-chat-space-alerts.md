# ADR-0005 — Alertas no espaço do Google Chat

## Status

Aceito

## Contexto

A dor é perceber tarde demais que acabou. Mensagem privada “sua vez” não é MVP. O time já se coordena num grupo.

## Decisão

- Um **Incoming Webhook** apontando para o **espaço (grupo) do workspace**.
- Disparo quando o estoque **cruzar 1 para baixo** (`anterior > 1` e `novo <= 1`). Detalhe: ADR-0011.
- O texto **nomeia o próximo da vez** daquele item, visível para todos.
- Sem DM, sem Chat API com menção obrigatória no MVP (webhook cobre o grupo).

## Consequências

- Todos veem o alerta; não depende do próximo abrir o app.
- Risco de ruído se o estoque oscilar em torno do limiar — precisa regra de “não repetir até repor” (ainda em aberto).
- URL do webhook é segredo de servidor.
