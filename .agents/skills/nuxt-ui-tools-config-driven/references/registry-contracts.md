# Registry Contracts

Registry-driven design works only when the contract is stable.

## Contract Rules

- define a normalized input shape
- define a normalized output shape
- keep the orchestration layer unaware of per-kind implementation details
- keep variant files small and single-purpose

## Practical Examples In This Repo

Good current direction:

- filter preview split by kind under `src/runtime/table/utils/filters/preview/*`
- columns pipeline under `src/runtime/table/utils/columns/*`

## When Adding A Variant

Before adding a new kind:

1. check whether a stable contract already exists
2. add the new implementation file under the owning pipeline
3. keep orchestration consuming the shared contract
4. update consumer docs if the new variant changes the public surface
