<script setup lang="ts">
const examples = [
  {
    label: 'Field labs',
    description: 'Dedicated visual, sizing, interaction, and validation pages for every field kind.',
    to: '/form/fields',
  },
  {
    label: 'Showcase',
    description: 'Field kinds, context resources, overlays, arrays, uploads, and live output.',
    to: '/form/showcase',
  },
  {
    label: 'Validation',
    description: 'Required rules, async checks, dependencies, step scope, and submit lifecycle.',
    to: '/form/validation',
  },
  {
    label: 'Settings',
    description: 'Grouped controls, defaults, dirty state, reset, and typed submit output.',
    to: '/form/settings',
  },
] as const
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-4xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid max-w-2xl gap-3">
        <p class="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Form playground
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Form examples</h1>
        <p class="text-sm leading-6 text-muted">
          Choose one form concern at a time. Each route owns its schema, controls, and validation
          surface so the runtime API remains visible.
        </p>
      </header>

      <nav class="grid border-y border-default" aria-label="Form examples">
        <NuxtLink
          v-for="example in examples"
          :key="example.to"
          :to="example.to"
          class="group grid gap-1 border-b border-default px-1 py-5 last:border-b-0 transition-colors hover:bg-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3"
        >
          <span class="text-base font-medium text-highlighted">{{ example.label }}</span>
          <span class="text-sm leading-6 text-muted">{{ example.description }}</span>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="mt-1 size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </NuxtLink>
      </nav>
    </section>
  </PlaygroundContent>
</template>
