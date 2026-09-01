# ADR-0009 — Histórico inicial como contribuições passadas

## Status

Aceito

## Contexto

O ranking por quantidade exige totais já trazidos. Datas importam para desempate. O estoque da prateleira já existe e é acertado na mão.

## Decisão

Tela para lançar **contribuições passadas** (data + funcionário + item + quantidade).

Esses lançamentos:

- somam no **total contribuído**;
- entram no desempate (data da última vez);
- **não** alteram o **estoque atual**.

Contribuição **vigente** (trazer agora) continua subindo estoque e total.

## Consequências

- Modelo precisa distinguir os dois (flag `affectsStock` ou `kind: current | past`).
- Cadastro de item deve permitir informar o estoque da contagem física na criação/edição.
