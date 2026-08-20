import { describe, expect, it } from 'vitest'

import type { TableQueryStateFilterRule } from '#ui-tools/table/types'

import {
  resolvePanelCommitRules,
  resolvePanelDefaultRules,
} from '../../src/runtime/table/utils/filter-presentation'

describe('table filter panel presentation', () => {
  it('resolves schema defaults into an isolated panel draft', () => {
    const defaults = resolvePanelDefaultRules({
      definitions: [{ key: 'status' }, { key: 'query' }],
      getDefault: (key) => (key === 'status' ? { key, value: ['active'] } : undefined),
    })

    expect(defaults).toEqual([{ key: 'status', value: ['active'] }])
  })

  it('replaces panel rules while preserving filters owned by other presentations', () => {
    const currentRules = [
      { key: 'search', value: 'invoice' },
      { key: 'status', value: ['active'] },
    ] satisfies TableQueryStateFilterRule[]

    const committed = resolvePanelCommitRules({
      currentRules,
      panelKeys: ['status', 'query'],
      panelRules: [{ key: 'status', value: ['draft'] }],
    })

    expect(committed).toEqual([
      { key: 'search', value: 'invoice' },
      { key: 'status', value: ['draft'] },
    ])
  })
})
