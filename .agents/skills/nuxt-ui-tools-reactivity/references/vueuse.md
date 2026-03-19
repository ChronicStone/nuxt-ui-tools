# VueUse

VueUse is available and should be considered proactively.

## Rule

Do not manually rebuild reactive utilities when VueUse already offers a clear and stable abstraction.

## Good Uses

- injection helpers
- event and lifecycle helpers
- controlled refs and sync helpers
- utility composables that replace repetitive handwritten glue

## Selection Test

Use VueUse when it:

- removes boilerplate
- makes intent clearer
- avoids handwritten reactive plumbing

Skip it when:

- it obscures ownership
- it adds an abstraction the team will fight more than maintain
