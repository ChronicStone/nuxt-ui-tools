<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import type { ButtonProps } from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import { twMerge } from 'tailwind-merge'
import { computed, shallowRef, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardBlock } from '../composables/use-dashboard-block'
import { useDashboardTime } from '../composables/use-dashboard-time'
import { useDashboardGridContext, useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardDataTable,
  DashboardLegendItem,
  DashboardMenu,
  DashboardMenuAction,
  DashboardMenuContext,
  DashboardMenuEntries,
  DashboardSkeletonKind,
  DashboardSourceLike,
} from '../types'
import { downloadDashboardFile, resolveDashboardFileName, toDashboardCsv } from '../utils/export'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardBlockState from './block/dashboard-block-state.vue'
import DashboardChips from './block/dashboard-chips.vue'
import DashboardDataTableView from './block/dashboard-data-table.vue'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardLegend from './dashboard-legend.vue'

// No height or padding of its own: a text link is no taller than the title it sits next to.
const HEADER_LINK: ButtonProps = {
  class: 'h-auto p-0 font-medium',
  color: 'neutral',
  trailingIcon: 'i-lucide-chevron-right',
  variant: 'link',
}

const props = withDefaults(
  defineProps<
    DashboardBlockBaseProps & {
      /** Source whose state drives the card: skeleton, error with retry, empty, refresh bar. */
      source?: DashboardSourceLike
      /** Whether the ready source has nothing to show. Blocks compute it from their typed data. */
      isEmpty?: boolean
      legend?: readonly DashboardLegendItem[]
      /** Skeleton drawn while the source loads when no `#skeleton` slot is given. */
      skeleton?: DashboardSkeletonKind
      /**
       * Tabular data behind the `table` and `csv` menu actions. Called only when one of them runs,
       * so it can read the source freely.
       */
      tabulate?: () => DashboardDataTable
      /** Offers the `table` menu action when `tabulate` is set. Off for blocks that are tables. */
      viewAsTable?: boolean
      /** Offers the `expand` menu action. The default slot renders again, with `expanded`. */
      expandable?: boolean
    }
  >(),
  {
    card: true,
    expandable: true,
    viewAsTable: true,
    freshness: undefined,
    isEmpty: false,
    menu: undefined,
    skeleton: 'rows',
  },
)

const slots = defineSlots<{
  /** Content. Rendered a second time inside the expand dialog, with `expanded: true`. */
  default?: (props: { expanded: boolean }) => unknown
  skeleton?: () => unknown
  'header-right'?: () => unknown
  /** Row under the header (active filters, chips…), kept visible in every phase. */
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const { t, code } = useUiToolsLocale()
const time = useDashboardTime()
const root = useTemplateRef<HTMLElement>('root')
const block = useDashboardBlock({
  activation: () => props.activation,
  empty: () => props.isEmpty,
  root,
  size: () => props.size,
  source: () => props.source,
})

const appUi = useDashboardUi()
const grid = useDashboardGridContext()
const panel = computed(() => grid?.panels.value ?? false)

const classes = computed(() => {
  const app = appUi.value
  const parts = resolveDashboardClasses(
    {
      actions:
        'ms-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-x-3.5 gap-y-1.5',
      // A column, so content that wants the card's full height (a centered gauge) can take it.
      body: 'flex min-w-0 flex-1 flex-col',
      footer: 'mt-3 flex flex-col',
      footerActions: 'mt-4 flex flex-wrap gap-2 *:flex-1 *:justify-center',
      freshness: 'mt-3 text-[11px] text-dimmed',
      header: 'mb-3.5 flex min-w-0 items-start gap-x-3',
      // Centered on the 20px first line: the 24px button overhangs 2px above and below.
      menu: '-my-0.5 -me-1.5 shrink-0 text-dimmed',
      root: '',
      subtitle: 'max-w-full truncate text-xs font-normal tracking-normal text-muted',
      // A subtitle that does not fit goes under the title rather than cutting it.
      title:
        'flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-semibold tracking-[-0.01em] text-highlighted',
      toolbar: '-mt-1 mb-3.5 flex min-w-0 flex-wrap items-center gap-1.5',
    },
    app.card,
    props.ui,
  )
  // Chrome layers: card defaults, app card, then panel cells drop their own border and radius.
  parts.root = twMerge(
    'relative flex min-w-0 flex-col',
    props.card && ['rounded-lg border border-default bg-default px-6 py-5.5', app.card?.root],
    props.card && panel.value && ['rounded-none border-0 shadow-none', app.grid?.panel],
    props.ui?.root,
  )
  return parts
})

const title = computed(() => resolveTextValue(props.title))
const subtitle = computed(() => resolveTextValue(props.subtitle))
const phase = computed(() => block.phase.value)
const pending = computed(() => phase.value === 'loading' || phase.value === 'idle')
const busy = computed(() => phase.value === 'loading' || block.fetching.value)

const builtInActions: readonly DashboardMenuAction[] = ['table', 'csv', 'expand']
const tableView = shallowRef<boolean>(false)
const expanded = shallowRef<boolean>(false)
// The dialog mounts on first use, then stays mounted so it can animate out.
const expandedOnce = shallowRef<boolean>(false)
function expand() {
  expandedOnce.value = true
  expanded.value = true
}

// What a function `menu` builds its items from. Built once: every member reads live state.
const menuContext: DashboardMenuContext = {
  download,
  expand,
  table: () => (phase.value === 'content' ? props.tabulate?.() : undefined),
  get title() {
    return title.value
  },
}

// The block's own `menu` wins over the grid's.
const menuItems = computed<DropdownMenuItem[]>(() => {
  const menu = props.menu ?? grid?.menu.value ?? false
  if (menu === false) return []
  const entries = menu === true ? builtInActions : isMenuEntries(menu) ? menu : menu(menuContext)
  return entries.flatMap((entry) => (isMenuAction(entry) ? builtInItem(entry) : [entry]))
})

// `placement` is ours; the rest are Nuxt UI button props. A header link without its own look reads
// as a text link with a chevron ("All ›").
const actionButtons = computed(() => {
  const header: ButtonProps[] = []
  const footer: ButtonProps[] = []
  for (const { placement, ...button } of props.actions ?? []) {
    if (placement === 'footer') footer.push(button)
    else header.push(isPlainLink(button) ? { ...HEADER_LINK, ...button } : button)
  }
  return { footer, header }
})

function isPlainLink(button: ButtonProps) {
  return (
    button.to !== undefined &&
    button.variant === undefined &&
    button.icon === undefined &&
    button.trailingIcon === undefined
  )
}
const showTable = computed<boolean>(
  () =>
    tableView.value &&
    props.viewAsTable &&
    phase.value === 'content' &&
    props.tabulate !== undefined,
)

function isMenuEntries(menu: Exclude<DashboardMenu, boolean>): menu is DashboardMenuEntries {
  return Array.isArray(menu)
}

function isMenuAction(entry: DashboardMenuAction | DropdownMenuItem): entry is DashboardMenuAction {
  return entry === 'table' || entry === 'csv' || entry === 'expand'
}

function builtInItem(action: DashboardMenuAction): DropdownMenuItem[] {
  const disabled = phase.value !== 'content'
  if (action === 'expand') {
    if (!props.expandable) return []
    return [
      {
        disabled,
        icon: 'i-lucide-maximize-2',
        label: t('dashboard.menu.expand'),
        onSelect: expand,
      },
    ]
  }
  if (!props.tabulate) return []
  if (action === 'csv') {
    return [
      {
        disabled,
        icon: 'i-lucide-download',
        label: t('dashboard.menu.download'),
        onSelect: download,
      },
    ]
  }
  if (!props.viewAsTable) return []
  return [
    {
      disabled,
      icon: tableView.value ? 'i-lucide-chart-no-axes-column' : 'i-lucide-table-2',
      label: t(tableView.value ? 'dashboard.menu.hideTable' : 'dashboard.menu.showTable'),
      onSelect: () => {
        tableView.value = !tableView.value
      },
    },
  ]
}

function download() {
  if (!props.tabulate) return
  downloadDashboardFile(
    resolveDashboardFileName(title.value, 'csv'),
    toDashboardCsv(props.tabulate(), code.value),
  )
}

const updatedAt = computed(() => {
  const freshness = props.freshness ?? grid?.freshness.value ?? false
  return freshness && phase.value === 'content' ? props.source?.updatedAt : undefined
})

/** The drill-down filters narrowing the block, while set: one removable chip each. */
const filterChips = computed(() =>
  (props.filters ?? [])
    .filter((filter) => filter.enabled && filter.changed)
    .map((filter) => ({
      key: filter.key,
      label: filter.display,
      prefix: filter.label,
      remove: () => filter.reset(),
      removeLabel: t('dashboard.filters.clear', { label: filter.label }),
    })),
)

const hasHeader = computed(() =>
  Boolean(
    title.value ||
    subtitle.value ||
    props.legend?.length ||
    slots['header-right'] ||
    actionButtons.value.header.length ||
    menuItems.value.length,
  ),
)
</script>

<template>
  <section
    v-if="!block.hidden.value"
    ref="root"
    :style="block.style.value"
    :data-phase="phase"
    :data-panel="panel || undefined"
    :aria-busy="busy"
    :class="classes.root"
  >
    <div
      v-if="block.fetching.value"
      aria-hidden="true"
      data-progress
      class="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden"
    >
      <div class="nut-dash-progress h-full w-1/3 rounded-full bg-primary" />
    </div>

    <!-- Title and actions share the first line and wrap as a group; the menu keeps the corner. -->
    <header v-if="hasHeader" :class="classes.header">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
        <h2 :class="classes.title">
          <span class="max-w-full truncate">{{ title }}</span>
          <small v-if="subtitle" :class="classes.subtitle">{{ subtitle }}</small>
        </h2>
        <div
          v-if="
            (legend?.length && !showTable) || $slots['header-right'] || actionButtons.header.length
          "
          :class="classes.actions"
        >
          <DashboardLegend v-if="legend?.length && !showTable" :items="legend" />
          <slot name="header-right" />
          <UButton
            v-for="(button, index) in actionButtons.header"
            :key="index"
            color="neutral"
            variant="outline"
            size="xs"
            v-bind="button"
            data-dashboard-action
          />
        </div>
      </div>
      <UDropdownMenu
        v-if="menuItems.length"
        :items="menuItems"
        :content="{ align: 'end', side: 'bottom', sideOffset: 6 }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          square
          icon="i-lucide-ellipsis"
          :aria-label="t('dashboard.menu.label')"
          :class="classes.menu"
          data-dashboard-menu
        />
      </UDropdownMenu>
    </header>

    <div v-if="$slots.toolbar || filterChips.length" :class="classes.toolbar">
      <DashboardChips v-if="filterChips.length" :chips="filterChips" />
      <slot name="toolbar" />
    </div>

    <div :class="classes.body">
      <div v-if="showTable && tabulate" class="nut-dash-enter">
        <DashboardDataTableView :table="tabulate()" scroll />
      </div>
      <div v-else-if="phase === 'content'" class="nut-dash-enter flex-1">
        <slot :expanded="false" />
      </div>
      <DashboardBlockState
        v-else-if="phase === 'error' || phase === 'empty'"
        :kind="phase"
        :empty
        :retrying="block.fetching.value"
        @retry="block.retry"
      />
      <div v-else aria-hidden="true" :class="phase === 'loading' && 'nut-dash-shimmer'">
        <slot name="skeleton">
          <DashboardSkeleton :kind="skeleton" />
        </slot>
      </div>
    </div>

    <footer v-if="$slots.footer && phase === 'content'" :class="classes.footer">
      <slot name="footer" />
    </footer>
    <footer
      v-else-if="$slots.footer && pending"
      aria-hidden="true"
      :class="[classes.footer, phase === 'loading' && 'nut-dash-shimmer']"
    >
      <div class="flex items-center justify-between border-t border-[var(--nut-dash-grid)] pt-3">
        <div class="nut-dash-ghost h-2.5 w-24 rounded-sm opacity-70" />
        <div class="nut-dash-ghost h-3 w-14 rounded-sm" />
      </div>
    </footer>

    <p v-if="updatedAt !== undefined" :class="classes.freshness">
      <time
        :datetime="new Date(updatedAt).toISOString()"
        :title="time.absolute(updatedAt)"
        data-allow-mismatch="text"
      >
        {{ t('dashboard.freshness.updated', { time: time.relative(updatedAt) }) }}
      </time>
    </p>

    <div v-if="actionButtons.footer.length" :class="classes.footerActions">
      <UButton
        v-for="(button, index) in actionButtons.footer"
        :key="index"
        color="neutral"
        variant="outline"
        v-bind="button"
        data-dashboard-action
      />
    </div>

    <UModal
      v-if="expandedOnce"
      v-model:open="expanded"
      :title="title || t('dashboard.menu.expand')"
      :description="subtitle || undefined"
      :ui="{ content: 'sm:max-w-5xl' }"
    >
      <template #body>
        <DashboardLegend v-if="legend?.length && !showTable" :items="legend" class="mb-4" />
        <DashboardDataTableView v-if="showTable && tabulate" :table="tabulate()" />
        <slot v-else-if="phase === 'content'" :expanded="true" />
      </template>
    </UModal>
  </section>
</template>
