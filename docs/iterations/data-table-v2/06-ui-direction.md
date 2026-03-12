# UI Direction

This document captures the current visual direction for the V2 `DataList` UI based on screenshots shared by the user on March 12, 2026.

Note: the screenshot binaries were not directly available as local files during this documentation pass, so this file records explicit observations and design decisions from those references.

## Current V1 Table

Reference: current live table screenshot provided by the user.

Main issues observed:

- ugly overall presentation
- cramped toolbar and control layout
- buttons feel too large and visually heavy
- controls compete too much with the data area
- filter chips occupy too much space
- header interactions feel weak
- overall hierarchy is not clean

Conclusion:

- V2 should not preserve the current V1 visual density
- toolbar controls need a more compact scale
- information hierarchy should be calmer and more intentional

## Reference Direction A: Compact Filter Toolbar

Reference: dark UI screenshots with compact inline filter chips.

Notable strengths:

- much more compact than V1
- filter chips feel structured and intentional
- operator/value grouping is clearer
- sorting is more evident as a first-class control
- overall horizontal packing is better

Direction to retain:

- compact filter chip sizing
- segmented chip structure
- stronger sort visibility
- tighter toolbar rhythm

## Reference Direction B: Header Dropdown Interaction

Reference: dark UI screenshot where the column header opens a dropdown with:

- `Asc`
- `Desc`
- `Hide`

Notable strengths:

- sorting is more discoverable
- header becomes a real interactive control
- future features like pinning and hiding fit naturally in the same place
- cleaner than relying on small sort icons only

Direction to retain:

- full dropdown-based header interactions
- sorting inside the column menu
- room for hide / pin / order actions in the same interaction model

## Reference Direction C: Clean Table Shell

Reference: dark `Users` table screenshot.

Notable strengths:

- clean and calm layout
- compact and balanced top bar
- table remains visually dominant
- search and actions are well grouped
- footer and pagination feel unobtrusive
- overall spacing is much better than V1

Direction to retain:

- restrained button sizing
- balanced left/right toolbar grouping
- clean shell around the table
- calmer pagination/footer treatment

## Confirmed UI Direction

For V2:

- more compact than V1
- less visually heavy
- smaller and calmer control sizing
- better toolbar packing
- stronger hierarchy between filters, search, actions, and table content
- column headers should support full dropdown interactions
- filter builder and active chips are first-class built-ins
- default footer should clearly expose:
  - selected count
  - total row count
  - pagination controls
- subtle animation and interaction polish are a high-priority part of the UI scope
- the table should feel:
  - responsive
  - snappy
  - enjoyable to use
- motion should be:
  - subtle
  - high-quality
  - intentional
  - never clunky

## Motion Direction

Motion should be treated as part of the product quality, not as decorative afterthought.

High-priority areas for subtle animation:

- toolbar interactions
- filter chip add/remove/update transitions
- overlay open/close behavior
- layout switching
- header affordances
- row action interactions
- loading state transitions
- empty/result state transitions
- pagination transitions where appropriate

Direction:

- prefer subtle micro-interactions over loud animation
- responsiveness and clarity matter more than spectacle
- avoid the clunky feel of the V1 interactions

## Future Scope

- column summaries / summary rows should remain possible later, even if deferred from first iteration

## Open UI Questions

- exact toolbar packing strategy when many controls are enabled
- responsive collapse behavior
- exact placement of clear/reset actions
- whether clear should integrate into the filter trigger area
- which granular UI pieces should be public beyond the main layout blocks
- exact animation language and timing system to adopt consistently
