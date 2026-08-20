<script setup lang="ts">
const { currentAbstraction } = usePlaygroundNavigation()
const groups = computed(() => currentAbstraction.value?.navigation ?? [])
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-5xl gap-9 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid max-w-2xl gap-2.5">
        <p class="text-xs font-medium uppercase tracking-[0.12em] text-dimmed">Tables</p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Data-list playground</h1>
        <p class="text-sm leading-6 text-muted">
          Data sources and composition examples are grouped exactly like the playground tree. Every
          table starts at MD; use the shell size control inside an example to inspect XS–XL.
        </p>
      </header>

      <div class="grid gap-8">
        <section v-for="group in groups" :key="group.id" class="grid gap-2.5">
          <div class="flex items-end justify-between gap-4 border-b border-default pb-2">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-highlighted">{{ group.label }}</h2>
              <p v-if="group.description" class="mt-0.5 text-xs leading-5 text-muted">
                {{ group.description }}
              </p>
            </div>
            <NuxtLink
              v-if="group.path"
              :to="group.path"
              class="shrink-0 text-xs font-medium text-muted transition-colors hover:text-default"
            >
              Overview
            </NuxtLink>
          </div>

          <nav class="grid gap-1" :aria-label="group.label">
            <NuxtLink
              v-for="entry in group.children ?? (group.path ? [group] : [])"
              :key="entry.id"
              :to="entry.path"
              class="group flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-border transition-colors group-hover:bg-primary" />
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium text-highlighted">{{ entry.label }}</span>
                <span v-if="entry.description" class="mt-0.5 block text-xs leading-5 text-muted">
                  {{ entry.description }}
                </span>
              </span>
              <UIcon
                name="i-lucide-arrow-right"
                class="mt-0.5 size-4 shrink-0 text-dimmed transition-transform group-hover:translate-x-0.5"
              />
            </NuxtLink>
          </nav>
        </section>
      </div>
    </section>
  </PlaygroundContent>
</template>
