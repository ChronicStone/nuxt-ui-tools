# Core Approach

This repository is trying to make both implementation and adoption easy.

That is the main lens for every design decision:

- internal architecture should reduce maintenance cost
- public APIs and consumer skills should reduce adoption cost

## What That Means In Practice

### For maintenance

The codebase should be:

- easy to scan
- easy to place new code into
- easy to refactor without fear
- organized by responsibility
- explicit about public vs internal surfaces

### For adoption

The package should be:

- schema-driven where that improves clarity
- inference-friendly
- example-driven in its consumer documentation
- consistent across features
- easy to explain without hidden setup knowledge

## The Core Tradeoff To Protect

The library should absorb complexity when doing so makes consumer usage simpler and more standard.

Good:

- complex internal normalization with a clean public schema API
- dynamic query-state machinery behind a small consumer surface
- config/registry-driven internals that preserve straightforward usage

Bad:

- awkward consumer typing to compensate for weak library inference
- consumer-side workaround patterns becoming "normal usage"
- leaking internal implementation details into the package surface

## Main Engineering Biases

- modularity over convenience
- composability over monoliths
- standard contracts over ad hoc branches
- config/registry-driven design whenever the domain has variants
- inference-first TypeScript
- lean reactivity

## Absolute Core Philosophy: Config / Registry Driven

This is not a stylistic preference.
It is a central design approach for this repository.

Use config/registry-driven design when a feature has:

- multiple kinds
- multiple modes
- multiple variants
- repeated branching behavior

Preferred direction:

- normalize the contract
- isolate per-kind behavior
- resolve through config/registry shape

Avoid:

- giant branching functions
- giant condition chains mixed with domain logic
- one file trying to know every variant

The filter preview split is the right kind of direction:

- shared normalized contract
- one implementation per filter kind
- orchestration consumes normalized outputs

Use this same approach for:

- filter kinds
- column kinds
- action variants
- layout-specific behavior
- future form / excel-import variant-heavy features

## Lean Reactivity Rule

Reactive architecture should be direct and explainable.

Prefer:

- one state abstraction that directly models the domain
- grouped state instead of many manually synchronized single refs
- computed values for real derivation only
- `shallowRef` for opaque instances and payloads
- VueUse when it removes boilerplate cleanly

Avoid:

- derived state wrapped in more derived state just to re-shape it
- extra computed bridges that exist only because the abstraction is too weak
- storing multiple representations of the same state
- preserving a slower architecture because it is already there

The current table/query-state integration is a known cleanup area.
Agents are encouraged to simplify it when touching it.

## Public Surface Rule

If a consumer-facing pattern is awkward, do not normalize the awkwardness.

Instead:

- improve the package abstraction
- improve inference
- improve consumer documentation/examples

The package should absorb complexity where it meaningfully reduces user burden.
