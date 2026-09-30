/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import { utils, write } from 'xlsx'

import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

/** ExAssess assessment import (V1 replica): VTest results of one test center, with fictional data. */

export const CEFR_LEVELS = [
  'A1',
  'A2.1',
  'A2.2',
  'B1.1',
  'B1.2',
  'B2.1',
  'B2.2',
  'C1.1',
  'C1.2',
  'C2',
] as const
export const ADMINISTRATION_MODES = [
  'Online proctoring',
  'Standard proctoring',
  'Onsite proctoring',
] as const
export const PROCTORING_STATUSES = [
  'Processing',
  'Under review',
  'Approved',
  'Security compromised',
] as const

export interface TestCenter {
  id: string
  name: string
  city: string
  vtestId: string
  affiliationGroups: readonly {
    slug: string
    name: string
    items: readonly { id: string; name: string }[]
  }[]
}

export interface Product {
  id: string
  name: string
  /** VTest exam names already tied to the product. */
  examNames: readonly string[]
}

/** An assessment already in ExAssess, in the shape of an imported row. */
export interface StoredAssessment {
  id: number
  secureCode: string
  levels: { general: string | null }
}

export const TEST_CENTERS: readonly TestCenter[] = [
  {
    affiliationGroups: [
      {
        items: [
          { id: 'college', name: 'Middle school' },
          { id: 'lycee', name: 'High school' },
          { id: 'superieur', name: 'Higher education' },
        ],
        name: 'School level',
        slug: 'schoolLevel',
      },
      {
        items: [
          { id: 'general-english', name: 'General English' },
          { id: 'business-english', name: 'Business English' },
        ],
        name: 'Programme',
        slug: 'programme',
      },
    ],
    city: 'Lyon',
    id: 'tc_lyon',
    name: 'Lyon Part-Dieu',
    vtestId: '0000021384',
  },
  {
    affiliationGroups: [
      {
        items: [
          { id: 'grenoble', name: 'Grenoble' },
          { id: 'chambery', name: 'Chambéry' },
        ],
        name: 'Site',
        slug: 'site',
      },
    ],
    city: 'Grenoble',
    id: 'tc_grenoble',
    name: 'Grenoble Campus',
    vtestId: '0000021402',
  },
]

export const PRODUCTS: readonly Product[] = [
  { examNames: ['VTEST ENGLISH - 4 SKILLS'], id: 'prod_en_4', name: 'VTest English · 4 skills' },
  {
    examNames: ['VTest Business English | 4 Skills'],
    id: 'prod_be_4',
    name: 'VTest Business English · 4 skills',
  },
  { examNames: [], id: 'prod_en_speaking', name: 'VTest English · Speaking' },
  { examNames: [], id: 'prod_en_placement', name: 'VTest English · Placement' },
  { examNames: [], id: 'prod_fr_4', name: 'VTest Français · 4 skills' },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Products, as the ExAssess API would return them. */
export function productsQuery() {
  return {
    queryFn: async () => {
      await wait(350)
      return PRODUCTS
    },
    queryKey: ['playground', 'products'],
  }
}

/** A CEFR level column. */
function level(label: string) {
  return { headers: `${label} level`, label, options: CEFR_LEVELS }
}

const LEVEL_HEADERS = ['General', 'Listening', 'Reading', 'Speaking', 'Writing', 'Grammar'].map(
  (label) => `${label} level`,
)

export const assessmentsImport = defineSpreadsheetSchema<{
  center: TestCenter
  products: readonly Product[]
  stored: readonly StoredAssessment[]
}>()({
  key: 'playground.assessments',
  file: { accept: ['.xlsx', '.xls', '.csv'], maxRows: 5000 },
  columns: (c) =>
    c
      .select('testCenterId', {
        label: 'Test center',
        headers: 'Test center ID',
        description:
          'VTest ID of the center. Filled with the chosen center when the column is missing.',
        options: ({ ctx }) => [ctx.center.vtestId],
        default: ({ ctx }) => ctx.center.vtestId,
        unknown: 'error',
      })
      .text('secureCode', {
        label: 'Secure code',
        headers: 'Secure Code',
        required: true,
        example: '8GM2FPM8RA',
      })
      .text('examName', { label: 'Exam name', headers: 'Exam name', required: true })
      .select('productId', {
        label: 'Product',
        from: 'examName',
        options: ({ ctx }) =>
          ctx.products.map((product) => ({
            aliases: product.examNames,
            label: product.name,
            value: product.id,
          })),
        required: true,
      })
      .text('firstName', { label: 'First name', headers: 'First Name', required: true })
      .text('lastName', { label: 'Last name', headers: 'Last Name', required: true })
      .text('email', {
        label: 'Email',
        headers: 'Email',
        required: true,
        rules: (v) => [v.email({ level: 'warning', message: 'This email address looks wrong' })],
      })
      .text('candidateReference', {
        label: 'Candidate reference',
        headers: 'External candidate reference code',
      })
      .select('status', {
        label: 'Test status',
        headers: 'Test Status',
        options: ['Done'],
        unknown: 'skip-rows',
        required: true,
      })
      .select('mode', {
        label: 'Administration mode',
        headers: 'Administration mode',
        options: ADMINISTRATION_MODES,
        required: true,
      })
      .select('proctoringStatus', {
        label: 'Proctoring status',
        headers: 'Proctoring status',
        options: PROCTORING_STATUSES,
        unknown: 'leave-empty',
      })
      .date('completedAt', {
        label: 'Completed at',
        headers: 'Completed date',
        formats: ['MMMM d, yyyy h:mm a'],
        required: true,
        rules: (v) => [v.notFuture()],
        example: 'September 12, 2026 10:05 AM',
      })
      .text('duration', {
        label: 'Duration',
        headers: 'Duration',
        required: true,
        rules: (v) => [
          v.pattern(/^([01]?\d|2[0-3]):[0-5]\d$/u, { message: 'Expected hh:mm, like 01:05' }),
        ],
        example: '01:05',
      })
      .text('batch', { label: 'Batch', headers: 'Batch' })
      .text('country', { label: 'Country', headers: 'Tc country', required: true })
      .group('levels', { label: 'CEFR levels' }, (g) =>
        g
          .select('general', level('General'))
          .select('listening', level('Listening'))
          .select('reading', level('Reading'))
          .select('speaking', level('Speaking'))
          .select('writing', level('Writing'))
          .select('grammar', level('Grammar')),
      )
      .dynamic('affiliations', {
        label: 'Affiliations',
        items: ({ ctx }) => ctx.center.affiliationGroups,
        column: (group, c) =>
          c.select(group.slug, {
            label: group.name,
            headers: `${group.name}: PRÉREQUIS CECR`,
            options: {
              source: group.items.map((item) => ({ label: item.name, value: item.id })),
              create: {
                handler: async ({ label }) => {
                  await wait(150)
                  return { label, value: label.toLowerCase().replaceAll(' ', '-') }
                },
              },
            },
            multiple: true,
            unknown: 'create',
          }),
      }),
  rows: {
    key: (row) => row.secureCode,
    duplicates: 'error',
    existing: {
      lookup: async ({ keys, ctx }) => {
        await wait(250)
        return ctx.stored.filter((record) => keys.includes(record.secureCode))
      },
      action: ({ row, existing }) =>
        row.levels.general === existing.levels.general ? 'skip' : 'update',
    },
  },
  validate: ({ row, issue }) => [
    !row.levels.general &&
      row.proctoringStatus !== 'Security compromised' &&
      issue('levels.general', 'Required unless proctoring status is “Security compromised”'),
  ],
  output: ({ row, mode, existing, ctx }) => ({
    ...row,
    assessmentId: existing?.id ?? null,
    centerId: ctx.center.id,
    mode,
  }),
})

/* ------------------------------------------------------------------ sample files */

const FIRST_NAMES = [
  'Léa',
  'Hugo',
  'Chloé',
  'Nathan',
  'Manon',
  'Lucas',
  'Camille',
  'Louis',
  'Inès',
  'Jules',
  'Sarah',
  'Adam',
  'Emma',
  'Théo',
  'Zoé',
  'Yanis',
  'Clara',
  'Rayan',
  'Lina',
  'Noah',
  'Jade',
  'Enzo',
  'Alice',
  'Sofiane',
]
const LAST_NAMES = [
  'Martin',
  'Bernard',
  'Dubois',
  'Thomas',
  'Robert',
  'Richard',
  'Petit',
  'Durand',
  'Leroy',
  'Moreau',
  'Simon',
  'Laurent',
  'Lefebvre',
  'Michel',
  'Garcia',
  'David',
  'Bertrand',
  'Roux',
  'Vincent',
  'Fournier',
  'Morel',
  'Girard',
  'André',
  'Mercier',
  'Benali',
  'Nguyen',
]
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const EXAMS = {
  business: 'VTest Business English | 4 Skills',
  english: 'VTEST ENGLISH - 4 SKILLS',
  speaking: 'VTEST ENGLISH - SPEAKING ONLY',
}
const SPEAKING_ROWS = new Set([2, 15, 33, 44, 58, 69, 81, 95, 110, 127, 139, 152, 171, 180])
const IN_PROGRESS_ROWS = new Set([10, 35, 90, 120, 150, 165])
const REMOTE_ROWS = new Set([8, 51, 77, 103, 140])
const NEW_PROGRAMME_ROWS = [26, 48, 66, 99, 118, 133, 177]
const NA_ROWS = new Set([4, 19, 37, 62, 85, 108, 131, 157, 174])
const ROW_COUNT = 184

export function secureCodeOf(index: number) {
  let seed = Math.imul(index + 1, 0x9e3779b1) | 0
  let code = ''
  for (let step = 0; step < 10; step += 1) {
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    code += CODE_ALPHABET[((value ^ (value >>> 14)) >>> 0) % 32]
  }
  return code
}

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/gu, '')
    .toLowerCase()
const pad = (value: number) => String(value).padStart(2, '0')
const levelAt = (index: number, offset: number, step: number) =>
  CEFR_LEVELS[offset + ((index * step) % (CEFR_LEVELS.length - offset))] ?? 'B1.1'

function sampleRow(index: number, center: TestCenter, messy: boolean) {
  const first = FIRST_NAMES[(index * 7) % FIRST_NAMES.length] ?? ''
  const last = LAST_NAMES[(index * 11 + 3) % LAST_NAMES.length] ?? ''
  const hour = 8 + (index % 9)
  const newProgramme = NEW_PROGRAMME_ROWS.indexOf(index)
  const general =
    messy && index === 17
      ? 'B2+'
      : messy && [29, 57, 97].includes(index)
        ? ''
        : levelAt(index, 3, 5)
  return {
    affiliations: center.affiliationGroups.map((group) => {
      if (group.slug === 'programme')
        return newProgramme >= 0
          ? newProgramme % 2
            ? 'FLE'
            : 'General English, FLE'
          : index % 3 === 0
            ? 'business english'
            : 'General English'
      if (group.slug === 'schoolLevel') return index % 5 ? 'Higher education' : 'High school'
      return group.items[index % group.items.length]?.name ?? ''
    }),
    center: messy && index === 73 ? '0000021999' : center.vtestId,
    completed:
      messy && index === 12
        ? 'Sept 31, 2026'
        : `${index % 3 === 0 ? 'August' : 'September'} ${1 + ((index * 5) % 27)}, 2026 ${pad(hour > 12 ? hour - 12 : hour)}:${pad((index * 7) % 60)} ${hour >= 12 ? 'PM' : 'AM'}`,
    duration:
      messy && index === 64 ? '1h05' : `${index % 4 ? '01' : '00'}:${pad((index * 7) % 60)}`,
    email:
      messy && (index === 5 || index === 22)
        ? ''
        : messy && index === 40
          ? 'marc.dubois@'
          : `${slug(first)}.${slug(last)}@campus-${slug(center.city)}.fr`,
    exam:
      messy && SPEAKING_ROWS.has(index)
        ? EXAMS.speaking
        : [0, 3, 6].includes(index % 8)
          ? EXAMS.business
          : EXAMS.english,
    first,
    general,
    last,
    mode:
      messy && REMOTE_ROWS.has(index)
        ? 'Remote proctoring'
        : index % 5
          ? 'Online proctoring'
          : 'Onsite proctoring',
    proctoring:
      messy && [57, 97].includes(index)
        ? 'Security compromised'
        : messy && NA_ROWS.has(index)
          ? 'N/A'
          : 'Approved',
    reference: index % 6 ? String(480210 + index * 37) : '',
    secure: messy && index === 30 ? secureCodeOf(3) : secureCodeOf(index),
    skills: [
      levelAt(index, 2, 3),
      levelAt(index, 3, 2),
      levelAt(index, 2, 1),
      levelAt(index, 2, 4),
    ],
    status: messy && IN_PROGRESS_ROWS.has(index) ? 'In progress' : 'Done',
  }
}

/** Assessments of the center already in ExAssess: some unchanged, some with a new general level. */
export function storedAssessments(center: TestCenter): readonly StoredAssessment[] {
  return Array.from({ length: 24 }, (_, offset) => {
    const index = 150 + offset
    const row = sampleRow(index, center, true)
    return {
      id: 9000 + index,
      levels: { general: offset % 3 === 0 ? 'A2.1' : row.general || null },
      secureCode: row.secure,
    }
  })
}

function toBinary(sheets: readonly { name: string; rows: readonly (readonly unknown[])[] }[]) {
  const workbook = utils.book_new()
  for (const sheet of sheets)
    utils.book_append_sheet(
      workbook,
      utils.aoa_to_sheet(sheet.rows.map((row) => [...row])),
      sheet.name,
    )
  const binary: ArrayBuffer = write(workbook, { bookType: 'xlsx', type: 'array' })
  return binary
}

/** A file made from the ExAssess template: exact headers, clean values. */
export function cleanWorkbook(center: TestCenter) {
  const header = [
    'Test center ID',
    'Secure Code',
    'Exam name',
    'First Name',
    'Last Name',
    'Email',
    'External candidate reference code',
    'Test Status',
    'Administration mode',
    'Proctoring status',
    'Completed date',
    'Duration',
    'Batch',
    'Tc country',
    ...LEVEL_HEADERS,
    ...center.affiliationGroups.map((group) => `${group.name}: PRÉREQUIS CECR`),
  ]
  const rows = Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = sampleRow(index, center, false)
    return [
      row.center,
      row.secure,
      row.exam,
      row.first,
      row.last,
      row.email,
      row.reference,
      row.status,
      row.mode,
      row.proctoring,
      row.completed,
      row.duration,
      index % 2 ? 'Sept A' : 'Sept B',
      'France',
      row.general,
      ...row.skills,
      row.skills[1],
      ...row.affiliations,
    ]
  })
  return {
    binary: toBinary([{ name: 'Assessments', rows: [header, ...rows] }]),
    name: `assessments_${slug(center.city)}_template.xlsx`,
  }
}

/** A raw VTest export: title rows, renamed and missing columns, unknown values, broken rows. */
export function vtestExportWorkbook(center: TestCenter) {
  const header = [
    'Test center ID',
    'Secure code',
    'Exam name',
    'First name',
    'Last name',
    'Email',
    'Candidate reference',
    'Test status',
    'Administration mode',
    'Proctoring status',
    'Completed date',
    'Time spent',
    'Batch',
    'Tc country',
    ...LEVEL_HEADERS.slice(0, 5),
    ...center.affiliationGroups.map((group) => `${group.name}: PRÉREQUIS CECR`),
    'Notes',
  ]
  const rows = Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = sampleRow(index, center, true)
    return [
      row.center,
      row.secure,
      row.exam,
      row.first,
      row.last,
      row.email,
      row.reference,
      row.status,
      row.mode,
      row.proctoring,
      row.completed,
      row.duration,
      index % 2 ? 'Sept A' : 'Sept B',
      'France',
      row.general,
      ...row.skills,
      ...row.affiliations,
      index % 17 === 0 ? 'Retake requested' : '',
    ]
  })
  return {
    binary: toBinary([
      {
        name: 'Summary',
        rows: [
          ['Candidates', ROW_COUNT],
          ['Center', center.name],
        ],
      },
      {
        name: 'Assessments',
        rows: [
          [`VTest export — ${center.name}`],
          ['Generated on September 28, 2026'],
          header,
          ...rows,
        ],
      },
      { name: 'Notes', rows: [] },
    ]),
    name: `vtest_export_${slug(center.city)}_2026-09.xlsx`,
  }
}
