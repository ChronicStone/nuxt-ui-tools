<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

const entries = [
  {
    title: 'Spreadsheet playground',
    description: 'Focused import-engine scenarios with isolated fullscreen routes for matching, references, and stress cases.',
    icon: 'i-lucide-file-spreadsheet',
    to: '/spreadsheet',
  },
  {
    title: 'Remote table',
    description: 'Server-driven data list playground for remote queries, filters, and table orchestration.',
    icon: 'i-lucide-database-zap',
    to: '/table-remote',
  },
  {
    title: 'Client table',
    description: 'Client-side table playground for local data behavior, filtering, and interaction states.',
    icon: 'i-lucide-table-properties',
    to: '/table-client',
  },
] as const
</script>

<template>
  <section class="grid min-h-full place-items-center px-6 py-10">
    <div class="grid w-full max-w-5xl gap-8">
      <div class="grid gap-4 text-center">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UBadge color="neutral" variant="subtle" size="sm" class="font-mono">
            Playground home
          </UBadge>
          <UBadge color="primary" variant="soft" size="sm" class="font-mono">
            No default component open
          </UBadge>
        </div>

        <div class="grid gap-3">
          <h1 class="text-3xl font-semibold tracking-tight text-highlighted">
            Playground Landing
          </h1>
          <p class="mx-auto max-w-3xl text-sm leading-6 text-muted">
            Start from an empty home state, then open the specific playground surface you want to inspect. This keeps the playground calm by default and makes intent explicit before loading a heavy runtime.
          </p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <UCard
          v-for="entry in entries"
          :key="entry.to"
          class="h-full border-default/70 bg-default shadow-sm"
          :ui="{ body: 'grid h-full gap-5 p-5' }"
        >
          <div class="grid gap-4">
            <div class="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <UIcon :name="entry.icon" class="size-5" />
            </div>

            <div class="grid gap-2">
              <h2 class="text-lg font-semibold text-highlighted">
                {{ entry.title }}
              </h2>
              <p class="text-sm leading-6 text-toned">
                {{ entry.description }}
              </p>
            </div>
          </div>

          <div class="mt-auto">
            <UButton
              :to="entry.to"
              color="primary"
              variant="soft"
              trailing-icon="i-lucide-arrow-right"
              label="Open"
            />
          </div>
        </UCard>
      </div>
    </div>
  </section>
</template>
