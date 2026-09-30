/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type { ExtractSpreadsheetRow } from '#ui-tools/spreadsheet/types'

import { createWorkbookFile, mountSpreadsheet, settle } from './helpers'

type ProductId = 'en' | 'fr'

interface Product {
  id: ProductId
  name: string
  categories: readonly string[]
  scale: readonly string[]
  maxScore: number
}

const PRODUCTS: readonly Product[] = [
  {
    categories: ['Grammar', 'Listening'],
    id: 'en',
    maxScore: 20,
    name: 'English',
    scale: ['A1', 'A2', 'B1', 'B2'],
  },
  {
    categories: ['Oral', 'Écrit'],
    id: 'fr',
    maxScore: 100,
    name: 'French',
    scale: ['Débutant', 'Intermédiaire', 'Avancé'],
  },
]

function productOf(products: readonly Product[], id: ProductId | null) {
  return products.find((product) => product.id === id)
}

/** Each product has its own score categories, scale, and maximum score. */
const scores = defineSpreadsheetSchema<{ products: readonly Product[] }>()({
  key: 'scores',
  columns: (c) =>
    c
      .select('product', {
        options: ({ ctx }) =>
          ctx.products.map((product) => ({ label: product.name, value: product.id })),
        required: true,
      })
      .select('category', {
        options: ({ row, ctx }) => productOf(ctx.products, row.product)?.categories ?? [],
        required: true,
      })
      .select('level', {
        options: ({ row, ctx }) => productOf(ctx.products, row.product)?.scale ?? [],
      })
      .number('score', {
        rules: (v, { row, ctx }) => [v.max(productOf(ctx.products, row.product)?.maxScore ?? 0)],
      })
      .text('note', { default: ({ row }) => `Product ${row.product}` }),
})

const ROWS = [
  ['English', 'Grammar', 'B1', 18, ''],
  ['French', 'Oral', 'Avancé', 85, 'Solid'],
  ['English', 'Oral', 'Avancé', 25, ''],
  ['French', 'Écrit', 'B2', 50, ''],
  ['English', 'Listening', 'Advanced', 10, ''],
  ['French', 'Oral', 'Advanced', 60, ''],
]

let stop: (() => void) | null = null
afterEach(() => {
  stop?.()
  stop = null
})

async function load() {
  const mounted = mountSpreadsheet(() =>
    useSpreadsheetImport(scores, { context: { products: PRODUCTS } }),
  )
  stop = mounted.stop
  mounted.value.file.load(
    createWorkbookFile({
      Scores: [['Product', 'Category', 'Level', 'Score', 'Note'], ...ROWS],
    }),
    'scores.xlsx',
  )
  await settle()
  await mounted.value.ready()
  await settle()
  return mounted.value
}

const labels = (options: readonly { label: string }[]) => options.map((option) => option.label)

describe('columns depending on the columns above', () => {
  it('types the row each callback receives', () => {
    expectTypeOf<ExtractSpreadsheetRow<typeof scores>>().toEqualTypeOf<{
      product: ProductId
      category: string
      level: string | null
      score: number | null
      note: string
    }>()
  })

  it('checks each row against the options of its product', async () => {
    const importer = await load()
    expect(importer.rows.all[0]!.data).toEqual({
      category: 'Grammar',
      level: 'B1',
      note: 'Product en',
      product: 'en',
      score: 18,
    })
    expect(importer.rows.all[1]!.data).toMatchObject({ category: 'Oral', level: 'Avancé' })
    expect(labels(importer.rows.cell(0, 'level').choices)).toEqual(['A1', 'A2', 'B1', 'B2'])
    expect(labels(importer.values.choices('level', 1))).toEqual([
      'Débutant',
      'Intermédiaire',
      'Avancé',
    ])
    expect(importer.values.choices('level')).toEqual([])
  })

  it('runs rules and defaults with the row', async () => {
    const importer = await load()
    expect(importer.rows.all[2]!.fieldIssues.score?.code).toBe('max')
    expect(importer.rows.all[3]!.fieldIssues.score).toBeUndefined()
    expect(importer.rows.all[3]!.data.note).toBe('Product fr')
  })

  it('asks a value once per set of options, with the values that decide them', async () => {
    const importer = await load()
    const questions = importer.values.questions.filter((question) => question.field === 'level')
    expect(questions.map((question) => [question.value, question.rows])).toEqual([
      ['Avancé', [2]],
      ['B2', [3]],
      ['Advanced', [4]],
      ['Advanced', [5]],
    ])
    const [, , english, french] = questions
    expect(english!.scope?.id).not.toBe(french!.scope?.id)
    expect(english!.scope?.dependsOn).toEqual([
      { field: 'product', label: 'Product', values: ['English'] },
    ])
    expect(labels(english!.choices)).toEqual(['A1', 'A2', 'B1', 'B2'])
    expect(labels(french!.choices)).toEqual(['Débutant', 'Intermédiaire', 'Avancé'])

    importer.values.answer(english!, 'B2')
    await settle()
    expect(importer.rows.all[4]!.data.level).toBe('B2')
    expect(importer.rows.all[5]!.fieldIssues.level?.code).toBe('value.unknown')
    expect(
      importer.values.open.filter((question) => question.field === 'level').map((q) => q.value),
    ).toEqual(['Avancé', 'B2', 'Advanced'])
  })

  it('checks the rows again when a value they depend on is edited', async () => {
    const importer = await load()
    importer.rows.edit(3, 'product', 'English')
    await settle()
    expect(importer.rows.all[3]!.data).toMatchObject({ category: null, level: 'B2', product: 'en' })
    expect(importer.rows.all[3]!.fieldIssues.category?.code).toBe('value.unknown')
  })
})
