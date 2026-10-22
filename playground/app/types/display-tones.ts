import type { DisplayTone } from '#ui-tools/display'

// Registers the extra tones of `app.config.ts`, so `tone: 'violet'` type-checks.
declare module '#ui-tools/display' {
  interface DisplayToneRegistry {
    teal: true
    violet: true
  }
}

/** Every tone the playground can use, the registered ones included. */
export type PlaygroundTone = DisplayTone
