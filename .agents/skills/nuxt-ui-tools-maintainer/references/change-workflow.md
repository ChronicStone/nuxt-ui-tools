# Change Workflow

Use this reference when implementing or refactoring a feature.

## Step 1: Classify The Change

Identify whether the change is primarily about:

- public package surface
- domain runtime behavior
- query-state primitive behavior
- shared helper behavior
- rendering/presentation
- documentation/consumer guidance

## Step 2: Decide The Owning Layer

Ask:

- is this a public contract change?
- is this orchestration?
- is this pure transformation?
- is this rendering?

Then place it in the right layer.

Also ask:

- does this belong in a current runtime domain, or should it be shared?
- is this a variant-specific implementation that should live behind a config/registry contract?
- is this an opportunity to reduce a current abstraction leak?

## Step 3: Normalize Before Branching

If the feature introduces variants, do not immediately write a giant branching implementation.

Ask first:

- what is the shared contract?
- what are the variant-specific pieces?
- should this be config/registry-driven?
- can I make the public surface simpler by moving complexity inward?

## Step 4: Protect Consumer Simplicity

Before finalizing the implementation, ask:

- does this improve or damage inference?
- does it force awkward consumer-side typing?
- does it create a workflow that is hard to explain?

If yes, fix the abstraction.

## Step 5: Update The Full Surface

When relevant, update:

- implementation
- tests
- playground validation surface
- consumer skills
- internal skills if architecture or extension patterns changed

If the change touches user-facing behavior, treat the consumer skill update as required, not optional.

## Step 6: Prefer Refactoring Over Layering

If the existing code is wasteful or over-layered:

- simplify it
- reorganize it
- remove unnecessary wrappers

Do not preserve a weak structure just because it already exists.

## Step 7: Leave The Area Easier To Navigate

When you touch a confusing area, try to improve at least one of:

- file placement
- naming
- type clarity
- reactive simplicity
- config/registry structure
- related internal or consumer guidance
