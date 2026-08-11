<script setup lang="ts">
import PlaygroundControls from '../components/playground/PlaygroundControls.vue'
import PlaygroundLogo from '../components/playground/PlaygroundLogo.vue'
import PlaygroundNavbar from '../components/playground/PlaygroundNavbar.vue'

const { classes } = usePlaygroundAppearance()
const { components, groups, homeLink, items } = usePlaygroundNavigation()
</script>

<template>
  <div :class="classes.shell">
    <UDashboardGroup :class="classes.dashboardFrame" unit="rem">
      <UDashboardSidebar
        :class="classes.dashboardSidebar"
        resizable
        collapsible
        :toggle="{ size: 'sm', variant: 'outline', class: 'ring-default' }"
      >
        <template #header="{ collapsed }">
          <NuxtLink :to="homeLink.to" class="inline-flex text-highlighted" aria-label="Home">
            <PlaygroundLogo :collapsed="collapsed" />
          </NuxtLink>

          <div v-if="!collapsed" class="ms-auto flex items-center gap-1">
            <PlaygroundControls />
            <UColorModeButton
              color="neutral"
              variant="ghost"
              class="data-[state=open]:bg-elevated"
            />
          </div>
        </template>

        <template #default="{ collapsed }">
          <UDashboardSearchButton :collapsed="collapsed" />

          <UNavigationMenu :collapsed="collapsed" :items="items" orientation="vertical" />

          <USeparator type="dashed" />

          <UNavigationMenu :collapsed="collapsed" :items="components" orientation="vertical" />
        </template>
      </UDashboardSidebar>

      <UDashboardPanel
        :class="classes.dashboardPanel"
        :ui="{
          body: 'p-0 sm:p-0',
        }"
      >
        <template #header>
          <PlaygroundNavbar />
        </template>

        <template #body>
          <div :class="classes.dashboardPage">
            <slot />
          </div>
        </template>
      </UDashboardPanel>

      <UDashboardSearch :groups="groups" :fuse="{ resultLimit: 100 }" />
    </UDashboardGroup>
  </div>
</template>
