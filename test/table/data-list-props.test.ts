import { describe, expect, it } from 'vitest'

import { mergeDataListProps, mergeDataListUiConfig } from '#ui-tools/table/utils/data-list-ui'

describe(mergeDataListProps, () => {
  it('lets later layers win while skipping undefined values', () => {
    expect(
      mergeDataListProps<Record<string, unknown>>(
        { color: 'neutral', size: 'md' },
        { color: 'primary', size: undefined },
      ),
    ).toStrictEqual({ color: 'primary', size: 'md' })
    expect(mergeDataListProps<Record<string, unknown>>(undefined, { icon: false })).toStrictEqual({
      icon: false,
    })
    expect(
      mergeDataListProps<Record<string, unknown>>({ label: 'A' }, { label: null }),
    ).toStrictEqual({ label: null })
  })

  it('merges nested control objects one level deep and replaces arrays', () => {
    expect(
      mergeDataListProps<Record<string, unknown>>(
        {
          order: ['table', 'grid'],
          trigger: { color: 'neutral', ui: { base: 'a' }, variant: 'outline' },
        },
        { order: ['grid'], trigger: { ui: { base: 'b' }, variant: 'soft' } },
      ),
    ).toStrictEqual({
      order: ['grid'],
      trigger: { color: 'neutral', ui: { base: 'b' }, variant: 'soft' },
    })
    expect(
      mergeDataListProps<Record<string, unknown>>({ count: { size: 'xs' } }, { count: false }),
    ).toStrictEqual({ count: false })
    expect(
      mergeDataListProps<Record<string, unknown>>({ count: false }, { count: { size: 'xs' } }),
    ).toStrictEqual({ count: { size: 'xs' } })
  })

  it('returns an empty object without layers', () => {
    expect(mergeDataListProps()).toStrictEqual({})
  })
})

describe(mergeDataListUiConfig, () => {
  it('resolves density and size precedence', () => {
    expect(mergeDataListUiConfig({ density: 'compact' }, { density: 'comfortable' }).density).toBe(
      'comfortable',
    )
    expect(mergeDataListUiConfig({ density: 'compact' }, undefined, 'default').density).toBe(
      'default',
    )
    expect(
      mergeDataListUiConfig({ control: { size: 'sm' } }, undefined, undefined, 'xl').control,
    ).toStrictEqual({ size: 'xl' })
    expect(
      mergeDataListUiConfig({ control: { size: 'sm' } }, { control: { size: 'lg' } }).control,
    ).toStrictEqual({ size: 'lg' })
  })

  it('merges every part with nested ui slots and control props', () => {
    const merged = mergeDataListUiConfig(
      {
        filterPanel: { mode: 'panel', props: { chips: 4 } },
        filterTags: {
          props: { icon: true, trigger: { size: 'xs' } },
          size: 'sm',
          ui: { trigger: 'app-trigger' },
        },
        grid: { gap: 20 },
        pagination: { props: { firstLast: true } },
        search: {
          props: { input: { color: 'neutral', variant: 'soft' } },
          ui: { root: 'app-root' },
          width: '300px',
        },
        selectionActions: { ui: { bar: 'app-bar' } },
        table: { gutter: 12, ui: { td: 'app-td' } },
      },
      {
        filterPanel: { commitMode: 'live', ui: { chip: 'cmp-chip' } },
        filterTags: { props: { icon: false }, ui: { value: 'cmp-value' } },
        grid: { gap: 12 },
        pagination: { props: { firstLast: false }, size: 'sm' },
        search: { props: { input: { variant: 'outline' } }, ui: { base: 'cmp-base' } },
        table: { gutter: 20, props: { checkbox: { color: 'primary' } } },
      },
    )
    expect([merged.search, merged.filterTags]).toStrictEqual([
      {
        props: { input: { color: 'neutral', variant: 'outline' } },
        ui: { base: 'cmp-base', root: 'app-root' },
        width: '300px',
      },
      {
        props: { icon: false, trigger: { size: 'xs' } },
        size: 'sm',
        ui: { trigger: 'app-trigger', value: 'cmp-value' },
      },
    ])
    expect(merged.filterPanel).toMatchObject({
      commitMode: 'live',
      mode: 'panel',
      props: { chips: 4 },
      ui: { chip: 'cmp-chip' },
    })
    expect([merged.table, merged.grid, merged.pagination, merged.selectionActions]).toStrictEqual([
      {
        gutter: 20,
        props: { checkbox: { color: 'primary' } },
        ui: { td: 'app-td' },
      },
      { gap: 12, props: {}, ui: {} },
      { props: { firstLast: false }, size: 'sm', ui: {} },
      { props: {}, ui: { bar: 'app-bar' } },
    ])
  })

  it('keeps mobile overrides for the root to apply later', () => {
    const merged = mergeDataListUiConfig(undefined, {
      mobile: { control: { size: 'lg' }, search: { width: '100%' } },
    })
    expect(merged.mobile).toStrictEqual({ control: { size: 'lg' }, search: { width: '100%' } })
    const mobile = mergeDataListUiConfig(
      merged,
      merged.mobile,
      merged.mobile?.density,
      merged.mobile?.control?.size,
    )
    expect(mobile.control).toStrictEqual({ size: 'lg' })
    expect(mobile.search?.width).toBe('100%')
  })
})
