# Feature Organization

Config-driven design should show up in the file structure.

## Preferred Placement

- normalized contracts in `types/`
- schema-facing entrypoints in `schema/`
- orchestration in `composables/`
- pure variant logic in `utils/`
- builders in `utils/builders/`
- rendering in `components/`

## Split Early

Once a feature becomes non-trivial, split by concern early.

Examples:

- `utils/filters/preview/*`
- `utils/columns/*`

## Smells

Refactor when you see:

- giant branching functions
- giant files mixing contracts, resolution, and rendering
- variant code scattered through multiple orchestration layers
