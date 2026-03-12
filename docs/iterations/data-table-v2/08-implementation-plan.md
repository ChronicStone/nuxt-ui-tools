# Implementation Plan

This plan replaces the old single-package runtime roadmap.

## Phase 1: Schema package reset

Goal:

- land the three-package surface
- stabilize `defineTable(...)`
- stabilize `defineQueryTable(...)`
- move shared schema primitives into `table-core`

Status:

- completed on 2026-03-12 for the initial package split and type surface

## Phase 2: Runtime contract planning

Goal:

- define decision-complete contracts for:
  - query state
  - table context
  - table data
- preserve V1-style organization for future runtime files

Rules:

- do not expand to the rest of the runtime yet
- pause for review after each contract area

## Phase 3: Runtime implementation, one foundation at a time

Execution order:

1. query state
2. table context
3. table data

For each step:

- keep shared utilities in their own directories
- prefer the V1 composable split as the reference
- stop for review before moving to the next foundation

## Deferred until after review

- async filter runtime behavior
- actions
- selection
- layout orchestration
- rendering components
- UI polish and motion
