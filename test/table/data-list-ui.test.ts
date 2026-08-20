import { describe, expect, expectTypeOf, it } from 'vitest'

import type { DataListUiConfig } from '#ui-tools/table/types'

import {
  mergeDataListUiClass,
  mergeDataListUiConfig,
  resolveDataListContentShellClass,
  resolveDataListPopoverContentClass,
  resolveDataListTableDensity,
  resolveDataListTableSize,
} from '../../src/runtime/table/utils/data-list-ui'
import { resolveFilterEditorSizeClasses } from '../../src/runtime/table/utils/filters/editor-size'

describe('data-list UI', () => {
  it('uses Nuxt UI class conflict resolution in local precedence order', () => {
    expect(mergeDataListUiClass('px-2 text-sm', 'px-3', 'px-4 text-xs')).toBe('px-4 text-xs')
  })

  it('keeps table popovers independent from trigger width and constrains nested content', () => {
    const contentClass = resolveDataListPopoverContentClass('independent', 'p-0')

    expect(contentClass).toContain('w-[min(20rem,calc(100vw-1rem))]')
    expect(contentClass).toContain('min-w-[min(16rem,calc(100vw-1rem))]')
    expect(contentClass).toContain('max-w-[calc(100vw-1rem)]')
    expect(contentClass).toContain('[&>div]:w-full')
    expect(contentClass).toContain('[&>div]:min-w-0')
    expect(contentClass).toContain('[&>div]:max-w-full')
    expect(contentClass).toContain('p-0')

    expect(resolveDataListPopoverContentClass('fit')).toContain('w-fit')
    expect(resolveDataListPopoverContentClass('fit')).not.toContain('20rem')
    expect(resolveDataListPopoverContentClass('trigger')).toContain(
      'w-[var(--reka-popover-trigger-width)]',
    )
  })

  it('keeps granular content boundary-free while assembled content opts into one boundary', () => {
    expect(resolveDataListContentShellClass({ layout: 'table', surface: 'plain' })).toBe(
      'overflow-hidden',
    )
    expect(resolveDataListContentShellClass({ layout: 'table', surface: 'contained' })).toContain(
      'rounded-md border',
    )
    expect(resolveDataListContentShellClass({ layout: 'grid', surface: 'contained' })).toContain(
      'rounded-md border',
    )
    expect(resolveDataListContentShellClass({ layout: 'grid', surface: 'plain' })).toBe(
      'grid gap-5',
    )
    expect(resolveDataListTableDensity('compact').rowHeight).toBe(40)
    expect(resolveDataListTableDensity('comfortable').row).toContain('min-h-14')
    expect(resolveDataListTableSize('xs').rowHeight).toBe(36)
    expect(resolveDataListTableSize('xl').rowHeight).toBe(64)
  })

  it('scales the complete filter editor surface with its control size', () => {
    expect(resolveFilterEditorSizeClasses('sm')).toMatchObject({
      editor: 'w-[min(15rem,calc(100vw-1rem))] min-w-48 max-w-60',
      searchHeader: 'p-1.5',
      option: expect.stringContaining('text-xs'),
      footer: 'p-1.5',
    })
    expect(resolveFilterEditorSizeClasses('lg')).toMatchObject({
      editor: 'w-[min(19rem,calc(100vw-1rem))] min-w-56 max-w-76',
      option: expect.stringContaining('py-2.5'),
    })
    expect(resolveFilterEditorSizeClasses('xl')).toMatchObject({
      editor: 'w-[min(21rem,calc(100vw-1rem))] min-w-60 max-w-84',
      option: expect.stringContaining('text-base'),
    })
  })

  it('types root defaults for every granular rendering concern', () => {
    const ui: DataListUiConfig = {
      density: 'compact',
      search: {
        size: 'sm',
        width: '20rem',
        ui: { root: 'w-full', base: 'text-xs' },
      },
      filterTags: {
        ui: {
          trigger: 'rounded-sm',
          value: 'max-w-48',
          popoverContent: 'w-80',
          operatorContent: 'min-w-32',
          operatorTrigger: 'px-2',
          searchHeader: 'p-3',
          optionCheckbox: 'rounded-sm',
          optionExpander: 'text-dimmed',
          footer: 'px-3 py-2',
          preset: 'rounded-sm',
        },
      },
      addFilter: { ui: { panel: 'min-w-72', option: 'py-2.5' } },
      filterPanel: {
        ui: { trigger: 'shrink-0', body: 'p-4', apply: 'font-medium' },
      },
      content: { size: 'xl', ui: { root: 'border-0', error: 'min-h-80' } },
      resultCount: { size: 'xs', ui: { root: 'tabular-nums' } },
      table: {
        size: 'xl',
        ui: {
          wrapper: 'overflow-auto',
          root: 'min-w-full',
          th: 'h-8',
          td: 'py-1.5',
        },
      },
      grid: { size: 'lg', ui: { flowRoot: 'p-4', flow: 'gap-3', item: 'min-w-0' } },
      pagination: { ui: { root: 'border-t', button: 'rounded-sm' } },
      infiniteLoader: { ui: { root: 'min-h-10', loadMore: 'rounded-full' } },
    }

    expectTypeOf(ui).toEqualTypeOf<DataListUiConfig>()
  })

  it('preserves nested app slots while root config wins per slot', () => {
    expect(
      mergeDataListUiConfig(
        {
          density: 'default',
          filterTags: {
            size: 'md',
            ui: {
              trigger: 'rounded-md',
              popoverContent: 'w-72',
              option: 'px-3',
            },
          },
        },
        {
          filterTags: {
            size: 'sm',
            ui: { trigger: 'rounded-sm', optionLabel: 'font-medium' },
          },
        },
        'compact',
        'lg',
      ),
    ).toMatchObject({
      density: 'compact',
      control: { size: 'lg' },
      filterTags: {
        size: 'sm',
        ui: {
          trigger: 'rounded-sm',
          popoverContent: 'w-72',
          option: 'px-3',
          optionLabel: 'font-medium',
        },
      },
    })
  })
})
