# PracticeOps command-center navigation design

## Goal

Turn the existing dashboard shell into a focused operations command center. Every navigation item must expose a meaningful workspace without changing the modular-monolith backend or using non-fictional data.

## Experience

- Keep the single Angular standalone application and its current dashboard payload.
- Use a selected-view signal rather than introduce a router for this MVP.
- Make Overview the operational snapshot; Schedule, Documentation, Claims, and Audit log expose their corresponding queues; Settings provides a clearly bounded demo preferences surface.
- Make each rail button keyboard-accessible, visibly selected, and update the page title and visible content.

## Visual system

- Retain the dark navy navigation rail, but use a more deliberate command-center palette: dark ink canvas, bright cyan active accents, warm amber risk accents, and status-specific chips.
- Increase hierarchy with compact eyebrow labels, stronger data numerals, and more intentional panel headers.
- Preserve responsive behavior: the rail becomes a compact navigation grid on narrow viewports.

## Data and error handling

- Reuse the typed dashboard API model for every view.
- Keep the existing loading and retry states. Each view displays an empty-state message if its queue has no items.
- No new API endpoints are required for the navigation work.

## Verification

- Add frontend tests proving a navigation selection changes the active view and heading.
- Run Angular tests and production build.
- Verify Overview and at least one queue view in the running browser.
