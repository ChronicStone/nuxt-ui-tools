import UBadge from '@nuxt/ui/components/Badge.vue'
import { email, maxValue, sameAs, withAsync, withMessage } from '@regle/rules'
import { queryOptions } from '@tanstack/vue-query'
import { h } from 'vue'

import {
  defineFormField,
  defineFormPageSchema,
  defineFormPageSection,
  useForm,
} from '#ui-tools/form'

import {
  CHANNEL_OPTIONS,
  CITY_OPTIONS,
  COUNTRIES,
  CURRENCIES,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  LEVEL_OPTIONS,
  PRIORITY_OPTIONS,
  PRODUCTS,
  ROLE_OPTIONS,
  SKILL_OPTIONS,
  STATUS_OPTIONS,
  TEAMS,
  USERS,
  countriesQuery,
  isoDate,
  regionOptions,
  sleep,
  slowTeamsQuery,
  teamsQuery,
  userOptions,
} from './data'
import { exposePerfForm } from './form'
import type { PerfScenarioOptions } from './form'

const CONTRACTS = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Fixed term', value: 'fixed' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Intern', value: 'intern' },
]

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '200+']

const CATEGORY_TREE = [
  {
    children: [
      { key: 'frontend', label: 'Frontend' },
      { key: 'backend', label: 'Backend' },
    ],
    key: 'engineering',
    label: 'Engineering',
  },
  { key: 'operations', label: 'Operations' },
]

const LOCATION_TREE = [
  {
    children: [
      { key: 'france', label: 'France' },
      { key: 'belgium', label: 'Belgium' },
    ],
    key: 'europe',
    label: 'Europe',
  },
]

const SCOPE_TREE = [
  {
    children: [
      { key: 'catalog.read', label: 'Read' },
      { key: 'catalog.write', label: 'Write' },
    ],
    key: 'catalog',
    label: 'Catalog',
  },
]

function symbolOf(currency: unknown) {
  return CURRENCY_SYMBOLS[
    currency === CURRENCIES.USD || currency === CURRENCIES.GBP ? currency : CURRENCIES.EUR
  ]
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function teamOptions() {
  return queryOptions({
    ...teamsQuery,
    select: (teams) => teams.map((team) => ({ label: team.name, value: team.id })),
  })
}

function countryOptions() {
  return queryOptions({
    ...countriesQuery,
    select: (countries) =>
      countries.map((country) => ({ label: country.name, value: country.code })),
  })
}

/** One copy of the catalog: six sections with every field kind, keys suffixed per copy. */
function catalogSections(copy: number, options: { inert: boolean | 'auto'; mount: number }) {
  const s = copy === 0 ? '' : `_${copy + 1}`
  const title = (label: string) => (copy === 0 ? label : `${label} ${copy + 1}`)
  const profile = `profile${s}`

  return [
    defineFormPageSection({
      description: 'Text inputs and their variants, with sync and async rules.',
      fields: [
        {
          key: `${profile}.firstName`,
          label: 'First name',
          placeholder: 'Ada',
          required: true,
          type: 'text',
        },
        {
          key: `${profile}.lastName`,
          label: 'Last name',
          placeholder: 'Lovelace',
          required: true,
          type: 'text',
          watch: ({ api, value }) => {
            const first = api.form.get(`${profile}.firstName`)
            api.form.set(
              `${profile}.displayName`,
              `${typeof first === 'string' ? first : ''} ${value ?? ''}`.trim(),
            )
          },
          watchOptions: { immediate: true },
        },
        {
          description: 'Filled by an immediate watch on the last name.',
          disabled: () => true,
          key: `${profile}.displayName`,
          label: 'Display name',
          type: 'text',
        },
        {
          key: `${profile}.email`,
          label: 'Email',
          props: { inputType: 'email' },
          required: true,
          type: 'text',
          validators: { email: withMessage(email, 'Enter a valid email address.') },
        },
        {
          description: 'Try “taken” to see the async rule fail.',
          key: `${profile}.username`,
          label: 'Username',
          props: { mono: true, prefix: '@' },
          type: 'text',
          validators: {
            available: withMessage(
              withAsync(async (value) => {
                await sleep(300)
                return value !== 'taken'
              }),
              'That username is taken.',
            ),
          },
        },
        {
          key: `${profile}.website`,
          label: 'Website',
          props: { clearable: true, inputType: 'url' },
          type: 'text',
        },
        {
          key: `${profile}.vat`,
          label: 'VAT number',
          props: { icon: 'i-lucide-landmark' },
          type: 'text',
        },
        {
          key: `${profile}.code`,
          label: 'Employee code',
          props: { mask: '###-AAA' },
          type: 'text',
        },
        {
          key: `${profile}.phone`,
          label: 'Phone',
          props: { clearable: true, defaultCountryCode: 'FR' },
          type: 'phone-number',
        },
        {
          key: `${profile}.birthDate`,
          label: 'Birth date',
          props: { calendar: { yearRange: [1920, 2035] }, clearable: true },
          type: 'date',
        },
        { key: `${profile}.city`, label: 'City', options: CITY_OPTIONS, type: 'auto-complete' },
        {
          key: `${profile}.keywords`,
          label: 'Keywords',
          placeholder: 'Add a keyword',
          type: 'tag',
        },
        {
          key: `${profile}.bio`,
          label: 'Bio',
          layout: { span: 'full' },
          placeholder: 'A few words…',
          props: { autoresize: true, rows: 3 },
          type: 'textarea',
        },
        {
          key: `${profile}.password`,
          label: 'Password',
          props: {
            requirements: [
              {
                key: 'length',
                label: 'At least 8 characters',
                validate: (value: string) => value.length >= 8,
              },
              {
                key: 'number',
                label: 'At least one number',
                validate: (value: string) => /\d/u.test(value),
              },
            ],
          },
          type: 'password',
        },
        {
          dependencies: [[`${profile}.password`, 'password']],
          key: `${profile}.confirmPassword`,
          label: 'Confirm password',
          submit: { omit: true },
          type: 'password',
          validators: ({ deps }) => ({
            sameAs: withMessage(sameAs(deps.password), 'Passwords do not match.'),
          }),
        },
        {
          key: `${profile}.otp`,
          label: 'One-time code',
          props: { inputType: 'number', length: 6 },
          type: 'one-time-code',
        },
        {
          default: `draft-${copy}`,
          key: `${profile}.draftId`,
          submit: { omit: true },
          type: 'hidden',
        },
      ],
      key: `identity${s}`,
      label: title('Identity'),
    }),
    defineFormPageSection({
      description: 'Every option source and every choice control.',
      fields: [
        { key: `role${s}`, label: 'Role', options: ROLE_OPTIONS, required: true, type: 'select' },
        { key: `team${s}`, label: 'Team (query)', options: teamOptions, type: 'select' },
        {
          key: `skills${s}`,
          label: 'Skills',
          options: SKILL_OPTIONS,
          props: { multiple: true },
          type: 'select',
        },
        {
          key: `country${s}`,
          label: 'Country (searchable)',
          options: countryOptions,
          props: { searchable: true },
          type: 'select',
        },
        {
          dependencies: [[`country${s}`, 'country']],
          key: `region${s}`,
          label: 'Region (by country)',
          options: ({ deps }) => regionOptions(deps.country),
          type: 'select',
        },
        {
          key: `owner${s}`,
          label: 'Owner (clearable)',
          options: USERS.slice(0, 12).map((user) => ({ label: user.name, value: user.id })),
          props: { clearable: true },
          type: 'select',
        },
        {
          key: `manager${s}`,
          label: 'Manager (remote)',
          options: { loader: userOptions, mode: 'remote' },
          type: 'select',
        },
        {
          key: `level${s}`,
          label: 'Level (promise)',
          options: async () => {
            await sleep(300)
            return LEVEL_OPTIONS
          },
          type: 'select',
        },
        {
          key: `sponsor${s}`,
          label: 'Sponsor team (slow query)',
          options: () =>
            queryOptions({
              ...slowTeamsQuery(options.mount),
              select: (teams) => teams.map((team) => ({ label: team.name, value: team.id })),
            }),
          type: 'select',
        },
        {
          key: `status${s}`,
          label: 'Status',
          options: STATUS_OPTIONS,
          props: { orientation: 'horizontal' },
          type: 'radio',
        },
        {
          key: `plan${s}`,
          label: 'Plan',
          options: [
            { description: 'Light usage', label: 'Starter', value: 'starter' },
            { description: 'Team workflows', label: 'Scale', value: 'scale' },
          ],
          type: 'radio-card',
        },
        {
          key: `channels${s}`,
          label: 'Channels',
          options: CHANNEL_OPTIONS,
          props: { variant: 'card' },
          type: 'checkbox-group',
        },
        {
          key: `flags${s}`,
          label: 'Flags',
          options: ['priority', 'audited'],
          props: { orientation: 'horizontal' },
          type: 'checkbox-card',
        },
        {
          key: `alerts${s}`,
          label: 'Alerts',
          options: [
            { label: 'Email alerts', value: 'email' },
            { label: 'SMS alerts', value: 'sms' },
          ],
          type: 'switch-group',
        },
        {
          key: `category${s}`,
          label: 'Category (tree select)',
          options: CATEGORY_TREE,
          props: { searchable: true, selectionControl: 'radio', showPath: true },
          type: 'tree-select',
        },
        {
          key: `location${s}`,
          label: 'Location (cascader)',
          options: LOCATION_TREE,
          props: { leafOnly: true },
          type: 'cascader',
        },
        {
          key: `scopes${s}`,
          label: 'Scopes (tree)',
          options: SCOPE_TREE,
          props: { cascade: true, defaultExpanded: ['catalog'], multiple: true },
          type: 'tree',
        },
        {
          key: `priority${s}`,
          label: 'Priority',
          options: PRIORITY_OPTIONS,
          props: { icon: 'i-lucide-flag' },
          type: 'select',
        },
      ],
      key: `choices${s}`,
      label: title('Choices'),
    }),
    defineFormPageSection({
      description: 'Dates, times, numbers and toggles.',
      fields: [
        { key: `meeting${s}`, label: 'Meeting', props: { clearable: true }, type: 'datetime' },
        { key: `vacation${s}`, label: 'Vacation', props: { clearable: true }, type: 'daterange' },
        { key: `booking${s}`, label: 'Booking window', type: 'datetimerange' },
        { key: `startMonth${s}`, label: 'Start month', type: 'month' },
        { key: `quarter${s}`, label: 'Quarter', type: 'monthrange' },
        {
          key: `graduation${s}`,
          label: 'Graduation',
          props: { max: 2040, min: 1980 },
          type: 'year',
        },
        { key: `standup${s}`, label: 'Standup', props: { minuteStep: 5 }, type: 'time' },
        {
          key: `salary${s}`,
          label: 'Salary',
          props: {
            controls: false,
            format: { currency: 'EUR', maximumFractionDigits: 0, style: 'currency' },
          },
          type: 'number',
        },
        { key: `headcount${s}`, label: 'Headcount', props: { max: 500, min: 1 }, type: 'number' },
        {
          key: `budget${s}`,
          label: 'Budget share',
          props: { max: 100, min: 0, step: 5, tooltip: true },
          type: 'slider',
        },
        { key: `satisfaction${s}`, label: 'Satisfaction', type: 'rating' },
        { key: `brand${s}`, label: 'Brand color', props: { format: 'hex' }, type: 'color-picker' },
        { key: `newsletter${s}`, label: 'Newsletter', type: 'switch' },
        {
          key: `autosave${s}`,
          label: 'Autosave',
          props: { checkedIcon: 'i-lucide-check', uncheckedIcon: 'i-lucide-x' },
          type: 'switch',
        },
        { key: `terms${s}`, label: 'Accept terms', type: 'checkbox' },
        { key: `avatar${s}`, label: 'Avatar', props: { accept: 'image/*' }, type: 'file' },
      ],
      key: `values${s}`,
      label: title('Dates, numbers, toggles'),
    }),
    defineFormPageSection({
      description: 'Nested objects, groups, cards, columns, tabs and a matrix.',
      fields: [
        {
          description: 'Nested object in a card.',
          fields: [
            { default: 12, key: 'seats', label: 'Seats', props: { min: 1 }, type: 'number' },
            {
              default: 65,
              key: 'confidence',
              label: 'Confidence',
              props: { max: 100, min: 0, step: 5 },
              type: 'slider',
            },
            { default: '09:30', key: 'reviewTime', label: 'Review time', type: 'time' },
            { default: ['verified'], key: 'tags', label: 'Tags', type: 'tag' },
            { default: true, key: 'notify', label: 'Notify', type: 'checkbox' },
            {
              default: '#00C16A',
              key: 'accent',
              label: 'Accent',
              props: { format: 'hex' },
              type: 'color-picker',
            },
            {
              fields: [
                { key: 'street', label: 'Street', type: 'text' },
                { key: 'zip', label: 'ZIP', props: { mask: '#####' }, type: 'text' },
                { key: 'country', label: 'Country', options: countryOptions, type: 'select' },
                {
                  dependencies: [['$parent.country', 'country']],
                  key: 'region',
                  label: 'Region',
                  options: ({ deps }) => regionOptions(deps.country),
                  type: 'select',
                },
              ],
              key: 'address',
              label: 'Address (object in object)',
              layout: { columns: 4, span: 'full' },
              type: 'object',
            },
            {
              key: 'notes',
              label: 'Notes',
              layout: { span: 'full' },
              placeholder: 'Internal notes…',
              type: 'textarea',
            },
          ],
          key: `settings${s}`,
          label: 'Settings (object)',
          layout: { columns: 8, span: 'full', variant: 'card' },
          type: 'object',
        },
        {
          fields: [
            { default: '+33', key: `contactPrefix${s}`, label: 'Prefix', type: 'text' },
            {
              key: `contactNumber${s}`,
              label: 'Number',
              placeholder: '6 12 34 56 78',
              type: 'text',
            },
          ],
          key: `contact${s}`,
          label: 'Contact (input group)',
          layout: { span: 'full' },
          type: 'input-group',
        },
        {
          fields: [
            { key: 'code', placeholder: 'Code', type: 'text' },
            { key: 'region', options: ['EU', 'US'], type: 'select' },
          ],
          key: `compact${s}`,
          label: 'Compact identity (group)',
          layout: { span: 'full' },
          type: 'group',
        },
        {
          description: 'Card fields write at the form level.',
          fields: [
            { key: `headline${s}`, label: 'Headline', type: 'text' },
            {
              key: `stage${s}`,
              label: 'Stage',
              options: ['draft', 'ready', 'archived'],
              type: 'select',
            },
          ],
          key: `card${s}`,
          label: 'Card',
          layout: { columns: 8, span: 'full' },
          type: 'card',
        },
        {
          fields: [{ key: `comment${s}`, label: 'Comment (column)', type: 'textarea' }],
          key: `column${s}`,
          layout: { span: 'full' },
          type: 'column',
        },
        {
          key: `details${s}`,
          tabs: [
            {
              fields: [
                { key: `companyName${s}`, label: 'Company', type: 'text' },
                {
                  key: `siret${s}`,
                  label: 'SIRET',
                  props: { mask: '### ### ### #####' },
                  type: 'text',
                },
                { key: `companySize${s}`, label: 'Size', options: COMPANY_SIZES, type: 'select' },
              ],
              key: 'company',
              label: 'Company',
            },
            {
              fields: [
                { key: `iban${s}`, label: 'IBAN', props: { mono: true }, type: 'text' },
                {
                  key: `billingEmail${s}`,
                  label: 'Billing email',
                  props: { inputType: 'email' },
                  type: 'text',
                },
              ],
              key: 'billing',
              label: 'Billing',
            },
          ],
          type: 'tabs',
        },
        {
          fields: [
            { key: 'enabled', label: 'Enabled', type: 'switch' },
            { key: 'scope', label: 'Scope', options: ['own', 'all'], type: 'select' },
          ],
          key: `permissions${s}`,
          label: 'Permissions (matrix)',
          layout: { span: 'full' },
          rows: [
            { key: 'catalog', label: 'Catalog' },
            { key: 'orders', label: 'Orders' },
            { key: 'users', label: 'Users' },
          ],
          type: 'matrix',
        },
        {
          content: 'Info block between structured fields.',
          key: `note${s}`,
          layout: { span: 'full' },
          type: 'info',
        },
        { key: `split${s}`, label: 'Divider', layout: { span: 'full' }, type: 'divider' },
        {
          key: `badge${s}`,
          label: 'Custom render',
          render: ({ api }) =>
            h(UBadge, {
              color: 'primary',
              label: String(api.value.get() ?? '—'),
              variant: 'subtle',
            }),
          type: 'custom-component',
        },
      ],
      key: `structure${s}`,
      label: title('Structure'),
    }),
    defineFormPageSection({
      description:
        'Conditions, dependent props, effects, computed values and required/disabled callbacks.',
      fields: [
        {
          key: `contract${s}`,
          label: 'Contract',
          options: CONTRACTS,
          required: true,
          type: 'select',
        },
        { key: `currency${s}`, label: 'Currency', options: CURRENCY_OPTIONS, type: 'select' },
        {
          condition: ({ deps }) => deps.contract === 'fixed',
          dependencies: [[`contract${s}`, 'contract']],
          key: `contractEnd${s}`,
          label: 'End date (fixed term)',
          required: true,
          type: 'date',
        },
        {
          condition: ({ deps }) => deps.contract === 'freelance',
          dependencies: [
            [`contract${s}`, 'contract'],
            [`currency${s}`, 'currency'],
          ],
          key: `dailyRate${s}`,
          label: 'Daily rate (freelance)',
          props: ({ deps }) => ({ controls: false, min: 0, suffix: symbolOf(deps.currency) }),
          type: 'number',
        },
        {
          dependencies: [[`contract${s}`, 'contract']],
          disabled: ({ deps }) => deps.contract === 'intern',
          key: `seniority${s}`,
          label: 'Seniority (disabled for interns)',
          options: LEVEL_OPTIONS,
          type: 'select',
        },
        { key: `hasCompany${s}`, label: 'Bills through a company', type: 'switch' },
        {
          condition: ({ deps }) => deps.hasCompany === true,
          dependencies: [[`hasCompany${s}`, 'hasCompany']],
          fields: [
            { key: 'name', label: 'Company name', required: true, type: 'text' },
            { key: 'size', label: 'Size', options: COMPANY_SIZES, type: 'select' },
          ],
          key: `company${s}`,
          label: 'Company (conditional object)',
          layout: { columns: 2, span: 'full' },
          type: 'object',
        },
        {
          dependencies: [[`hasCompany${s}`, 'hasCompany']],
          key: `vatId${s}`,
          label: 'VAT id (required with a company)',
          placeholder: ({ deps }) => (deps.hasCompany === true ? 'FR12345678901' : 'Not needed'),
          required: ({ deps }) => deps.hasCompany === true,
          type: 'text',
        },
        {
          key: `product${s}`,
          label: 'Product (fills price)',
          options: PRODUCTS.slice(0, 30).map((product) => ({
            label: product.name,
            value: product.id,
          })),
          props: { searchable: true },
          type: 'select',
          watch: ({ api, value }) => {
            const product = PRODUCTS.find((entry) => entry.id === value)
            if (product) api.form.set(`unitPrice${s}`, product.price)
          },
        },
        { default: 1, key: `quantity${s}`, label: 'Quantity', props: { min: 1 }, type: 'number' },
        {
          dependencies: [[`currency${s}`, 'currency']],
          key: `unitPrice${s}`,
          label: 'Unit price',
          props: ({ deps }) => ({
            controls: false,
            min: 0,
            step: 0.01,
            suffix: symbolOf(deps.currency),
          }),
          type: 'number',
        },
        { key: `discounted${s}`, label: 'Apply a discount', type: 'switch' },
        {
          condition: ({ deps }) => deps.discounted === true,
          dependencies: [[`discounted${s}`, 'discounted']],
          key: `discount${s}`,
          label: 'Discount',
          props: { controls: false, max: 100, min: 0, suffix: '%' },
          type: 'number',
          validators: { maxValue: withMessage(maxValue(100), 'At most 100 %.') },
        },
        {
          content: ({ api }) => {
            const net =
              asNumber(api.form.get(`quantity${s}`)) *
              asNumber(api.form.get(`unitPrice${s}`)) *
              (1 -
                asNumber(
                  api.form.get(`discounted${s}`) === true ? api.form.get(`discount${s}`) : 0,
                ) /
                  100)
            return `Total: ${net.toFixed(2)} ${symbolOf(api.form.get(`currency${s}`))}`
          },
          key: `total${s}`,
          layout: { span: 'full' },
          props: { color: 'primary', icon: 'i-lucide-calculator', variant: 'soft' },
          type: 'info',
        },
        {
          dependencies: [[`unitPrice${s}`, 'unitPrice']],
          description: 'Resets when the unit price changes.',
          key: `approved${s}`,
          label: 'Approved',
          onDependencyChange: ({ api }) => api.value.set(false),
          type: 'checkbox',
        },
        {
          key: `copyName${s}`,
          label: 'Copy first name into headline',
          onClick: ({ api }) => {
            api.form.set(`headline${s}`, String(api.form.get(`${profile}.firstName`) ?? ''))
          },
          props: { color: 'neutral', icon: 'i-lucide-copy', variant: 'soft' },
          type: 'button',
        },
      ],
      key: `rules${s}`,
      label: title('Dependencies'),
    }),
    defineFormPageSection({
      description: 'Every array kind, with nested fields and a nested table.',
      fields: [
        defineFormField({
          addItemLabel: 'Add contact',
          fields: [
            { key: 'name', label: 'Name', required: true, type: 'text' },
            { key: 'email', label: 'Email', props: { inputType: 'email' }, type: 'text' },
            { key: 'role', label: 'Role', options: ROLE_OPTIONS, type: 'select' },
            {
              key: 'phone',
              label: 'Phone',
              props: { defaultCountryCode: 'FR' },
              type: 'phone-number',
            },
          ],
          itemLabel: 'Contact',
          key: `contacts${s}`,
          label: 'Contacts (array list)',
          layout: { columns: 4, span: 'full' },
          type: 'array-list',
        }),
        defineFormField({
          fields: [
            { key: 'company', label: 'Company', type: 'text' },
            { key: 'period', label: 'Period', type: 'daterange' },
            { key: 'stack', label: 'Stack', type: 'tag' },
            { key: 'summary', label: 'Summary', layout: { span: 'full' }, type: 'textarea' },
          ],
          key: `experiences${s}`,
          label: 'Experiences (array collapse)',
          layout: { columns: 3, span: 'full' },
          props: { defaultExpanded: 'first' },
          summaryTemplate: (item) => String(item.company ?? 'Experience'),
          type: 'array-collapse',
        }),
        defineFormField({
          fields: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'dueDate', label: 'Due date', type: 'date' },
            { key: 'owner', label: 'Owner', options: teamOptions, type: 'select' },
          ],
          itemLabel: 'Milestone',
          key: `milestones${s}`,
          label: 'Milestones (array tabs)',
          layout: { columns: 3, span: 'full' },
          type: 'array-tabs',
        }),
        {
          addItemLabel: 'Add alias',
          field: { placeholder: 'alias', type: 'text' },
          key: `aliases${s}`,
          label: 'Aliases (primitive array)',
          layout: { span: 'full' },
          type: 'array-primitive',
        },
        {
          key: `contactMethods${s}`,
          label: 'Contact methods (variant array)',
          layout: { span: 'full' },
          props: { displayMode: 'tabs' },
          type: 'array-variant',
          variantKey: 'kind',
          variants: [
            {
              fields: [{ key: 'address', label: 'Email address', type: 'text' }],
              key: 'email',
              label: 'Email',
            },
            {
              fields: [{ key: 'number', label: 'Phone number', type: 'phone-number' }],
              key: 'phone',
              label: 'Phone',
            },
          ],
        },
        defineFormField({
          fields: [
            { key: 'label', label: 'Label', required: true, type: 'text' },
            {
              default: 1,
              key: 'quantity',
              label: 'Qty',
              layout: { width: 120 },
              props: { min: 1 },
              type: 'number',
            },
            {
              key: 'unitPrice',
              label: 'Unit price',
              layout: { width: 130 },
              props: { controls: false, format: { currency: 'EUR', style: 'currency' } },
              type: 'number',
            },
            {
              key: 'team',
              label: 'Team',
              layout: { width: 150 },
              options: teamOptions,
              type: 'select',
            },
            {
              default: true,
              key: 'taxable',
              label: 'Taxable',
              layout: { width: 90 },
              type: 'switch',
            },
          ],
          key: `lineItems${s}`,
          label: 'Line items (array table)',
          layout: { span: 'full' },
          props: { draggable: true, inert: options.inert },
          type: 'array-table',
        }),
        defineFormField({
          addItemLabel: 'Add project',
          fields: [
            { key: 'name', label: 'Project', required: true, type: 'text' },
            { key: 'owner', label: 'Owner', options: teamOptions, type: 'select' },
            { key: 'deadline', label: 'Deadline', type: 'date' },
            defineFormField({
              fields: [
                { key: 'task', label: 'Task', type: 'text' },
                {
                  key: 'estimate',
                  label: 'Estimate',
                  layout: { width: 120 },
                  props: { controls: false, suffix: 'h' },
                  type: 'number',
                },
                { key: 'done', label: 'Done', layout: { width: 80 }, type: 'checkbox' },
              ],
              key: 'tasks',
              label: 'Tasks (table in list)',
              layout: { span: 'full' },
              props: { draggable: false, inert: options.inert },
              type: 'array-table',
            }),
          ],
          itemLabel: 'Project',
          key: `projects${s}`,
          label: 'Projects (list with nested tables)',
          layout: { columns: 3, span: 'full' },
          props: { draggable: false },
          type: 'array-list',
        }),
      ],
      key: `collections${s}`,
      label: title('Collections'),
    }),
  ]
}

/** Values filling one copy of the catalog, so every control shows a realistic state. */
function catalogInput(copy: number) {
  const s = copy === 0 ? '' : `_${copy + 1}`
  const country = COUNTRIES[copy % COUNTRIES.length]!
  return {
    [`aliases${s}`]: ['ada', 'countess', 'enchantress'],
    [`alerts${s}`]: ['email'],
    [`autosave${s}`]: true,
    [`badge${s}`]: `Copy ${copy + 1}`,
    [`booking${s}`]: [`${isoDate(copy)}T09:00`, `${isoDate(copy + 2)}T18:00`],
    [`brand${s}`]: '#3B82F6',
    [`budget${s}`]: 40,
    [`category${s}`]: 'frontend',
    [`channels${s}`]: ['email', 'push'],
    [`contactMethods${s}`]: [
      { address: 'ada@example.com', kind: 'email' },
      { kind: 'phone', number: '+33612345678' },
    ],
    [`contactNumber${s}`]: '6 12 34 56 78',
    [`contacts${s}`]: Array.from({ length: 6 }, (_, index) => ({
      email: `contact${index}@example.com`,
      name: `Contact ${index + 1}`,
      phone: '+33612345678',
      role: ROLE_OPTIONS[index % ROLE_OPTIONS.length]!.value,
    })),
    [`contract${s}`]: CONTRACTS[copy % CONTRACTS.length]!.value,
    [`country${s}`]: country.code,
    [`currency${s}`]: CURRENCIES.EUR,
    [`experiences${s}`]: Array.from({ length: 4 }, (_, index) => ({
      company: `Company ${index + 1}`,
      period: [isoDate(index * 200), isoDate(index * 200 + 180)],
      stack: ['vue', 'nuxt'],
      summary: 'Led the migration of the design system.',
    })),
    [`flags${s}`]: ['priority'],
    [`graduation${s}`]: 2012,
    [`hasCompany${s}`]: copy % 2 === 0,
    [`headcount${s}`]: 42,
    [`headline${s}`]: 'Quarterly review',
    [`level${s}`]: 'senior',
    [`lineItems${s}`]: Array.from({ length: 10 }, (_, index) => ({
      label: `Line ${index + 1}`,
      quantity: 1 + (index % 4),
      taxable: index % 3 !== 0,
      team: TEAMS[index % TEAMS.length]!.id,
      unitPrice: 20 + index * 2.5,
    })),
    [`location${s}`]: 'france',
    [`manager${s}`]: USERS[copy * 3]!.id,
    [`meeting${s}`]: `${isoDate(copy)}T10:30`,
    [`milestones${s}`]: Array.from({ length: 4 }, (_, index) => ({
      dueDate: isoDate(30 * index),
      owner: TEAMS[index % TEAMS.length]!.id,
      title: `Milestone ${index + 1}`,
    })),
    [`newsletter${s}`]: true,
    [`owner${s}`]: USERS[copy % 12]!.id,
    [`permissions${s}`]: {
      catalog: { enabled: true, scope: 'all' },
      orders: { enabled: false, scope: 'own' },
      users: { enabled: true, scope: 'own' },
    },
    [`plan${s}`]: 'scale',
    [`priority${s}`]: 'high',
    [`product${s}`]: PRODUCTS[copy]!.id,
    [`profile${s}`]: {
      bio: 'Mathematician and writer, chiefly known for her work on the Analytical Engine.',
      birthDate: '1815-12-10',
      city: 'Paris',
      code: '123-ABC',
      email: `ada${copy}@example.com`,
      firstName: 'Ada',
      keywords: ['math', 'engines'],
      lastName: 'Lovelace',
      phone: '+33612345678',
      username: `ada${copy}`,
      vat: 'FR12345678901',
      website: 'https://example.com',
    },
    [`projects${s}`]: Array.from({ length: 3 }, (_, index) => ({
      deadline: isoDate(60 + index * 30),
      name: `Project ${index + 1}`,
      owner: TEAMS[index % TEAMS.length]!.id,
      tasks: Array.from({ length: 5 }, (_, task) => ({
        done: task % 2 === 0,
        estimate: 2 + task,
        task: `Task ${task + 1}`,
      })),
    })),
    [`quantity${s}`]: 3,
    [`quarter${s}`]: [isoDate(0).slice(0, 7), isoDate(80).slice(0, 7)],
    [`region${s}`]: country.regions[0],
    [`role${s}`]: 'manager',
    [`salary${s}`]: 58_000,
    [`satisfaction${s}`]: 4,
    [`scopes${s}`]: ['catalog.read'],
    [`seniority${s}`]: 'mid',
    [`settings${s}`]: {
      address: { country: 'FR', region: 'Bretagne', street: '1 rue de la Paix', zip: '75002' },
      notes: 'Keep the roadmap public.',
    },
    [`skills${s}`]: ['skill-0', 'skill-2', 'skill-5'],
    [`sponsor${s}`]: TEAMS[2]!.id,
    [`standup${s}`]: '09:15',
    [`startMonth${s}`]: isoDate(120).slice(0, 7),
    [`status${s}`]: 'live',
    [`team${s}`]: TEAMS[copy % TEAMS.length]!.id,
    [`terms${s}`]: true,
    [`unitPrice${s}`]: 49.9,
    [`vacation${s}`]: [isoDate(200), isoDate(214)],
  }
}

export const CATALOG_COPIES = [1, 3, 6, 10] as const

/** A large form: the catalog repeated `rows` times, each copy six sections of every field kind. */
export function createCatalogForm({ inert, mount, rows }: PerfScenarioOptions) {
  const copies = Math.max(1, rows)
  return exposePerfForm(
    useForm({
      input: Object.assign({}, ...Array.from({ length: copies }, (_, copy) => catalogInput(copy))),
      onSubmit: () => ({ success: true }),
      schema: defineFormPageSchema({
        actions: [
          { key: 'cancel', label: 'Cancel' },
          { icon: 'i-lucide-check', key: 'submit', label: 'Save' },
        ],
        controls: { confirmNavOnDirty: false, dirtyCheck: true, validate: true },
        formKey: 'perf.catalog',
        layout: { columns: 8, fieldSpan: '8 md:4 xl:2' },
        sections: Array.from({ length: copies }, (_, copy) =>
          catalogSections(copy, { inert, mount }),
        ).flat(),
      }),
    }),
  )
}
