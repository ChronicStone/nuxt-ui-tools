import { describe, expect, it } from 'vitest'

import type { TableResolvedFilterOptionEntry } from '#ui-tools/table/types'
import {
  collectFilterOptionBranchIds,
  filterFilterOptionTree,
  flattenFilterOptionEntries,
  flattenVisibleFilterOptionTree,
} from '../../src/runtime/table/utils/filters/tree'

const entries: TableResolvedFilterOptionEntry[] = [
  {
    id: '0:engineering',
    label: 'Engineering',
    selected: false,
    children: [
      {
        id: '0:engineering/0:frontend',
        label: 'Frontend',
        value: 'frontend',
        selected: false,
        children: [],
      },
      {
        id: '0:engineering/1:backend',
        label: 'Backend',
        value: 'backend',
        selected: false,
        children: [],
      },
    ],
  },
  {
    id: '1:operations',
    label: 'Operations',
    value: 'operations',
    selected: false,
    children: [],
  },
]

describe('filter tree utils', () => {
  it('filters deeply and expands matching ancestor paths', () => {
    const result = filterFilterOptionTree({
      entries,
      search: 'front',
    })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]?.label).toBe('Engineering')
    expect(result.entries[0]?.children.map(child => child.label)).toEqual(['Frontend'])
    expect(result.expandedIds).toEqual(['0:engineering'])
  })

  it('collects branch ids and flattens visible entries with leaf-only selection', () => {
    const expandedIds = new Set(collectFilterOptionBranchIds(entries))
    const visible = flattenVisibleFilterOptionTree({
      entries,
      expandedIds,
      selectable: 'leaf-only',
    })

    expect(flattenFilterOptionEntries(entries)).toHaveLength(4)
    expect(visible[0]?.selectable).toBe(false)
    expect(visible[1]?.depth).toBe(1)
    expect(visible[1]?.selectable).toBe(true)
  })
})
