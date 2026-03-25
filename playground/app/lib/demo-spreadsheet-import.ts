import { write, utils, type WorkSheet } from 'xlsx'

import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  ExtractSpreadsheetContextData,
  ExtractSpreadsheetRow,
  SpreadsheetColumnsDefinition,
  SpreadsheetContextItem,
  SpreadsheetPipelineDefinition,
  SpreadsheetQueryDefinition,
  SpreadsheetReferenceDefinition,
} from '#ui-tools/spreadsheet/types'

export interface DemoAffiliationItem {
  id: string
  name: string
}

export interface DemoAffiliationGroup {
  id: string
  name: string
  slug: string
  items: readonly [DemoAffiliationItem, ...DemoAffiliationItem[]]
}

export interface DemoAssessmentProduct {
  id: string
  name: string
}

export interface DemoAssessmentRowSeed {
  testCenterId: string
  secureCode: string
  examNameRaw: string
  firstName: string
  lastName: string
  email: string
  completionDate: string
  status: 'Done'
  country: string
  batchName?: string
  scores: {
    general?: string
    listening?: string
  }
  affiliations: Record<string, readonly string[]>
}

export interface DemoAssessmentCenter {
  id: string
  name: string
  organisationName: string
  country: string
  affiliationGroups: readonly DemoAffiliationGroup[]
  products: readonly DemoAssessmentProduct[]
  sampleRows: readonly [DemoAssessmentRowSeed, ...DemoAssessmentRowSeed[]]
}

export interface DemoGeneratedWorkbook {
  fileName: string
  binary: Buffer
  rowCount: number
  headerRowIndex: number
  sheetName: string
}

interface DemoTemplateColumn {
  header: string
  required: boolean
}

function sleep(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

function parseUtcDate(value: string) {
  return new Date(`${value} UTC`).toISOString()
}

function formatRequiredHeader(column: DemoTemplateColumn) {
  return column.required ? `${column.header} *` : column.header
}

function createAssessmentTemplateColumns(testCenter: DemoAssessmentCenter) {
  return [
    { header: 'Test center ID', required: true },
    { header: 'Secure code', required: true },
    { header: 'Exam name', required: true },
    { header: 'First name', required: true },
    { header: 'Last name', required: true },
    { header: 'Email', required: true },
    { header: 'Completed date', required: true },
    { header: 'Status', required: true },
    { header: 'Batch', required: false },
    { header: 'Tc country', required: true },
    { header: 'General level', required: false },
    { header: 'Listening level', required: false },
    ...testCenter.affiliationGroups.map((group) => ({
      header: `${group.name}: PRÉREQUIS CECR`,
      required: false,
    })),
  ] satisfies DemoTemplateColumn[]
}

function applySheetColumnWidths(sheet: WorkSheet, rows: readonly (readonly unknown[])[]) {
  const widths = rows[0]?.map((_, columnIndex) => {
    const maxLength = rows.reduce((largest, row) => {
      const candidate = String(row[columnIndex] ?? '').length
      return Math.max(largest, candidate)
    }, 0)

    return {
      wch: Math.min(Math.max(maxLength + 3, 12), 40),
    }
  }) ?? []

  sheet['!cols'] = widths
}

function createMinimalRequiredAssessmentRow(testCenter: DemoAssessmentCenter) {
  return {
    testCenterId: testCenter.id,
    secureCode: 'MIN-REQ-001',
    examNameRaw: testCenter.products[0]?.name ?? 'Assessment product',
    firstName: 'Alex',
    lastName: 'Required',
    email: 'alex.required@example.com',
    completionDate: 'March 25, 2024 11:34 AM',
    status: 'Done' as const,
    country: testCenter.country,
    batchName: '',
    scores: {},
    affiliations: Object.fromEntries(
      testCenter.affiliationGroups.map((group) => [group.slug, []]),
    ) as Record<string, readonly string[]>,
  } satisfies DemoAssessmentRowSeed
}

function createAssessmentWorksheetRow(params: {
  row: DemoAssessmentRowSeed
  testCenter: DemoAssessmentCenter
  notes?: string
}) {
  const { row, testCenter, notes = '' } = params

  return [
    row.testCenterId,
    row.secureCode,
    row.examNameRaw,
    row.firstName,
    row.lastName,
    row.email,
    row.completionDate,
    row.status,
    row.batchName ?? '',
    row.country,
    row.scores.general ?? '',
    row.scores.listening ?? '',
    ...testCenter.affiliationGroups.map((group) =>
      (row.affiliations[group.slug] ?? []).join(', '),
    ),
    notes,
  ]
}

export const demoAssessmentCenters = [
  {
    id: 'tc_paris',
    name: 'Paris Academic Hub',
    organisationName: 'ExAssess France',
    country: 'France',
    affiliationGroups: [
      {
        id: 'school-level',
        name: 'School level',
        slug: 'schoolLevel',
        items: [
          { id: 'primary', name: 'Primary' },
          { id: 'secondary', name: 'Secondary' },
          { id: 'higher-education', name: 'Higher education' },
        ],
      },
      {
        id: 'programme',
        name: 'Programme',
        slug: 'programme',
        items: [
          { id: 'general-english', name: 'General English' },
          { id: 'business-english', name: 'Business English' },
          { id: 'teacher-training', name: 'Teacher training' },
        ],
      },
    ],
    products: [
      { id: 'prod_be_4skills', name: 'Positionnement VTest Business English - 4 Skills' },
      { id: 'prod_general_4skills', name: 'Positionnement VTest English - 4 Skills' },
      { id: 'prod_french_oral', name: 'VTest French Oral Booster' },
      { id: 'prod_reading_mock', name: 'Mock assessment VTest Business English - Reading' },
    ],
    sampleRows: [
      {
        testCenterId: 'tc_paris',
        secureCode: 'PAR-001-A',
        examNameRaw: 'VTest Business English | 4 Skills',
        firstName: 'Lina',
        lastName: 'Martin',
        email: 'lina.martin@example.com',
        completionDate: 'March 25, 2024 11:34 AM',
        status: 'Done',
        country: 'France',
        batchName: 'Spring Paris 1',
        scores: {
          general: 'B2',
          listening: 'B2',
        },
        affiliations: {
          schoolLevel: ['Higher education'],
          programme: ['Business English'],
        },
      },
      {
        testCenterId: 'tc_paris',
        secureCode: 'PAR-002-B',
        examNameRaw: 'VTEST ENGLISH - 4 SKILLS',
        firstName: 'Noah',
        lastName: 'Bernard',
        email: 'noah.bernard@example.com',
        completionDate: 'March 26, 2024 09:10 AM',
        status: 'Done',
        country: 'France',
        batchName: 'Spring Paris 1',
        scores: {
          general: 'B1',
          listening: 'B1',
        },
        affiliations: {
          schoolLevel: ['Secondary'],
          programme: ['General English'],
        },
      },
      {
        testCenterId: 'tc_paris',
        secureCode: 'PAR-003-C',
        examNameRaw: 'VTest Communication Booster',
        firstName: 'Sofia',
        lastName: 'Petit',
        email: 'sofia.petit@example.com',
        completionDate: 'March 27, 2024 02:45 PM',
        status: 'Done',
        country: 'France',
        batchName: 'Spring Paris 2',
        scores: {
          general: 'C1',
          listening: 'B2',
        },
        affiliations: {
          schoolLevel: ['Higher education'],
          programme: ['Teacher training'],
        },
      },
    ],
  },
  {
    id: 'tc_newyork',
    name: 'New York Partner Network',
    organisationName: 'ExAssess North America',
    country: 'United States',
    affiliationGroups: [
      {
        id: 'district',
        name: 'District',
        slug: 'district',
        items: [
          { id: 'manhattan', name: 'Manhattan' },
          { id: 'brooklyn', name: 'Brooklyn' },
          { id: 'queens', name: 'Queens' },
        ],
      },
      {
        id: 'delivery-format',
        name: 'Delivery format',
        slug: 'deliveryFormat',
        items: [
          { id: 'onsite', name: 'Onsite' },
          { id: 'remote', name: 'Remote' },
          { id: 'hybrid', name: 'Hybrid' },
        ],
      },
      {
        id: 'market-segment',
        name: 'Market segment',
        slug: 'marketSegment',
        items: [
          { id: 'k12', name: 'K-12' },
          { id: 'corporate', name: 'Corporate' },
          { id: 'higher-ed', name: 'Higher Ed' },
        ],
      },
    ],
    products: [
      { id: 'prod_corp_4skills', name: 'Placement Test Corporate English - 4 Skills' },
      { id: 'prod_k12_4skills', name: 'Placement Test K-12 English - 4 Skills' },
      { id: 'prod_remote_screening', name: 'Remote Screening Bundle' },
    ],
    sampleRows: [
      {
        testCenterId: 'tc_newyork',
        secureCode: 'NY-101-A',
        examNameRaw: 'Corporate English Placement | 4 Skills',
        firstName: 'Mia',
        lastName: 'Brooks',
        email: 'mia.brooks@example.com',
        completionDate: 'April 03, 2024 10:05 AM',
        status: 'Done',
        country: 'United States',
        batchName: 'April NYC',
        scores: {
          general: 'B2',
          listening: 'B2',
        },
        affiliations: {
          district: ['Manhattan'],
          deliveryFormat: ['Hybrid'],
          marketSegment: ['Corporate'],
        },
      },
      {
        testCenterId: 'tc_newyork',
        secureCode: 'NY-102-B',
        examNameRaw: 'Remote language screening',
        firstName: 'Leo',
        lastName: 'Wright',
        email: 'leo.wright@example.com',
        completionDate: 'April 04, 2024 01:20 PM',
        status: 'Done',
        country: 'United States',
        batchName: 'April NYC',
        scores: {
          general: 'B1',
          listening: 'B1',
        },
        affiliations: {
          district: ['Queens'],
          deliveryFormat: ['Remote'],
          marketSegment: ['Higher Ed'],
        },
      },
    ],
  },
] satisfies readonly [DemoAssessmentCenter, ...DemoAssessmentCenter[]]

export function getDemoAssessmentCenter(testCenterId: string) {
  const matchedCenter = demoAssessmentCenters.find((center) => center.id === testCenterId)
  if (matchedCenter) return matchedCenter
  return demoAssessmentCenters[0]
}

export function createDemoAssessmentSchema(testCenter: DemoAssessmentCenter) {
  const context = [
    {
      key: 'affiliationGroups',
      query: () =>
        ({
          queryKey: ['demo-assessment-affiliations', testCenter.id],
          queryFn: async () => {
            await sleep(180)
            return testCenter.affiliationGroups
          },
        }) satisfies SpreadsheetQueryDefinition<readonly DemoAffiliationGroup[]>,
    },
  ] satisfies readonly [
    SpreadsheetContextItem<'affiliationGroups', readonly DemoAffiliationGroup[]>,
  ]

  type ContextData = ExtractSpreadsheetContextData<{
    context: typeof context
  }>

  const columns = {
    static: (column) => [
      column.text('testCenterId', {
        from: 'Test center ID',
        required: true as const,
        parse: ({ cell }) => cell.text.trim(),
        validate: ({ value, addIssue }) => {
          if (value !== testCenter.id)
            addIssue('error', 'test-center.mismatch', 'Row test center does not match the current playground context.')
        },
      }),
      column.text('secureCode', {
        from: 'Secure code',
        required: true as const,
      }),
      column.text('examNameRaw', {
        from: 'Exam name',
        required: true as const,
      }),
      column.text('firstName', {
        from: 'First name',
        required: true as const,
      }),
      column.text('lastName', {
        from: 'Last name',
        required: true as const,
      }),
      column.email('email', {
        from: 'Email',
        required: true as const,
        parse: ({ cell }) => cell.text.trim().toLowerCase(),
      }),
      column.date('completionDate', {
        from: 'Completed date',
        required: true as const,
        parse: ({ cell }) => parseUtcDate(cell.text.trim()),
      }),
      column.enum('status', {
        from: 'Status',
        required: true as const,
        options: ['Done'],
      }),
      column.text('country', {
        from: 'Tc country',
        required: true as const,
      }),
      column.text('batchName', {
        from: 'Batch',
      }),
      column.text('scores.general', {
        from: 'General level',
      }),
      column.text('scores.listening', {
        from: 'Listening level',
      }),
    ],
    dynamic: ({ dynamic, context }) => [
      dynamic.optionGroups({
        key: 'affiliations',
        source: context.affiliationGroups,
        itemKey: (group) => group.id,
        itemLabel: (group) => group.name,
        targetKey: (group) => group.slug,
        header: {
          strategy: 'template',
          template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
          normalize: ['trim', 'case-insensitive', 'accent-insensitive'],
        },
        options: {
          resolve: (group) => group.items,
          optionValue: (item) => item.id,
          optionLabel: (item) => item.name,
        },
        values: {
          mode: 'csv',
          separator: ',',
          resolve: 'label',
          normalize: ['trim', 'case-insensitive', 'accent-insensitive'],
        },
        output: {
          into: 'affiliations',
        },
      }),
    ],
  } satisfies SpreadsheetColumnsDefinition<ContextData>

  type BaseRow = ExtractSpreadsheetRow<{
    columns: typeof columns
  }>

  const references = [
    {
      key: 'product',
      sourceField: 'examNameRaw',
      target: {
        options: testCenter.products,
        optionValue: (product) => product.id,
        optionLabel: (product) => product.name,
        query: ({ search }) => ({
          queryKey: ['demo-assessment-products', testCenter.id, search],
          queryFn: async () => {
            await sleep(120)
            const normalizedSearch = search.trim().toLowerCase()
            if (!normalizedSearch) return testCenter.products

            return testCenter.products.filter((product) =>
              product.name.toLowerCase().includes(normalizedSearch),
            )
          },
        }),
      },
      output: {
        field: 'productId',
      },
    },
  ] satisfies readonly SpreadsheetReferenceDefinition<
    ContextData,
    BaseRow,
    'productId',
    string,
    DemoAssessmentProduct
  >[]

  type InferredRow = ExtractSpreadsheetRow<{
    columns: typeof columns
    references: typeof references
  }>
  type Row = InferredRow & {
    affiliations?: Record<string, string[]>
  }

  const pipeline = {
    submit: ({ row }) => ({
      testCenterId: testCenter.id,
      secureCode: row.secureCode,
      candidate: {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        country: row.country,
      },
      assessment: {
        rawExamName: row.examNameRaw,
        mappedProductId: row.productId ?? null,
        completedAt: row.completionDate,
        status: row.status,
        batchName: row.batchName ?? null,
        scores: row.scores ?? {},
      },
      affiliations: testCenter.affiliationGroups.flatMap((group) => {
        const selectedItemIds = row.affiliations?.[group.slug] ?? []
        if (!selectedItemIds.length) return []

        return [{
          groupId: group.id,
          itemIds: selectedItemIds,
        }]
      }),
    }),
  } satisfies SpreadsheetPipelineDefinition<ContextData, Row>

  return defineSpreadsheetSchema({
    importKey: `demo.assessment-import.${testCenter.id}`,
    source: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 1000,
    },
    sheet: {
      strategy: 'selection',
    },
    header: {
      strategy: 'selection',
    },
    matching: {
      strategy: 'smart',
    },
    context,
    columns,
    references,
    pipeline,
  })
}

export function createDemoAssessmentWorkbook(testCenter: DemoAssessmentCenter) {
  return createDemoAssessmentWorkbookVariant(testCenter, {
    variant: 'sample',
  })
}

export function createDemoAssessmentTemplateWorkbook(testCenter: DemoAssessmentCenter) {
  const workbook = utils.book_new()
  const columns = createAssessmentTemplateColumns(testCenter)
  const fullExampleRow = testCenter.sampleRows[0] ?? createMinimalRequiredAssessmentRow(testCenter)
  const minimalRequiredRow = createMinimalRequiredAssessmentRow(testCenter)
  const rows = [
    columns.map(formatRequiredHeader),
    createAssessmentWorksheetRow({
      row: fullExampleRow,
      testCenter,
    }).slice(0, columns.length),
    createAssessmentWorksheetRow({
      row: minimalRequiredRow,
      testCenter,
    }).slice(0, columns.length),
  ]
  const sheet = utils.aoa_to_sheet(rows)
  applySheetColumnWidths(sheet, rows)

  utils.book_append_sheet(workbook, sheet, 'Results')

  return {
    fileName: `${testCenter.id}-assessment-template.xlsx`,
    binary: write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }),
    rowCount: 2,
    headerRowIndex: 0,
    sheetName: 'Results',
  }
}

export function createSignificantDemoAssessmentWorkbook(testCenter: DemoAssessmentCenter) {
  return createDemoAssessmentWorkbookVariant(testCenter, {
    variant: 'significant',
  })
}

export function getSignificantDemoAssessmentSummary(testCenter: DemoAssessmentCenter) {
  return {
    rowCount: createExpandedAssessmentRows(testCenter).length,
    sheetName: 'Assessment import raw',
    headerRowIndex: 2,
  }
}

function createDemoAssessmentWorkbookVariant(
  testCenter: DemoAssessmentCenter,
  options: {
    variant: 'sample' | 'significant'
  },
): DemoGeneratedWorkbook {
  const workbook = utils.book_new()
  const templateColumns = createAssessmentTemplateColumns(testCenter)
  const headers = [
    ...templateColumns.map(formatRequiredHeader),
    'Internal notes',
  ]
  const sheetName = options.variant === 'significant'
    ? 'Assessment import raw'
    : 'Assessments'
  const headerRowIndex = options.variant === 'significant' ? 2 : 0
  const seedRows = options.variant === 'significant'
    ? createExpandedAssessmentRows(testCenter)
    : testCenter.sampleRows
  const rows = seedRows.map((row, index) =>
    createAssessmentWorksheetRow({
      row,
      testCenter,
      notes: options.variant === 'significant'
        ? `Generated row ${index + 1}`
        : 'Happy-path sample',
    }),
  )
  const assessmentSheetRows = options.variant === 'significant'
    ? [
        ['Assessment import export'],
        [`Generated for ${testCenter.name}`, ...Array.from({ length: headers.length - 1 }, () => '')],
        headers,
        ...rows,
      ]
    : [
        headers,
        ...rows,
      ]

  const overviewSheet = utils.aoa_to_sheet([
    ['Demo workbook'],
    ['Selected test center', testCenter.name],
    ['Organisation', testCenter.organisationName],
    ['Rows included', String(seedRows.length)],
    ['Dynamic affiliation groups', String(testCenter.affiliationGroups.length)],
    ['Reference mapping target options', String(testCenter.products.length)],
    ['Suggested sheet', sheetName],
    ['Suggested header row (0-based)', String(headerRowIndex)],
    ['Purpose', options.variant === 'significant' ? 'Stress the spreadsheet runtime' : 'Quick happy-path smoke test'],
  ])
  const mappingGuideSheet = utils.aoa_to_sheet([
    ['Imported exam name', 'Recommended product target', 'Why it is useful'],
    ...testCenter.products.map((product, index) => [
      getExamAliasForProduct(product.name, index),
      product.name,
      index % 2 === 0 ? 'Auto-match should usually succeed.' : 'Useful for manual mapping.',
    ]),
    ['Unknown exam bundle', '', 'Keeps one unresolved mapping visible.'],
  ])
  const assessmentSheet = utils.aoa_to_sheet(assessmentSheetRows)
  applySheetColumnWidths(assessmentSheet, assessmentSheetRows)
  applySheetColumnWidths(overviewSheet, [
    ['Demo workbook'],
    ['Selected test center', testCenter.name],
    ['Organisation', testCenter.organisationName],
    ['Rows included', String(seedRows.length)],
    ['Dynamic affiliation groups', String(testCenter.affiliationGroups.length)],
    ['Reference mapping target options', String(testCenter.products.length)],
    ['Suggested sheet', sheetName],
    ['Suggested header row (0-based)', String(headerRowIndex)],
    ['Purpose', options.variant === 'significant' ? 'Stress the spreadsheet runtime' : 'Quick happy-path smoke test'],
  ])
  applySheetColumnWidths(mappingGuideSheet, [
    ['Imported exam name', 'Recommended product target', 'Why it is useful'],
    ...testCenter.products.map((product, index) => [
      getExamAliasForProduct(product.name, index),
      product.name,
      index % 2 === 0 ? 'Auto-match should usually succeed.' : 'Useful for manual mapping.',
    ]),
    ['Unknown exam bundle', '', 'Keeps one unresolved mapping visible.'],
  ])

  utils.book_append_sheet(workbook, assessmentSheet, sheetName)
  utils.book_append_sheet(workbook, overviewSheet, 'Overview')
  utils.book_append_sheet(workbook, mappingGuideSheet, 'Reference guide')

  return {
    fileName: `${testCenter.id}-${options.variant}-assessment-import.xlsx`,
    binary: write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }),
    rowCount: seedRows.length,
    headerRowIndex,
    sheetName,
  }
}

function createExpandedAssessmentRows(testCenter: DemoAssessmentCenter) {
  const repeatedRows = Array.from({ length: 18 }, (_, index) => {
    const baseRow = getDemoAssessmentSampleRow(testCenter, index)
    const variantIndex = index + 1

    return {
      ...baseRow,
      secureCode: `${baseRow.secureCode}-X${String(variantIndex).padStart(2, '0')}`,
      firstName: `${baseRow.firstName} ${variantIndex}`,
      lastName: variantIndex % 3 === 0 ? `${baseRow.lastName}-Alt` : baseRow.lastName,
      email: `${baseRow.firstName.toLowerCase()}.${variantIndex}@example.com`,
      batchName: variantIndex % 2 === 0 ? `${baseRow.batchName ?? 'Batch'} · Wave ${variantIndex}` : baseRow.batchName,
      examNameRaw: createVariantExamName(baseRow.examNameRaw, variantIndex),
      scores: {
        general: variantIndex % 6 === 0 ? '' : baseRow.scores.general,
        listening: variantIndex % 4 === 0 ? 'B2' : baseRow.scores.listening,
      },
      affiliations: createVariantAffiliations(testCenter, baseRow.affiliations, variantIndex),
    }
  })
  const [row0, row1, row2, row3] = repeatedRows

  if (!row0 || !row1 || !row2 || !row3)
    return repeatedRows

  return [
    ...repeatedRows,
    {
      ...row0,
      secureCode: 'EDGE-UNKNOWN-01',
      examNameRaw: 'Unknown exam bundle',
      firstName: 'Ava',
      lastName: 'Unmatched',
      email: 'ava.unmatched@example.com',
    },
    {
      ...row1,
      secureCode: 'EDGE-MISSING-02',
      firstName: '',
      email: '',
      examNameRaw: row1.examNameRaw,
    },
    {
      ...row2,
      secureCode: 'EDGE-GROUP-03',
      testCenterId: `${testCenter.id}-other`,
      affiliations: createBrokenAffiliations(testCenter),
    },
    {
      ...row3,
      secureCode: 'EDGE-CLOSE-04',
      examNameRaw: 'Positionnement VTest Business English 4 Skills',
    },
  ]
}

function createVariantExamName(baseName: string, index: number) {
  if (index % 7 === 0) return baseName.toUpperCase()
  if (index % 5 === 0) return baseName.replace(/\|/g, '-')
  if (index % 3 === 0) return `${baseName} candidate export`
  return baseName
}

function createVariantAffiliations(
  testCenter: DemoAssessmentCenter,
  affiliations: Record<string, readonly string[]>,
  index: number,
) {
  const nextAffiliations: Record<string, readonly string[]> = {}

  for (const group of testCenter.affiliationGroups) {
    const currentValues = affiliations[group.slug] ?? []
    const firstValue = currentValues[0]

    if (!firstValue) {
      nextAffiliations[group.slug] = []
      continue
    }

    if (index % 5 === 0)
      nextAffiliations[group.slug] = [firstValue, group.items[0].name]
    else if (index % 4 === 0)
      nextAffiliations[group.slug] = [firstValue]
    else
      nextAffiliations[group.slug] = currentValues
  }

  return nextAffiliations
}

function createBrokenAffiliations(testCenter: DemoAssessmentCenter) {
  const affiliations: Record<string, readonly string[]> = {}

  testCenter.affiliationGroups.forEach((group, index) => {
    affiliations[group.slug] = [index === 0 ? 'Unknown option' : group.items[0].name]
  })

  return affiliations
}

function getExamAliasForProduct(productName: string, index: number) {
  if (index % 3 === 0) return productName.replace('Positionnement ', '').replace('Placement Test ', '')
  if (index % 2 === 0) return productName.replace(/ - /g, ' | ')
  return productName.toUpperCase()
}

function getDemoAssessmentSampleRow(testCenter: DemoAssessmentCenter, index: number) {
  const matchedRow = testCenter.sampleRows[index % testCenter.sampleRows.length]
  if (matchedRow) return matchedRow
  return testCenter.sampleRows[0]
}
