import { describe, expect, it } from 'vitest'

import { mergeDataListProps, mergeDataListUiConfig } from '#ui-tools/table/utils/data-list-ui'

describe('mergeDataListProps', () => {
  it('lets later layers win while skipping undefined values', () => {
    expect(mergeDataListProps<Record<string, unknown>>({ color: 'neutral', size: 'md' }, { color: 'primary', size: undefined })).toEqual({ color: 'primary', size: 'md' })
    expect(mergeDataListProps<Record<string, unknown>>(undefined, { icon: false }, undefined)).toEqual({ icon: false })
    expect(mergeDataListProps<Record<string, unknown>>({ label: 'A' }, { label: null })).toEqual({ label: null })
  })

  it('merges nested control objects one level deep and replaces arrays', () => {
    expect(
      mergeDataListProps<Record<string, unknown>>(
        { trigger: { color: 'neutral', variant: 'outline', ui: { base: 'a' } }, order: ['table', 'grid'] },
        { trigger: { variant: 'soft', ui: { base: 'b' } }, order: ['grid'] },
      ),
    ).toEqual({ trigger: { color: 'neutral', variant: 'soft', ui: { base: 'b' } }, order: ['grid'] })
    expect(mergeDataListProps<Record<string, unknown>>({ count: { size: 'xs' } }, { count: false })).toEqual({ count: false })
    expect(mergeDataListProps<Record<string, unknown>>({ count: false }, { count: { size: 'xs' } })).toEqual({ count: { size: 'xs' } })
  })

  it('returns an empty object without layers', () => {
    expect(mergeDataListProps()).toEqual({})
  })
})

describe('mergeDataListUiConfig', () => {
  it('resolves density and size precedence', () => {
    expect(mergeDataListUiConfig({ density: 'compact' }, { density: 'comfortable' }, undefined).density).toBe('comfortable')
    expect(mergeDataListUiConfig({ density: 'compact' }, undefined, 'default').density).toBe('default')
    expect(mergeDataListUiConfig({ control: { size: 'sm' } }, undefined, undefined, 'xl').control).toEqual({ size: 'xl' })
    expect(mergeDataListUiConfig({ control: { size: 'sm' } }, { control: { size: 'lg' } }, undefined).control).toEqual({ size: 'lg' })
  })

  it('merges every part with nested ui slots and control props', () => {
    const merged = mergeDataListUiConfig(
      {
        search: { width: '300px', ui: { root: 'app-root' }, props: { input: { color: 'neutral', variant: 'soft' } } },
        filterTags: { size: 'sm', ui: { trigger: 'app-trigger' }, props: { icon: true, trigger: { size: 'xs' } } },
        filterPanel: { mode: 'panel', props: { chips: 4 } },
        table: { gutter: 12, ui: { td: 'app-td' } },
        grid: { gap: 20 },
        pagination: { props: { firstLast: true } },
        selectionActions: { ui: { bar: 'app-bar' } },
      },
      {
        search: { ui: { base: 'cmp-base' }, props: { input: { variant: 'outline' } } },
        filterTags: { ui: { value: 'cmp-value' }, props: { icon: false } },
        filterPanel: { commitMode: 'live', ui: { chip: 'cmp-chip' } },
        table: { gutter: 20, props: { checkbox: { color: 'primary' } } },
        grid: { gap: 12 },
        pagination: { size: 'sm', props: { firstLast: false } },
      },
      undefined,
    )
    expect(merged.search).toEqual({ width: '300px', ui: { root: 'app-root', base: 'cmp-base' }, props: { input: { color: 'neutral', variant: 'outline' } } })
    expect(merged.filterTags).toEqual({ size: 'sm', ui: { trigger: 'app-trigger', value: 'cmp-value' }, props: { icon: false, trigger: { size: 'xs' } } })
    expect(merged.filterPanel).toMatchObject({ mode: 'panel', commitMode: 'live', ui: { chip: 'cmp-chip' }, props: { chips: 4 } })
    expect(merged.table).toEqual({ gutter: 20, ui: { td: 'app-td' }, props: { checkbox: { color: 'primary' } } })
    expect(merged.grid).toEqual({ gap: 12, ui: {}, props: {} })
    expect(merged.pagination).toEqual({ size: 'sm', ui: {}, props: { firstLast: false } })
    expect(merged.selectionActions).toEqual({ ui: { bar: 'app-bar' }, props: {} })
  })

  it('keeps mobile overrides for the root to apply later', () => {
    const merged = mergeDataListUiConfig(undefined, { mobile: { control: { size: 'lg' }, search: { width: '100%' } } }, undefined)
    expect(merged.mobile).toEqual({ control: { size: 'lg' }, search: { width: '100%' } })
    const mobile = mergeDataListUiConfig(merged, merged.mobile, merged.mobile?.density, merged.mobile?.control?.size)
    expect(mobile.control).toEqual({ size: 'lg' })
    expect(mobile.search?.width).toBe('100%')
  })
})
