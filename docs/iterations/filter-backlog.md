# Filter Backlog

Temporary note for future filter work.

This is not canonical consumer documentation.

## Current Situation

The current built-in filter set covers the core cases well:

- text
- option
- boolean
- number
- date

Recent work also added:

- richer per-filter UI config
- tree mode on `option`
- local vs remote tree search handling
- preview formatting
- lazy text values for translated filter copy

## Important Gaps To Revisit

These are the most likely next filter capabilities worth addressing.

### 1. Presence / Empty Operators

Likely higher priority than adding a brand new filter kind.

Important operators:

- `isEmpty`
- `isNotEmpty`
- maybe `hasValue`
- maybe `missing`

This would be useful across multiple existing filter kinds instead of creating a separate filter type.

### 2. Stronger Array Membership Semantics

The current `option` filter covers many array-field cases, but some products will need more explicit semantics for array values:

- contains any
- contains all
- contains none

This may belong as additional `option` operators rather than a new filter kind.

### 3. Relative Date Support

Date filtering will likely need a stronger story for:

- last N days
- next N days
- older than N days
- this week / month / quarter / year

This probably belongs inside `date`, not as a separate kind.

### 4. Date-Time Precision

If applications need hour/minute precision often, we may need to decide whether:

- `date` should continue to absorb this through config, or
- a more explicit date-time flavor should exist

Not enough evidence yet for a separate kind.

### 5. Relation / Entity Picker

Some remote option filters may eventually stretch beyond generic `option`.

Possible examples:

- users
- teams
- companies
- projects

This may still remain an `option` specialization unless query-state shape or behavior genuinely diverges.

### 6. Status / Enum Presets

This is probably not a new filter kind.

More likely:

- stronger `option` presets for status-like values
- icons
- colors
- compact previews

## Recommendation Order

If this area is revisited later, the recommended priority is:

1. add presence operators across existing kinds
2. improve array-membership semantics for `option`
3. strengthen relative-date/date-time support
4. only then decide whether a new filter kind is truly needed

## Design Reminder

When revisiting filters:

- prefer extending existing kinds before adding new ones
- keep query-state contracts stable unless a real new domain is needed
- only add a new filter kind when behavior or value shape truly diverges
- keep config-driven resolution centralized
- update tests, playground routes, and consumer skills together
