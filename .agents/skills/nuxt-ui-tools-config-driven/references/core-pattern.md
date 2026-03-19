# Core Pattern

Use config/registry-driven design when a feature has:

- multiple kinds
- multiple modes
- repeated branching behavior
- multiple implementations behind the same contract

## Preferred Flow

1. define the shared contract
2. normalize inputs once
3. isolate per-kind logic in separate files
4. resolve behavior through config/registry structure
5. consume normalized outputs in orchestration or rendering

## Why

This avoids:

- giant branching functions
- one file knowing every variant
- mixed normalization, orchestration, and rendering logic
