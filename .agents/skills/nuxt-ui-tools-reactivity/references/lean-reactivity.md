# Lean Reactivity

This repository prefers a lean reactivity model.

## Core Rules

- use `computed` for derivation
- use `watch` for side effects, synchronization, or external bridging
- do not store what can be derived
- avoid duplicated state that must be manually kept in sync
- prefer one clear abstraction over many small bridges

## Good Pattern

- one domain-owned state source
- derived values only where there is real derivation
- clearly named grouped state for related values

## Bad Pattern

- low-level refs
- then computed wrappers to group them
- then more computed wrappers to reshape them
- then extra public wrappers to hide the earlier layering

If you see this pattern, it is usually a sign the abstraction itself should improve.
