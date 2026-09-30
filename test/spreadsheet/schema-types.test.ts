/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import { describe, expectTypeOf, it } from 'vitest'

import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  ExtractSpreadsheetContext,
  ExtractSpreadsheetExisting,
  ExtractSpreadsheetFieldPath,
  ExtractSpreadsheetKeyValue,
  ExtractSpreadsheetOutput,
  ExtractSpreadsheetRow,
} from '#ui-tools/spreadsheet/types'

interface TestCenter {
  id: string
  vtestId: string
  affiliationGroups: readonly {
    slug: string
    name: string
    items: readonly { id: string; name: string }[]
  }[]
}

type ProductId = 'prod_en' | 'prod_placement'

interface Product {
  id: ProductId
  name: string
  examNames: readonly string[]
  scale: readonly string[]
  maxScore: number
}

interface StoredAssessment {
  secureCode: string
  id: number
  levels: { general: string | null }
}

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

function productOf(products: readonly Product[], id: ProductId) {
  return products.find((product) => product.id === id)
}

const assessmentsImport = defineSpreadsheetSchema<{
  center: TestCenter
  products: readonly Product[]
}>()({
  key: 'assessments',
  file: { accept: ['.xlsx'], maxRows: 5000 },
  columns: (c) =>
    c
      .select('testCenterId', {
        label: 'Centre de test',
        headers: 'Test center ID',
        options: ({ ctx }) => [ctx.center.vtestId],
        default: ({ ctx }) => ctx.center.vtestId,
        unknown: 'error',
      })
      .text('secureCode', { label: 'Code sécurisé', headers: 'Secure code', required: true })
      .text('examName', { label: 'Examen', required: true })
      .text('notes')
      .text('tags', { multiple: { separator: ';' } })
      .date('completedAt', { formats: ['MMMM d, yyyy h:mm a'], required: true })
      .boolean('retake', { true: ['oui'] })
      .text('duration', {
        parse: ({ cell }) => Number.parseInt(cell.text, 10),
        rules: (v) => [v.min(1)],
      })
      .select('productId', {
        label: 'Produit',
        from: 'examName',
        options: ({ ctx }) =>
          ctx.products.map((product) => ({
            label: product.name,
            value: product.id,
            aliases: product.examNames,
          })),
        required: true,
      })
      .number('score', {
        decimal: ',',
        rules: (v, { row, ctx }) => {
          expectTypeOf(row.productId).toEqualTypeOf<ProductId>()
          return [v.between(0, productOf(ctx.products, row.productId)?.maxScore ?? 100)]
        },
      })
      .select('status', { options: ['Done', 'Absent'], unknown: 'skip-rows' })
      .select('mode', {
        options: [
          { label: 'Online', value: 'online' },
          { label: 'Onsite', value: 'onsite' },
        ],
      })
      .select('grammar', { options: CEFR, when: ({ ctx }) => ctx.center.id === 'lyon' })
      .group('levels', { label: 'Niveaux' }, (g) =>
        g
          .select('general', {
            options: ({ row, ctx }) => {
              expectTypeOf(row.secureCode).toEqualTypeOf<string>()
              return productOf(ctx.products, row.productId)?.scale ?? CEFR
            },
          })
          .select('listening', {
            options: CEFR,
            required: true,
            rules: (v, { row }) => {
              expectTypeOf(row.levels.general).toEqualTypeOf<string | null>()
              return []
            },
          }),
      )
      .dynamic('affiliations', {
        label: 'Affiliations',
        items: ({ ctx }) => ctx.center.affiliationGroups,
        column: (group, c) =>
          c.select(group.slug, {
            label: group.name,
            headers: `${group.name}: PRÉREQUIS CECR`,
            options: group.items.map((item) => ({ label: item.name, value: item.id })),
            multiple: true,
          }),
      }),
  rows: {
    key: (row) => row.secureCode,
    duplicates: 'error',
    existing: {
      lookup: ({ keys, ctx }) => {
        expectTypeOf(keys).toEqualTypeOf<readonly string[]>()
        expectTypeOf(ctx.center).toEqualTypeOf<TestCenter>()
        return Promise.resolve<readonly StoredAssessment[]>([])
      },
      action: ({ row, existing }) =>
        row.levels.general === existing.levels.general ? 'skip' : 'update',
    },
  },
  validate: ({ row, issue }) => [
    !row.levels.general && issue('levels.general', 'Required when the test is done'),
  ],
  output: ({ row, mode, existing, ctx }) => ({
    centerId: ctx.center.id,
    code: row.secureCode,
    mode,
    storedId: existing?.id,
  }),
})

type Row = ExtractSpreadsheetRow<typeof assessmentsImport>

describe('defineSpreadsheetSchema types', () => {
  it('types the context declared on the schema', () => {
    expectTypeOf<ExtractSpreadsheetContext<typeof assessmentsImport>>().toEqualTypeOf<{
      center: TestCenter
      products: readonly Product[]
    }>()
  })

  it('infers scalar values and their nullability', () => {
    expectTypeOf<Row['secureCode']>().toEqualTypeOf<string>()
    expectTypeOf<Row['notes']>().toEqualTypeOf<string | null>()
    expectTypeOf<Row['tags']>().toEqualTypeOf<string[]>()
    expectTypeOf<Row['score']>().toEqualTypeOf<number | null>()
    expectTypeOf<Row['completedAt']>().toEqualTypeOf<string>()
    expectTypeOf<Row['retake']>().toEqualTypeOf<boolean | null>()
    expectTypeOf<Row['duration']>().toEqualTypeOf<number | null>()
  })

  it('infers select values from the options, literal where possible', () => {
    expectTypeOf<Row['testCenterId']>().toEqualTypeOf<string>()
    expectTypeOf<Row['productId']>().toEqualTypeOf<ProductId>()
    expectTypeOf<Row['status']>().toEqualTypeOf<'Done' | 'Absent' | null>()
    expectTypeOf<Row['mode']>().toEqualTypeOf<'online' | 'onsite' | null>()
  })

  it('makes a column with `when` optional', () => {
    expectTypeOf<Row['grammar']>().toEqualTypeOf<
      'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null | undefined
    >()
  })

  it('nests groups, and builds a record from dynamic groups', () => {
    expectTypeOf<Row['levels']>().toEqualTypeOf<{
      general: string | null
      listening: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    }>()
    expectTypeOf<Row['affiliations']>().toEqualTypeOf<{ [key: string]: string[] }>()
  })

  it('lists field paths', () => {
    expectTypeOf<'levels.general'>().toExtend<
      ExtractSpreadsheetFieldPath<typeof assessmentsImport>
    >()
    expectTypeOf<'affiliations.site'>().toExtend<
      ExtractSpreadsheetFieldPath<typeof assessmentsImport>
    >()
    expectTypeOf<'levels.unknown'>().not.toExtend<
      ExtractSpreadsheetFieldPath<typeof assessmentsImport>
    >()
  })

  it('types the row key, the stored records, and the output', () => {
    expectTypeOf<ExtractSpreadsheetKeyValue<typeof assessmentsImport>>().toEqualTypeOf<string>()
    expectTypeOf<
      ExtractSpreadsheetExisting<typeof assessmentsImport>
    >().toEqualTypeOf<StoredAssessment>()
    expectTypeOf<ExtractSpreadsheetOutput<typeof assessmentsImport>>().toEqualTypeOf<{
      centerId: string
      code: string
      mode: 'create' | 'update'
      storedId: number | undefined
    }>()
  })

  it('reads `from` only from a column declared above', () => {
    defineSpreadsheetSchema({
      key: 'typo',
      columns: (c) =>
        // @ts-expect-error -- `examNam` is not a column
        c.text('examName').select('productId', { from: 'examNam', options: ['a'] }),
    })
    defineSpreadsheetSchema({
      key: 'order',
      columns: (c) =>
        // @ts-expect-error -- `examName` is declared after the select
        c.select('productId', { from: 'examName', options: ['a'] }).text('examName'),
    })
  })

  it('gives callbacks only the columns declared above', () => {
    defineSpreadsheetSchema({
      key: 'above',
      columns: (c) =>
        c
          .select('level', {
            // @ts-expect-error -- `product` is declared below
            options: ({ row }) => (row.product === 'en' ? ['A1'] : ['1']),
          })
          .select('product', { options: ['en', 'fr'] }),
    })
    defineSpreadsheetSchema({
      key: 'typed-row',
      columns: (c) =>
        c.select('product', { options: ['en', 'fr'], required: true }).select('level', {
          options: ({ row }) => {
            expectTypeOf(row).toEqualTypeOf<{ product: 'en' | 'fr' }>()
            // @ts-expect-error -- `de` is not a product
            return row.product === 'de' ? ['A1'] : ['1']
          },
        }),
    })
  })

  it('rejects a column declared twice', () => {
    defineSpreadsheetSchema({
      key: 'twice',
      // @ts-expect-error -- `code` is already a column
      columns: (c) => c.text('code').number('code'),
    })
  })

  it('rejects a key that is not text or numbers', () => {
    defineSpreadsheetSchema({
      key: 'bad-key',
      columns: (c) => c.boolean('retake', { required: true }),
      // @ts-expect-error -- a boolean cannot identify a row
      rows: { key: (row) => row.retake },
    })
  })

  it('types keys of several fields as tuples, and drops empty keys', () => {
    const composite = defineSpreadsheetSchema({
      key: 'composite',
      columns: (c) => c.text('center').number('code', { required: true }),
      rows: { key: (row) => (row.center ? [row.center, row.code] : null) },
    })
    expectTypeOf<ExtractSpreadsheetKeyValue<typeof composite>>().toEqualTypeOf<
      readonly [string, number]
    >()
  })

  it('defaults the output to the row', () => {
    const plain = defineSpreadsheetSchema({
      key: 'plain',
      columns: (c) => c.text('name', { required: true }),
    })
    expectTypeOf<ExtractSpreadsheetOutput<typeof plain>>().toEqualTypeOf<{ name: string }>()
  })

  it('types rule values by column kind', () => {
    defineSpreadsheetSchema({
      key: 'rules',
      columns: (c) =>
        // @ts-expect-error -- `min` checks numbers, the column holds text
        c.text('name', { rules: (v) => [v.min(2)] }),
    })
  })
})
