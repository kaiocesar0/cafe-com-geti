# ADR-0010 — Flag ativo no funcionário

## Status

Aceito

## Contexto

Férias, desligamento ou saída temporária do rodízio.

## Decisão

Funcionário tem flag **ativo**. Inativo sai de **todas** as filas e deixa de ser próximo da vez. Preferência continua definindo em quais itens um ativo participa. Não há participação por item no MVP.

## Consequências

- “Toma leite mas não traz leite” não é suportado sem mudar preferência ou inativar.
- Histórico do inativo permanece.
