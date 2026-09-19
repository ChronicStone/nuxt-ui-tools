import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListColumnPanel from '#ui-tools/table/components/data-list/DataListColumnPanel.vue'

import { must } from '../../helpers/must'
import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, texts } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

async function mountPanel(
  options: Partial<Parameters<typeof mountLoaded>[0]> & {
    panelProps?: Record<string, unknown>
  } = {},
) {
  const mounted = await mountLoaded({
    schema: createAccountsSchema(),
    ...options,
    render: () => h(DataListColumnPanel, options.panelProps),
  })
  mounted.internals.controls.columnsPanelOpen.value = true
  await mounted.flush()
  return mounted
}

describe('ColumnPanel', () => {
  it('renders the trigger with a visible-column count', async () => {
    harness = await mountPanel()
    const trigger = harness.wrapper.find('.nut-dl-colbtn')
    expect(trigger.attributes('data-label')).toBe('Colonnes')
    expect(trigger.attributes('data-icon')).toBe('i-lucide-layers')
    expect(trigger.attributes('data-variant')).toBe('outline')
    expect(trigger.find('.nut-dl-colbtn__count').attributes('data-label')).toBe('6')
  })

  it('lists configurable columns with pinned rows and toggles visibility', async () => {
    harness = await mountPanel()
    const w = harness.wrapper
    expect(w.find('.nut-dl-colpanel__title').text().replaceAll(/\s+/gu, ' ')).toBe(
      'Colonnes · 6 sur 7',
    )
    expect(w.find('.nut-dl-colpanel input[data-ui="UInput"]').exists()).toBeFalsy()
    const rows = w.findAll('.nut-dl-colpanel__row')
    expect(rows.map((row) => row.find('span.truncate').text())).toStrictEqual([
      'Nom',
      'Statut',
      'Pays',
      'Entité légale',
      'EDOF',
      'Contrats',
      'Conso.',
    ])
    expect(must(rows[0]).find('input[type="checkbox"]').attributes('disabled')).toBeDefined()
    expect(must(rows[0]).find('[data-ui="UIcon"][data-name="i-lucide-pin"]').exists()).toBeTruthy()
    expect(must(rows[1]).find('.column-drag-handle').exists()).toBeTruthy()
    expect(must(rows[3]).find('input[type="checkbox"]').attributes('checked')).toBeUndefined()
    expect(must(rows[1]).find('input[type="checkbox"]').attributes('data-color')).toBe('primary')

    await must(rows[1]).find('input[type="checkbox"]').trigger('click')
    await harness.flush()
    expect(
      harness.internals.tableColumns.visibleOrderedColumns.value.map((c) => c.id),
    ).not.toContain('status')
    expect(w.find('.nut-dl-colbtn__count').attributes('data-label')).toBe('5')
    await must(w.findAll('.nut-dl-colpanel__row')[3]).find('button.flex-1').trigger('click')
    await harness.flush()
    expect(harness.internals.tableColumns.visibleOrderedColumns.value.map((c) => c.id)).toContain(
      'legalEntity',
    )
  })

  it('filters rows by search and resets to defaults from the footer', async () => {
    harness = await mountPanel({
      ui: {
        columnPanel: {
          props: { count: false, reset: { color: 'primary' }, search: true },
          ui: { panel: 'panel-x', row: 'row-x' },
        },
      },
    })
    const w = harness.wrapper
    expect(w.find('.nut-dl-colbtn__count').exists()).toBeFalsy()
    expect(w.find('.nut-dl-colpanel').classes()).toContain('panel-x')
    expect(w.find('.nut-dl-colpanel__row').classes()).toContain('row-x')
    const search = w.find('.nut-dl-colpanel input[data-ui="UInput"]')
    expect(search.attributes('placeholder')).toBe('Rechercher des colonnes...')
    await search.setValue('pa')
    await harness.flush()
    expect(texts(w, '.nut-dl-colpanel__row span.truncate')).toStrictEqual(['Pays'])
    await search.setValue('')
    await harness.flush()

    harness.internals.tableColumns.setVisibility({ columnId: 'country', visible: false })
    await harness.flush()
    const reset = w.find('[data-ui="UButton"][data-label="Par défaut"]')
    expect(reset.attributes('data-color')).toBe('primary')
    await reset.trigger('click')
    await harness.flush()
    expect(harness.internals.tableColumns.visibleOrderedColumns.value.map((c) => c.id)).toContain(
      'country',
    )
    await w.find('.nut-dl-colpanel__footer button:last-child').trigger('click')
    await harness.flush()
    expect(harness.internals.controls.columnsPanelOpen.value).toBeFalsy()
  })

  it('exposes trigger state through its slot', async () => {
    harness = await mountLoaded({
      render: () =>
        h(DataListColumnPanel, null, {
          trigger: (scope: { openState: boolean; toggle: () => void }) =>
            h(
              'button',
              { class: 'custom-trigger', onClick: scope.toggle },
              String(scope.openState),
            ),
        }),
      schema: createAccountsSchema(),
    })
    const trigger = harness.wrapper.find('.custom-trigger')
    expect(trigger.text()).toBe('false')
    await trigger.trigger('click')
    await harness.flush()
    expect(harness.internals.controls.columnsPanelOpen.value).toBeTruthy()
  })
})
