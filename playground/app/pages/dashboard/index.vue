<script setup lang="ts">
const { currentAbstraction } = usePlaygroundNavigation()
const groups = computed(() => currentAbstraction.value?.navigation ?? [])
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-5xl gap-9 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid max-w-2xl gap-2.5">
        <p class="text-xs font-medium uppercase tracking-[0.12em] text-dimmed">Dashboards</p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Dashboard playground</h1>
        <p class="text-sm leading-6 text-muted">
          Schemas declare typed URL params and staged queries once; blocks bind to query and derived
          resources and get loading, error, empty, and refresh states for free.
        </p>
      </header>

      <section v-for="group in groups" :key="group.id" class="grid gap-2.5">
        <h2 class="border-b border-default pb-2 text-sm font-semibold text-highlighted">
          {{ group.label }}
        </h2>
        <nav class="grid gap-1" :aria-label="group.label">
          <NuxtLink
            v-for="entry in group.children ?? []"
            :key="entry.id"
            :to="entry.path"
            class="grid gap-0.5 rounded-md px-3 py-2.5 transition-colors hover:bg-elevated/60"
          >
            <span class="text-sm font-medium text-highlighted">{{ entry.label }}</span>
            <span class="text-xs leading-5 text-muted">{{ entry.description }}</span>
          </NuxtLink>
        </nav>
      </section>
    </section>
  </PlaygroundContent>
</template>
