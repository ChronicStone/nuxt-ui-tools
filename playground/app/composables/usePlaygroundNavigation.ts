import { computed } from 'vue'

import { formFieldPlaygrounds } from '../lib/form-field-playgrounds'
import type { PlaygroundContentMode } from '../types/playground'

export type PlaygroundNavigationNode = {
  id: string
  label: string
  description?: string
  path?: string
  mode?: PlaygroundContentMode
  icon?: string
  children?: readonly PlaygroundNavigationNode[]
}

export type PlaygroundNavigationEntry = {
  id: string
  path: string
  label: string
  description: string
  mode: PlaygroundContentMode
}

export type PlaygroundAbstraction = {
  id: string
  path: string
  label: string
  description: string
  icon: string
  navigation: readonly PlaygroundNavigationNode[]
}

const playgroundAbstractions: readonly PlaygroundAbstraction[] = [
  {
    id: 'form',
    path: '/form',
    label: 'Forms',
    description: 'Schema-driven fields, validation, overlays, and typed output.',
    icon: 'i-lucide-list-checks',
    navigation: [
      {
        id: 'form-fields',
        path: '/form/fields',
        label: 'Fields',
        description: 'Focused visual and interaction acceptance for every public field kind.',
        mode: 'document',
        children: formFieldPlaygrounds.map((field) => ({
          id: `form-field-${field.id}`,
          path: `/form/fields/${field.id}`,
          label: field.label,
          description: field.description,
          mode: 'document' as const,
        })),
      },
      {
        id: 'form-workflows',
        label: 'Workflows',
        children: [
          {
            id: 'form-showcase',
            path: '/form/showcase',
            label: 'Showcase',
            description:
              'Field kinds, context resources, overlays, arrays, uploads, and live output.',
            mode: 'document',
          },
          {
            id: 'form-validation',
            path: '/form/validation',
            label: 'Validation',
            description:
              'Required rules, async checks, dependencies, step scope, and submit lifecycle.',
            mode: 'document',
          },
          {
            id: 'form-settings',
            path: '/form/settings',
            label: 'Settings',
            description: 'Grouped controls, defaults, dirty state, reset, and typed submit output.',
            mode: 'document',
          },
        ],
      },
    ],
  },
  {
    id: 'table',
    path: '/table',
    label: 'Tables',
    description: 'Client, remote, and composable data-list runtime examples.',
    icon: 'i-lucide-table-2',
    navigation: [
      {
        id: 'table-data-sources',
        label: 'Data sources',
        children: [
          {
            id: 'table-client',
            path: '/table/client',
            label: 'Client data',
            description:
              'Local data behavior, derived counts, layout switching, and row interactions.',
            mode: 'scroll',
          },
          {
            id: 'table-remote',
            path: '/table/remote',
            label: 'Remote · pages',
            description:
              'Drizzle Resource offset queries, embedded facets, loading, and pagination.',
            mode: 'scroll',
          },
          {
            id: 'table-remote-infinite',
            path: '/table/remote-infinite',
            label: 'Remote · infinite',
            description:
              'Drizzle Resource cursor queries with retained rows and progressive loading.',
            mode: 'fixed',
          },
        ],
      },
      {
        id: 'table-compositions',
        path: '/table/compositions',
        label: 'Compositions',
        description: 'Independent table layouts with purpose-built schemas and behavior.',
        mode: 'document',
        children: [
          {
            id: 'table-composition-rail',
            path: '/table/compositions/rail',
            label: 'Filter rail',
            description: 'A full-height table with a persistent filter rail and cursor loading.',
            mode: 'fixed',
          },
          {
            id: 'table-composition-staged',
            path: '/table/compositions/staged',
            label: 'Finance workspace',
            description: 'Inline tags plus a staged filter drawer in a centered finance workspace.',
            mode: 'fixed',
          },
          {
            id: 'table-composition-operations',
            path: '/table/compositions/operations',
            label: 'Operations',
            description: 'Schema bulk actions reveal a bottom selection overlay for selected rows.',
            mode: 'fixed',
          },
          {
            id: 'table-composition-minimal',
            path: '/table/compositions/minimal',
            label: 'People directory',
            description: 'A grid-first directory with responsive filters and a table fallback.',
            mode: 'fixed',
          },
        ],
      },
    ],
  },
  {
    id: 'spreadsheet',
    path: '/spreadsheet',
    label: 'Spreadsheet',
    description: 'Focused import-engine scenarios for matching, references, and validation.',
    icon: 'i-lucide-sheet',
    navigation: [
      {
        id: 'spreadsheet-core',
        label: 'Core flow',
        children: [
          {
            id: 'spreadsheet-happy-path',
            path: '/spreadsheet/happy-path',
            label: 'Happy path',
            description: 'Baseline end-to-end import and reference resolution flow.',
            mode: 'canvas',
          },
          {
            id: 'spreadsheet-manual-matching',
            path: '/spreadsheet/manual-matching',
            label: 'Manual matching',
            description: 'Header selection and manual column assignment.',
            mode: 'canvas',
          },
        ],
      },
      {
        id: 'spreadsheet-references',
        label: 'References',
        children: [
          {
            id: 'spreadsheet-column-resolve',
            path: '/spreadsheet/column-resolve-lab',
            label: 'Column resolve',
            description: 'In-place smart resolution where the final field becomes canonical.',
            mode: 'canvas',
          },
          {
            id: 'spreadsheet-derived-references',
            path: '/spreadsheet/derived-references-lab',
            label: 'Derived references',
            description: 'Preserved raw input plus a derived canonical reference field.',
            mode: 'canvas',
          },
          {
            id: 'spreadsheet-reference-reconciliation',
            path: '/spreadsheet/reference-reconciliation',
            label: 'Reconciliation',
            description: 'Single-value reference suggestions and manual resolution.',
            mode: 'canvas',
          },
          {
            id: 'spreadsheet-multi-reference',
            path: '/spreadsheet/multi-reference-lab',
            label: 'Multi reference',
            description: 'Resolve a multi-value source field into an array output.',
            mode: 'canvas',
          },
          {
            id: 'spreadsheet-reference-rules',
            path: '/spreadsheet/reference-rules-lab',
            label: 'Reference rules',
            description: 'Reference rules decide review validity for unresolved values.',
            mode: 'canvas',
          },
        ],
      },
      {
        id: 'spreadsheet-stress',
        label: 'Stress & validation',
        children: [
          {
            id: 'spreadsheet-structure-stress',
            path: '/spreadsheet/structure-stress',
            label: 'Structure stress',
            description: 'Large workbook and structural edge cases.',
            mode: 'canvas',
          },
          {
            id: 'spreadsheet-large-validation',
            path: '/spreadsheet/large-validation-lab',
            label: 'Large validation',
            description: 'Large dataset with mixed validation failures.',
            mode: 'canvas',
          },
          {
            id: 'spreadsheet-refine-relations',
            path: '/spreadsheet/refine-relations-lab',
            label: 'Refine relations',
            description: 'Deterministic cross-field validation scenario.',
            mode: 'canvas',
          },
          {
            id: 'spreadsheet-multi-value',
            path: '/spreadsheet/multi-value-lab',
            label: 'Multi value',
            description: 'Built-in multiple columns without references.',
            mode: 'canvas',
          },
        ],
      },
    ],
  },
]

export function usePlaygroundNavigation() {
  const route = useRoute()
  const abstractions = computed(() => playgroundAbstractions)
  const currentAbstraction = computed<PlaygroundAbstraction | undefined>(() => {
    if (route.path === '/') return undefined

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
    if (matchedPage) return matchedPage

    if (currentAbstraction.value && route.path === currentAbstraction.value.path) {
      return {
        id: currentAbstraction.value.id,
        path: currentAbstraction.value.path,
        label: 'Overview',
        description: currentAbstraction.value.description,
        mode: 'document',
      }
    }

    return {
      id: route.path === '/' ? 'home' : route.path,
      path: route.path,
      label: route.path === '/' ? 'Overview' : 'Playground',
      description: 'Choose an abstraction and then an isolated example.',
      mode: 'document',
    }
  })
  const currentTrail = computed<PlaygroundNavigationNode[]>(() => {
    const abstraction = currentAbstraction.value
    if (!abstraction || route.path === abstraction.path) return []
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
  if (node.path === path) return true
  return node.children?.some((child) => navigationNodeContainsPath(child, path)) ?? false
}

function flattenNavigation(nodes: readonly PlaygroundNavigationNode[]) {
  const entries: PlaygroundNavigationEntry[] = []

  for (const node of nodes) {
    if (node.path && node.mode)
      entries.push({
        id: node.id,
        path: node.path,
        label: node.label,
        description: node.description ?? node.label,
        mode: node.mode,
      })

    if (node.children?.length) entries.push(...flattenNavigation(node.children))
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
    if (node.path === path) return nextTrail

    if (node.children?.length) {
      const childTrail = findNavigationTrail(node.children, path, nextTrail)
      if (childTrail) return childTrail
    }
  }

  return undefined
}
