# Consumer Skills Maintenance

Use this reference when changing or auditing `skills/consumer/*`.

## Goal

Consumer skills are not lightweight notes.
They are the package's AI-facing usage documentation.

They should make adoption easy by answering:

- what the user imports
- what the user writes
- what the valid options are
- what behavior or URL shape results
- what defaults, edge cases, and gotchas matter in practice

## Hard Separation

Consumer skills must not contain:

- playground guidance
- internal file-routing
- maintainer language about how the repository is organized
- aspirational statements about what the package should eventually do

Consumer skills must contain:

- current exported APIs
- current behavior
- concrete examples
- concrete result shapes
- practical caveats when they matter

## Writing Standard

Prefer this order inside a feature reference:

1. what this part of the API is for
2. the code the consumer writes
3. the resulting state, URL, or rendered behavior
4. important options
5. gotchas or edge cases

## Example Quality Bar

Bad:

- abstract prose with no code
- generic statements like "the package manages this for you"
- maintainer-only explanations

Good:

- realistic `defineTableSchema(...)` examples
- realistic `useQueryState(...)` / `useQueryStates(...)` examples
- example query strings
- example option values
- example result shapes

## Maintenance Rule

When a user-facing surface changes, update the matching consumer skill in the same task.

That includes:

- new options
- renamed keys
- changed defaults
- changed URL serialization
- new supported patterns
- removed behavior

## Translation Guidance Must Be Explicit

When a schema or component surface accepts user-facing text, consumer skills should say clearly whether that text belongs to:

- package-owned locale messages, or
- consumer-owned schema text

For consumer-owned schema text, document the lazy translation pattern directly:

- prefer `() => t('...')`
- do not recommend rebuilding the whole schema in `computed(...)` just to change language
- do not recommend ad hoc bilingual helpers when translation keys are available

If a task adds lazy text support to a new surface, update the matching consumer skill with at least one concrete i18n example in the same task.
