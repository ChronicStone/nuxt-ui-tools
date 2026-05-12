# Form Engine V2

This directory contains the current discovery and architecture framing for the future `form` runtime.

Use these files as the current source of truth:

- [`CURRENT-PLAN.md`](./CURRENT-PLAN.md): living implementation plan and current decisions for the port
- [`CONTEXT.md`](./CONTEXT.md): centralized handoff context for future agents
- [`01-legacy-analysis.md`](./01-legacy-analysis.md): deep analysis of the legacy `tars-shared-ui` form engine
- [`02-dependency-system-analysis.md`](./02-dependency-system-analysis.md): focused analysis of the dependency model, DX gaps, and typed redesign feasibility
- [`03-v2-direction.md`](./03-v2-direction.md): current architectural direction for a Nuxt UI Tools form runtime
- [`04-api-questions.md`](./04-api-questions.md): unresolved API and product questions that should shape the design
- [`05-decisions-log.md`](./05-decisions-log.md): compact active decisions and working constraints
- [`06-public-api-proposal.md`](./06-public-api-proposal.md): concrete public API alternatives shown mostly through practical schema examples
- [`07-field-migration-scope.md`](./07-field-migration-scope.md): Exassess-focused V1 field migration priority and Nuxt UI mapping
- [`08-implementation-progress.md`](./08-implementation-progress.md): current implementation checkpoints, validation notes, and next technical slices

Important:

- the current implementation source of truth for the legacy system is:
  - `tars-shared-ui/src/runtime/lib/form`
- the current high-signal consumer usage reference is:
  - `exassess-app-cloudflare/app/entities/*/schema.ts`
  - `exassess-app-cloudflare/app/entities/*/schema.tsx`
- the secondary consumer usage reference is:
  - `tars-profile-frontend/app/entities/*/schema.tsx`
- the current type-safety inspiration reference is:
  - `typed-xlsx/packages/core/src/core/path.ts`
  - `typed-xlsx/packages/core/src/core/accessor.ts`
- `src/runtime/form` now contains the first type-layer foundation; keep this directory and the implementation progress log in sync as slices land
