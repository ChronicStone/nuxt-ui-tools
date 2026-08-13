import { describe, expect, expectTypeOf, it } from 'vitest'

import type { DataListUiConfig } from '#ui-tools/table/types'

import { mergeDataListUiClass } from '../../src/runtime/table/utils/data-list-ui'

describe('data-list UI', () => {
  it('uses Nuxt UI class conflict resolution in local precedence order', () => {
    expect(mergeDataListUiClass('px-2 text-sm', 'px-3', 'px-4 text-xs')).toBe('px-4 text-xs')
  })

  it('types root defaults for every granular rendering concern', () => {
    const ui: DataListUiConfig = {
      density: 'compact',
      search: { size: 'sm', width: '20rem', ui: { root: 'w-full', base: 'text-xs' } },
      filterTags: { ui: { trigger: 'rounded-sm', value: 'max-w-48' } },
      filterPanel: { ui: { trigger: 'shrink-0', body: 'p-4', apply: 'font-medium' } },
      content: { ui: { root: 'border-0', error: 'min-h-80' } },
      table: { ui: { th: 'h-8', td: 'py-1.5' } },
      grid: { ui: { flow: 'gap-3', item: 'min-w-0' } },
      pagination: { ui: { root: 'border-t', button: 'rounded-sm' } },
      infiniteLoader: { ui: { root: 'min-h-10', loadMore: 'rounded-full' } },
    }

    expectTypeOf(ui).toEqualTypeOf<DataListUiConfig>()
  })
})
