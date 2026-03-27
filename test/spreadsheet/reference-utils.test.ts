import { computed } from 'vue'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  applySpreadsheetReferenceResolutions,
  createSpreadsheetReferenceCandidates,
  createSpreadsheetReferenceQueryRequests,
  createSpreadsheetReferenceResolutions,
} from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type { SpreadsheetParsedRow, SpreadsheetReferenceDefinition } from '#ui-tools/spreadsheet/types'
import { useSpreadsheetReferences } from '../../src/runtime/spreadsheet/composables/use-spreadsheet-references'

const productOptions = [
  { label: 'Business English 4 Skills', value: 'prod_1' },
  { label: 'Reading Placement Test', value: 'prod_2' },
] as const

describe('spreadsheet reference utils', () => {
  const references = [
    {
      kind: 'select',
      field: 'productId',
      source: 'examNameRaw',
      options: productOptions,
      getOptions: ({ search }: { search: string }) => ({
        queryKey: ['products', search],
        queryFn: async () => [],
      }),
    },
  ] satisfies readonly SpreadsheetReferenceDefinition[]

  const rows: SpreadsheetParsedRow<Record<string, unknown>>[] = [
    {
      index: 0,
      source: ['Business English 4 Skills'],
      data: {
        examNameRaw: 'Business English 4 Skills',
      },
      issues: [],
      isValid: true,
    },
    {
      index: 1,
      source: ['Business English 4 Skills'],
      data: {
        examNameRaw: 'Business English 4 Skills',
      },
      issues: [],
      isValid: true,
    },
    {
      index: 2,
      source: ['Unknown External Product'],
      data: {
        examNameRaw: 'Unknown External Product',
      },
      issues: [],
      isValid: true,
    },
  ]

  it('creates sorted candidates from reference options', () => {
    const candidates = createSpreadsheetReferenceCandidates({
      sourceValue: 'Business English 4 Skills',
      reference: references[0],
      options: references[0].options ?? [],
    })

    expect(candidates[0]).toMatchObject({
      value: 'prod_1',
      label: 'Business English 4 Skills',
      score: 1,
    })
  })

  it('keeps full option list even when no recommendation score is found', () => {
    const candidates = createSpreadsheetReferenceCandidates({
      sourceValue: 'Unknown External Product',
      reference: references[0],
      options: references[0].options ?? [],
    })

    expect(candidates).toHaveLength(2)
    expect(candidates.every(candidate => candidate.score === 0)).toBe(true)
  })

  it('creates one resolution per distinct imported source value', () => {
    const resolutions = createSpreadsheetReferenceResolutions({
      references,
      rows,
      context: {},
    })

    expect(resolutions).toHaveLength(2)
    expect(resolutions[0]).toMatchObject({
      referenceField: 'productId',
      sourceValue: 'Business English 4 Skills',
      status: 'matched',
      selectedValue: 'prod_1',
    })
    expect(resolutions[1]).toMatchObject({
      sourceValue: 'Unknown External Product',
      status: 'unresolved',
    })
    expect(resolutions[1]?.candidates).toHaveLength(2)
  })

  it('applies reference selections back onto all matching rows', () => {
    const resolvedRows = applySpreadsheetReferenceResolutions({
      rows,
      resolutions: [
        {
          referenceField: 'productId',
          sourceField: 'examNameRaw',
          outputField: 'product.id',
          sourceValue: 'Business English 4 Skills',
          rowIndexes: [0, 1],
          status: 'matched',
          selectedValue: 'prod_1',
          selectedLabel: 'Business English 4 Skills',
          candidates: [],
        },
        {
          referenceField: 'productId',
          sourceField: 'examNameRaw',
          outputField: 'product.id',
          sourceValue: 'Unknown External Product',
          rowIndexes: [2],
          status: 'unresolved',
          candidates: [],
        },
      ],
    })

    expect(resolvedRows[0]?.data).toMatchObject({
      examNameRaw: 'Business English 4 Skills',
      product: {
        id: 'prod_1',
      },
    })
    expect(resolvedRows[2]?.issues).toEqual([
      expect.objectContaining({
        code: 'reference.unresolved',
        columnKey: 'product.id',
      }),
    ])
  })

  it('creates query requests for unresolved references with remote targets', () => {
    const requests = createSpreadsheetReferenceQueryRequests({
      references,
      rows,
      context: {
        products: references[0].options,
      },
    })

    expect(requests).toHaveLength(1)
    expect(requests[0]?.query.queryKey).toEqual(['products', 'Unknown External Product'])
  })

  it('resolves array-bound references into array outputs', () => {
    const multiRows: SpreadsheetParsedRow<Record<string, unknown>>[] = [
      {
        index: 0,
        source: ['Business English 4 Skills', 'Reading Placement Test'],
        data: {
          examNamesRaw: ['Business English 4 Skills', 'Reading Placement Test'],
        },
        issues: [],
        isValid: true,
      },
    ]

    const multiReferences = [
      {
        kind: 'select',
        field: 'productIds',
        source: 'examNamesRaw',
        options: productOptions,
      },
    ] satisfies readonly SpreadsheetReferenceDefinition[]

    const resolutions = createSpreadsheetReferenceResolutions({
      references: multiReferences,
      rows: multiRows,
      context: {},
    })

    expect(resolutions).toHaveLength(2)
    expect(resolutions.map(resolution => resolution.sourceValue)).toEqual([
      'Business English 4 Skills',
      'Reading Placement Test',
    ])

    const resolvedRows = applySpreadsheetReferenceResolutions({
      rows: multiRows,
      resolutions,
    })

    expect(resolvedRows[0]?.data).toMatchObject({
      examNamesRaw: ['Business English 4 Skills', 'Reading Placement Test'],
      productIds: ['prod_1', 'prod_2'],
    })
  })

  it('orchestrates auto and manual selections in the reference composable', () => {
    const schema = defineSpreadsheetSchema({
      importKey: 'assessment.results',
      columns: {
        static: (column) => [
          column.text('examNameRaw', {
            match: {
              headers: ['Exam name'],
            },
          }),
        ],
      },
      references: reference => [
        reference.select('productId', {
          source: 'examNameRaw',
          options: productOptions,
          getOptions: ({ search }) => ({
            queryKey: ['products', search],
            queryFn: async () => [],
          }),
        }),
      ],
    })

    const referenceState = useSpreadsheetReferences({
      schema: computed(() => ({
        ...schema,
        context: [],
        columns: {
          static: [],
          dynamic: () => [],
        },
        references,
        relations: [],
      })),
      contextData: computed(() => ({
        products: references[0].options,
      })),
      rows: computed(() => rows),
    })

    expect(referenceState.unresolvedResolutions.value).toHaveLength(1)

    referenceState.selectReference({
      referenceField: 'productId',
      sourceValue: 'Unknown External Product',
      selectedValue: 'prod_2',
      selectedLabel: 'Reading Placement Test',
    })

    expect(referenceState.unresolvedResolutions.value).toHaveLength(0)
    expect(referenceState.resolvedRows.value[2]?.data).toMatchObject({
      productId: 'prod_2',
    })
    expectTypeOf(referenceState.queryRequests.value[0]?.query.queryKey).toMatchTypeOf<readonly unknown[] | undefined>()
  })
})
