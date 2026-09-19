import { describe, expect, it } from 'vitest'

import { fr } from '#ui-tools/i18n'
import {
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
import type { SpreadsheetCellValue, SpreadsheetRuleBuilder } from '#ui-tools/spreadsheet'

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
        columns: [
          {
            from: 'First name',
            key: 'firstName',
            kind: 'text',
            required: true,
          },
          {
            from: /^Last name$/iu,
            key: 'lastName',
            kind: 'text',
            required: true,
          },
        ],
        key: 'candidate',
        kind: 'group',
      },
      {
        from: 'Exam name',
        key: 'examNameRaw',
        kind: 'text',
        required: true,
      },
    ])

    const headers = createSpreadsheetHeaderCells(['First Name', 'Last name', 'Exam name'])

    const matches = matchSpreadsheetColumns(columns, headers)
    const unmatched = getSpreadsheetUnmatchedColumns(columns, matches)

    expect(matches).toHaveLength(3)
    expect(matches.map((match) => match.key)).toStrictEqual([
      'firstName',
      'lastName',
      'examNameRaw',
    ])
    expect(unmatched).toHaveLength(0)
  })

  it('parses matched rows into nested output and collects validation issues', async () => {
    const scoreBand = createSheetRule<
      number,
      [min: number, max: number],
      {
        min: number
        max: number
      }
    >({
      message: ({ value, params: [min, max] }) => `${value} must be between ${min} and ${max}`,
      name: 'scoreBand',
      validator: (value, min, max) => ({
        $valid: value >= min && value <= max,
        max,
        min,
      }),
    })

    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          from: 'Exam name',
          key: 'examNameRaw',
          kind: 'text',
          rules: (v: SpreadsheetRuleBuilder) => [
            v.required({
              message: 'Exam name is required',
            }),
          ],
        },
        {
          from: 'General level',
          key: 'scores.general',
          kind: 'number',
          parse: async ({ cell }: { cell: SpreadsheetCellValue }) => Number(cell.text),
          rules: (v: SpreadsheetRuleBuilder) => [
            v.number({
              message: 'Score must be numeric',
            }),
            scoreBand(0, 100),
          ],
        },
        {
          from: 'Batch',
          key: 'batchName',
          kind: 'text',
          rules: (v: SpreadsheetRuleBuilder) => [
            v.oneOf(['spring-2026', '_internal']),
            v.validate({
              message: ({ value }) => `"${value}" cannot start with underscore`,
              name: 'noUnderscore',
              validator: (value: string) => !value.startsWith('_'),
            }),
          ],
        },
        {
          from: 'Email',
          key: 'candidate.email',
          kind: 'text',
          parse: ({ cell }: { cell: SpreadsheetCellValue }) => cell.text.toLowerCase(),
        },
      ]),
      createSpreadsheetHeaderCells(['Exam name', 'General level', 'Batch', 'Email']),
    )

    const rows = await parseSpreadsheetRows<{
      products: readonly string[]
    }>({
      context: {
        products: ['prod_1'],
      },
      matches,
      rows: [
        ['Business English 4 Skills', '84', 'spring-2026', 'JOHN@EXAMPLE.COM'],
        ['', 'oops', '_internal', 'JANE@EXAMPLE.COM'],
      ],
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      data: {
        batchName: 'spring-2026',
        candidate: {
          email: 'john@example.com',
        },
        examNameRaw: 'Business English 4 Skills',
        scores: {
          general: 84,
        },
      },
      isValid: true,
    })
    expect(rows[1]?.isValid).toBeFalsy()
    expect(rows[1]?.issues).toStrictEqual([
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
          from: 'Product',
          key: 'productId',
          kind: 'option',
          options: ({
            context,
          }: {
            context: {
              products: readonly { id: string; name: string }[]
            }
          }) =>
            context.products.map((product) => ({
              label: product.name,
              value: product.id,
            })),
        },
        {
          from: 'Selected product',
          key: 'selectedProductId',
          kind: 'option',
          options: ({
            context,
          }: {
            context: {
              products: readonly { id: string; name: string }[]
            }
          }) =>
            context.products.map((product) => ({
              label: product.name,
              value: product.id,
            })),
        },
      ]),
      createSpreadsheetHeaderCells(['Product', 'Selected product']),
    )

    const rows = await parseSpreadsheetRows({
      context: {
        products: [
          { id: 'prod_1', name: 'Business English 4 Skills' },
          { id: 'prod_2', name: 'Reading Placement Test' },
        ] as const,
      },
      matches,
      rows: [
        ['Business English 4 Skills', 'Reading Placement Test'],
        ['Unknown product', 'Business English 4 Skills'],
      ],
    })

    expect(rows[0]).toMatchObject({
      data: {
        productId: 'prod_1',
        selectedProductId: 'prod_2',
      },
      isValid: true,
    })
    expect(rows[1]).toMatchObject({
      data: {
        selectedProductId: 'prod_1',
      },
      isValid: false,
      issues: [
        expect.objectContaining({
          code: 'option.not_found',
          columnKey: 'productId',
          message: 'The value "Unknown product" is not recognized',
        }),
      ],
    })
  })

  it('applies column modifiers before built-in parsing', async () => {
    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          from: 'Email',
          key: 'candidate.email',
          kind: 'text',
          modifiers: ['trim', 'lowercase'],
        },
        {
          from: 'Score',
          key: 'candidate.score',
          kind: 'number',
          modifiers: ['trim'],
        },
      ]),
      createSpreadsheetHeaderCells(['Email', 'Score']),
    )

    const rows = await parseSpreadsheetRows({
      context: {},
      matches,
      rows: [['  JOHN@EXAMPLE.COM  ', ' 84 ']],
    })

    expect(rows[0]).toMatchObject({
      data: {
        candidate: {
          email: 'john@example.com',
          score: 84,
        },
      },
      isValid: true,
    })
  })

  it('applies multiple item modifiers after splitting tokens', async () => {
    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          from: 'Tags',
          key: 'tags',
          kind: 'text',
          modifiers: ['trim'],
          multiple: {
            itemModifiers: ['trim', 'lowercase'],
            separator: ',',
          },
        },
      ]),
      createSpreadsheetHeaderCells(['Tags']),
    )

    const rows = await parseSpreadsheetRows({
      context: {},
      matches,
      rows: [['  Alpha, BETA ,  Gamma  ']],
    })

    expect(rows[0]).toMatchObject({
      data: {
        tags: ['alpha', 'beta', 'gamma'],
      },
      isValid: true,
    })
  })

  it('parses built-in multiple values for scalar and option columns', async () => {
    const matches = matchSpreadsheetColumns(
      flattenSpreadsheetStaticColumns([
        {
          from: 'Tags',
          key: 'tags',
          kind: 'text',
          multiple: true,
        },
        {
          from: 'Scores',
          key: 'scores',
          kind: 'number',
          multiple: {
            separator: ';',
          },
          rules: (v: SpreadsheetRuleBuilder) => [
            v.validate({
              message: 'All scores must be at least 50',
              name: 'allPassing',
              validator: (value: number[]) => value.every((score) => score >= 50),
            }),
          ],
        },
        {
          from: 'Products',
          key: 'productIds',
          kind: 'option',
          multiple: {
            matchBy: 'label',
            separator: ',',
          },
          options: ({
            context,
          }: {
            context: {
              products: readonly { id: string; name: string }[]
            }
          }) =>
            context.products.map((product) => ({
              label: product.name,
              value: product.id,
            })),
        },
      ]),
      createSpreadsheetHeaderCells(['Tags', 'Scores', 'Products']),
    )

    const rows = await parseSpreadsheetRows({
      context: {
        products: [
          { id: 'prod_1', name: 'Business English 4 Skills' },
          { id: 'prod_2', name: 'Reading Placement Test' },
        ] as const,
      },
      matches,
      rows: [
        ['alpha, beta', '82;91', 'Business English 4 Skills, Reading Placement Test'],
        ['solo', '82;oops', 'Business English 4 Skills, Unknown product'],
      ],
    })

    expect(rows[0]).toMatchObject({
      data: {
        productIds: ['prod_1', 'prod_2'],
        scores: [82, 91],
        tags: ['alpha', 'beta'],
      },
      isValid: true,
    })
    expect(rows[1]).toMatchObject({
      data: {
        productIds: ['prod_1'],
        scores: [82],
        tags: ['solo'],
      },
      isValid: false,
      issues: [
        expect.objectContaining({
          code: 'number.invalid',
          columnKey: 'scores',
          message: 'Enter a valid number instead of "oops"',
        }),
        expect.objectContaining({
          code: 'option.not_found',
          columnKey: 'productIds',
          message: 'The value "Unknown product" is not recognized',
        }),
      ],
    })
  })

  it('defines user-facing French translations for built-in spreadsheet parsing issues', () => {
    expect(fr.messages.spreadsheet.validation.unrecognizedValue).toBe(
      'La valeur "{value}" n est pas reconnue',
    )
    expect(fr.messages.spreadsheet.validation.invalidNumberInput).toBe(
      'Saisissez un nombre valide à la place de "{value}"',
    )
    expect(fr.messages.spreadsheet.validation.invalidBooleanInput).toBe(
      'Répondez par Oui ou Non à la place de "{value}"',
    )
    expect(fr.messages.spreadsheet.validation.missingValue).toBe(
      'Ajoutez une valeur pour "{field}"',
    )
    expect(fr.messages.spreadsheet.validation.parseFailed).toBe(
      'Impossible de lire la valeur pour "{field}"',
    )
  })

  it('creates a compact summary for parsed rows', () => {
    const summary = createSpreadsheetRowSummary([
      {
        data: { examNameRaw: 'A' },
        index: 0,
        isValid: true,
        issues: [],
        source: ['a'],
      },
      {
        data: {},
        index: 1,
        isValid: false,
        issues: [
          {
            code: 'cell.required',
            level: 'error',
            message: 'Missing value',
            rowIndex: 1,
          },
        ],
        source: ['b'],
      },
    ])

    expect(summary).toStrictEqual({
      invalidRows: 1,
      issueCount: 1,
      totalRows: 2,
      validRows: 1,
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
          from: 'Exam name',
          key: 'examNameRaw',
          kind: 'text',
          required: true,
        },
      ]),
      headers,
    )

    const dynamicMatches = matchSpreadsheetDynamicColumns(
      [
        dynamic.optionGroups({
          header: {
            strategy: 'template',
            template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
          },
          itemKey: (item) => item.id,
          itemLabel: (item) => item.name,
          key: 'affiliations',
          options: (item) =>
            item.items.map((option) => ({
              label: option.name,
              value: option.id,
            })),
          output: {
            into: 'affiliations',
          },
          source: [
            {
              id: 'school-level',
              items: [
                { id: 'primary', name: 'Primary' },
                { id: 'secondary', name: 'Secondary' },
              ],
              name: 'School level',
              slug: 'schoolLevel',
            },
            {
              id: 'program',
              items: [{ id: 'business-english', name: 'Business English' }],
              name: 'Program',
              slug: 'program',
            },
          ] satisfies readonly DemoDynamicAffiliationGroup[],
          targetKey: (item) => item.slug,
          values: {
            itemModifiers: ['trim', 'case-insensitive', 'accent-insensitive'],
            mode: 'csv',
            resolve: 'label',
            separator: ',',
          },
        }),
      ],
      headers,
      staticMatches.map((match) => match.columnIndex),
    )

    const rows = await parseSpreadsheetRows({
      context: {},
      dynamicMatches,
      matches: staticMatches,
      rows: [['Business English 4 Skills', 'Primary, Secondary', 'Business English']],
    })

    expect(dynamicMatches.map((match) => match.targetKey)).toStrictEqual(['schoolLevel', 'program'])
    expect(rows[0]).toMatchObject({
      data: {
        affiliations: {
          program: ['business-english'],
          schoolLevel: ['primary', 'secondary'],
        },
        examNameRaw: 'Business English 4 Skills',
      },
      isValid: true,
    })
  })
})
