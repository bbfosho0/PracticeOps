# Clinical Observatory v2 system

## Tokens

| Token family | Values | Use |
| --- | --- | --- |
| Canvas | `#04060c`, deep graphite/blue tiers | Obsidian spatial field and solid data surfaces |
| Signals | cyan, cobalt, violet, green, amber, coral | Telemetry, intelligence, health, and risk semantics |
| Text | `#f5f7ff`, muted blue-grey | Editorial display and operational supporting text |
| Spacing | 8-point rhythm | Workspace gutters, panel padding, and compact rows |
| Materials | deep glass, elevated glass, subtle overlay, near-solid data surface | Context-sensitive hierarchy, never blanket glassmorphism |

## Component rules

- Command dock indicates the active workspace through color, edge light, and `aria-current`.
- Metric signals reconcile with current dashboard state.
- Glass panels carry a cool edge, minimal inner highlight, and deep shadow; dense tables remain near-solid.
- Signal orbs, status chips, pipeline nodes, risk nodes, and spectrum bars receive a semantic `data-tone` from real state.
- Forms, filters, toggles, and rows retain explicit focus treatment and do not rely only on color.

## Atmosphere

`AtmosphereRenderer` uses a single full-viewport WebGL2 draw call for a cyan/cobalt/violet aurora and sparse stars. It is `aria-hidden`, pointer-inert, behind all application content, device-pixel-ratio capped, visibility-aware, and reduced-motion aware. Existing CSS aurora, horizon, scanline, and stars provide the static fallback.
