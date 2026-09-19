<script setup lang="ts">
const route = useRoute()
const drawer = ref(false)

const nav = [
  {
    label: 'Relations',
    items: [
      { to: '/accounts', label: 'Comptes', icon: 'i-lucide-building-2' },
      { to: '/audit', label: 'Journal d’audit', icon: 'i-lucide-scroll-text' },
    ],
  },
]

watch(() => route.path, () => { drawer.value = false })
</script>

<template>
  <div class="ex-shell">
    <aside class="ex-sidebar">
      <div class="ex-sidebar-top">
        <span class="ex-wordmark">Ex<b>A</b>ssess</span>
      </div>
      <nav class="ex-nav">
        <template v-for="group in nav" :key="group.label">
          <div class="ex-nav-label">{{ group.label }}</div>
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="ex-nav-item"
            active-class="ex-nav-item--on"
          >
            <UIcon :name="item.icon" class="size-4" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>
      <div class="ex-sidebar-user">
        <span class="ex-avatar">CT</span>
        <span class="min-w-0">
          <b class="block truncate text-[13px] font-semibold">Cyprien Thao</b>
          <small class="block truncate text-[11.5px] text-muted">Administrateur</small>
        </span>
      </div>
    </aside>
    <header class="ex-mbar">
      <UButton icon="i-lucide-menu" color="neutral" variant="ghost" size="sm" @click="drawer = true" />
      <span class="ex-wordmark">Ex<b>A</b>ssess</span>
      <span class="flex-1" />
      <span class="ex-avatar ex-avatar--dark">CT</span>
    </header>
    <main class="ex-main">
      <slot />
    </main>
    <USlideover v-model:open="drawer" side="left" title="ExAssess" :ui="{ content: 'w-72 max-w-[80vw]' }">
      <template #body>
        <nav class="ex-nav">
          <template v-for="group in nav" :key="group.label">
            <div class="ex-nav-label">{{ group.label }}</div>
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="ex-nav-item"
              active-class="ex-nav-item--on"
            >
              <UIcon :name="item.icon" class="size-4" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </template>
        </nav>
      </template>
    </USlideover>
  </div>
</template>

<style scoped>
.ex-shell { display: grid; grid-template-columns: 240px minmax(0, 1fr); grid-template-rows: 100dvh; height: 100dvh; }
.ex-sidebar { background: var(--ex-sidebar); border-right: 1px solid var(--ui-border); display: flex; flex-direction: column; min-height: 0; }
.ex-sidebar-top { height: 60px; display: flex; align-items: center; padding: 0 20px; }
.ex-wordmark { font-weight: 700; font-size: 17px; letter-spacing: -0.02em; }
.ex-wordmark b { color: var(--ui-primary); }
.ex-nav { padding: 6px 12px; display: flex; flex-direction: column; gap: 1px; flex: 1; overflow: auto; }
.ex-nav-label { font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ui-text-dimmed); font-weight: 600; padding: 16px 10px 6px; }
.ex-nav-item { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 10px; border-radius: 7px; color: var(--ui-text-toned); font-size: 13.5px; }
.ex-nav-item:hover { background: rgb(0 0 0 / 0.04); color: var(--ui-text); }
.ex-nav-item--on { background: var(--ex-selection); color: var(--ui-text); font-weight: 600; }
.ex-nav-item--on :deep(svg) { color: var(--ui-primary); }
.ex-sidebar-user { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-top: 1px solid var(--ui-border); }
.ex-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--ui-bg-inverted); color: var(--ui-text-inverted); display: grid; place-items: center; font-size: 11px; font-weight: 700; flex: none; }
.ex-mbar { display: none; }
.ex-main { min-width: 0; min-height: 0; display: flex; flex-direction: column; background: var(--ex-page); }
@media (max-width: 1023px) {
  .ex-shell { grid-template-columns: minmax(0, 1fr); grid-template-rows: 52px minmax(0, 1fr); }
  .ex-sidebar { display: none; }
  .ex-mbar { display: flex; align-items: center; gap: 10px; padding: 0 12px; background: var(--ex-sidebar); border-bottom: 1px solid var(--ui-border); }
}
</style>
