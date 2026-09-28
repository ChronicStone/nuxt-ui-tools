import UBadge from '@nuxt/ui/components/Badge.vue'
import { email, maxValue, withAsync, withMessage } from '@regle/rules'
import { queryOptions, useQueryClient } from '@tanstack/vue-query'
import { h } from 'vue'

import {
  defineFormField,
  defineFormFields,
  defineFormPageSchema,
  defineFormPageSection,
  useForm,
} from '#ui-tools/form'
import type { FormField } from '#ui-tools/form'

import {
  BIN_TYPE_OPTIONS,
  CHANNEL_OPTIONS,
  CITY_OPTIONS,
  COUNTRIES,
  CURRENCIES,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  LEVEL_OPTIONS,
  PRIORITY_OPTIONS,
  PRODUCT_KINDS,
  PRODUCTS,
  ROLE_OPTIONS,
  SKILL_OPTIONS,
  STATUS_OPTIONS,
  TEAMS,
  USERS,
  countriesQuery,
  isoDate,
  productsQuery,
  regionOptions,
  sleep,
  slowTeamsQuery,
  taxRateOptions,
  teamsQuery,
  userOptions,
} from './data'
import { exposePerfForm } from './form'
import type { PerfScenario, PerfScenarioOptions } from './form'
import { createCatalogForm } from './form-catalog'

const ACTIONS = [
  { key: 'cancel', label: 'Cancel' },
  { icon: 'i-lucide-check', key: 'submit', label: 'Save' },
] as const

const CONTROLS = { confirmNavOnDirty: false, dirtyCheck: true, validate: true } as const

function countryQuery() {
  return queryOptions({
    ...countriesQuery,
    select: (countries) =>
      countries.map((country) => ({ label: country.name, value: country.code })),
  })
}

function symbolOf(currency: unknown) {
  return CURRENCY_SYMBOLS[
    currency === CURRENCIES.USD || currency === CURRENCIES.GBP ? currency : CURRENCIES.EUR
  ]
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const INPUT_COLUMNS = defineFormFields([
  {
    key: 'name',
    label: 'Name',
    layout: { width: 180 },
    placeholder: 'Full name',
    required: true,
    type: 'text',
  },
  {
    key: 'email',
    label: 'Email',
    layout: { width: 220 },
    props: { inputType: 'email' },
    type: 'text',
    validators: { email: withMessage(email, 'Enter a valid email.') },
  },
  {
    key: 'reference',
    label: 'Reference',
    layout: { width: 170 },
    props: { mono: true, prefix: 'REF-' },
    type: 'text',
  },
  {
    key: 'code',
    label: 'Masked code',
    layout: { width: 150 },
    props: { mask: '###-AAA' },
    type: 'text',
  },
  {
    key: 'website',
    label: 'Website (clearable)',
    layout: { width: 230 },
    props: { clearable: true, inputType: 'url' },
    type: 'text',
  },
  {
    key: 'vat',
    label: 'VAT (icon)',
    layout: { width: 190 },
    props: { icon: 'i-lucide-landmark' },
    type: 'text',
  },
  {
    key: 'amount',
    label: 'Amount',
    layout: { width: 140 },
    props: { controls: false, format: { currency: 'EUR', style: 'currency' } },
    type: 'number',
  },
  {
    key: 'quantity',
    label: 'Quantity',
    layout: { width: 150 },
    props: { min: 0, step: 1 },
    type: 'number',
  },
  {
    key: 'ratio',
    label: 'Ratio',
    layout: { width: 110 },
    props: { controls: false, max: 100, min: 0, suffix: '%' },
    type: 'number',
  },
  {
    key: 'note',
    label: 'Note',
    layout: { width: 220 },
    props: { autoresize: true, rows: 1 },
    type: 'textarea',
  },
  { key: 'secret', label: 'Password', layout: { width: 190 }, type: 'password' },
  {
    key: 'phone',
    label: 'Phone',
    layout: { width: 230 },
    props: { defaultCountryCode: 'FR' },
    type: 'phone-number',
  },
  { default: [], key: 'tags', label: 'Tags', layout: { width: 230 }, type: 'tag' },
  {
    key: 'city',
    label: 'City (auto-complete)',
    layout: { width: 190 },
    options: CITY_OPTIONS,
    type: 'auto-complete',
  },
])

function inputRow(index: number) {
  return {
    amount: 100 + index * 3.5,
    city: CITY_OPTIONS[index % CITY_OPTIONS.length],
    code: index % 4 === 0 ? '' : `${String(100 + (index % 900))}-ABC`,
    email: index % 5 === 3 ? 'not-an-email' : `person${index}@example.com`,
    name: index % 9 === 4 ? '' : `Person ${index + 1}`,
    note: index % 3 === 0 ? `Follow up on item ${index + 1}` : '',
    phone: index % 2 === 0 ? '+33612345678' : '',
    quantity: index % 12,
    ratio: (index * 7) % 101,
    reference: String(1000 + index),
    secret: index % 2 === 0 ? 'hunter22' : '',
    tags: index % 3 === 0 ? ['vip', 'north'] : [],
    vat: index % 2 === 0 ? `FR${String(10_000_000_000 + index)}` : '',
    website: index % 3 === 1 ? `https://site-${index}.example.com` : '',
  }
}

function choiceColumns(mount: number) {
  return defineFormFields([
    {
      key: 'role',
      label: 'Role',
      layout: { width: 150 },
      options: ROLE_OPTIONS,
      required: true,
      type: 'select',
    },
    {
      key: 'team',
      label: 'Team (query)',
      layout: { width: 160 },
      options: () =>
        queryOptions({
          ...teamsQuery,
          select: (teams) => teams.map((team) => ({ label: team.name, value: team.id })),
        }),
      type: 'select',
    },
    {
      default: [],
      key: 'skills',
      label: 'Skills (multiple)',
      layout: { width: 230 },
      options: SKILL_OPTIONS,
      props: { multiple: true },
      type: 'select',
    },
    {
      key: 'country',
      label: 'Country (searchable)',
      layout: { width: 180 },
      options: countryQuery,
      props: { searchable: true },
      type: 'select',
    },
    {
      dependencies: [['$parent.country', 'country']],
      key: 'region',
      label: 'Region (by country)',
      layout: { width: 180 },
      options: ({ deps }) => regionOptions(deps.country),
      type: 'select',
    },
    {
      key: 'owner',
      label: 'Owner (clearable)',
      layout: { width: 180 },
      options: USERS.slice(0, 12).map((user) => ({ label: user.name, value: user.id })),
      props: { clearable: true },
      type: 'select',
    },
    {
      key: 'manager',
      label: 'Manager (remote)',
      layout: { width: 190 },
      options: { loader: userOptions, mode: 'remote' },
      type: 'select',
    },
    {
      key: 'level',
      label: 'Level (promise)',
      layout: { width: 150 },
      options: async () => {
        await sleep(300)
        return LEVEL_OPTIONS
      },
      type: 'select',
    },
    {
      key: 'status',
      label: 'Status (radio)',
      layout: { width: 270 },
      options: STATUS_OPTIONS,
      props: { orientation: 'horizontal' },
      type: 'radio',
    },
    {
      default: [],
      key: 'channels',
      label: 'Channels (checkbox group)',
      layout: { width: 280 },
      options: CHANNEL_OPTIONS,
      props: { orientation: 'horizontal' },
      type: 'checkbox-group',
    },
    {
      key: 'priority',
      label: 'Priority (icon)',
      layout: { width: 160 },
      options: PRIORITY_OPTIONS,
      props: { icon: 'i-lucide-flag' },
      type: 'select',
    },
    {
      key: 'slowTeam',
      label: 'Team (slow query)',
      layout: { width: 170 },
      options: () =>
        queryOptions({
          ...slowTeamsQuery(mount),
          select: (teams) => teams.map((team) => ({ label: team.name, value: team.id })),
        }),
      type: 'select',
    },
  ])
}

function choiceRow(index: number) {
  const country = COUNTRIES[index % COUNTRIES.length]!
  return {
    channels: CHANNEL_OPTIONS.filter((_option, option) => (index + option) % 2 === 0).map(
      (option) => option.value,
    ),
    country: country.code,
    level: LEVEL_OPTIONS[index % LEVEL_OPTIONS.length]!.value,
    manager: USERS[(index * 7) % USERS.length]!.id,
    owner: index % 2 === 0 ? USERS[index % 12]!.id : null,
    priority: PRIORITY_OPTIONS[index % PRIORITY_OPTIONS.length]!.value,
    region: country.regions[index % country.regions.length],
    role: index % 11 === 5 ? null : ROLE_OPTIONS[index % ROLE_OPTIONS.length]!.value,
    skills: SKILL_OPTIONS.filter((_skill, skill) => (index + skill) % 5 === 0).map(
      (skill) => skill.value,
    ),
    slowTeam: TEAMS[(index + 3) % TEAMS.length]!.id,
    status: STATUS_OPTIONS[index % STATUS_OPTIONS.length]!.value,
    team: TEAMS[index % TEAMS.length]!.id,
  }
}

const DATE_COLUMNS = defineFormFields([
  { key: 'start', label: 'Start', layout: { width: 170 }, type: 'date' },
  {
    dependencies: [['$parent.start', 'start']],
    key: 'end',
    label: 'End (min = start)',
    layout: { width: 170 },
    props: ({ deps }) => ({ min: typeof deps.start === 'string' ? deps.start : undefined }),
    type: 'date',
  },
  { key: 'due', label: 'Due (datetime)', layout: { width: 220 }, type: 'datetime' },
  { key: 'month', label: 'Month', layout: { width: 180 }, type: 'month' },
  { key: 'year', label: 'Year', layout: { width: 120 }, type: 'year' },
  { key: 'time', label: 'Time', layout: { width: 130 }, type: 'time' },
  { key: 'period', label: 'Period (range)', layout: { width: 270 }, type: 'daterange' },
  {
    key: 'renewal',
    label: 'Renewal (clearable)',
    layout: { width: 200 },
    props: { clearable: true },
    type: 'date',
  },
])

function dateRow(index: number) {
  return {
    due: `${isoDate(index % 40)}T${String(8 + (index % 10)).padStart(2, '0')}:30`,
    end: isoDate((index % 60) + 7),
    month: isoDate(index * 30).slice(0, 7),
    period: [isoDate(index % 30), isoDate((index % 30) + 5)],
    renewal: index % 2 === 0 ? isoDate(365 + index) : null,
    start: index % 6 === 5 ? null : isoDate(index % 60),
    time: `${String(7 + (index % 12)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`,
    year: 2020 + (index % 8),
  }
}

const MISC_COLUMNS = defineFormFields([
  { default: false, key: 'active', label: 'Active', layout: { width: 80 }, type: 'switch' },
  { default: false, key: 'billable', label: 'Billable', layout: { width: 80 }, type: 'checkbox' },
  {
    default: 0,
    key: 'score',
    label: 'Score (slider)',
    layout: { width: 180 },
    props: { max: 100, min: 0 },
    type: 'slider',
  },
  { key: 'stars', label: 'Rating', layout: { width: 150 }, props: { max: 5 }, type: 'rating' },
  { key: 'color', label: 'Color', layout: { width: 170 }, type: 'color-picker' },
  {
    content: ({ api }) =>
      `${asNumber(api.form.get('$parent.score'))} pts · ${asNumber(api.form.get('$parent.stars'))} ★`,
    key: 'summary',
    layout: { width: 200 },
    props: { color: 'neutral', icon: false, variant: 'soft' },
    type: 'info',
  },
  {
    fields: [
      { key: 'priceValue', label: 'Price', props: { controls: false, min: 0 }, type: 'number' },
      {
        default: CURRENCIES.EUR,
        key: 'priceCurrency',
        label: 'Currency',
        options: CURRENCY_OPTIONS,
        type: 'select',
      },
    ],
    key: 'price',
    label: 'Price (input group)',
    layout: { width: 250 },
    type: 'input-group',
  },
  {
    key: 'duplicate',
    label: 'Copy name',
    layout: { width: 130 },
    onClick: ({ api }) => {
      api.form.set('$parent.note', String(api.form.get('$parent.name') ?? ''))
    },
    props: { color: 'neutral', icon: 'i-lucide-copy', variant: 'soft' },
    type: 'button',
  },
  {
    key: 'badge',
    label: 'Custom render',
    layout: { width: 140 },
    render: ({ api }) =>
      h(UBadge, { color: 'primary', label: String(api.value.get() ?? '—'), variant: 'subtle' }),
    type: 'custom-component',
  },
])

function miscRow(index: number) {
  return {
    active: index % 2 === 0,
    badge: `#${index + 1}`,
    billable: index % 3 === 0,
    color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][index % 4],
    priceCurrency: CURRENCY_OPTIONS[index % CURRENCY_OPTIONS.length]!.value,
    priceValue: 20 + index,
    score: (index * 13) % 101,
    stars: index % 6,
  }
}

function tableField<
  const TKey extends string,
  const TFields extends readonly FormField[],
>(options: { key: TKey; label: string; inert: boolean | 'auto'; fields: TFields }) {
  return defineFormField({
    addItemLabel: 'Add row',
    emptyLabel: 'No rows',
    extraProperties: true,
    fields: options.fields,
    key: options.key,
    label: options.label,
    layout: { span: 8 },
    props: { draggable: false, inert: options.inert },
    type: 'array-table',
  })
}

function tableScenario(options: {
  title: string
  rows: number
  inert: boolean | 'auto'
  fields: Parameters<typeof defineFormFields>[0]
  row: (index: number) => Readonly<Record<string, unknown>>
}) {
  return exposePerfForm(
    useForm({
      input: {
        rows: Array.from({ length: options.rows }, (_, index) => ({
          id: `row-${index}`,
          ...options.row(index),
        })),
      },
      onSubmit: () => ({ success: true }),
      schema: defineFormPageSchema({
        actions: ACTIONS,
        controls: CONTROLS,
        formKey: `perf.${options.title}`,
        layout: { columns: 8, fieldSpan: 8 },
        sections: [
          defineFormPageSection({
            fields: [
              tableField({
                fields: [{ key: 'id', type: 'hidden' }, ...options.fields],
                inert: options.inert,
                key: 'rows',
                label: options.title,
              }),
            ],
            key: 'rows',
            label: options.title,
          }),
        ],
      }),
    }),
  )
}

function presetScenario({ rows, inert }: PerfScenarioOptions) {
  const lines = Array.from({ length: 6 }, (_, index) => ({
    id: `line-${index}`,
    name: `Gamme ${index + 1}`,
  }))
  const catalog = Array.from({ length: 120 }, (_, index) => ({
    id: `product-${index}`,
    name: `Produit ${index + 1} · VTest English Listening & Reading`,
    productLineId: lines[index % lines.length]!.id,
    versions: Array.from({ length: 1 + (index % 3) }, (_, version) => ({
      feeCurrency: version % 2 ? CURRENCIES.USD : CURRENCIES.EUR,
      feeValue: `${3 + version}.000000`,
      id: `version-${index}-${version}`,
      name: `Version ${version + 1}`,
      priceEur: `${10 + index}.500000`,
      priceUsd: `${12 + index}.250000`,
    })),
  }))
  const catalogQuery = queryOptions({
    queryFn: async () => catalog,
    queryKey: ['perf', 'catalog'],
    staleTime: Number.POSITIVE_INFINITY,
  })
  const linesQuery = queryOptions({
    queryFn: async () => lines,
    queryKey: ['perf', 'lines'],
    staleTime: Number.POSITIVE_INFINITY,
  })
  const queryClient = useQueryClient()
  queryClient.setQueryData(catalogQuery.queryKey, catalog)
  queryClient.setQueryData(linesQuery.queryKey, lines)
  const findVersion = (versionId: unknown) =>
    catalog.flatMap((product) => product.versions).find((entry) => entry.id === versionId)
  const decimal = {
    input: (value: string) => Number(value),
    output: (value: number) => String(value),
  }

  return exposePerfForm(
    useForm({
      input: {
        currency: CURRENCIES.EUR,
        label: `Perf ${rows} produits`,
        productLineIds: lines.map((line) => line.id),
        products: Array.from({ length: rows }, (_, index) => {
          const product = catalog[index % catalog.length]!
          const version = product.versions[0]!
          return {
            active: true,
            id: `row-${index}`,
            presetId: 'preset-1',
            productFee: version.feeValue,
            productId: product.id,
            productPrice: version.priceEur,
            productVersionId: version.id,
          }
        }),
      },
      onSubmit: () => ({ success: true }),
      schema: defineFormPageSchema({
        actions: [
          { key: 'cancel', label: 'Annuler' },
          { icon: 'i-lucide-check', key: 'submit', label: 'Enregistrer' },
        ],
        controls: CONTROLS,
        formKey: 'perf.preset',
        layout: { columns: 8, fieldSpan: '8 xl:4' },
        sections: [
          defineFormPageSection({
            description: 'Libellé, devise et lignes de produits couvertes.',
            fields: [
              { default: '', key: 'label', label: 'Libellé', required: true, type: 'text' },
              {
                default: CURRENCIES.EUR,
                key: 'currency',
                label: 'Devise',
                options: [CURRENCIES.EUR, CURRENCIES.USD].map((currency) => ({
                  label: currency,
                  value: currency,
                })),
                required: true,
                type: 'select',
              },
              {
                default: [],
                key: 'productLineIds',
                label: 'Lignes de produits',
                layout: { span: 8 },
                options: {
                  clearOnInvalid: false,
                  source: () =>
                    queryOptions({
                      ...linesQuery,
                      select: (entries) =>
                        entries.map((line) => ({ label: line.name, value: line.id })),
                    }),
                },
                props: { multiple: true },
                type: 'select',
              },
            ],
            key: 'general',
            label: 'Préréglage',
          }),
          defineFormPageSection({
            description: 'Les tarifs restent modifiables dans chaque contrat après import.',
            fields: [
              defineFormField({
                addItemLabel: 'Ajouter un produit',
                emptyLabel: 'Aucun produit',
                extraProperties: true,
                fields: [
                  {
                    key: 'id',
                    transform: {
                      input: (id: string) => id,
                      output: (id: string | null) => id ?? undefined,
                    },
                    type: 'hidden',
                  },
                  {
                    key: 'presetId',
                    transform: { input: (presetId: string | null) => presetId },
                    type: 'hidden',
                  },
                  {
                    default: null,
                    dependencies: ['productLineIds'],
                    key: 'productId',
                    label: 'Produit',
                    options: ({ api, deps }) =>
                      queryOptions({
                        ...catalogQuery,
                        select: (products) =>
                          products
                            .filter(
                              (product) =>
                                product.id === api.value.get() ||
                                !Array.isArray(deps.productLineIds) ||
                                deps.productLineIds.length === 0 ||
                                deps.productLineIds.includes(product.productLineId),
                            )
                            .map((product) => ({ label: product.name, value: product.id })),
                      }),
                    props: { searchable: true },
                    required: true,
                    type: 'select',
                    watch: ({ api, value }) => {
                      const versions =
                        catalog.find((product) => product.id === value)?.versions ?? []
                      const current = api.form.get('$parent.productVersionId')
                      if (versions.some((version) => version.id === current)) return
                      api.form.set(
                        '$parent.productVersionId',
                        versions.length === 1 ? (versions[0]?.id ?? null) : null,
                      )
                    },
                  },
                  {
                    default: null,
                    dependencies: [['$parent.productId', 'productId']],
                    key: 'productVersionId',
                    label: 'Version',
                    layout: { width: 212 },
                    options: ({ deps }) =>
                      queryOptions({
                        ...catalogQuery,
                        select: (products) =>
                          (
                            products.find((product) => product.id === deps.productId)?.versions ??
                            []
                          ).map((version) => ({ label: version.name, value: version.id })),
                      }),
                    required: true,
                    type: 'select',
                    watch: ({ api, value }) => {
                      const version = findVersion(value)
                      if (!version) return
                      const usd = api.form.get('currency') === CURRENCIES.USD
                      api.form.set(
                        '$parent.productPrice',
                        Number(usd ? version.priceUsd : version.priceEur),
                      )
                      api.form.set('$parent.productFee', Number(version.feeValue))
                    },
                  },
                  {
                    default: null,
                    dependencies: ['currency'],
                    key: 'productPrice',
                    label: 'Prix',
                    layout: { width: 104 },
                    props: ({ deps }) => ({
                      controls: false,
                      min: 0,
                      step: 0.01,
                      suffix: symbolOf(deps.currency),
                    }),
                    required: true,
                    transform: decimal,
                    type: 'number',
                  },
                  {
                    default: null,
                    dependencies: [['$parent.productVersionId', 'versionId']],
                    key: 'productFee',
                    label: 'Frais',
                    layout: { width: 104 },
                    props: ({ deps }) => {
                      const feeCurrency = findVersion(deps.versionId)?.feeCurrency
                      return {
                        controls: false,
                        min: 0,
                        step: 0.01,
                        suffix: feeCurrency ? symbolOf(feeCurrency) : '',
                      }
                    },
                    required: true,
                    transform: decimal,
                    type: 'number',
                  },
                  {
                    default: true,
                    key: 'active',
                    label: 'Actif',
                    layout: { width: 64 },
                    type: 'switch',
                  },
                ],
                key: 'products',
                layout: { span: 8 },
                props: { draggable: false, inert, minWidth: 720 },
                type: 'array-table',
              }),
            ],
            key: 'products',
            label: 'Produits',
          }),
        ],
      }),
    }),
  )
}

const KIND_OPTIONS = [
  { label: 'Product', value: PRODUCT_KINDS.product },
  { label: 'Service', value: PRODUCT_KINDS.service },
  { label: 'Discount', value: PRODUCT_KINDS.discount },
]

function dependenciesScenario({ rows, inert }: PerfScenarioOptions) {
  const kinds = [
    PRODUCT_KINDS.product,
    PRODUCT_KINDS.service,
    PRODUCT_KINDS.product,
    PRODUCT_KINDS.discount,
  ]
  return exposePerfForm(
    useForm({
      input: {
        country: 'FR',
        currency: CURRENCIES.EUR,
        discounts: false,
        lines: Array.from({ length: rows }, (_, index) => {
          const kind = kinds[index % kinds.length]!
          const product = PRODUCTS.filter((entry) => entry.kind === kind)[index % 40]
          return {
            approved: index % 2 === 0,
            billable: kind !== PRODUCT_KINDS.discount,
            discount: kind === PRODUCT_KINDS.discount ? 5 + (index % 20) : null,
            hours: kind === PRODUCT_KINDS.service ? 1 + (index % 8) : null,
            id: `line-${index}`,
            kind,
            label: product?.name ?? `Discount ${index + 1}`,
            productId: product?.id ?? null,
            quantity: kind === PRODUCT_KINDS.product ? 1 + (index % 5) : null,
            reference: index % 7 === 2 ? '' : `PO-${2000 + index}`,
            taxRate: 20 as const,
            unitPrice: product?.price ?? null,
          }
        }),
      },
      onSubmit: () => ({ success: true }),
      schema: defineFormPageSchema({
        actions: ACTIONS,
        controls: CONTROLS,
        formKey: 'perf.dependencies',
        layout: { columns: 8, fieldSpan: '8 xl:4' },
        sections: [
          defineFormPageSection({
            description:
              'Every line reads these values: currency suffixes, tax rates, discount column.',
            fields: [
              {
                default: CURRENCIES.EUR,
                key: 'currency',
                label: 'Currency',
                options: CURRENCY_OPTIONS,
                required: true,
                type: 'select',
              },
              {
                default: 'FR',
                key: 'country',
                label: 'Country (tax rates)',
                options: countryQuery,
                type: 'select',
              },
              {
                default: false,
                key: 'discounts',
                label: 'Discount column on every line',
                type: 'switch',
              },
            ],
            key: 'order',
            label: 'Order',
          }),
          defineFormPageSection({
            description:
              'Conditional cells, dependent options, computed totals, effects that write other cells, callback props and async validation.',
            fields: [
              tableField({
                fields: [
                  { key: 'id', type: 'hidden' },
                  {
                    default: PRODUCT_KINDS.product,
                    key: 'kind',
                    label: 'Kind',
                    layout: { width: 130 },
                    options: KIND_OPTIONS,
                    required: true,
                    type: 'select',
                  },
                  {
                    condition: ({ deps }) => deps.kind !== PRODUCT_KINDS.discount,
                    default: null,
                    dependencies: [['$parent.kind', 'kind']],
                    key: 'productId',
                    label: 'Item (by kind)',
                    layout: { width: 200 },
                    options: ({ deps }) =>
                      queryOptions({
                        ...productsQuery,
                        select: (products) =>
                          products
                            .filter((product) => product.kind === deps.kind)
                            .map((product) => ({ label: product.name, value: product.id })),
                      }),
                    props: { searchable: true },
                    required: true,
                    type: 'select',
                    watch: ({ api, value }) => {
                      const product = PRODUCTS.find((entry) => entry.id === value)
                      if (!product) return
                      api.form.set('$parent.unitPrice', product.price)
                      api.form.set('$parent.label', product.name)
                    },
                  },
                  {
                    default: '',
                    dependencies: [['$parent.kind', 'kind']],
                    key: 'label',
                    label: 'Label',
                    layout: { width: 200 },
                    placeholder: ({ deps }) =>
                      deps.kind === PRODUCT_KINDS.discount ? 'Discount reason' : 'Line label',
                    required: true,
                    type: 'text',
                  },
                  {
                    condition: ({ deps }) => deps.kind === PRODUCT_KINDS.product,
                    default: 1,
                    dependencies: [['$parent.kind', 'kind']],
                    key: 'quantity',
                    label: 'Qty',
                    layout: { width: 130 },
                    props: { min: 1, step: 1 },
                    required: true,
                    type: 'number',
                  },
                  {
                    condition: ({ deps }) => deps.kind === PRODUCT_KINDS.service,
                    default: 1,
                    dependencies: [['$parent.kind', 'kind']],
                    key: 'hours',
                    label: 'Hours',
                    layout: { width: 110 },
                    props: { controls: false, min: 0, step: 0.5, suffix: 'h' },
                    required: true,
                    type: 'number',
                  },
                  {
                    default: null,
                    dependencies: ['currency', ['$parent.kind', 'kind']],
                    disabled: ({ deps }) => deps.kind === PRODUCT_KINDS.discount,
                    key: 'unitPrice',
                    label: 'Unit price',
                    layout: { width: 130 },
                    props: ({ deps }) => ({
                      controls: false,
                      min: 0,
                      step: 0.01,
                      suffix: symbolOf(deps.currency),
                    }),
                    type: 'number',
                  },
                  {
                    condition: ({ deps }) =>
                      deps.kind === PRODUCT_KINDS.discount || deps.discounts === true,
                    default: null,
                    dependencies: [['$parent.kind', 'kind'], 'discounts'],
                    key: 'discount',
                    label: 'Discount',
                    layout: { width: 120 },
                    props: { controls: false, max: 100, min: 0, suffix: '%' },
                    type: 'number',
                    validators: { maxValue: withMessage(maxValue(100), 'At most 100 %.') },
                  },
                  {
                    default: null,
                    dependencies: ['country'],
                    key: 'taxRate',
                    label: 'Tax (by country)',
                    layout: { width: 140 },
                    options: ({ deps }) => taxRateOptions(deps.country),
                    type: 'select',
                  },
                  {
                    content: ({ api }) => {
                      const line = (key: string) => api.form.get(`$parent.${key}`)
                      const units =
                        line('kind') === PRODUCT_KINDS.service
                          ? asNumber(line('hours'))
                          : asNumber(line('quantity'))
                      const net =
                        units * asNumber(line('unitPrice')) * (1 - asNumber(line('discount')) / 100)
                      return `${net.toFixed(2)} ${symbolOf(api.form.get('currency'))}`
                    },
                    key: 'total',
                    layout: { width: 150 },
                    props: { color: 'neutral', icon: false, variant: 'soft' },
                    type: 'info',
                  },
                  {
                    default: true,
                    dependencies: [['$parent.kind', 'kind']],
                    disabled: ({ deps }) => deps.kind === PRODUCT_KINDS.discount,
                    key: 'billable',
                    label: 'Billable',
                    layout: { width: 90 },
                    type: 'switch',
                  },
                  {
                    default: '',
                    dependencies: [['$parent.billable', 'billable']],
                    key: 'reference',
                    label: 'PO ref (async rule)',
                    layout: { width: 180 },
                    required: ({ deps }) => deps.billable === true,
                    type: 'text',
                    validators: {
                      available: withMessage(
                        withAsync(async (value) => {
                          await sleep(250)
                          return value !== 'TAKEN'
                        }),
                        'Reference already used.',
                      ),
                    },
                  },
                  {
                    default: false,
                    dependencies: [['$parent.unitPrice', 'unitPrice']],
                    key: 'approved',
                    label: 'Approved',
                    layout: { width: 100 },
                    onDependencyChange: ({ api }) => api.value.set(false),
                    type: 'checkbox',
                  },
                ],
                inert,
                key: 'lines',
                label: 'Lines',
              }),
            ],
            key: 'lines',
            label: 'Lines',
          }),
        ],
      }),
    }),
  )
}

function nestedScenario({ rows, inert }: PerfScenarioOptions) {
  const binsPerWarehouse = 25
  const warehouses = Math.max(2, Math.ceil(rows / binsPerWarehouse))
  const binTypes = BIN_TYPE_OPTIONS.map((option) => option.value)
  return exposePerfForm(
    useForm({
      input: {
        carriers: Array.from({ length: 20 }, (_, index) => ({
          active: index % 3 !== 0,
          name: `Carrier ${index + 1}`,
          rate: 4 + index * 0.4,
        })),
        name: 'North network',
        warehouses: Array.from({ length: warehouses }, (_, warehouse) => ({
          address: {
            city: CITY_OPTIONS[warehouse % CITY_OPTIONS.length],
            country: COUNTRIES[warehouse % COUNTRIES.length]!.code,
          },
          bins: Array.from({ length: binsPerWarehouse }, (_, bin) => ({
            code: `W${warehouse + 1}-${String(bin + 1).padStart(3, '0')}`,
            shared: bin % 4 === 0,
            size: { depth: 60 + (bin % 5) * 10, width: 40 + (bin % 3) * 20 },
            temperature: binTypes[bin % binTypes.length] === 'cold' ? -18 : null,
            type: binTypes[bin % binTypes.length],
          })),
          name: `Warehouse ${warehouse + 1}`,
        })),
        zones: Array.from({ length: 3 }, (_, zone) => ({
          label: `Zone ${String.fromCodePoint(65 + zone)}`,
          slots: Array.from({ length: 10 }, (_, slot) => ({
            capacity: 10 + slot,
            open: slot % 2 === 0,
            slot: `${String.fromCodePoint(65 + zone)}${slot + 1}`,
          })),
        })),
      },
      onSubmit: () => ({ success: true }),
      schema: defineFormPageSchema({
        actions: ACTIONS,
        controls: CONTROLS,
        formKey: 'perf.nested',
        layout: { columns: 8, fieldSpan: 8 },
        sections: [
          defineFormPageSection({
            fields: [{ default: '', key: 'name', label: 'Network', required: true, type: 'text' }],
            key: 'general',
            label: 'Network',
          }),
          defineFormPageSection({
            description: `${warehouses} warehouses × ${binsPerWarehouse} bins: tables inside a list, nested objects, dotted keys, a conditional column.`,
            fields: [
              defineFormField({
                addItemLabel: 'Add warehouse',
                fields: [
                  {
                    default: '',
                    key: 'name',
                    label: 'Warehouse',
                    layout: { span: 4 },
                    required: true,
                    type: 'text',
                  },
                  {
                    fields: [
                      { default: '', key: 'city', label: 'City', type: 'text' },
                      {
                        default: null,
                        key: 'country',
                        label: 'Country',
                        options: countryQuery,
                        type: 'select',
                      },
                    ],
                    key: 'address',
                    layout: { columns: 2, span: 4 },
                    type: 'object',
                  },
                  tableField({
                    fields: [
                      {
                        default: '',
                        key: 'code',
                        label: 'Code',
                        layout: { width: 130 },
                        props: { mono: true },
                        required: true,
                        type: 'text',
                      },
                      {
                        default: null,
                        key: 'size.width',
                        label: 'Width',
                        layout: { width: 110 },
                        props: { controls: false, suffix: 'cm' },
                        type: 'number',
                      },
                      {
                        default: null,
                        key: 'size.depth',
                        label: 'Depth',
                        layout: { width: 110 },
                        props: { controls: false, suffix: 'cm' },
                        type: 'number',
                      },
                      {
                        default: 'shelf',
                        key: 'type',
                        label: 'Type',
                        layout: { width: 130 },
                        options: BIN_TYPE_OPTIONS,
                        type: 'select',
                      },
                      {
                        condition: ({ deps }) => deps.type === 'cold',
                        default: null,
                        dependencies: [['$parent.type', 'type']],
                        key: 'temperature',
                        label: 'Temp. (cold only)',
                        layout: { width: 140 },
                        props: { controls: false, suffix: '°C' },
                        type: 'number',
                      },
                      {
                        default: false,
                        key: 'shared',
                        label: 'Shared',
                        layout: { width: 80 },
                        type: 'switch',
                      },
                    ],
                    inert,
                    key: 'bins',
                    label: 'Bins',
                  }),
                ],
                key: 'warehouses',
                label: 'Warehouses',
                layout: { span: 8 },
                props: { draggable: false },
                type: 'array-list',
              }),
            ],
            key: 'warehouses',
            label: 'Warehouses',
          }),
          defineFormPageSection({
            description: 'Tables inside collapsible items.',
            fields: [
              defineFormField({
                fields: [
                  { default: '', key: 'label', label: 'Zone', type: 'text' },
                  tableField({
                    fields: [
                      {
                        default: '',
                        key: 'slot',
                        label: 'Slot',
                        layout: { width: 110 },
                        type: 'text',
                      },
                      {
                        default: 0,
                        key: 'capacity',
                        label: 'Capacity',
                        layout: { width: 140 },
                        props: { min: 0 },
                        type: 'number',
                      },
                      {
                        default: true,
                        key: 'open',
                        label: 'Open',
                        layout: { width: 80 },
                        type: 'switch',
                      },
                    ],
                    inert,
                    key: 'slots',
                    label: 'Slots',
                  }),
                ],
                key: 'zones',
                label: 'Zones',
                layout: { span: 8 },
                props: { defaultExpanded: 'first', draggable: false },
                type: 'array-collapse',
              }),
            ],
            key: 'zones',
            label: 'Zones',
          }),
          defineFormPageSection({
            description: 'A table in a tab that mounts when the tab opens.',
            fields: [
              {
                key: 'carrierTabs',
                tabs: [
                  {
                    fields: [
                      {
                        content: 'Open the Carriers tab to mount its table.',
                        key: 'carrierIntro',
                        type: 'info',
                      },
                    ],
                    key: 'overview',
                    label: 'Overview',
                  },
                  {
                    fields: [
                      tableField({
                        fields: [
                          {
                            default: '',
                            key: 'name',
                            label: 'Carrier',
                            layout: { width: 180 },
                            required: true,
                            type: 'text',
                          },
                          {
                            default: 0,
                            key: 'rate',
                            label: 'Rate',
                            layout: { width: 130 },
                            props: {
                              controls: false,
                              format: { currency: 'EUR', style: 'currency' },
                            },
                            type: 'number',
                          },
                          {
                            default: true,
                            key: 'active',
                            label: 'Active',
                            layout: { width: 80 },
                            type: 'switch',
                          },
                        ],
                        inert,
                        key: 'carriers',
                        label: 'Carriers',
                      }),
                    ],
                    key: 'carriers',
                    label: 'Carriers',
                  },
                ],
                type: 'tabs',
              },
            ],
            key: 'carriers',
            label: 'Carriers',
          }),
        ],
      }),
    }),
  )
}

const TABLE_SIZES = [20, 50, 300, 1000] as const

export const PERF_SCENARIOS = {
  catalog: {
    create: createCatalogForm,
    description:
      'A large form page: every field kind at page level, nested objects, tabs, a matrix, conditions, dependencies and every array kind, repeated per copy.',
    label: 'Big form (catalog)',
    sizes: [1, 3, 6, 10],
    unit: '× catalog',
  },
  all: {
    create: ({ inert, mount, rows }) =>
      tableScenario({
        fields: [...INPUT_COLUMNS, ...choiceColumns(mount), ...DATE_COLUMNS, ...MISC_COLUMNS],
        inert,
        row: (index) => ({
          ...inputRow(index),
          ...choiceRow(index),
          ...dateRow(index),
          ...miscRow(index),
        }),
        rows,
        title: 'Every cell type',
      }),
    description: 'One table with every column type of the other catalogs (43 columns).',
    label: 'Table: all cell types',
    sizes: TABLE_SIZES,
    unit: ' rows',
  },
  choices: {
    create: ({ inert, mount, rows }) =>
      tableScenario({
        fields: choiceColumns(mount),
        inert,
        row: choiceRow,
        rows,
        title: 'Choices',
      }),
    description:
      'Static, query, dependent, remote, promise, slow and multiple selects, radio, checkbox group.',
    label: 'Table: choices',
    sizes: TABLE_SIZES,
    unit: ' rows',
  },
  dates: {
    create: ({ inert, rows }) =>
      tableScenario({ fields: DATE_COLUMNS, inert, row: dateRow, rows, title: 'Dates' }),
    description: 'Date, dependent min date, datetime, month, year, time, range, clearable date.',
    label: 'Table: dates',
    sizes: TABLE_SIZES,
    unit: ' rows',
  },
  dependencies: {
    create: dependenciesScenario,
    description:
      'Conditional cells, dependent options, effects, computed totals, async validation.',
    label: 'Table: dependencies',
    sizes: TABLE_SIZES,
    unit: ' rows',
  },
  inputs: {
    create: ({ inert, rows }) =>
      tableScenario({ fields: INPUT_COLUMNS, inert, row: inputRow, rows, title: 'Inputs' }),
    description:
      'Text variants (prefix, mask, clearable, icon), numbers, textarea, password, phone, tags, auto-complete.',
    label: 'Table: inputs',
    sizes: TABLE_SIZES,
    unit: ' rows',
  },
  misc: {
    create: ({ inert, rows }) =>
      tableScenario({ fields: MISC_COLUMNS, inert, row: miscRow, rows, title: 'Misc' }),
    description:
      'Switch, checkbox, slider, rating, color, info, input group, button, custom render.',
    label: 'Table: misc',
    sizes: TABLE_SIZES,
    unit: ' rows',
  },
  nested: {
    create: nestedScenario,
    description:
      'Tables inside an array list, a collapse and tabs, with nested objects and dotted keys.',
    label: 'Table: nested tables',
    sizes: TABLE_SIZES,
    unit: ' rows',
  },
  preset: {
    create: presetScenario,
    description: 'Replica of the ExAssess preset form.',
    label: 'Table: ExAssess preset',
    sizes: TABLE_SIZES,
    unit: ' rows',
  },
} satisfies Record<string, PerfScenario>

export type PerfScenarioKey = keyof typeof PERF_SCENARIOS

export function isPerfScenarioKey(value: unknown): value is PerfScenarioKey {
  return typeof value === 'string' && Object.hasOwn(PERF_SCENARIOS, value)
}
