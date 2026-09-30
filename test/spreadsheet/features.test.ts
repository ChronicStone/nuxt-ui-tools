/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { read, utils } from 'xlsx'

import { defineRemoteOptions } from '#ui-tools/shared'
import { spreadsheetSteps, useSpreadsheetImport, useSpreadsheetSteps } from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type { SpreadsheetImporter } from '#ui-tools/spreadsheet/types'

import { createWorkbookFile, mountSpreadsheet, settle } from './helpers'

let stops: (() => void)[] = []
afterEach(() => {
  for (const stop of stops) stop()
  stops = []
})

/** Mounts a composable factory and keeps its scope until the test ends. */
function mount<TValue>(factory: () => TValue) {
  const mounted = mountSpreadsheet(factory)
  stops.push(mounted.stop)
  return mounted.value
}

async function load(importer: SpreadsheetImporter, rows: readonly (readonly unknown[])[]) {
  importer.file.load(createWorkbookFile({ Sheet: rows }), 'rows.xlsx')
  await settle()
  await importer.ready()
  await settle()
}

describe('remote options', () => {
  const PEOPLE = [
    { id: 'p1', name: 'Léa Martin', reference: '4801' },
    { id: 'p2', name: 'Hugo Petit', reference: '4802' },
    { id: 'p3', name: 'Zoé Roux', reference: '4803' },
  ]
  const toOption = (person: (typeof PEOPLE)[number]) => ({
    label: person.name,
    value: person.id,
    aliases: [person.reference],
  })

  it('matches every value of the file in one label query, and searches on demand', async () => {
    const byLabels = vi.fn((labels: readonly string[]) =>
      PEOPLE.filter((person) => labels.includes(person.reference)),
    )
    const bySearch = vi.fn((text: string) =>
      PEOPLE.filter((person) => person.name.toLowerCase().includes(text.toLowerCase())),
    )
    const people = defineRemoteOptions(
      {
        load: ({ search, page }) => ({
          queryKey: ['test', 'people', 'page', search, page.index],
          queryFn: () => Promise.resolve({ rows: bySearch(search) }),
        }),
        resolveSelected: ({ values }) => ({
          queryKey: ['test', 'people', 'ids', ...values],
          queryFn: () =>
            Promise.resolve({ rows: PEOPLE.filter((person) => values.includes(person.id)) }),
        }),
        resolveLabels: ({ labels }) => ({
          queryKey: ['test', 'people', 'labels', ...labels],
          queryFn: () => Promise.resolve({ rows: byLabels(labels) }),
        }),
      },
      {
        key: 'test-people',
        mapPage: (result) => ({ hasMore: false, options: result.rows.map(toOption) }),
        mapSelected: (result) => result.rows.map(toOption),
        pagination: { size: 20, type: 'page' },
      },
    )
    const schema = defineSpreadsheetSchema({
      key: 'test.remote',
      columns: (c) =>
        c
          .text('code', { required: true })
          .select('person', { headers: 'Candidate', options: people, required: true }),
    })
    const importer = mount(() => useSpreadsheetImport(schema))
    await load(importer, [
      ['Code', 'Candidate'],
      ['A', '4801'],
      ['B', '4803'],
      ['C', '4801'],
      ['D', '9999'],
    ])

    expect(byLabels).toHaveBeenLastCalledWith(['4801', '4803', '9999'])
    expect(bySearch).not.toHaveBeenCalled()
    expect(importer.rows.all.map((row) => row.data.person)).toEqual(['p1', 'p3', 'p1', null])
    expect(importer.rows.cell(0, 'person').display).toBe('Léa Martin')
    expect(importer.values.open).toMatchObject([{ field: 'person', remote: true, value: '9999' }])

    const found = await importer.values.search('person', 'hugo')
    expect(found.map((option) => option.label)).toEqual(['Hugo Petit'])
    importer.values.answer(importer.values.open[0]!, 'p2')
    await settle()
    expect(importer.rows.all[3]!.data.person).toBe('p2')
  })
})

describe('values created on import', () => {
  it('creates each new value once, when the rows are sent', async () => {
    const handler = vi.fn(({ label }: { label: string }) =>
      Promise.resolve({ label, value: `new-${label.toLowerCase()}` }),
    )
    const schema = defineSpreadsheetSchema({
      key: 'test.create',
      columns: (c) =>
        c.text('code', { required: true }).select('sites', {
          options: { source: [{ label: 'Lyon', value: 'lyon' }], create: { handler } },
          multiple: true,
          unknown: 'create',
        }),
    })
    const onSubmit = vi.fn()
    const importer = mount(() => useSpreadsheetImport(schema, { onSubmit }))
    await load(importer, [
      ['Code', 'Sites'],
      ['A', 'Lyon, Grenoble'],
      ['B', 'grenoble'],
      ['C', 'Annecy'],
    ])

    expect(importer.values.questions).toMatchObject([
      { answeredBy: 'policy', rows: [0, 1], state: 'answered', value: 'Grenoble' },
      { answeredBy: 'policy', rows: [2], state: 'answered', value: 'Annecy' },
    ])
    expect(importer.rows.cell(0, 'sites').created).toBe(true)
    expect(handler).not.toHaveBeenCalled()

    await importer.submit.run()
    expect(handler.mock.calls.map(([params]) => params.label)).toEqual(['Grenoble', 'Annecy'])
    expect(onSubmit.mock.calls[0]?.[0].create).toEqual([
      { code: 'A', sites: ['lyon', 'new-grenoble'] },
      { code: 'B', sites: ['new-grenoble'] },
      { code: 'C', sites: ['new-annecy'] },
    ])
  })
})

describe('values created on import, with options depending on the row', () => {
  it('creates a value asked in several scopes once', async () => {
    const handler = vi.fn(({ label }: { label: string }) =>
      Promise.resolve(`new-${label.toLowerCase()}`),
    )
    const schema = defineSpreadsheetSchema({
      key: 'test.create-scoped',
      columns: (c) =>
        c.select('product', { options: ['en', 'fr'], required: true }).select('level', {
          options: {
            source: ({ row }) => (row.product === 'en' ? ['A1', 'A2'] : ['B1', 'B2']),
            create: { handler },
          },
          unknown: 'create',
        }),
    })
    const onSubmit = vi.fn()
    const importer = mount(() => useSpreadsheetImport(schema, { onSubmit }))
    await load(importer, [
      ['Product', 'Level'],
      ['en', 'Z9'],
      ['fr', 'z9'],
    ])
    expect(importer.values.questions).toHaveLength(2)

    await importer.submit.run()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]?.[0].create).toEqual([
      { level: 'new-z9', product: 'en' },
      { level: 'new-z9', product: 'fr' },
    ])
  })
})

describe('duplicate keys', () => {
  it.each([
    ['keep-first', 2],
    ['keep-last', 0],
  ] as const)('with %s, leaves the other row out', async (duplicates, discarded) => {
    const schema = defineSpreadsheetSchema({
      key: `test.${duplicates}`,
      columns: (c) => c.text('code', { required: true }).number('score'),
      rows: { key: (row) => row.code, duplicates },
    })
    const importer = mount(() => useSpreadsheetImport(schema))
    await load(importer, [
      ['Code', 'Score'],
      ['A', 1],
      ['B', 2],
      ['A', 3],
    ])
    expect(importer.rows.all.map((row) => row.discardReason)).toEqual(
      [0, 1, 2].map((index) => (index === discarded ? 'duplicate' : null)),
    )
    expect(importer.readiness.importable).toBe(2)
  })
})

describe('columns with `when`', () => {
  it('leaves the column out of the import until the context includes it', async () => {
    const grammar = shallowRef<boolean>(false)
    const schema = defineSpreadsheetSchema<{ grammar: boolean }>()({
      key: 'test.when',
      columns: (c) =>
        c.text('code', { required: true }).select('grammar', {
          options: ['A1', 'B1'],
          when: ({ ctx }) => ctx.grammar,
        }),
    })
    const importer = mount(() => useSpreadsheetImport(schema, { context: { grammar } }))
    await load(importer, [
      ['Code', 'Grammar'],
      ['A', 'B1'],
    ])
    expect(importer.columns.fields.map((field) => field.path)).toEqual(['code'])
    expect(importer.rows.all[0]!.data).toEqual({ code: 'A' })
    expect(importer.columns.unusedHeaders.map((header) => header.text)).toEqual(['Grammar'])

    grammar.value = true
    await settle()
    expect(importer.columns.fields.map((field) => field.path)).toEqual(['code', 'grammar'])
    expect(importer.rows.all[0]!.data).toEqual({ code: 'A', grammar: 'B1' })
  })
})

describe('steps', () => {
  it('runs built-in and custom steps, skipping those with nothing to do', async () => {
    const centerId = shallowRef<string | null>(null)
    const schema = defineSpreadsheetSchema({
      key: 'test.steps',
      columns: (c) => c.text('code', { required: true }).select('level', { options: ['A1', 'B1'] }),
    })
    const { importer, steps } = mount(() => {
      const created = useSpreadsheetImport(schema)
      return {
        importer: created,
        steps: useSpreadsheetSteps(created, [
          { key: 'center', label: 'Center', ready: () => Boolean(centerId.value) },
          spreadsheetSteps.file(),
          spreadsheetSteps.columns({ show: 'when-needed' }),
          spreadsheetSteps.values({ show: 'when-needed' }),
          spreadsheetSteps.review(),
          spreadsheetSteps.submit(),
        ]),
      }
    })

    expect(steps.current).toBe('center')
    steps.next()
    expect(steps.current).toBe('center')
    centerId.value = 'lyon'
    steps.next()
    expect(steps.current).toBe('file')
    expect(steps.canNext).toBe(false)

    await load(importer, [
      ['Code', 'Level'],
      ['A', 'B1'],
      ['B', 'C2'],
    ])
    steps.next()
    expect(steps.current).toBe('values')
    expect(steps.list.find((step) => step.key === 'columns')?.state).toBe('skipped')
    expect(steps.step?.blockers).toBe(1)
    steps.next()
    expect(steps.current).toBe('values')

    importer.values.answer(importer.values.open[0]!, 'B1')
    await settle()
    steps.next()
    expect(steps.current).toBe('review')
    steps.back()
    expect(steps.current).toBe('values')
    steps.back()
    expect(steps.current).toBe('file')
    steps.goTo('review')
    expect(steps.current).toBe('file')

    steps.next()
    steps.next()
    expect(steps.current).toBe('review')
    importer.file.clear()
    await settle()
    expect(steps.current).toBe('file')
  })
})

describe('submit', () => {
  const schema = defineSpreadsheetSchema({
    key: 'test.submit',
    columns: (c) => c.text('code', { required: true }),
  })
  const ROWS = [['Code'], ['A'], ['B'], ['C'], ['D'], ['E']]

  it('reports progress per batch and retries only the refused rows', async () => {
    const progress: number[] = []
    const sent: number[][] = []
    const state: { importer: SpreadsheetImporter | null } = { importer: null }
    const importer = mount(() =>
      useSpreadsheetImport(schema, {
        onSubmit: ({ rows, reportProgress }) => {
          reportProgress(1)
          progress.push(state.importer?.submit.progress.done ?? -1)
          sent.push(rows.map((row) => row.index))
          const refuse = sent.length <= 3 && rows.some((row) => row.index === 3)
          return refuse ? { rejected: [{ index: 3, message: 'Locked' }] } : undefined
        },
        submit: { batchSize: 2 },
      }),
    )
    state.importer = importer
    await load(importer, ROWS)

    await importer.submit.run()
    expect(sent).toEqual([[0, 1], [2, 3], [4]])
    expect(progress).toEqual([1, 3, 5])
    expect(importer.submit).toMatchObject({ imported: 4, progress: { done: 5, total: 5 } })
    expect(importer.rows.all[3]!.errors[0]).toMatchObject({ code: 'server', message: 'Locked' })

    await importer.submit.retryRejected()
    expect(sent.at(-1)).toEqual([3])
    expect(importer.submit).toMatchObject({ imported: 1, rejected: [], status: 'done' })
    expect(importer.rows.all[3]!.importable).toBe(true)
  })

  it('stops a running import on reset', async () => {
    let release: () => void = () => undefined
    const seen: { signal: AbortSignal | null } = { signal: null }
    const onSubmit = vi.fn((params: { signal: AbortSignal }) => {
      seen.signal = params.signal
      return new Promise<void>((resolve) => {
        release = resolve
      })
    })
    const importer = mount(() =>
      useSpreadsheetImport(schema, { onSubmit, submit: { batchSize: 1 } }),
    )
    await load(importer, ROWS)

    const running = importer.submit.run()
    await settle()
    expect(importer.submit.status).toBe('running')
    importer.submit.reset()
    expect(seen.signal?.aborted).toBe(true)
    release()
    await running
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(importer.submit).toMatchObject({ progress: { done: 0, total: 0 }, status: 'idle' })
  })
})

describe('review commands', () => {
  it('discards and restores rows, exports invalid rows, and resets', async () => {
    const schema = defineSpreadsheetSchema({
      key: 'test.review',
      columns: (c) =>
        c.text('code', { required: true }).text('email', { rules: (v) => [v.email()] }),
    })
    const importer = mount(() => useSpreadsheetImport(schema))
    await load(importer, [
      ['Code', 'Email'],
      ['A', 'a@campus.fr'],
      ['B', 'nope'],
      ['C', 'c@campus.fr'],
    ])
    expect(importer.rows.invalid.map((row) => row.index)).toEqual([1])

    importer.rows.discard([2])
    await settle()
    expect(importer.rows.all[2]!.discardReason).toBe('manual')
    expect(importer.readiness.importable).toBe(1)
    importer.rows.restore([2])
    await settle()
    expect(importer.readiness.importable).toBe(2)

    const workbook = read(new Uint8Array(await importer.rows.exportInvalid().arrayBuffer()), {
      type: 'array',
    })
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? '']
    const lines: unknown[][] = sheet ? utils.sheet_to_json(sheet, { header: 1 }) : []
    expect(lines).toHaveLength(2)
    expect(lines[0]?.slice(0, 2)).toEqual(['Code', 'Email'])
    expect(lines[1]?.slice(0, 2)).toEqual(['B', 'nope'])
    expect(String(lines[1]?.[2] ?? '')).not.toBe('')

    importer.reset()
    await settle()
    expect(importer.file.loaded).toBe(false)
    expect(importer.rows.all).toHaveLength(0)
  })
})
