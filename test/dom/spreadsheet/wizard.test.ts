/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { utils, write } from 'xlsx'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImportColumnMapping from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-column-mapping.vue'
import SpreadsheetImportDropzone from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-dropzone.vue'
import SpreadsheetImportTable from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-table.vue'
import SpreadsheetImportRoot from '#ui-tools/spreadsheet/components/spreadsheet-import-root.vue'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/spreadsheet-import.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type { SpreadsheetImporter, SpreadsheetSubmitParams } from '#ui-tools/spreadsheet/types'

const schema = defineSpreadsheetSchema({
  key: 'test.assessments',
  columns: (c) =>
    c
      .text('secureCode', { headers: 'Secure code', required: true })
      .text('email', { required: true })
      .select('status', { headers: 'Test status', options: ['Done'], unknown: 'skip-rows' })
      .select('mode', { options: ['Online', 'Onsite'] })
      .text('duration', { required: true, rules: (v) => [v.pattern(/^\d{2}:\d{2}$/u)] }),
})

function createFile() {
  const workbook = utils.book_new()
  utils.book_append_sheet(
    workbook,
    utils.aoa_to_sheet([
      ['VTest export — Lyon'],
      ['Secure code', 'Email', 'Test status', 'Mode', 'Time spent'],
      ['8GM2FPM8RA', 'lea@campus.fr', 'Done', 'Online', '01:05'],
      ['M7MAJ2EBSS', '', 'Done', 'Remote', '00:58'],
      ['QX4TT9K2PL', 'chloe@campus.fr', 'In progress', 'Online', '01:12'],
      ['R2D7HJ8KWN', 'nathan@campus.fr', 'Done', 'Onsite', '01:30'],
    ]),
    'Assessments',
  )
  const binary: ArrayBuffer = write(workbook, { bookType: 'xlsx', type: 'array' })
  return binary
}

let wrapper: VueWrapper | null = null
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

async function flush(rounds = 4) {
  for (let index = 0; index < rounds; index += 1) {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

async function until(predicate: () => boolean, timeout = 3000) {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error('until(): timed out')
    await flush(1)
  }
}

function mountWith(
  render: (importer: SpreadsheetImporter<typeof schema>) => ReturnType<typeof h>,
  onSubmit?: (params: SpreadsheetSubmitParams<unknown, unknown, unknown>) => void,
) {
  let importer!: SpreadsheetImporter<typeof schema>
  const Host = defineComponent({
    setup() {
      importer = useSpreadsheetImport(schema, { onSubmit })
      return () => render(importer)
    },
  })
  wrapper = mount(Host, {
    attachTo: document.body,
    global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
  })
  return { importer, view: wrapper }
}

describe('spreadsheet import wizard', () => {
  it('walks a messy file from detection to import through the UI', async () => {
    const onSubmit = vi.fn()
    const { importer, view } = mountWith(
      (current) => h(SpreadsheetImport, { importer: current, title: 'Import' }),
      onSubmit,
    )
    const step = () => view.find('[data-spreadsheet-step]').attributes('data-spreadsheet-step')
    const next = async () => {
      await view.find('[data-spreadsheet-next]').trigger('click')
      await flush()
    }

    importer.file.load(createFile(), 'vtest_export.xlsx')
    await until(() => importer.rows.all.length === 4)
    await flush()
    expect(importer.layout.headerRow).toBe(1)
    expect(view.text()).toContain('vtest_export.xlsx')

    await next()
    expect(step()).toBe('columns')
    const duration = () => view.find('[data-spreadsheet-field="duration"]')
    expect(duration().attributes('data-status')).toBe('missing')
    await duration().find('[data-spreadsheet-use-suggestion]').trigger('click')
    await flush()
    expect(duration().attributes('data-status')).toBe('matched')

    await next()
    expect(step()).toBe('values')
    expect(view.find('[data-spreadsheet-value="mode::remote"]').attributes('data-state')).toBe(
      'open',
    )
    expect(
      view.find('[data-spreadsheet-value="status::in progress"]').attributes('data-state'),
    ).toBe('answered')
    // Pickers never answer by themselves: the value stays open once they are mounted.
    await flush()
    expect(importer.values.open.map((question) => question.value)).toEqual(['Remote'])
    importer.values.answer({ field: 'mode', value: 'Remote' }, 'Online')
    await flush()

    await next()
    expect(step()).toBe('review')
    await until(() => view.findAll('[data-spreadsheet-row]').length === 4)
    const row = (index: number) => view.find(`[data-spreadsheet-row="${index}"]`)
    expect([0, 1, 2, 3].map((index) => row(index).attributes('data-status'))).toEqual([
      'valid',
      'blocking',
      'discarded',
      'valid',
    ])

    await row(1).find('[data-spreadsheet-cell="email"]').trigger('click')
    await flush()
    const input = row(1).find('[data-spreadsheet-cell="email"] input')
    await input.setValue('hugo@campus.fr')
    await input.trigger('keydown', { key: 'Enter' })
    await until(() => row(1).attributes('data-status') === 'valid')
    expect(importer.rows.cell(1, 'email')).toMatchObject({ edited: true, original: '' })

    await row(3).find('[data-spreadsheet-inspect]').trigger('click')
    await flush()
    expect(view.find('[data-spreadsheet-inspector]').exists()).toBe(true)

    await next()
    expect(step()).toBe('submit')
    await view.find('[data-spreadsheet-submit]').trigger('click')
    await until(() => importer.submit.status === 'done')
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]?.[0].create).toHaveLength(3)
  })

  it('composes a single page from the parts, without steps', async () => {
    const { importer, view } = mountWith((current) =>
      h(SpreadsheetImportRoot, { importer: current }, () => [
        h(SpreadsheetImportDropzone),
        h(SpreadsheetImportColumnMapping, { only: 'missing' }),
        h(SpreadsheetImportTable, { height: '20rem' }),
      ]),
    )
    expect(view.find('[data-spreadsheet-dropzone]').exists()).toBe(true)
    importer.file.load(createFile(), 'export.xlsx')
    await until(() => importer.rows.all.length === 4)
    await flush()
    expect(
      view
        .findAll('[data-spreadsheet-field]')
        .map((field) => field.attributes('data-spreadsheet-field')),
    ).toEqual(['duration'])
    importer.columns.assign('duration', 4)
    await flush()
    // A fixed field stays in place while the user works on the list.
    expect(view.find('[data-spreadsheet-field="duration"]').attributes('data-status')).toBe(
      'matched',
    )
    expect(view.findAll('[data-spreadsheet-row]')).toHaveLength(4)
  })
})
