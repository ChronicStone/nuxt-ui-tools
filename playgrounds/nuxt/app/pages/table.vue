<script setup lang="ts">
const { classes } = usePlaygroundAppearance()

const previewSections = [
  {
    title: 'Base table schema',
    description: 'Promise-based async contracts only.',
    payload: baseTableSchema,
  },
  {
    title: 'Query table schema',
    description: 'TanStack Query options for every async resolver.',
    payload: queryTableSchema,
  },
]
</script>

<template>
  <section :class="classes.pageStack">
    <div :class="classes.pageGrid">
      <article :class="classes.panel">
        <h1 class="text-xl font-semibold">
          Data Table V2 reset
        </h1>
        <p class="mt-3 text-sm text-muted">
          Runtime has been intentionally removed. This playground now tracks the schema split between
          <code>@nuxt-ui-tools/table</code> and <code>@nuxt-ui-tools/table-query</code>.
        </p>
        <pre class="mt-6 overflow-auto text-xs">{{ tablePlaygroundSummary }}</pre>
      </article>

      <article
        v-for="section in previewSections"
        :key="section.title"
        :class="classes.panel"
      >
        <h2 class="text-lg font-semibold">
          {{ section.title }}
        </h2>
        <p class="mt-2 text-sm text-muted">
          {{ section.description }}
        </p>
        <pre class="mt-4 overflow-auto text-xs">{{ section.payload }}</pre>
      </article>
    </div>
  </section>
</template>
