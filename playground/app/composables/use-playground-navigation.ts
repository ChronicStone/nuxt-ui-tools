import { computed } from 'vue'

import { formFieldPlaygrounds } from '../lib/form-field-playgrounds'
import type { PlaygroundContentMode } from '../types/playground'

export interface PlaygroundNavigationNode {
  id: string
  label: string
  description?: string
  path?: string
  mode?: PlaygroundContentMode
  icon?: string
  children?: readonly PlaygroundNavigationNode[]
}

export interface PlaygroundNavigationEntry {
  id: string
  path: string
  label: string
  description: string
  mode: PlaygroundContentMode
}

export interface PlaygroundAbstraction {
  id: string
  path: string
  label: string
  description: string
  icon: string
  navigation: readonly PlaygroundNavigationNode[]
}

const playgroundAbstractions: readonly PlaygroundAbstraction[] = [
  {
    description: 'Typed filters, staged queries, derived values, and state-aware chart blocks.',
    icon: 'i-lucide-layout-dashboard',
    id: 'dashboard',
    label: 'Dashboards',
    navigation: [
      {
        children: [
          {
            description:
              'Two views sharing a year: remote account picker, query filters, all block kinds.',
            id: 'dashboard-analytics',
            label: 'Analytics',
            mode: 'fixed',
            path: '/dashboard/analytics',
          },
          {
            description: 'A flat single-view schema: one filter, staged queries, derived totals.',
            id: 'dashboard-sales',
            label: 'Single view',
            mode: 'fixed',
            path: '/dashboard/sales',
          },
          {
            description:
              'Stat trends and goals, alerts, activity feed, sortable table, drill-down, card menus.',
            id: 'dashboard-operations',
            label: 'Operations',
            mode: 'fixed',
            path: '/dashboard/operations',
          },
        ],
        id: 'dashboard-examples',
        label: 'Examples',
      },
    ],
    path: '/dashboard',
  },
  {
    description: 'Schema-driven fields, validation, overlays, and typed output.',
    icon: 'i-lucide-list-checks',
    id: 'form',
    label: 'Forms',
    navigation: [
      {
        children: formFieldPlaygrounds.map((field) => ({
          description: field.description,
          id: `form-field-${field.id}`,
          label: field.label,
          mode: 'document' as const,
          path: `/form/fields/${field.id}`,
        })),
        description: 'Focused visual and interaction acceptance for every public field kind.',
        id: 'form-fields',
        label: 'Fields',
        mode: 'document',
        path: '/form/fields',
      },
      {
        children: [
          {
            description:
              'Field kinds, context resources, overlays, arrays, uploads, and live output.',
            id: 'form-showcase',
            label: 'Showcase',
            mode: 'document',
            path: '/form/showcase',
          },
          {
            description:
              'Required rules, async checks, dependencies, step scope, and submit lifecycle.',
            id: 'form-validation',
            label: 'Validation',
            mode: 'document',
            path: '/form/validation',
          },
          {
            description: 'Grouped controls, defaults, dirty state, reset, and typed submit output.',
            id: 'form-settings',
            label: 'Settings',
            mode: 'document',
            path: '/form/settings',
          },
        ],
        id: 'form-workflows',
        label: 'Workflows',
      },
    ],
    path: '/form',
  },
  {
    description: 'Client, remote, and composable data-list runtime examples.',
    icon: 'i-lucide-table-2',
    id: 'table',
    label: 'Tables',
    navigation: [
      {
        children: [
          {
            description:
              'Local data behavior, derived counts, layout switching, and row interactions.',
            id: 'table-client',
            label: 'Client data',
            mode: 'scroll',
            path: '/table/client',
          },
          {
            description:
              'Drizzle Resource offset queries, embedded facets, loading, and pagination.',
            id: 'table-remote',
            label: 'Remote · pages',
            mode: 'scroll',
            path: '/table/remote',
          },
          {
            description:
              'Drizzle Resource cursor queries with retained rows and progressive loading.',
            id: 'table-remote-infinite',
            label: 'Remote · infinite',
            mode: 'fixed',
            path: '/table/remote-infinite',
          },
        ],
        id: 'table-data-sources',
        label: 'Data sources',
      },
      {
        children: [
          {
            description: 'A full-height table with a persistent filter rail and cursor loading.',
            id: 'table-composition-rail',
            label: 'Filter rail',
            mode: 'fixed',
            path: '/table/compositions/rail',
          },
          {
            description: 'Inline tags plus a staged filter drawer in a centered finance workspace.',
            id: 'table-composition-staged',
            label: 'Finance workspace',
            mode: 'fixed',
            path: '/table/compositions/staged',
          },
          {
            description: 'Schema bulk actions reveal a bottom selection overlay for selected rows.',
            id: 'table-composition-operations',
            label: 'Operations',
            mode: 'fixed',
            path: '/table/compositions/operations',
          },
          {
            description: 'A grid-first directory with responsive filters and a table fallback.',
            id: 'table-composition-minimal',
            label: 'People directory',
            mode: 'fixed',
            path: '/table/compositions/minimal',
          },
        ],
        description: 'Independent table layouts with purpose-built schemas and behavior.',
        id: 'table-compositions',
        label: 'Compositions',
        mode: 'document',
        path: '/table/compositions',
      },
    ],
    path: '/table',
  },
  {
    description: 'Focused import-engine scenarios for matching, references, and validation.',
    icon: 'i-lucide-sheet',
    id: 'spreadsheet',
    label: 'Spreadsheet',
    navigation: [
      {
        children: [
          {
            description: 'Baseline end-to-end import and reference resolution flow.',
            id: 'spreadsheet-happy-path',
            label: 'Happy path',
            mode: 'canvas',
            path: '/spreadsheet/happy-path',
          },
          {
            description: 'Header selection and manual column assignment.',
            id: 'spreadsheet-manual-matching',
            label: 'Manual matching',
            mode: 'canvas',
            path: '/spreadsheet/manual-matching',
          },
        ],
        id: 'spreadsheet-core',
        label: 'Core flow',
      },
      {
        children: [
          {
            description: 'In-place smart resolution where the final field becomes canonical.',
            id: 'spreadsheet-column-resolve',
            label: 'Column resolve',
            mode: 'canvas',
            path: '/spreadsheet/column-resolve-lab',
          },
          {
            description: 'Preserved raw input plus a derived canonical reference field.',
            id: 'spreadsheet-derived-references',
            label: 'Derived references',
            mode: 'canvas',
            path: '/spreadsheet/derived-references-lab',
          },
          {
            description: 'Single-value reference suggestions and manual resolution.',
            id: 'spreadsheet-reference-reconciliation',
            label: 'Reconciliation',
            mode: 'canvas',
            path: '/spreadsheet/reference-reconciliation',
          },
          {
            description: 'Resolve a multi-value source field into an array output.',
            id: 'spreadsheet-multi-reference',
            label: 'Multi reference',
            mode: 'canvas',
            path: '/spreadsheet/multi-reference-lab',
          },
          {
            description: 'Reference rules decide review validity for unresolved values.',
            id: 'spreadsheet-reference-rules',
            label: 'Reference rules',
            mode: 'canvas',
            path: '/spreadsheet/reference-rules-lab',
          },
        ],
        id: 'spreadsheet-references',
        label: 'References',
      },
      {
        children: [
          {
            description: 'Large workbook and structural edge cases.',
            id: 'spreadsheet-structure-stress',
            label: 'Structure stress',
            mode: 'canvas',
            path: '/spreadsheet/structure-stress',
          },
          {
            description: 'Large dataset with mixed validation failures.',
            id: 'spreadsheet-large-validation',
            label: 'Large validation',
            mode: 'canvas',
            path: '/spreadsheet/large-validation-lab',
          },
          {
            description: 'Deterministic cross-field validation scenario.',
            id: 'spreadsheet-refine-relations',
            label: 'Refine relations',
            mode: 'canvas',
            path: '/spreadsheet/refine-relations-lab',
          },
          {
            description: 'Built-in multiple columns without references.',
            id: 'spreadsheet-multi-value',
            label: 'Multi value',
            mode: 'canvas',
            path: '/spreadsheet/multi-value-lab',
          },
        ],
        id: 'spreadsheet-stress',
        label: 'Stress & validation',
      },
    ],
    path: '/spreadsheet',
  },
]

export function usePlaygroundNavigation() {
  const route = useRoute()
  const abstractions = computed(() => playgroundAbstractions)
  const currentAbstraction = computed<PlaygroundAbstraction | undefined>(() => {
    if (route.path === '/') {
      return
    }

    return abstractions.value.find(
      (abstraction) =>
        route.path === abstraction.path || route.path.startsWith(`${abstraction.path}/`),
    )
  })
  const examples = computed(() =>
    currentAbstraction.value ? flattenNavigation(currentAbstraction.value.navigation) : [],
  )
  const currentPage = computed<PlaygroundNavigationEntry>(() => {
    const matchedPage = examples.value.find((page) => page.path === route.path)
    if (matchedPage) {
      return matchedPage
    }

    if (currentAbstraction.value && route.path === currentAbstraction.value.path) {
      return {
        description: currentAbstraction.value.description,
        id: currentAbstraction.value.id,
        label: 'Overview',
        mode: 'document',
        path: currentAbstraction.value.path,
      }
    }

    return {
      description: 'Choose an abstraction and then an isolated example.',
      id: route.path === '/' ? 'home' : route.path,
      label: route.path === '/' ? 'Overview' : 'Playground',
      mode: 'document',
      path: route.path,
    }
  })
  const currentTrail = computed<PlaygroundNavigationNode[]>(() => {
    const abstraction = currentAbstraction.value
    if (!abstraction || route.path === abstraction.path) {
      return []
    }
    return findNavigationTrail(abstraction.navigation, route.path) ?? []
  })
  const pageIndex = computed(() => examples.value.findIndex((page) => page.path === route.path))
  const previousPage = computed(() =>
    pageIndex.value > 0 ? examples.value[pageIndex.value - 1] : undefined,
  )
  const nextPage = computed(() =>
    pageIndex.value >= 0 && pageIndex.value < examples.value.length - 1
      ? examples.value[pageIndex.value + 1]
      : undefined,
  )

  return {
    abstractions,
    currentAbstraction,
    currentPage,
    currentTrail,
    examples,
    nextPage,
    pageIndex,
    previousPage,
    route,
  }
}

export function navigationNodeContainsPath(node: PlaygroundNavigationNode, path: string): boolean {
  if (node.path === path) {
    return true
  }
  return node.children?.some((child) => navigationNodeContainsPath(child, path)) ?? false
}

function flattenNavigation(nodes: readonly PlaygroundNavigationNode[]) {
  const entries: PlaygroundNavigationEntry[] = []

  for (const node of nodes) {
    if (node.path && node.mode) {
      entries.push({
        description: node.description ?? node.label,
        id: node.id,
        label: node.label,
        mode: node.mode,
        path: node.path,
      })
    }

    if (node.children?.length) {
      entries.push(...flattenNavigation(node.children))
    }
  }

  return entries
}

function findNavigationTrail(
  nodes: readonly PlaygroundNavigationNode[],
  path: string,
  trail: PlaygroundNavigationNode[] = [],
): PlaygroundNavigationNode[] | undefined {
  for (const node of nodes) {
    const nextTrail = [...trail, node]
    if (node.path === path) {
      return nextTrail
    }

    if (node.children?.length) {
      const childTrail = findNavigationTrail(node.children, path, nextTrail)
      if (childTrail) {
        return childTrail
      }
    }
  }

  return undefined
}
