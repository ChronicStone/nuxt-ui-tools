# Session Logs

This directory stores chronological logs of individual Codex sessions working on Data Table V2.

Purpose:

- trace what each session worked on
- record decisions made in that session
- record blockers, regressions, and open questions
- make handoff between sessions explicit

## Rules

- create one markdown file per session
- file naming:
  - `YYYY-MM-DD-session-01.md`
  - `YYYY-MM-DD-session-02.md`
  - etc.
- every implementation session should add or update one log file here
- if a session changes the spec, it must also update:
  - [`../05-decisions-log.md`](../05-decisions-log.md)
  - [`../07-current-spec.md`](../07-current-spec.md)
  - when relevant, [`../08-implementation-plan.md`](../08-implementation-plan.md)

## Suggested Template

```md
# Session Log

- Date:
- Session ID:
- Agent:

## Scope

- Step(s) worked on:
- Goal for this session:

## Work Completed

- ...

## Decisions Made

- ...

## Files Changed

- ...

## Issues / Blockers

- ...

## Validation

- ...

## Next Handoff

- ...
```
