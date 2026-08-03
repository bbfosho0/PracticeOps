# Clinical Observatory v2 motion grammar

| Interaction | Duration | Behavior |
| --- | ---: | --- |
| Control feedback | 120–180ms | Color/edge and small transform change |
| Rows and filters | 180–240ms | Preserve position; no bounce |
| Workspace switch | 240–360ms | Existing view state remains immediately usable |
| Ambient atmosphere | Slow | Low-amplitude aurora only; no task-surface animation |
| Telemetry update | 350–650ms | Values and meaningful visual signals update together |

Reduced-motion disables nonessential ambient and transition animation while preserving active, selected, and status states. The WebGL atmosphere draws a static fallback frame, and CSS animation rules collapse without hiding information.
