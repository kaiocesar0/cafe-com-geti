# ADR-0013 — Identidade visual: tokens, sem marca DPE

## Status

Aceito

## Contexto

Paleta e [Design System no Figma](https://www.figma.com/design/3kid9m8j5OrTnenRUvALx7/Design-System?node-id=4048-350) da Defensoria Pública SC. O app é da copa (Café com Geti), não um produto oficial da DPE.

## Decisão

- Usar **tokens** (cores, tipografia, ritmo de componentes) no tema shadcn.
- **Não** usar logo, nome ou assinatura “Defensoria Pública Santa Catarina” no app.
- Fonte da verdade de layout: shadcn alinhado ao DS, não Figma Make.

| Token | Hex | Papel no tema |
|---|---|---|
| Pine Green Dark | `#0A6239` | `--primary` |
| Blue Green | `#718E8B` | muted / secondary |
| Gold | `#D9A656` | aviso (próximo da vez, estoque baixo) |
| Red | `#C8322A` | destructive / crítico |
| Soft / Light / Snowy Pine | `#1D3D18` `#0E5E3D` `#15804D` | variantes e tema escuro |

## Consequências

- Temas claro (default) e escuro: ADR-0016.
- Implementação mapeia CSS variables do shadcn; não copia o arquivo Figma pixel a pixel.
