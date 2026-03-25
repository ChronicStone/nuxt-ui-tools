import { computed } from 'vue'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  applySpreadsheetReferenceResolutions,
  createSpreadsheetReferenceCandidates,
  createSpreadsheetReferenceQueryRequests,
  createSpreadsheetReferenceResolutions,
} from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  SpreadsheetParsedRow,
  SpreadsheetReferenceDefinition,
} from '#ui-tools/spreadsheet/types'
import { useSpreadsheetReferences } from '../../src/runtime/spreadsheet/composables/use-spreadsheet-references'

describe('spreadsheet reference utils', () => {
  const references = [
    {
      key: 'product',
      sourceField: 'examNameRaw',
      target: {
        options: [
          { id: 'prod_1', name: 'Business English 4 Skills' },
          { id: 'prod_2', name: 'Reading Placement Test' },
        ],
        query: ({ search }: { search: string }) => ({
          queryKey: ['products', search],
          queryFn: async () => [],
        }),
        optionValue: (option: { id: string; name: string }) => option.id,
        optionLabel: (option: { id: string; name: string }) => option.name,
      },
      output: {
        field: 'productId',
      },
    },
  ] satisfies readonly SpreadsheetReferenceDefinition<
    Record<string, unknown>,
    Record<string, unknown>,
    'productId',
    string,
    { id: string; name: string }
  >[]

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
      options: references[0].target.options,
    })

    expect(candidates[0]).toMatchObject({
      value: 'prod_1',
      label: 'Business English 4 Skills',
      score: 1,
    })
  })

  it('creates one resolution per distinct imported source value', () => {
    const resolutions = createSpreadsheetReferenceResolutions({
      references,
      rows,
    })

    expect(resolutions).toHaveLength(2)
    expect(resolutions[0]).toMatchObject({
      referenceKey: 'product',
      sourceValue: 'Business English 4 Skills',
      status: 'matched',
      selectedValue: 'prod_1',
    })
    expect(resolutions[1]).toMatchObject({
      sourceValue: 'Unknown External Product',
      status: 'unresolved',
    })
  })

  it('applies reference selections back onto all matching rows', () => {
    const resolvedRows = applySpreadsheetReferenceResolutions({
      rows,
      resolutions: [
        {
          referenceKey: 'product',
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
          referenceKey: 'product',
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
        products: references[0].target.options,
      },
    })

    expect(requests).toHaveLength(1)
    expect(requests[0]?.query.queryKey).toEqual(['products', 'Unknown External Product'])
  })

  it('orchestrates auto and manual selections in the reference composable', () => {
    const schema = defineSpreadsheetSchema({
      importKey: 'assessment.results',
      references,
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
      })),
      contextData: computed(() => ({
        products: references[0].target.options,
      })),
      rows: computed(() => rows),
    })

    expect(referenceState.unresolvedResolutions.value).toHaveLength(1)

    referenceState.selectReference({
      referenceKey: 'product',
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
