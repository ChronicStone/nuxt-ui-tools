export default defineAppConfig({
  nuxtUiTools: {
    display: {
      // Extra tones for the display blocks, declared in `types/display-tones.ts`.
      tones: {
        teal: {
          color: 'var(--color-teal-500)',
          dark: { ink: 'var(--color-teal-300)' },
          ink: 'var(--color-teal-700)',
        },
        violet: {
          color: 'var(--color-violet-500)',
          dark: { ink: 'var(--color-violet-300)' },
          ink: 'var(--color-violet-700)',
        },
      },
    },
  },
  ui: {
    colors: {
      neutral: 'zinc',
      primary: 'neutral',
    },
  },
})
