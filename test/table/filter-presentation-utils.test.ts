import { describe, expect, it } from 'vitest'

import type { TableUiFilterDefinition } from '#ui-tools/table/types'
import {
  resolvePanelCommitRules,
  resolvePanelDefaultRules,
} from '#ui-tools/table/utils/filter-presentation'
import {
  resolveFilterDisplayLocation,
  resolveFilterDisplayOrder,
} from '#ui-tools/table/utils/filters/presentation'

describe('panel rule resolution', () => {
  it('collects default rules for panel definitions only', () => {
    const rules = resolvePanelDefaultRules({
      definitions: [{ key: 'a' }, { key: 'b' }],
      getDefault: (key) => (key === 'a' ? { key: 'a', value: ['x'] } : undefined),
    })
    expect(rules).toStrictEqual([{ key: 'a', value: ['x'] }])
    expect(rules[0]).not.toBe(rules[0] && { key: 'a', value: ['x'] })
  })

  it('replaces panel rules while preserving tag rules', () => {
    const current = [
      { key: 'tag', value: 1 },
      { key: 'panel', value: 'old' },
    ]
    const next = resolvePanelCommitRules({
      currentRules: current,
      panelKeys: ['panel', 'other'],
      panelRules: [{ key: 'other', value: 'new' }],
    })
    expect(next).toStrictEqual([
      { key: 'tag', value: 1 },
      { key: 'other', value: 'new' },
    ])
    expect(next[0]).toBe(current[0])
  })
})

describe('display resolution', () => {
  function definition(display?: TableUiFilterDefinition['display']) {
    return { display, key: 'k', kind: 'text', label: 'K' } as unknown as TableUiFilterDefinition
  }

  it('defaults to tag, keeps valid locations and rejects unknown ones', () => {
    expect(resolveFilterDisplayLocation()).toBe('tag')
    expect(resolveFilterDisplayLocation('panel')).toBe('panel')
    expect(resolveFilterDisplayLocation('tag-dynamic')).toBe('tag-dynamic')
    expect(resolveFilterDisplayLocation('bogus' as never)).toBe('tag')
  })

  it('orders definitions with explicit order first', () => {
    expect(resolveFilterDisplayOrder(definition({ order: 2 }))).toBe(2)
    expect(resolveFilterDisplayOrder(definition())).toBe(Number.MAX_SAFE_INTEGER)
  })
})
