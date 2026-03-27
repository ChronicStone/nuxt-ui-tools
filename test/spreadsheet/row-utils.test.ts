import { describe, expect, it } from 'vitest'

import {
  type SpreadsheetCellValue,
  type SpreadsheetRuleBuilder,
  createSheetRule,
  createSpreadsheetDynamicBuilder,
  createSpreadsheetHeaderCells,
  createSpreadsheetRowSummary,
  flattenSpreadsheetStaticColumns,
  getSpreadsheetUnmatchedColumns,
  matchSpreadsheetColumns,
  matchSpreadsheetDynamicColumns,
  parseSpreadsheetRows,
} from '#ui-tools/spreadsheet'

interface DemoDynamicAffiliationItem {
  id: string
  name: string
}

interface DemoDynamicAffiliationGroup {
  id: string
  slug: string
  name: string
  items: readonly DemoDynamicAffiliationItem[]
}

describe('spreadsheet row utils', () => {
  it('flattens grouped static columns and matches them against headers', () => {
    const columns = flattenSpreadsheetStaticColumns([
      {
        kind: 'group',
        key: 'candidate',
        columns: [
          {
            kind: 'text',
            key: 'firstName',
            from: 'First name',
            required: true,
          },
          {
            kind: 'text',
            key: 'lastName',
            from: /^Last name$/i,
            required: true,
          },
        ],
      },
      {
        kind: 'text',
        key: 'examNameRaw',
        from: 'Exam name',
        required: true,
      },
    ])

    const headers = createSpreadsheetHeaderCells([
      'First Name',
      'Last name',
      'Exam name',
    ])

    const matches = matchSpreadsheetColumns(columns, headers)
    const unmatched = getSpreadsheetUnmatchedColumns(columns, matches)

    expect(matches).toHaveLength(3)
    expect(matches.map((match) => match.key)).toEqual([
      'firstName',
      'lastName',
      'examNameRaw',
    ])
    expect(unmatched).toHaveLength(0)
  })

  it('parses matched rows into nested output and collects validation issues', async () => {
    const scoreBand = createSheetRule<number, [min: number, max: number], {
      min: number
      max: number
    }>({
      name: 'scoreBand',
      validator: (value, min, max) => ({
        $valid: value >= min && value <= max,
        min,
        max,
      }),
      message: ({ value, params: [min, max] }) => `${value} must be between ${min} and ${max}`,
    })

    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          kind: 'text',
          key: 'examNameRaw',
          from: 'Exam name',
          rules: (v: SpreadsheetRuleBuilder) => [
            v.required({
              message: 'Exam name is required',
            }),
          ],
        },
        {
          kind: 'number',
          key: 'scores.general',
          from: 'General level',
          parse: async ({ cell }: { cell: SpreadsheetCellValue }) => Number(cell.text),
          rules: (v: SpreadsheetRuleBuilder) => [
            v.number({
              message: 'Score must be numeric',
            }),
            scoreBand(0, 100),
          ],
        },
        {
          kind: 'text',
          key: 'batchName',
          from: 'Batch',
          rules: (v: SpreadsheetRuleBuilder) => [
            v.oneOf(['spring-2026', '_internal']),
            v.validate({
              name: 'noUnderscore',
              validator: (value: string) => !value.startsWith('_'),
              message: ({ value }) => `"${value}" cannot start with underscore`,
            }),
          ],
        },
        {
          kind: 'text',
          key: 'candidate.email',
          from: 'Email',
          parse: ({ cell }: { cell: SpreadsheetCellValue }) => cell.text.toLowerCase(),
        },
      ]),
      createSpreadsheetHeaderCells(['Exam name', 'General level', 'Batch', 'Email']),
    )

    const rows = await parseSpreadsheetRows<{
      products: readonly string[]
    }>({
      rows: [
        ['Business English 4 Skills', '84', 'spring-2026', 'JOHN@EXAMPLE.COM'],
        ['', 'oops', '_internal', 'JANE@EXAMPLE.COM'],
      ],
      matches,
      context: {
        products: ['prod_1'],
      },
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      isValid: true,
      data: {
        examNameRaw: 'Business English 4 Skills',
        scores: {
          general: 84,
        },
        candidate: {
          email: 'john@example.com',
        },
        batchName: 'spring-2026',
      },
    })
    expect(rows[1]?.isValid).toBe(false)
    expect(rows[1]?.issues).toEqual([
      expect.objectContaining({
        code: 'required',
        columnKey: 'examNameRaw',
        message: 'Exam name is required',
      }),
      expect.objectContaining({
        code: 'number',
        columnKey: 'scores.general',
        message: 'Score must be numeric',
      }),
      expect.objectContaining({
        code: 'scoreBand',
        columnKey: 'scores.general',
        message: 'NaN must be between 0 and 100',
      }),
      expect.objectContaining({
        code: 'noUnderscore',
        columnKey: 'batchName',
        message: '"_internal" cannot start with underscore',
      }),
    ])
  })

  it('resolves static option columns from context-backed sources', async () => {
    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          kind: 'option',
          key: 'productId',
          from: 'Product',
          options: ({ context }: {
            context: {
              products: readonly { id: string, name: string }[]
            }
          }) => context.products.map(product => ({
            label: product.name,
            value: product.id,
          })),
        },
        {
          kind: 'option',
          key: 'selectedProductId',
          from: 'Selected product',
          options: ({ context }: {
            context: {
              products: readonly { id: string, name: string }[]
            }
          }) => context.products.map(product => ({
            label: product.name,
            value: product.id,
          })),
        },
      ]),
      createSpreadsheetHeaderCells(['Product', 'Selected product']),
    )

    const rows = await parseSpreadsheetRows({
      rows: [
        ['Business English 4 Skills', 'Reading Placement Test'],
        ['Unknown product', 'Business English 4 Skills'],
      ],
      matches,
      context: {
        products: [
          { id: 'prod_1', name: 'Business English 4 Skills' },
          { id: 'prod_2', name: 'Reading Placement Test' },
        ] as const,
      },
    })

    expect(rows[0]).toMatchObject({
      isValid: true,
      data: {
        productId: 'prod_1',
        selectedProductId: 'prod_2',
      },
    })
    expect(rows[1]).toMatchObject({
      isValid: false,
      data: {
        selectedProductId: 'prod_1',
      },
      issues: [
        expect.objectContaining({
          code: 'option.not_found',
          columnKey: 'productId',
          message: 'Unknown option "Unknown product"',
        }),
      ],
    })
  })

  it('applies column modifiers before built-in parsing', async () => {
    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          kind: 'text',
          key: 'candidate.email',
          from: 'Email',
          modifiers: ['trim', 'lowercase'],
        },
        {
          kind: 'number',
          key: 'candidate.score',
          from: 'Score',
          modifiers: ['trim'],
        },
      ]),
      createSpreadsheetHeaderCells(['Email', 'Score']),
    )

    const rows = await parseSpreadsheetRows({
      rows: [
        ['  JOHN@EXAMPLE.COM  ', ' 84 '],
      ],
      matches,
      context: {},
    })

    expect(rows[0]).toMatchObject({
      isValid: true,
      data: {
        candidate: {
          email: 'john@example.com',
          score: 84,
        },
      },
    })
  })

  it('applies multiple item modifiers after splitting tokens', async () => {
    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          kind: 'text',
          key: 'tags',
          from: 'Tags',
          modifiers: ['trim'],
          multiple: {
            separator: ',',
            itemModifiers: ['trim', 'lowercase'],
          },
        },
      ]),
      createSpreadsheetHeaderCells(['Tags']),
    )

    const rows = await parseSpreadsheetRows({
      rows: [
        ['  Alpha, BETA ,  Gamma  '],
      ],
      matches,
      context: {},
    })

    expect(rows[0]).toMatchObject({
      isValid: true,
      data: {
        tags: ['alpha', 'beta', 'gamma'],
      },
    })
  })

  it('parses built-in multiple values for scalar and option columns', async () => {
    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          kind: 'text',
          key: 'tags',
          from: 'Tags',
          multiple: true,
        },
        {
          kind: 'number',
          key: 'scores',
          from: 'Scores',
          multiple: {
            separator: ';',
          },
          rules: (v: SpreadsheetRuleBuilder) => [
            v.validate({
              name: 'allPassing',
              validator: (value: number[]) => value.every(score => score >= 50),
              message: 'All scores must be at least 50',
            }),
          ],
        },
        {
          kind: 'option',
          key: 'productIds',
          from: 'Products',
          multiple: {
            separator: ',',
            matchBy: 'label',
          },
          options: ({ context }: {
            context: {
              products: readonly { id: string, name: string }[]
            }
          }) => context.products.map(product => ({
            label: product.name,
            value: product.id,
          })),
        },
      ]),
      createSpreadsheetHeaderCells(['Tags', 'Scores', 'Products']),
    )

    const rows = await parseSpreadsheetRows({
      rows: [
        ['alpha, beta', '82;91', 'Business English 4 Skills, Reading Placement Test'],
        ['solo', '82;oops', 'Business English 4 Skills, Unknown product'],
      ],
      matches,
      context: {
        products: [
          { id: 'prod_1', name: 'Business English 4 Skills' },
          { id: 'prod_2', name: 'Reading Placement Test' },
        ] as const,
      },
    })

    expect(rows[0]).toMatchObject({
      isValid: true,
      data: {
        tags: ['alpha', 'beta'],
        scores: [82, 91],
        productIds: ['prod_1', 'prod_2'],
      },
    })
    expect(rows[1]).toMatchObject({
      isValid: false,
      data: {
        tags: ['solo'],
        scores: [82],
        productIds: ['prod_1'],
      },
      issues: [
        expect.objectContaining({
          code: 'number.invalid',
          columnKey: 'scores',
          message: 'Invalid number "oops"',
        }),
        expect.objectContaining({
          code: 'option.not_found',
          columnKey: 'productIds',
          message: 'Unknown option "Unknown product"',
        }),
      ],
    })
  })

  it('creates a compact summary for parsed rows', () => {
    const summary = createSpreadsheetRowSummary([
      {
        index: 0,
        source: ['a'],
        data: { examNameRaw: 'A' },
        issues: [],
        isValid: true,
      },
      {
        index: 1,
        source: ['b'],
        data: {},
        issues: [
          {
            level: 'error',
            code: 'cell.required',
            message: 'Missing value',
            rowIndex: 1,
          },
        ],
        isValid: false,
      },
    ])

    expect(summary).toEqual({
      totalRows: 2,
      validRows: 1,
      invalidRows: 1,
      issueCount: 1,
    })
  })

  it('matches and parses dynamic option-group columns into normalized grouped output', async () => {
    const dynamic = createSpreadsheetDynamicBuilder({})
    const headers = createSpreadsheetHeaderCells([
      'Exam name',
      'School level: PRÉREQUIS CECR',
      'Program: PREREQUIS CECR',
    ])

    const staticMatches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          kind: 'text',
          key: 'examNameRaw',
          from: 'Exam name',
          required: true,
        },
      ]),
      headers,
    )

    const dynamicMatches = matchSpreadsheetDynamicColumns(
      [
        dynamic.optionGroups({
          key: 'affiliations',
          source: [
            {
              id: 'school-level',
              slug: 'schoolLevel',
              name: 'School level',
              items: [
                { id: 'primary', name: 'Primary' },
                { id: 'secondary', name: 'Secondary' },
              ],
            },
            {
              id: 'program',
              slug: 'program',
              name: 'Program',
              items: [
                { id: 'business-english', name: 'Business English' },
              ],
            },
          ] satisfies readonly DemoDynamicAffiliationGroup[],
          itemKey: (item) => item.id,
          itemLabel: (item) => item.name,
          targetKey: (item) => item.slug,
          header: {
            strategy: 'template',
            template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
          },
          options: item => item.items.map(option => ({
            label: option.name,
            value: option.id,
          })),
          values: {
            mode: 'csv',
            separator: ',',
            resolve: 'label',
            itemModifiers: ['trim', 'case-insensitive', 'accent-insensitive'],
          },
          output: {
            into: 'affiliations',
          },
        }),
      ],
      headers,
      staticMatches.map((match) => match.columnIndex),
    )

    const rows = await parseSpreadsheetRows({
      rows: [
        ['Business English 4 Skills', 'Primary, Secondary', 'Business English'],
      ],
      matches: staticMatches,
      dynamicMatches,
      context: {},
    })

    expect(dynamicMatches.map((match) => match.targetKey)).toEqual([
      'schoolLevel',
      'program',
    ])
    expect(rows[0]).toMatchObject({
      isValid: true,
      data: {
        examNameRaw: 'Business English 4 Skills',
        affiliations: {
          schoolLevel: ['primary', 'secondary'],
          program: ['business-english'],
        },
      },
    })
  })
})
