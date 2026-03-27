import { computed } from 'vue'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  applySpreadsheetReferenceResolutions,
  createSheetRule,
  createSpreadsheetReferenceCandidates,
  createSpreadsheetReferenceQueryRequests,
  createSpreadsheetReferenceResolutions,
} from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema, normalizeSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type { SpreadsheetParsedRow } from '#ui-tools/spreadsheet/types'
import { useSpreadsheetReferences } from '../../src/runtime/spreadsheet/composables/use-spreadsheet-references'

const productOptions = [
  { label: 'Business English 4 Skills', value: 'prod_1' },
  { label: 'Reading Placement Test', value: 'prod_2' },
] as const

describe('spreadsheet reference utils', () => {
  const references = [
    {
      kind: 'select' as const,
      field: 'productId',
      source: 'examNameRaw',
      options: productOptions,
      getOptions: ({ search }: { search: string }) => ({
        queryKey: ['products', search],
        queryFn: async () => [],
      }),
    },
  ]

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
      references,
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
    expect(resolvedRows[2]?.issues).toEqual([])
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
        kind: 'select' as const,
        field: 'productIds',
        source: 'examNamesRaw',
        options: productOptions,
      },
    ]

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
      references: multiReferences,
      resolutions,
    })

    expect(resolvedRows[0]?.data).toMatchObject({
      examNamesRaw: ['Business English 4 Skills', 'Reading Placement Test'],
      productIds: ['prod_1', 'prod_2'],
    })
  })

  it('lets unresolved references pass unless reference rules invalidate the row', () => {
    const requiredReference = createSheetRule<unknown, [], { required: true }, { required: true }>({
      name: 'requiredReference',
      flags: { required: true },
      validator: value => ({
        $valid: Boolean(value),
        required: true,
      }),
      message: 'Product reference is required',
    })

    const referenceDefinitions = [
      {
        kind: 'select' as const,
        field: 'productId',
        source: 'examNameRaw',
        options: productOptions,
      },
      {
        kind: 'select' as const,
        field: 'requiredProductId',
        source: 'examNameRaw',
        options: productOptions,
        rules: [requiredReference()],
      },
    ]

    const unresolvedRows = applySpreadsheetReferenceResolutions({
      rows,
      references: referenceDefinitions,
      resolutions: [
        {
          referenceField: 'productId',
          sourceField: 'examNameRaw',
          outputField: 'productId',
          sourceValue: 'Unknown External Product',
          rowIndexes: [2],
          status: 'unresolved',
          candidates: [],
        },
        {
          referenceField: 'requiredProductId',
          sourceField: 'examNameRaw',
          outputField: 'requiredProductId',
          sourceValue: 'Unknown External Product',
          rowIndexes: [2],
          status: 'unresolved',
          candidates: [],
        },
      ],
    })

    expect(unresolvedRows[2]?.data).toMatchObject({
      examNameRaw: 'Unknown External Product',
    })
    expect(unresolvedRows[2]?.issues).toEqual([
      expect.objectContaining({
        code: 'requiredReference',
        columnKey: 'requiredProductId',
        message: 'Product reference is required',
      }),
    ])
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
    const normalizedSchema = normalizeSpreadsheetSchema(schema)

    const referenceState = useSpreadsheetReferences({
      schema: computed(() => normalizedSchema),
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

  it('resolves column-level resolve definitions in place without keeping the raw source field', () => {
    const schema = defineSpreadsheetSchema({
      importKey: 'assessment.resolve',
      columns: {
        static: (column) => [
          column.text('productId', {
            match: {
              headers: ['Product'],
            },
            resolve: {
              options: productOptions,
            },
          }),
        ],
      },
    })
    const normalizedSchema = normalizeSpreadsheetSchema(schema)

    const parsedRows: SpreadsheetParsedRow<Record<string, unknown>>[] = [
      {
        index: 0,
        source: ['Business English 4 Skills'],
        data: {
          productId: 'Business English 4 Skills',
        },
        issues: [],
        isValid: true,
      },
      {
        index: 1,
        source: ['Unknown External Product'],
        data: {
          productId: 'Unknown External Product',
        },
        issues: [],
        isValid: true,
      },
    ]

    const resolutions = createSpreadsheetReferenceResolutions({
      references: normalizedSchema.resolutions,
      rows: parsedRows,
      context: {},
    })

    expect(resolutions).toHaveLength(2)
    expect(resolutions[0]).toMatchObject({
      scope: 'column',
      targetField: 'productId',
      status: 'matched',
      selectedValue: 'prod_1',
    })
    expect(resolutions[1]).toMatchObject({
      scope: 'column',
      targetField: 'productId',
      status: 'unresolved',
    })

    const resolvedRows = applySpreadsheetReferenceResolutions({
      rows: parsedRows,
      references: normalizedSchema.resolutions,
      resolutions,
    })

    expect(resolvedRows[0]?.data).toMatchObject({
      productId: 'prod_1',
    })
    expect(resolvedRows[1]?.data).toEqual({})
  })

  it('applies column resolve rules only after resolution and lets manual selections override auto-match', () => {
    const schema = defineSpreadsheetSchema({
      importKey: 'assessment.resolve.rules',
      columns: {
        static: (column) => [
          column.text('productId', {
            match: {
              headers: ['Product'],
            },
            resolve: {
              options: productOptions,
            },
            rules: v => [
              v.required({
                message: 'Product must be resolved before import',
              }),
            ],
          }),
        ],
      },
    })
    const normalizedSchema = normalizeSpreadsheetSchema(schema)

    const parsedRows: SpreadsheetParsedRow<Record<string, unknown>>[] = [
      {
        index: 0,
        source: ['Unknown External Product'],
        data: {
          productId: 'Unknown External Product',
        },
        issues: [],
        isValid: true,
      },
      {
        index: 1,
        source: ['Business English 4 Skills'],
        data: {
          productId: 'Business English 4 Skills',
        },
        issues: [],
        isValid: true,
      },
    ]

    const resolutionState = useSpreadsheetReferences({
      schema: computed(() => ({
        ...normalizedSchema,
        relations: [],
      })),
      contextData: computed(() => ({})),
      rows: computed(() => parsedRows),
    })

    expect(resolutionState.unresolvedResolutions.value).toHaveLength(1)
    expect(resolutionState.resolvedRows.value[0]?.issues).toEqual([
      expect.objectContaining({
        code: 'required',
        columnKey: 'productId',
        message: 'Product must be resolved before import',
      }),
    ])

    resolutionState.selectReference({
      referenceField: 'productId',
      sourceValue: 'Unknown External Product',
      selectedValue: 'prod_2',
      selectedLabel: 'Reading Placement Test',
    })

    expect(resolutionState.unresolvedResolutions.value).toHaveLength(0)
    expect(resolutionState.resolvedRows.value[0]?.data).toMatchObject({
      productId: 'prod_2',
    })
    expect(resolutionState.resolvedRows.value[0]?.issues).toEqual([])
  })
})
