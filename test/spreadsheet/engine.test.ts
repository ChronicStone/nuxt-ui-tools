/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { read, utils } from 'xlsx'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type { SpreadsheetImporter, SpreadsheetImportOptions } from '#ui-tools/spreadsheet/types'

import { createWorkbookFile, mountSpreadsheet, settle } from './helpers'

interface Center {
  id: string
  vtestId: string
  groups: readonly { slug: string; name: string; items: readonly string[] }[]
}

/** Stored records have the row's shape, so review can show the fields that change. */
interface Stored {
  secureCode: string
  id: number
  levels: { general: string | null }
}

const LYON: Center = {
  groups: [{ items: ['Primary', 'Secondary'], name: 'School level', slug: 'schoolLevel' }],
  id: 'lyon',
  vtestId: '0000021384',
}

const assessments = defineSpreadsheetSchema<{ center: Center; stored: readonly Stored[] }>()({
  key: 'assessments',
  file: { maxRows: 100 },
  columns: (c) =>
    c
      .select('testCenterId', {
        headers: 'Test center ID',
        options: ({ ctx }) => [ctx.center.vtestId],
        default: ({ ctx }) => ctx.center.vtestId,
        unknown: 'error',
      })
      .text('secureCode', { headers: 'Secure code', required: true })
      .text('examName', { headers: 'Exam name', required: true })
      .select('productId', {
        label: 'Product',
        from: 'examName',
        options: [
          {
            label: 'VTest English · 4 skills',
            value: 'prod_en',
            aliases: ['VTEST ENGLISH - 4 SKILLS'],
          },
          { label: 'VTest Business', value: 'prod_be' },
        ],
        required: true,
      })
      .text('email', { rules: (v) => [v.email({ level: 'warning' })] })
      .select('status', { headers: 'Test status', options: ['Done'], unknown: 'skip-rows' })
      .text('duration', {
        headers: ['Duration'],
        rules: (v) => [v.pattern(/^\d{2}:\d{2}$/u)],
      })
      .number('score', { decimal: ',' })
      .date('completedAt', { headers: 'Completed date', formats: ['MMMM d, yyyy h:mm a'] })
      .boolean('retake')
      .group('levels', {}, (g) =>
        g.select('general', { headers: 'General level', options: ['A1', 'A2', 'B1', 'B2'] }),
      )
      .dynamic('affiliations', {
        label: 'Affiliations',
        items: ({ ctx }) => ctx.center.groups,
        column: (group, c) =>
          c.select(group.slug, {
            label: group.name,
            options: group.items,
            multiple: true,
            unknown: 'leave-empty',
          }),
      }),
  rows: {
    key: (row) => row.secureCode,
    existing: {
      lookup: ({ keys, ctx }) =>
        Promise.resolve(ctx.stored.filter((record) => keys.includes(record.secureCode))),
      action: ({ row, existing }) =>
        row.levels.general === existing.levels.general ? 'skip' : 'update',
    },
  },
  validate: ({ row, issue }) => [
    row.status === 'Done' &&
      !row.levels.general &&
      issue('levels.general', 'Required when the test is done'),
  ],
  output: ({ row, mode, existing }) => ({
    code: row.secureCode,
    mode,
    product: row.productId,
    storedId: existing?.id,
  }),
})

const HEADER = [
  'Secure code',
  'Exam name',
  'Email',
  'Test status',
  'Time spent',
  'Score',
  'Completed date',
  'Retake',
  'General level',
  'School level',
]

function file(rows: readonly (readonly unknown[])[]) {
  return createWorkbookFile({
    Summary: [['Candidates', rows.length]],
    Assessments: [['VTest export — Lyon'], ['Generated on September 28, 2026'], HEADER, ...rows],
  })
}

const ROWS = [
  [
    'AAA111',
    'VTEST ENGLISH - 4 SKILLS',
    'lea@campus.fr',
    'Done',
    '01:05',
    '12,5',
    'September 12, 2026 10:05 AM',
    'oui',
    'B1',
    'Primary',
  ],
  [
    'BBB222',
    'vtest business',
    'hugo@',
    'Done',
    '00:58',
    '14',
    'September 13, 2026 9:00 AM',
    'non',
    '',
    'Secondary, University',
  ],
  [
    'CCC333',
    'VTest Business',
    'chloe@campus.fr',
    'In progress',
    '1h05',
    '',
    'Sept 31, 2026',
    '',
    'A2',
    '',
  ],
  [
    'AAA111',
    'VTest Speaking',
    'dup@campus.fr',
    'Done',
    '01:10',
    '9',
    'September 14, 2026 8:00 AM',
    'x',
    'B2',
    'Primary',
  ],
  [
    'DDD444',
    'VTest Business',
    'nina@campus.fr',
    'Done',
    '01:00',
    '10',
    'September 15, 2026 8:00 AM',
    'x',
    'A1',
    'Secondary',
  ],
  [
    'EEE555',
    'VTest Business',
    'omar@campus.fr',
    'Done',
    '01:00',
    '11',
    'September 15, 2026 9:00 AM',
    'x',
    'B2',
    'Primary',
  ],
]

const STORED: readonly Stored[] = [
  { id: 1, levels: { general: 'A1' }, secureCode: 'DDD444' },
  { id: 2, levels: { general: 'A2' }, secureCode: 'EEE555' },
]

let stop: (() => void) | null = null
afterEach(() => {
  stop?.()
  stop = null
})

async function load(
  onSubmit?: SpreadsheetImportOptions<typeof assessments>['onSubmit'],
  batchSize?: number,
) {
  const mounted = mountSpreadsheet(() =>
    useSpreadsheetImport(assessments, {
      context: { center: LYON, stored: STORED },
      onSubmit,
      submit: { batchSize },
    }),
  )
  stop = mounted.stop
  const importer = mounted.value
  importer.file.load(file(ROWS), 'vtest_export.xlsx')
  await settle()
  await importer.ready()
  await settle()
  return importer
}

describe('spreadsheet engine', () => {
  it('types the importer from the schema', async () => {
    const importer = await load()
    expectTypeOf(importer).toEqualTypeOf<SpreadsheetImporter<typeof assessments>>()
    expectTypeOf(importer).toExtend<SpreadsheetImporter>()
    expectTypeOf(importer.rows.all[0]!.data.productId).toEqualTypeOf<'prod_en' | 'prod_be'>()
    expectTypeOf(importer.rows.all[0]!.existing).toEqualTypeOf<Stored | undefined>()
    expectTypeOf(importer.columns.assign)
      .parameter(0)
      .toEqualTypeOf<
        | 'testCenterId'
        | 'secureCode'
        | 'examName'
        | 'productId'
        | 'email'
        | 'status'
        | 'duration'
        | 'score'
        | 'completedAt'
        | 'retake'
        | 'levels.general'
        | `affiliations.${string}`
      >()
  })

  it('finds the sheet and the header row under title rows', async () => {
    const importer = await load()
    expect(importer.layout.sheet).toBe('Assessments')
    expect(importer.layout.headerRow).toBe(2)
    expect(importer.layout.detected).toBe(true)
    expect(importer.rows.all).toHaveLength(6)
    expect(importer.rows.all[0]!.rowNumber).toBe(4)
  })

  it('matches headers exactly and never guesses', async () => {
    const importer = await load()
    const status = (path: string) =>
      importer.columns.fields.find((field) => field.path === path)?.status
    expect(status('secureCode')).toBe('matched')
    expect(status('testCenterId')).toBe('default')
    expect(status('duration')).toBe('unmatched')
    expect(status('productId')).toBe('matched')
    expect(importer.columns.unusedHeaders.map((header) => header.text)).toEqual(['Time spent'])
  })

  it('suggests a column for a missing required field without applying it', async () => {
    const schema = defineSpreadsheetSchema({
      key: 'suggest',
      columns: (c) =>
        c
          .text('code', { required: true })
          .text('duration', { required: true, rules: (v) => [v.pattern(/^\d{2}:\d{2}$/u)] }),
    })
    const mounted = mountSpreadsheet(() => useSpreadsheetImport(schema))
    stop = mounted.stop
    mounted.value.file.load(
      createWorkbookFile({
        Sheet: [
          ['Code', 'Time spent'],
          ['A', '01:05'],
          ['B', '00:58'],
        ],
      }),
      'a.xlsx',
    )
    await settle()
    await mounted.value.ready()
    const duration = mounted.value.columns.fields.find((field) => field.path === 'duration')
    expect(duration?.status).toBe('missing')
    expect(duration?.suggestion?.header.text).toBe('Time spent')
    mounted.value.columns.assign('duration', 1)
    await settle()
    expect(mounted.value.columns.missing).toHaveLength(0)
  })

  it('reads typed values, defaults, groups, and multiple values', async () => {
    const importer = await load()
    const first = importer.rows.all[0]!.data
    expect(first).toMatchObject({
      affiliations: { schoolLevel: ['Primary'] },
      completedAt: '2026-09-12T10:05',
      levels: { general: 'B1' },
      productId: 'prod_en',
      retake: true,
      score: 12.5,
      testCenterId: '0000021384',
    })
    expect(importer.rows.cell(0, 'testCenterId').defaulted).toBe(true)
    expect(importer.rows.all[1]!.data.affiliations.schoolLevel).toEqual(['Secondary'])
  })

  it('turns values that match no option into questions, once per value', async () => {
    const importer = await load()
    expect(
      importer.values.open.map((question) => [question.field, question.value, question.rows]),
    ).toEqual([['productId', 'VTest Speaking', [3]]])
    const skipped = importer.values.questions.find((question) => question.field === 'status')
    expect(skipped).toMatchObject({ answeredBy: 'policy', state: 'answered', value: 'In progress' })
    expect(importer.rows.all[2]!.discardReason).toBe('value')
    expect(importer.readiness.canSubmit).toBe(false)

    importer.values.answer({ field: 'productId', value: 'VTest Speaking' }, 'prod_be')
    await settle()
    expect(importer.values.open).toHaveLength(0)
    expect(importer.rows.all[3]!.data.productId).toBe('prod_be')
  })

  it('checks rules with their level and runs validate', async () => {
    const importer = await load()
    const second = importer.rows.all[1]!
    expect(second.fieldIssues.email?.level).toBe('warning')
    expect(second.fieldIssues['levels.general']?.message).toBe('Required when the test is done')
    expect(second.status).toBe('blocking')
  })

  it('identifies rows: duplicates block both rows, stored records update or skip', async () => {
    const importer = await load()
    expect(importer.rows.all[0]!.fieldIssues.secureCode?.code).toBe('row.duplicate')
    expect(importer.rows.all[3]!.fieldIssues.secureCode?.code).toBe('row.duplicate')
    expect(importer.rows.keyFields).toEqual(['secureCode'])
    expect(importer.rows.all[4]).toMatchObject({ discardReason: 'existing', mode: 'skip' })
    expect(importer.rows.all[5]).toMatchObject({ changed: ['levels.general'], mode: 'update' })
    expect(importer.rows.all[5]!.existing?.id).toBe(2)
    expect(importer.rows.cell(5, 'levels.general').stored).toBe('A2')
  })

  it('re-parses an edited row and reverts it', async () => {
    const importer = await load()
    importer.rows.edit(3, 'secureCode', 'FFF666')
    await settle()
    expect(importer.rows.all[0]!.fieldIssues.secureCode).toBeUndefined()
    expect(importer.rows.cell(3, 'secureCode')).toMatchObject({
      edited: true,
      original: 'AAA111',
      text: 'FFF666',
    })
    importer.rows.revert(3, 'secureCode')
    await settle()
    expect(importer.rows.all[3]!.fieldIssues.secureCode?.code).toBe('row.duplicate')
  })

  it('submits in batches, by mode, and sends refused rows back to review', async () => {
    const onSubmit = vi.fn(({ rows }: { rows: readonly { index: number }[] }) =>
      rows.some((row) => row.index === 5)
        ? { rejected: [{ index: 5, message: 'Locked by ProCertif' }] }
        : undefined,
    )
    const importer = await load(onSubmit, 1)
    importer.rows.edit(3, 'secureCode', 'FFF666')
    importer.rows.edit(1, 'levels.general', 'B1')
    importer.values.answer({ field: 'productId', value: 'VTest Speaking' }, 'prod_be')
    await settle()
    expect(importer.readiness).toMatchObject({ canSubmit: true, importable: 4, openValues: 0 })
    await importer.submit.run()
    expect(onSubmit).toHaveBeenCalledTimes(4)
    expect(onSubmit.mock.calls.map(([params]) => params.rows[0]?.index)).toEqual([0, 1, 3, 5])
    const updateCall = onSubmit.mock.calls.find(([params]) => params.rows[0]?.index === 5)?.[0]
    expect(updateCall).toMatchObject({
      create: [],
      update: [{ code: 'EEE555', mode: 'update', storedId: 2 }],
    })
    expect(importer.submit).toMatchObject({ imported: 3, status: 'done' })
    expect(importer.rows.all[5]!.fieldIssues).toEqual({})
    expect(importer.rows.all[5]!.errors[0]).toMatchObject({
      code: 'server',
      message: 'Locked by ProCertif',
    })
    expect(importer.rows.all[5]!.importable).toBe(false)
  })

  it('reads pasted rows and builds a template', async () => {
    const schema = defineSpreadsheetSchema({
      key: 'paste',
      columns: (c) =>
        c
          .text('code', { headers: 'Code', required: true })
          .select('level', { options: ['A1', 'B1'] }),
    })
    const mounted = mountSpreadsheet(() => useSpreadsheetImport(schema))
    stop = mounted.stop
    mounted.value.file.paste('Code\tLevel\nX1\ta1\nX2\tC2')
    await settle()
    await mounted.value.ready()
    expect(mounted.value.rows.all.map((row) => row.data)).toEqual([
      { code: 'X1', level: 'A1' },
      { code: 'X2', level: null },
    ])
    expect(mounted.value.values.open[0]?.value).toBe('C2')

    const template = read(new Uint8Array(await mounted.value.template().arrayBuffer()), {
      type: 'array',
    })
    const first = template.Sheets[template.SheetNames[0] ?? '']
    expect(first ? utils.sheet_to_json(first, { header: 1 })[0] : []).toEqual(['Code', 'Level'])
  })
})
