import { describe, expect, it } from 'vitest'
import { computed } from 'vue'

import type { TableApi } from '#ui-tools/table/types'

import {
  createRowActionDropdownItems,
  hasVisibleTableRowActions,
  resolveVisibleTableRowActions,
} from '../../src/runtime/table/utils/actions'

type DemoRow = {
  id: string
  active: boolean
}

function createTableApiStub() {
  const rows = computed<DemoRow[]>(() => [])
  const rowCount = computed<number>(() => rows.value.length)
  const layout = computed<'table' | 'grid'>(() => 'table')
  const query = computed(() => ({
    layout: 'table' as const,
    pagination: {
      mode: 'offset' as const,
      pageIndex: 1,
      pageSize: 20,
      count: 'exact' as const,
    },
    sorting: null,
    filters: { search: '', ui: [] },
  }))
  const falseValue = computed<boolean>(() => false)
  const trueValue = computed<boolean>(() => true)
  const context = computed<Record<string, never>>(() => ({}))
  const requestContext = computed(() => ({
    context: {},
    pagination: {
      mode: 'offset' as const,
      pageIndex: 1,
      pageSize: 20,
      count: 'exact' as const,
    },
    sorting: [],
    filters: { type: 'group' as const, combinator: 'and' as const, children: [] },
    search: { value: '', fields: [] },
  }))
  const error = computed<unknown>(() => null)
  const status = computed(() => ({
    initialized: true,
    phase: 'active' as const,
    isBooting: false,
    isPending: false,
    isFetching: false,
    isRefreshing: false,
    isRevalidating: false,
    isContextPending: false,
    isContextFetching: false,
    isDataPending: false,
    isDataFetching: false,
    isPageContextPending: false,
    isPageContextFetching: false,
  }))
  const selectionState = computed(() => ({
    selectedKeys: [],
    selectedCount: 0,
    allSelected: false,
    partiallySelected: false,
  }))
  const paginationState = computed(() => ({
    mode: 'offset' as const,
    pageIndex: 1,
    pageSize: 20,
    pageCount: 1,
    loadedCount: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    isLoadingMore: false,
    loadMoreError: null,
  }))
  const sortingState = computed(() => ({
    key: undefined,
    dir: undefined,
    active: false,
  }))

  const tableApi: TableApi = {
    state: {
      layout,
      query,
      initialized: trueValue,
      isEmpty: trueValue,
      isLoading: falseValue,
      isRefreshing: falseValue,
    },
    data: {
      rows,
      rowCount,
      loadedRowCount: rowCount,
      totalRowCount: rowCount,
      rawRows: rows,
      rawRowCount: rowCount,
      context,
      pageContext: context,
      requestContext,
      error,
      status,
      refresh: async () => {
        throw new Error('not implemented')
      },
      updateRow: () => undefined,
      updateRows: () => undefined,
    },
    layout: {
      state: computed(() => ({ active: 'table' as const, available: ['table', 'grid'] })),
      set: () => undefined,
    },
    filters: {
      state: computed(() => ({ search: '', ui: [] })),
      search: computed({ get: () => '', set: () => undefined }),
      activeCount: computed(() => 0),
      clear: () => undefined,
      remove: () => undefined,
      replace: () => undefined,
    },
    pagination: {
      mode: 'offset',
      state: paginationState,
      pageSizeOptions: computed(() => [20]),
      setPage: () => undefined,
      setPageSize: () => undefined,
      next: () => undefined,
      previous: () => undefined,
      reset: () => undefined,
    },
    sorting: {
      state: sortingState,
      sortKeys: computed(() => []),
      set: () => undefined,
      setKey: () => undefined,
      setDirection: () => undefined,
      clear: () => undefined,
      toggle: () => undefined,
    },
    selection: {
      state: selectionState,
      clear: () => undefined,
      selectAll: () => undefined,
      selectRows: () => undefined,
      unselectRows: () => undefined,
      toggle: () => undefined,
      isSelected: () => false,
    },
    reset: {
      query: () => undefined,
      all: () => undefined,
    },
    refresh: async () => {
      throw new Error('not implemented')
    },
    updateRow: () => undefined,
    updateRows: () => undefined,
  }

  return tableApi
}

function createScope(row: DemoRow, index = 0) {
  return {
    row,
    index,
    context: {},
    pageContext: {},
    tableApi: createTableApiStub(),
    layout: 'table' as const,
  }
}

describe('row actions', () => {
  it('prunes hidden actions and empty parent groups', () => {
    const schema = {
      rowActions: [
        {
          key: 'hidden',
          label: 'Hidden',
          condition: () => false,
          action: () => undefined,
        },
        {
          key: 'group',
          label: 'Group',
          children: [
            {
              key: 'group-hidden',
              label: 'Group hidden',
              condition: () => false,
              action: () => undefined,
            },
          ],
        },
        {
          key: 'toggle',
          label: () => 'Pause',
          action: () => undefined,
        },
      ],
    }

    expect(
      resolveVisibleTableRowActions({
        schema,
        scope: createScope({ id: '1', active: true }),
      }),
    ).toEqual([
      {
        key: 'toggle',
        label: expect.any(Function),
        action: expect.any(Function),
      },
    ])
  })

  it('keeps actionable parents even when all children are hidden', () => {
    const schema = {
      rowActions: [
        {
          key: 'parent',
          label: 'Parent',
          href: '/users/1',
          children: [
            {
              key: 'hidden-child',
              label: 'Hidden child',
              condition: () => false,
              action: () => undefined,
            },
          ],
        },
      ],
    }

    const [action] = resolveVisibleTableRowActions({
      schema,
      scope: createScope({ id: '1', active: true }),
    })

    expect(action?.key).toBe('parent')
    expect(action?.children).toBeUndefined()
  })

  it('hides the synthetic column when no current row resolves visible actions', () => {
    const schema = {
      rowActions: [
        {
          key: 'never',
          label: 'Never',
          condition: () => false,
          action: () => undefined,
        },
      ],
    }

    expect(
      hasVisibleTableRowActions({
        schema,
        rows: [{ id: '1', active: false }],
        context: {},
        pageContext: {},
        tableApi: createTableApiStub(),
        layout: 'table',
      }),
    ).toBe(false)
  })

  it('creates dropdown items only for visible actions', () => {
    const schema = {
      rowActions: [
        {
          key: 'copy',
          label: () => '1 copy',
          action: () => undefined,
        },
        {
          key: 'hidden',
          label: 'Hidden',
          condition: () => false,
          action: () => undefined,
        },
      ],
    }

    const scope = createScope({ id: '1', active: true })
    const items = createRowActionDropdownItems({
      actions: resolveVisibleTableRowActions({ schema, scope }),
      scope,
    })

    expect(items).toHaveLength(1)
    expect(items[0]?.label).toBe('1 copy')
  })
})
