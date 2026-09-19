import { describe, expect, expectTypeOf, it } from 'vitest'
import { computed } from 'vue'

import {
  applySpreadsheetReferenceResolutions,
  createSheetRule,
  createSpreadsheetReferenceCandidates,
  createSpreadsheetReferenceQueryRequests,
  createSpreadsheetReferenceResolutions,
} from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema, normalizeSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type { SpreadsheetParsedRow, SpreadsheetRecord } from '#ui-tools/spreadsheet/types'

import { useSpreadsheetReferences } from '../../src/runtime/spreadsheet/composables/use-spreadsheet-references'

const productOptions = [
  { label: 'Business English 4 Skills', value: 'prod_1' },
  { label: 'Reading Placement Test', value: 'prod_2' },
] as const

describe('spreadsheet reference utils', () => {
  const references = [
    {
      field: 'productId',
      getOptions: ({ search }: { search: string }) => ({
        queryFn: async () => [],
        queryKey: ['products', search],
      }),
      kind: 'select' as const,
      options: productOptions,
      source: 'examNameRaw',
    },
  ]

  const rows: SpreadsheetParsedRow<SpreadsheetRecord>[] = [
    {
      data: {
        examNameRaw: 'Business English 4 Skills',
      },
      index: 0,
      isValid: true,
      issues: [],
      source: ['Business English 4 Skills'],
    },
    {
      data: {
        examNameRaw: 'Business English 4 Skills',
      },
      index: 1,
      isValid: true,
      issues: [],
      source: ['Business English 4 Skills'],
    },
    {
      data: {
        examNameRaw: 'Unknown External Product',
      },
      index: 2,
      isValid: true,
      issues: [],
      source: ['Unknown External Product'],
    },
  ]

  it('creates sorted candidates from reference options', () => {
    const candidates = createSpreadsheetReferenceCandidates({
      options: references[0].options ?? [],
      reference: references[0],
      sourceValue: 'Business English 4 Skills',
    })

    expect(candidates[0]).toMatchObject({
      label: 'Business English 4 Skills',
      score: 1,
      value: 'prod_1',
    })
  })

  it('keeps full option list even when no recommendation score is found', () => {
    const candidates = createSpreadsheetReferenceCandidates({
      options: references[0].options ?? [],
      reference: references[0],
      sourceValue: 'Unknown External Product',
    })

    expect(candidates).toHaveLength(2)
    expect(candidates.every((candidate) => candidate.score === 0)).toBeTruthy()
  })

  it('creates one resolution per distinct imported source value', () => {
    const resolutions = createSpreadsheetReferenceResolutions({
      context: {},
      references,
      rows,
    })

    expect(resolutions).toHaveLength(2)
    expect(resolutions[0]).toMatchObject({
      referenceField: 'productId',
      selectedValue: 'prod_1',
      sourceValue: 'Business English 4 Skills',
      status: 'matched',
    })
    expect(resolutions[1]).toMatchObject({
      sourceValue: 'Unknown External Product',
      status: 'unresolved',
    })
    expect(resolutions[1]?.candidates).toHaveLength(2)
  })

  it('applies reference selections back onto all matching rows', () => {
    const resolvedRows = applySpreadsheetReferenceResolutions({
      references,
      resolutions: [
        {
          candidates: [],
          outputField: 'product.id',
          referenceField: 'productId',
          rowIndexes: [0, 1],
          selectedLabel: 'Business English 4 Skills',
          selectedValue: 'prod_1',
          sourceField: 'examNameRaw',
          sourceValue: 'Business English 4 Skills',
          status: 'matched',
        },
        {
          candidates: [],
          outputField: 'product.id',
          referenceField: 'productId',
          rowIndexes: [2],
          sourceField: 'examNameRaw',
          sourceValue: 'Unknown External Product',
          status: 'unresolved',
        },
      ],
      rows,
    })

    expect(resolvedRows[0]?.data).toMatchObject({
      examNameRaw: 'Business English 4 Skills',
      product: {
        id: 'prod_1',
      },
    })
    expect(resolvedRows[2]?.issues).toStrictEqual([])
  })

  it('creates query requests for unresolved references with remote targets', () => {
    const requests = createSpreadsheetReferenceQueryRequests({
      context: {
        products: references[0].options,
      },
      references,
      rows,
    })

    expect(requests).toHaveLength(1)
    expect(requests[0]?.query.queryKey).toStrictEqual(['products', 'Unknown External Product'])
  })

  it('resolves array-bound references into array outputs', () => {
    const multiRows: SpreadsheetParsedRow<SpreadsheetRecord>[] = [
      {
        data: {
          examNamesRaw: ['Business English 4 Skills', 'Reading Placement Test'],
        },
        index: 0,
        isValid: true,
        issues: [],
        source: ['Business English 4 Skills', 'Reading Placement Test'],
      },
    ]

    const multiReferences = [
      {
        field: 'productIds',
        kind: 'select' as const,
        options: productOptions,
        source: 'examNamesRaw',
      },
    ]

    const resolutions = createSpreadsheetReferenceResolutions({
      context: {},
      references: multiReferences,
      rows: multiRows,
    })

    expect(resolutions).toHaveLength(2)
    expect(resolutions.map((resolution) => resolution.sourceValue)).toStrictEqual([
      'Business English 4 Skills',
      'Reading Placement Test',
    ])

    const resolvedRows = applySpreadsheetReferenceResolutions({
      references: multiReferences,
      resolutions,
      rows: multiRows,
    })

    expect(resolvedRows[0]?.data).toMatchObject({
      examNamesRaw: ['Business English 4 Skills', 'Reading Placement Test'],
      productIds: ['prod_1', 'prod_2'],
    })
  })

  it('lets unresolved references pass unless reference rules invalidate the row', () => {
    const requiredReference = createSheetRule<unknown, [], { required: true }, { required: true }>({
      flags: { required: true },
      message: 'Product reference is required',
      name: 'requiredReference',
      validator: (value) => ({
        $valid: Boolean(value),
        required: true,
      }),
    })

    const referenceDefinitions = [
      {
        field: 'productId',
        kind: 'select' as const,
        options: productOptions,
        source: 'examNameRaw',
      },
      {
        field: 'requiredProductId',
        kind: 'select' as const,
        options: productOptions,
        rules: [requiredReference()],
        source: 'examNameRaw',
      },
    ]

    const unresolvedRows = applySpreadsheetReferenceResolutions({
      references: referenceDefinitions,
      resolutions: [
        {
          candidates: [],
          outputField: 'productId',
          referenceField: 'productId',
          rowIndexes: [2],
          sourceField: 'examNameRaw',
          sourceValue: 'Unknown External Product',
          status: 'unresolved',
        },
        {
          candidates: [],
          outputField: 'requiredProductId',
          referenceField: 'requiredProductId',
          rowIndexes: [2],
          sourceField: 'examNameRaw',
          sourceValue: 'Unknown External Product',
          status: 'unresolved',
        },
      ],
      rows,
    })

    expect(unresolvedRows[2]?.data).toMatchObject({
      examNameRaw: 'Unknown External Product',
    })
    expect(unresolvedRows[2]?.issues).toStrictEqual([
      expect.objectContaining({
        code: 'requiredReference',
        columnKey: 'requiredProductId',
        message: 'Product reference is required',
      }),
    ])
  })

  it('orchestrates auto and manual selections in the reference composable', () => {
    const schema = defineSpreadsheetSchema({
      columns: {
        static: (column) => [
          column.text('examNameRaw', {
            match: {
              headers: ['Exam name'],
            },
          }),
        ],
      },
      importKey: 'assessment.results',
      references: (reference) => [
        reference.select('productId', {
          getOptions: ({ search }) => ({
            queryKey: ['products', search],
            queryFn: async () => [],
          }),
          options: productOptions,
          source: 'examNameRaw',
        }),
      ],
    })
    const normalizedSchema = normalizeSpreadsheetSchema(schema)

    const referenceState = useSpreadsheetReferences({
      contextData: computed(() => ({
        products: references[0].options,
      })),
      rows: computed(() => rows),
      schema: computed(() => normalizedSchema),
    })

    expect(referenceState.unresolvedResolutions.value).toHaveLength(1)

    referenceState.selectReference({
      referenceField: 'productId',
      selectedLabel: 'Reading Placement Test',
      selectedValue: 'prod_2',
      sourceValue: 'Unknown External Product',
    })

    expect(referenceState.unresolvedResolutions.value).toHaveLength(0)
    expect(referenceState.resolvedRows.value[2]?.data).toMatchObject({
      productId: 'prod_2',
    })
    expectTypeOf(referenceState.queryRequests.value[0]?.query.queryKey).toMatchTypeOf<
      readonly unknown[] | undefined
    >()
  })

  it('resolves column-level resolve definitions in place without keeping the raw source field', () => {
    const schema = defineSpreadsheetSchema({
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
      importKey: 'assessment.resolve',
    })
    const normalizedSchema = normalizeSpreadsheetSchema(schema)

    const parsedRows: SpreadsheetParsedRow<SpreadsheetRecord>[] = [
      {
        data: {
          productId: 'Business English 4 Skills',
        },
        index: 0,
        isValid: true,
        issues: [],
        source: ['Business English 4 Skills'],
      },
      {
        data: {
          productId: 'Unknown External Product',
        },
        index: 1,
        isValid: true,
        issues: [],
        source: ['Unknown External Product'],
      },
    ]

    const resolutions = createSpreadsheetReferenceResolutions({
      context: {},
      references: normalizedSchema.resolutions,
      rows: parsedRows,
    })

    expect(resolutions).toHaveLength(2)
    expect(resolutions[0]).toMatchObject({
      scope: 'column',
      selectedValue: 'prod_1',
      status: 'matched',
      targetField: 'productId',
    })
    expect(resolutions[1]).toMatchObject({
      scope: 'column',
      status: 'unresolved',
      targetField: 'productId',
    })

    const resolvedRows = applySpreadsheetReferenceResolutions({
      references: normalizedSchema.resolutions,
      resolutions,
      rows: parsedRows,
    })

    expect(resolvedRows[0]?.data).toMatchObject({
      productId: 'prod_1',
    })
    expect(resolvedRows[1]?.data).toStrictEqual({})
  })

  it('applies column resolve rules only after resolution and lets manual selections override auto-match', () => {
    const schema = defineSpreadsheetSchema({
      columns: {
        static: (column) => [
          column.text('productId', {
            match: {
              headers: ['Product'],
            },
            resolve: {
              options: productOptions,
            },
            rules: (v) => [
              v.required({
                message: 'Product must be resolved before import',
              }),
            ],
          }),
        ],
      },
      importKey: 'assessment.resolve.rules',
    })
    const normalizedSchema = normalizeSpreadsheetSchema(schema)

    const parsedRows: SpreadsheetParsedRow<SpreadsheetRecord>[] = [
      {
        data: {
          productId: 'Unknown External Product',
        },
        index: 0,
        isValid: true,
        issues: [],
        source: ['Unknown External Product'],
      },
      {
        data: {
          productId: 'Business English 4 Skills',
        },
        index: 1,
        isValid: true,
        issues: [],
        source: ['Business English 4 Skills'],
      },
    ]

    const resolutionState = useSpreadsheetReferences({
      contextData: computed(() => ({})),
      rows: computed(() => parsedRows),
      schema: computed(() => ({
        ...normalizedSchema,
        relations: [],
      })),
    })

    expect(resolutionState.unresolvedResolutions.value).toHaveLength(1)
    expect(resolutionState.resolvedRows.value[0]?.issues).toStrictEqual([
      expect.objectContaining({
        code: 'required',
        columnKey: 'productId',
        message: 'Product must be resolved before import',
      }),
    ])

    resolutionState.selectReference({
      referenceField: 'productId',
      selectedLabel: 'Reading Placement Test',
      selectedValue: 'prod_2',
      sourceValue: 'Unknown External Product',
    })

    expect(resolutionState.unresolvedResolutions.value).toHaveLength(0)
    expect(resolutionState.resolvedRows.value[0]?.data).toMatchObject({
      productId: 'prod_2',
    })
    expect(resolutionState.resolvedRows.value[0]?.issues).toStrictEqual([])
  })
})
