# Clinical Observatory v2 visual audit

## Baseline assessment

The implementation already preserved the six real workspaces, synthetic fallback, data-derived telemetry, accessible filters, and a coherent dark clinical-observatory palette. The gap to the supplied reference pack was primarily atmospheric depth and verification evidence, rather than missing product workflow.

| Dimension | Baseline | Target | Required change |
| --- | ---: | ---: | --- |
| Composition | 7 | 9 | Preserve the schedule/runway focal region; keep tables stable and secondary. |
| Hierarchy | 7 | 9 | Retain editorial workspace titles and telemetry band; make workspace accents more deliberate. |
| Typography | 8 | 9 | Keep serif display plus technical sans labels; maintain readable minimum sizes. |
| Material depth | 7 | 9 | Strengthen the independent atmosphere and restrained inner-light panel treatment. |
| Atmospheric fidelity | 6 | 9 | Add a capability-sensitive WebGL2 aurora while retaining the CSS/SVG fallback. |
| Data-visual integration | 8 | 9 | Continue deriving every signal from dashboard records rather than decorative constants. |
| Interaction clarity | 8 | 9 | Preserve selected dock, filters, tabs, retry, and toggles with visible focus. |
| Motion quality | 7 | 9 | Limit motion to ambient drift, selection, and true status change. |
| Responsive quality | 7 | 9 | Keep the six-item mobile dock and local table scrolling. |
| Accessibility | 8 | 9 | Hide atmosphere from assistive tech, preserve contrast, and honor reduced motion. |

## Workspace changes required

- **Operations Observatory:** schedule remains dominant; the global aurora/horizon sits behind, never over, operational rows.
- **Temporal Runway:** retain provider/time-grid utility and current-time beam; prevent atmospheric visuals from competing with appointments.
- **Documentation Continuum:** use light only along the actual stage progression; queues remain solid/high contrast.
- **Risk Constellation:** risk nodes, exposure, and labels stay derived from claims data; amber/coral remain exception-only.
- **Event Spectrum:** preserve stable dense audit rows and confine live visual treatment to the spectrum.
- **Workspace Parameters:** retain the dark observatory surface and unmistakable synthetic-data boundary.

## Risks and guardrails

The atmospheric renderer is decorative, non-interactive, capped at device-pixel-ratio 1.5, pauses while hidden, and renders a single static frame for reduced-motion users. CSS aurora/horizon styling remains the fallback when WebGL2 is unavailable. No patient data or new backend workflow is introduced.
