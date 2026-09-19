import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListSelectionActions from '#ui-tools/table/components/data-list/DataListSelectionActions.vue'

import { bulkActionCalls, createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, texts } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())
beforeEach(() => bulkActionCalls.splice(0))

function mountBar(
  options: Partial<Parameters<typeof mountLoaded>[0]> & { barProps?: Record<string, unknown> } = {},
) {
  return mountLoaded({
    schema: createAccountsSchema(),
    ...options,
    render: () => h(DataListSelectionActions, options.barProps),
  })
}

describe('selection actions part', () => {
  it('appears with the selection and offers the scope switch', async () => {
    harness = await mountBar()
    const w = harness.wrapper
    expect(w.find('.nut-dl-selbar').exists()).toBeFalsy()
    harness.internals.selection.selectRows({ rowIds: ['acc-1', 'acc-2'] })
    await harness.flush()
    const bar = w.find('.nut-dl-selbar')
    expect(bar.exists()).toBeTruthy()
    expect(bar.classes()).toContain('absolute')
    expect(w.find('.nut-dl-selbar__bar').attributes('aria-label')).toBe('Sélection')
    const scope = w.findAll('.nut-dl-selbar__scope-btn')
    expect(scope.map((b) => b.text().replaceAll(/\s+/g, ''))).toStrictEqual([
      'Sélection2',
      'Touslesrésultats60',
    ])
    expect(scope[0]!.classes()).toContain('bg-white/16')
    await scope[1]!.trigger('click')
    await harness.flush()
    expect(harness.internals.selection.bulkScope.value).toBe('all')
    expect(w.findAll('.nut-dl-selbar__scope-btn')[1]!.classes()).toContain('bg-white/16')
  })

  it('renders three inline actions, an overflow menu and a dismiss control', async () => {
    harness = await mountBar()
    harness.internals.selection.selectRows({ rowIds: ['acc-1'] })
    await harness.flush()
    const w = harness.wrapper
    const actions = w.findAll('.nut-dl-selbar__action')
    expect(actions.map((a) => a.attributes('data-label'))).toStrictEqual([
      'Exporter',
      'Synchroniser',
      'Archiver',
    ])
    expect(actions[0]!.attributes('data-icon')).toBe('i-lucide-download')
    expect(actions[0]!.attributes('data-variant')).toBe('ghost')
    expect(texts(w, '.nut-dl-selbar__actions [data-ui-item]')).toStrictEqual([
      'Passer inactif',
      'Supprimer',
    ])
    expect(w.find('.nut-dl-selbar__more').attributes('aria-label')).toBe('Plus d’actions')

    await actions[0]!.trigger('click')
    await harness.flush()
    expect(bulkActionCalls).toContain('export')
    await w.find('.nut-dl-selbar__actions [data-ui-item]:nth-child(2)').trigger('click')
    await harness.flush()
    expect(bulkActionCalls).toContain('delete')

    const dismiss = w.find('.nut-dl-selbar__dismiss')
    expect(dismiss.attributes('aria-label')).toBe('Effacer la sélection')
    await dismiss.trigger('click')
    await harness.flush()
    expect(harness.internals.selection.selectedCount.value).toBe(0)
    await harness.until(() => !harness!.wrapper.find('.nut-dl-selbar').exists())
  })

  it('keeps one inline action on mobile and honours maxVisible', async () => {
    harness = await mountBar({ breakpoint: 'sm' })
    harness.internals.selection.selectRows({ rowIds: ['acc-1'] })
    await harness.flush()
    expect(harness.wrapper.findAll('.nut-dl-selbar__action')).toHaveLength(1)
    expect(harness.wrapper.findAll('.nut-dl-selbar__actions [data-ui-item]')).toHaveLength(4)
    harness.unmount()

    harness = await mountBar({ barProps: { maxVisible: 5, position: 'fixed' } })
    harness.internals.selection.selectRows({ rowIds: ['acc-1'] })
    await harness.flush()
    expect(harness.wrapper.findAll('.nut-dl-selbar__action')).toHaveLength(5)
    expect(harness.wrapper.find('.nut-dl-selbar__more').exists()).toBeFalsy()
    expect(harness.wrapper.find('.nut-dl-selbar').classes()).toContain('fixed')
  })

  it('falls back to a plain count when the scope is page-bound or disabled', async () => {
    harness = await mountBar({ schema: createAccountsSchema({ selection: { scope: 'page' } }) })
    harness.internals.selection.selectRows({ rowIds: ['acc-1'] })
    await harness.flush()
    expect(harness.wrapper.find('.nut-dl-selbar__scope').exists()).toBeFalsy()
    expect(harness.wrapper.find('.nut-dl-selbar__count').text().replaceAll(/\s+/g, '')).toBe(
      'Sélection1',
    )
    harness.unmount()

    harness = await mountBar({ barProps: { scope: false } })
    harness.internals.selection.selectRows({ rowIds: ['acc-1'] })
    await harness.flush()
    expect(harness.wrapper.find('.nut-dl-selbar__scope').exists()).toBeFalsy()
  })

  it('merges control props and ui classes from config and props', async () => {
    harness = await mountBar({
      barProps: { props: { dismiss: { color: 'error' } }, ui: { dismiss: 'dis-x' } },
      ui: {
        selectionActions: {
          props: { action: { variant: 'soft' } },
          size: 'md',
          ui: { action: 'act-x', bar: 'bar-x' },
        },
      },
    })
    harness.internals.selection.selectRows({ rowIds: ['acc-1'] })
    await harness.flush()
    const w = harness.wrapper
    expect(w.find('.nut-dl-selbar__bar').classes()).toContain('bar-x')
    const action = w.find('.nut-dl-selbar__action')
    expect(action.attributes('data-variant')).toBe('soft')
    expect(action.attributes('data-size')).toBe('md')
    expect(action.classes()).toContain('act-x')
    const dismiss = w.find('.nut-dl-selbar__dismiss')
    expect(dismiss.attributes('data-color')).toBe('error')
    expect(dismiss.classes()).toContain('dis-x')
  })

  it('is hidden without bulk actions', async () => {
    harness = await mountBar({
      schema: createAccountsSchema({ actions: false, selection: { mode: true } }),
    })
    harness.internals.selection.selectRows({ rowIds: ['acc-1'] })
    await harness.flush()
    expect(harness.wrapper.find('.nut-dl-selbar').exists()).toBeFalsy()
  })
})
