# Shared Runtime

`src/runtime/shared` is for genuinely shared building blocks.

## Good Fits

- generic utility types
- generic predicates
- generic object/render helpers
- shared composables that do not smuggle in domain assumptions

## Bad Fits

- table-specific logic parked in shared for convenience
- logic that only one runtime domain owns today and is unlikely to generalize

## Rule

Only move code to shared when doing so reduces duplication without hiding domain ownership.

## Practical Test

If you removed the current domain and the code would no longer make sense, it probably does not belong in shared.
