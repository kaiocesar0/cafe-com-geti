# ADR-0007 — Unidade do total contribuído

## Status

Aceito

## Contexto

“Trouxe 2 cafés” não é 2 usos da máquina. Pacotes de tamanhos diferentes poderiam distorcer o ranking.

## Decisão

Cada contribuição soma **unidades do item cadastrado** (1 pacote = 1). Tamanhos diferentes do mesmo produto, no MVP, contam iguais. Se no futuro misturarem 500 g e 1 kg de forma injusta, cadastrar itens separados.

## Consequências

- Cadastro de item precisa de nome + unidade visível (“pacote”, “litro”, “caixa”).
- Não há conversão para gramas/litros no MVP.
