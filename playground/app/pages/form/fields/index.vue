<script setup lang="ts">
import { formFieldPlaygrounds } from '../../../lib/form-field-playgrounds'

const groups = [
  {
    label: 'Inputs',
    ids: ['text', 'password', 'textarea', 'number', 'phone-number', 'one-time-code', 'tag'],
  },
  {
    label: 'Choice controls',
    ids: [
      'select',
      'auto-complete',
      'checkbox',
      'checkbox-group',
      'checkbox-card',
      'radio',
      'radio-card',
      'switch',
      'switch-group',
      'rating',
      'slider',
      'color-picker',
    ],
  },
  {
    label: 'Date & time',
    ids: ['date', 'datetime', 'daterange', 'monthrange', 'datetimerange', 'month', 'year', 'time'],
  },
  {
    label: 'Hierarchy',
    ids: ['tree-select', 'cascader', 'tree'],
  },
  {
    label: 'Composition',
    ids: ['input-group', 'group', 'object', 'card', 'column', 'matrix', 'custom-component'],
  },
  {
    label: 'Collections & files',
    ids: ['array-list', 'array-table', 'array-tabs', 'array-variant', 'file', 'upload'],
  },
  {
    label: 'Display & runtime',
    ids: ['info', 'divider', 'button', 'hidden'],
  },
].map((group) => ({
  ...group,
  entries: group.ids.flatMap((id) => {
    const entry = formFieldPlaygrounds.find((definition) => definition.id === id)
    return entry ? [entry] : []
  }),
}))
</script>

<template>
  <PlaygroundContent mode="document">
    <main class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header class="grid max-w-3xl gap-2">
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Form field labs</h1>
        <p class="text-sm leading-6 text-muted">
          Every public field kind has its own focused route with runtime diagnostics and a root
          control-size switch. Use these pages for visual, interaction, validation, overflow, and
          responsive acceptance instead of relying on the full showcase.
        </p>
      </header>

      <section v-for="group in groups" :key="group.label" class="grid gap-2.5">
        <div class="flex items-center gap-3 border-b border-default pb-2">
          <h2 class="text-sm font-semibold text-highlighted">{{ group.label }}</h2>
          <span class="text-xs text-muted">{{ group.entries.length }}</span>
        </div>

        <div class="divide-y divide-default border-y border-default">
          <NuxtLink
            v-for="entry in group.entries"
            :key="entry.id"
            :to="`/form/fields/${entry.id}`"
            class="group grid gap-1 px-1 py-3.5 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
          >
            <span class="text-sm font-medium text-highlighted">{{ entry.label }}</span>
            <span class="min-w-0 text-xs leading-5 text-muted">{{ entry.description }}</span>
            <span class="inline-flex items-center gap-1 text-xs text-muted group-hover:text-highlighted">
              {{ entry.id }}
              <UIcon name="i-lucide-arrow-right" class="size-3.5" />
            </span>
          </NuxtLink>
        </div>
      </section>
    </main>
  </PlaygroundContent>
</template>
