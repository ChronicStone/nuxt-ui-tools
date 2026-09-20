<script setup lang="ts">
const { currentAbstraction } = usePlaygroundNavigation()
const compositionGroup = computed(() =>
  currentAbstraction.value?.navigation.find((node) => node.id === 'table-compositions'),
)
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid max-w-2xl gap-2.5">
        <p class="text-xs font-medium uppercase tracking-[0.12em] text-dimmed">
          Tables · Compositions
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
          Purpose-built layouts
        </h1>
        <p class="text-sm leading-6 text-muted">
          These are deliberately different products around the same table runtime: persistent
          filtering, staged finance criteria, bulk operations, and a grid-first directory.
        </p>
      </header>

      <nav class="grid gap-1 border-t border-default pt-3" aria-label="Table compositions">
        <NuxtLink
          v-for="entry in compositionGroup?.children ?? []"
          :key="entry.id"
          :to="entry.path"
          class="group grid gap-1 rounded-md px-2 py-3 transition-colors hover:bg-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-start sm:gap-5"
        >
          <span class="text-sm font-medium text-highlighted">{{ entry.label }}</span>
          <span class="text-xs leading-5 text-muted">{{ entry.description }}</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="mt-0.5 size-4 text-dimmed transition-transform group-hover:translate-x-0.5"
          />
        </NuxtLink>
      </nav>
    </section>
  </PlaygroundContent>
</template>
