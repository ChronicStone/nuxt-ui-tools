<script setup lang="ts">
const entries = [
  {
    label: 'Forms',
    description: 'Schema fields, validation, overlays, settings, and typed output.',
    group: 'Abstraction',
    to: '/form',
  },
  {
    label: 'Tables',
    description: 'Client, remote, and composable data-list runtime examples.',
    group: 'Abstraction',
    to: '/table',
  },
  {
    label: 'Spreadsheet',
    description: 'Import-engine scenarios for matching, references, and validation.',
    group: 'Abstraction',
    to: '/spreadsheet',
  },
] as const
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header class="grid max-w-2xl gap-4">
        <p class="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Playground overview
        </p>
        <h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
          Isolated examples for the package runtime.
        </h1>
        <p class="text-base leading-7 text-muted">
          Choose one abstraction or variant at a time. Each route owns its content sizing, runtime
          controls, and validation surface so comparisons stay readable.
        </p>
      </header>

      <nav class="grid border-y border-default" aria-label="Playground examples">
        <NuxtLink
          v-for="entry in entries"
          :key="entry.to"
          :to="entry.to"
          class="group grid gap-2 border-b border-default px-1 py-5 transition-colors last:border-b-0 hover:bg-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-3"
        >
          <span class="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {{ entry.group }}
          </span>
          <span class="grid gap-1">
            <span class="text-base font-medium text-highlighted">{{ entry.label }}</span>
            <span class="text-sm leading-6 text-muted">{{ entry.description }}</span>
          </span>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </NuxtLink>
      </nav>

      <footer class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span>Content modes are declared by each route.</span>
        <span class="hidden h-3 w-px bg-border sm:block" aria-hidden="true" />
        <span>Light and dark modes use the same neutral baseline.</span>
      </footer>
    </section>
  </PlaygroundContent>
</template>
