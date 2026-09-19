import { h } from 'vue'

import type { FormControlSize, FormField, FormFieldType, FormObject } from '#ui-tools/form'

export interface FormFieldPlaygroundDefinition {
  id: FormFieldType
  label: string
  description: string
  fields: readonly FormField[]
  groups?: readonly {
    label: string
    description?: string
    before: string
  }[]
  input?: FormObject
  notes?: readonly string[]
}

export const formControlSizes: readonly FormControlSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

const planOptions = [
  { description: 'Simple workflows', label: 'Starter', value: 'starter' },
  { description: 'Team workflows', label: 'Scale', value: 'scale' },
  { description: 'Advanced governance', label: 'Enterprise', value: 'enterprise' },
] as const

const roleOptions = [
  { description: 'Full workspace access', label: 'Owner', value: 'owner' },
  { description: 'Operational access', label: 'Manager', value: 'manager' },
  { description: 'Read and comment', label: 'Reviewer', value: 'reviewer' },
] as const

const hierarchyOptions = [
  {
    children: [
      { label: 'Frontend', value: 'frontend' },
      { label: 'Backend', value: 'backend' },
      { label: 'Platform', value: 'platform' },
    ],
    label: 'Engineering',
    value: 'engineering',
  },
  {
    children: [
      { label: 'Product management', value: 'pm' },
      { label: 'Product design', value: 'design' },
    ],
    label: 'Product',
    value: 'product',
  },
] as const

const required = { required: true } as const

function sleep(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration))
}

async function loadRoleOptions() {
  await sleep(650)
  return roleOptions
}

export const formFieldPlaygrounds: readonly FormFieldPlaygroundDefinition[] = [
  {
    description: 'Text inputs, native input types, hints, validation, and disabled state.',
    fields: [
      {
        key: 'name',
        label: 'Name',
        placeholder: 'Ada Lovelace',
        type: 'text',
        validation: required,
      },
      {
        inputType: 'email',
        key: 'email',
        label: 'Email',
        placeholder: 'ada@example.com',
        type: 'text',
      },
      {
        default: 'Read only',
        disabled: () => true,
        key: 'disabled',
        label: 'Disabled',
        type: 'text',
      },
    ],
    id: 'text',
    label: 'Text',
  },
  {
    description: 'Password visibility controls, validation, and sizing.',
    fields: [
      {
        key: 'password',
        label: 'Default reveal control',
        placeholder: 'Enter a password',
        type: 'password',
        validation: required,
      },
      {
        key: 'fixed',
        label: 'Reveal disabled',
        placeholder: 'Always masked',
        type: 'password',
        visibilityToggle: false,
      },
      {
        default: 'secret-value',
        key: 'customReveal',
        label: 'Custom reveal affordance',
        type: 'password',
        visibilityToggle: {
          hideIcon: 'i-lucide-eye-closed',
          hideLabel: 'Mask secret',
          showIcon: 'i-lucide-scan-eye',
          showLabel: 'Preview secret',
        },
      },
      {
        default: 'secret-value',
        disabled: () => true,
        key: 'disabled',
        label: 'Disabled',
        type: 'password',
      },
    ],
    groups: [
      {
        before: 'password',
        description: 'Default reveal, disabled reveal, and authored reveal controls.',
        label: 'Visibility behavior',
      },
      {
        before: 'disabled',
        description: 'Disabled controls keep the same geometry and affordances.',
        label: 'States',
      },
    ],
    id: 'password',
    label: 'Password',
  },
  {
    description: 'Long-form input, placeholder behavior, validation, and disabled state.',
    fields: [
      {
        key: 'summary',
        label: 'Summary',
        placeholder: 'Describe the change…',
        type: 'textarea',
        validation: required,
      },
      {
        default: 'This content is locked.',
        disabled: () => true,
        key: 'disabled',
        label: 'Disabled',
        type: 'textarea',
      },
    ],
    id: 'textarea',
    label: 'Textarea',
  },
  {
    description: 'Numeric stepping, min/max constraints, defaults, and disabled state.',
    fields: [
      { default: 12, key: 'seats', label: 'Seats', max: 100, min: 1, step: 1, type: 'number' },
      { key: 'budget', label: 'Budget', min: 0, placeholder: '5000', step: 250, type: 'number' },
      { default: 42, disabled: () => true, key: 'disabled', label: 'Disabled', type: 'number' },
    ],
    id: 'number',
    label: 'Number',
  },
  {
    description: 'Searchable option input, multiple selection, creation, and clear behavior.',
    fields: [
      {
        clearable: true,
        key: 'role',
        label: 'Search + clear',
        options: roleOptions,
        type: 'auto-complete',
      },
      {
        clearable: true,
        key: 'roles',
        label: 'Multiple values',
        multiple: true,
        options: roleOptions,
        type: 'auto-complete',
      },
      {
        clearable: true,
        key: 'asyncRole',
        label: 'Async + refresh',
        options: { allowOptionsRefresh: true, source: loadRoleOptions },
        type: 'auto-complete',
      },
      {
        clearable: true,
        createItem: 'always',
        key: 'createdRole',
        label: 'Search + create',
        options: {
          create: {
            handler: async ({ label }) => {
              await sleep(350)
              return { label, value: label.toLowerCase().replaceAll(/\s+/g, '-') }
            },
            label: 'Create role',
          },
          source: roleOptions,
        },
        type: 'auto-complete',
      },
      {
        clearable: true,
        createItem: false,
        key: 'createdRoleButton',
        label: 'Dedicated create action',
        options: {
          create: {
            handler: async ({ label }) => {
              await sleep(500)
              return { label, value: label.toLowerCase().replaceAll(/\s+/g, '-') }
            },
            label: 'Create role',
          },
          source: roleOptions,
        },
        type: 'auto-complete',
      },
    ],
    groups: [
      {
        before: 'role',
        description: 'Single and multiple autocomplete behavior.',
        label: 'Selection modes',
      },
      {
        before: 'asyncRole',
        description: 'Promise-backed options expose loading and an explicit refresh action.',
        label: 'Async options',
      },
      {
        before: 'createdRole',
        description: 'Missing values can be authored from the search term.',
        label: 'Creation',
      },
    ],
    id: 'auto-complete',
    label: 'Autocomplete',
  },
  {
    description: 'Boolean checkbox alignment with labels, descriptions, and disabled state.',
    fields: [
      {
        description: 'Required before continuing.',
        key: 'terms',
        label: 'Accept the terms',
        type: 'checkbox',
        validation: required,
      },
      { default: true, key: 'marketing', label: 'Product updates', type: 'checkbox' },
      {
        default: true,
        disabled: () => true,
        key: 'disabled',
        label: 'Disabled option',
        type: 'checkbox',
      },
    ],
    id: 'checkbox',
    label: 'Checkbox',
  },
  {
    description: 'Boolean and custom-value switches with icons, loading, and disabled states.',
    fields: [
      {
        checkedIcon: 'i-lucide-check',
        default: true,
        key: 'autosave',
        label: 'Autosave',
        type: 'switch',
        uncheckedIcon: 'i-lucide-x',
      },
      { default: false, key: 'notifications', label: 'Notifications', type: 'switch' },
      { default: true, disabled: () => true, key: 'disabled', label: 'Disabled', type: 'switch' },
    ],
    id: 'switch',
    label: 'Switch',
  },
  {
    description: 'Option-driven switch groups in vertical and horizontal layouts.',
    fields: [
      {
        default: ['owner'],
        key: 'alerts',
        label: 'Alerts',
        options: roleOptions,
        orientation: 'vertical',
        type: 'switch-group',
      },
      {
        key: 'compact',
        label: 'Horizontal',
        options: planOptions,
        orientation: 'horizontal',
        type: 'switch-group',
      },
    ],
    id: 'switch-group',
    label: 'Switch group',
  },
  {
    description: 'Single-choice radio options with labels, descriptions, and validation.',
    fields: [
      { key: 'plan', label: 'Plan', options: planOptions, type: 'radio', validation: required },
      {
        default: 'starter',
        disabled: () => true,
        key: 'disabled',
        label: 'Disabled',
        options: planOptions,
        type: 'radio',
      },
    ],
    id: 'radio',
    label: 'Radio',
  },
  {
    description: 'Card-style single selection with horizontal and vertical presentations.',
    fields: [
      {
        key: 'plan',
        label: 'Plan',
        options: planOptions,
        orientation: 'horizontal',
        type: 'radio-card',
        validation: required,
      },
      {
        default: 'scale',
        key: 'fallback',
        label: 'Vertical',
        options: planOptions,
        orientation: 'vertical',
        type: 'radio-card',
      },
    ],
    id: 'radio-card',
    label: 'Radio cards',
  },
  {
    description: 'Multi-choice option groups across list, card, and horizontal layouts.',
    fields: [
      {
        default: ['manager'],
        key: 'roles',
        label: 'Roles',
        options: roleOptions,
        type: 'checkbox-group',
        variant: 'list',
      },
      {
        key: 'plans',
        label: 'Card variant',
        options: planOptions,
        orientation: 'horizontal',
        type: 'checkbox-group',
        variant: 'card',
      },
    ],
    id: 'checkbox-group',
    label: 'Checkbox group',
  },
  {
    description: 'Card-style multi-selection with richer option copy.',
    fields: [
      {
        default: ['starter'],
        key: 'plans',
        label: 'Enabled plans',
        options: planOptions,
        orientation: 'horizontal',
        type: 'checkbox-card',
      },
    ],
    id: 'checkbox-card',
    label: 'Checkbox cards',
  },
  {
    description: 'Searchable, clearable, and multi-select menu behavior.',
    fields: [
      {
        clearable: true,
        key: 'role',
        label: 'Searchable + clear',
        options: roleOptions,
        searchable: true,
        type: 'select',
        validation: required,
      },
      {
        clearable: true,
        key: 'roles',
        label: 'Multiple selection',
        multiple: true,
        options: roleOptions,
        searchable: true,
        type: 'select',
      },
      {
        clearable: true,
        key: 'asyncRole',
        label: 'Async source + refresh',
        options: { allowOptionsRefresh: true, source: loadRoleOptions },
        searchable: true,
        type: 'select',
      },
      {
        clearable: true,
        createItem: { position: 'bottom', when: 'always' },
        key: 'createdRole',
        label: 'Search + create',
        options: {
          create: {
            handler: async ({ label }) => {
              await sleep(350)
              return { label, value: label.toLowerCase().replaceAll(/\s+/g, '-') }
            },
            label: 'Create role',
          },
          source: roleOptions,
        },
        searchable: true,
        type: 'select',
      },
      {
        clearable: true,
        createItem: false,
        key: 'createdRoleButton',
        label: 'Dedicated create action',
        options: {
          create: {
            handler: async ({ label }) => {
              await sleep(500)
              return { label, value: label.toLowerCase().replaceAll(/\s+/g, '-') }
            },
            label: 'Create role',
          },
          source: roleOptions,
        },
        searchable: true,
        type: 'select',
      },
      {
        default: 'owner',
        disabled: () => true,
        key: 'disabled',
        label: 'Disabled',
        options: roleOptions,
        type: 'select',
      },
    ],
    groups: [
      {
        before: 'role',
        description: 'Search, clear, validation, and multiple selection.',
        label: 'Core selection',
      },
      {
        before: 'asyncRole',
        description: 'Remote-like options with pending and refresh states.',
        label: 'Async & refresh',
      },
      {
        before: 'createdRole',
        description: 'Create and immediately select values that are not in the source.',
        label: 'Creation',
      },
      { before: 'disabled', label: 'States' },
    ],
    id: 'select',
    label: 'Select',
  },
  {
    description: 'Manual input, calendar popup placement, clearing, limits, and localization.',
    fields: [
      {
        calendar: { yearRange: [2020, 2035] },
        clearable: true,
        key: 'launchDate',
        label: 'Manual + calendar',
        manualInput: { format: 'dd/MM/yyyy', placeholder: 'dd/mm/yyyy' },
        type: 'date',
        validation: required,
      },
      {
        clearable: true,
        default: '2026-08-20',
        key: 'usDate',
        label: 'MM/DD manual format',
        manualInput: { format: 'MM/dd/yyyy', placeholder: 'mm/dd/yyyy' },
        type: 'date',
      },
      {
        calendar: { monthControls: false, yearControls: false },
        clearable: true,
        key: 'minimalCalendar',
        label: 'Minimal calendar chrome',
        previewFormat: { dateStyle: 'medium' },
        type: 'date',
      },
      {
        clearable: true,
        key: 'boundedDate',
        label: 'Bounded + Date output',
        max: '2026-12-31',
        min: '2026-01-01',
        outputFormat: 'date',
        type: 'date',
      },
    ],
    groups: [
      {
        before: 'launchDate',
        description: 'Typing keeps focus while the anchored calendar remains interactive.',
        label: 'Editable input',
      },
      {
        before: 'usDate',
        description: 'Manual parsing and preview formats are independently authored.',
        label: 'Formatting',
      },
      {
        before: 'minimalCalendar',
        description: 'Month/year controls can be hidden without changing date semantics.',
        label: 'Calendar chrome',
      },
      {
        before: 'boundedDate',
        description: 'Min/max limits and output representation stay schema-controlled.',
        label: 'Constraints & output',
      },
    ],
    id: 'date',
    label: 'Date',
  },
  {
    description: 'Date-time manual controls, popup behavior, and clearing.',
    fields: [
      {
        clearable: true,
        key: 'startsAt',
        label: 'Starts at',
        type: 'datetime',
        validation: required,
      },
      {
        default: '2026-08-20T09:30',
        disabled: () => true,
        key: 'disabled',
        label: 'Disabled',
        type: 'datetime',
      },
    ],
    id: 'datetime',
    label: 'Date-time',
  },
  {
    description: 'Two-ended date range editing, clearing, and responsive layout.',
    fields: [{ clearable: true, key: 'window', label: 'Date window', type: 'daterange' }],
    id: 'daterange',
    label: 'Date range',
  },
  {
    description: 'Month-range editing with compact grouped controls.',
    fields: [{ clearable: true, key: 'period', label: 'Reporting period', type: 'monthrange' }],
    id: 'monthrange',
    label: 'Month range',
  },
  {
    description: 'Start/end date-time editing and grouped sizing behavior.',
    fields: [
      { clearable: true, key: 'window', label: 'Availability window', type: 'datetimerange' },
    ],
    id: 'datetimerange',
    label: 'Date-time range',
  },
  {
    description: 'Month selection and clear behavior.',
    fields: [{ clearable: true, key: 'month', label: 'Billing month', type: 'month' }],
    id: 'month',
    label: 'Month',
  },
  {
    description: 'Bounded year input and clearing.',
    fields: [
      { clearable: true, key: 'year', label: 'Fiscal year', max: 2035, min: 2020, type: 'year' },
    ],
    id: 'year',
    label: 'Year',
  },
  {
    description: 'Time popup placement, minute stepping, bounds, and clear behavior.',
    fields: [
      {
        clearable: true,
        default: '09:30',
        key: 'reviewTime',
        label: 'Review time',
        minuteStep: 15,
        type: 'time',
      },
      {
        key: 'bounded',
        label: 'Business hours',
        max: '18:00',
        min: '08:00',
        minuteStep: 30,
        type: 'time',
      },
    ],
    id: 'time',
    label: 'Time',
  },
  {
    description: 'Country selector, dial code, number formatting, and clear behavior.',
    fields: [
      {
        clearable: true,
        defaultCountryCode: 'FR',
        key: 'phone',
        label: 'National display · international value',
        type: 'phone-number',
      },
      {
        countryCodes: ['FR', 'BE', 'CH'],
        defaultCountryCode: 'FR',
        format: 'e164',
        key: 'restricted',
        label: 'FR / BE / CH only',
        type: 'phone-number',
      },
      {
        clearable: true,
        defaultCountryCode: 'US',
        displayFormat: 'raw',
        key: 'raw',
        label: 'Raw typing · no validity icon',
        type: 'phone-number',
        validityIndicator: false,
      },
      {
        defaultCountryCode: 'FR',
        format: 'e164',
        key: 'mobile',
        label: 'Mobile numbers only',
        numberType: ['MOBILE'],
        type: 'phone-number',
      },
    ],
    groups: [
      {
        before: 'phone',
        description:
          'Valid input formats nationally in-place while the stored value keeps its authored format.',
        label: 'Display vs value',
      },
      {
        before: 'restricted',
        description: 'Country availability and output format are independent controls.',
        label: 'Country policy',
      },
      {
        before: 'raw',
        description: 'Live normalization and validity feedback can both be disabled.',
        label: 'Presentation behavior',
      },
      {
        before: 'mobile',
        description: 'Restrict accepted phone-number types without changing the input UI.',
        label: 'Number policy',
      },
    ],
    id: 'phone-number',
    label: 'Phone number',
  },
  {
    description: 'Stateful non-rendered data and submit omission behavior.',
    fields: [
      { default: 'draft_001', key: 'internalId', type: 'hidden' },
      { default: 'never-submit', key: 'omitted', submit: { omit: true }, type: 'hidden' },
      {
        default: 'Inspect live state below',
        key: 'visibleCompanion',
        label: 'Visible companion',
        type: 'text',
      },
    ],
    id: 'hidden',
    label: 'Hidden',
    notes: [
      'Hidden fields intentionally render no control; inspect the state/output panels to verify behavior.',
    ],
  },
  {
    description: 'Informational content inside the form grid.',
    fields: [
      {
        content: 'This information block should align cleanly with surrounding form content.',
        key: 'info',
        type: 'info',
      },
      {
        key: 'companion',
        label: 'Companion field',
        placeholder: 'Check vertical rhythm',
        type: 'text',
      },
    ],
    id: 'info',
    label: 'Info',
  },
  {
    description: 'Section separators with and without labels.',
    fields: [
      { key: 'before', label: 'Before divider', type: 'text' },
      { key: 'section', label: 'Section title', type: 'divider' },
      { key: 'after', label: 'After divider', type: 'text' },
      { key: 'plainDivider', type: 'divider' },
    ],
    id: 'divider',
    label: 'Divider',
  },
  {
    description: 'Bare child controls joined into one Nuxt UI field group.',
    fields: [
      {
        fields: [
          { key: 'prefix', type: 'text', label: 'Prefix', default: '+33', layout: { span: 2 } },
          {
            key: 'number',
            type: 'text',
            label: 'Phone',
            placeholder: '6 12 34 56 78',
            layout: { span: 6 },
          },
        ],
        key: 'phoneParts',
        label: 'Weighted phone group',
        type: 'input-group',
      },
      {
        fields: [
          {
            key: 'currency',
            type: 'select',
            label: 'Currency',
            options: ['EUR', 'USD', 'GBP'],
            default: 'EUR',
            layout: { span: 2 },
          },
          {
            key: 'amount',
            type: 'number',
            label: 'Amount',
            min: 0,
            step: 10,
            placeholder: '2500',
            layout: { span: 5 },
          },
        ],
        key: 'money',
        label: 'Mixed controls',
        type: 'input-group',
      },
      {
        fields: [
          { key: 'username', type: 'text', label: 'Username', placeholder: 'ada' },
          { key: 'password', type: 'password', label: 'Password', placeholder: 'Secret' },
        ],
        key: 'verticalCredentials',
        label: 'Vertical group',
        orientation: 'vertical',
        type: 'input-group',
      },
    ],
    groups: [
      {
        before: 'phoneParts',
        description:
          'Child spans become actual FieldGroup flex weights instead of arbitrary equal widths.',
        label: 'Weighted layout',
      },
      {
        before: 'money',
        description:
          'Select, number, and other Nuxt UI controls join with native group radii and focus treatment.',
        label: 'Mixed controls',
      },
      {
        before: 'verticalCredentials',
        description: 'The same primitive supports vertical control stacks.',
        label: 'Orientation',
      },
    ],
    id: 'input-group',
    label: 'Input group',
  },
  {
    description: 'Nested state, card presentation, child grid, and validation.',
    fields: [
      {
        fields: [
          { key: 'firstName', type: 'text', label: 'First name', validation: required },
          { key: 'lastName', type: 'text', label: 'Last name', validation: required },
          { key: 'role', type: 'select', label: 'Role', options: roleOptions },
        ],
        key: 'profile',
        label: 'Profile',
        layout: { variant: 'card' },
        type: 'object',
      },
    ],
    id: 'object',
    label: 'Object',
  },
  {
    description: 'Custom rendered content inside field layout and runtime state.',
    fields: [
      {
        default: 'custom-value',
        key: 'custom',
        label: 'Custom renderer',
        render: ({ api }) =>
          h('div', { class: 'rounded-md border border-default bg-muted/30 px-3 py-2 text-sm' }, [
            h('div', { class: 'font-medium text-highlighted' }, 'Custom field renderer'),
            h('div', { class: 'text-muted' }, `Current value: ${String(api.value.get() ?? '—')}`),
          ]),
        type: 'custom-component',
      },
    ],
    id: 'custom-component',
    label: 'Custom component',
  },
  {
    description: 'Single and multiple file selection with accept filters.',
    fields: [
      { accept: 'image/*', key: 'avatar', label: 'Avatar', type: 'file' },
      { accept: '.pdf,.txt', key: 'documents', label: 'Documents', multiple: true, type: 'file' },
    ],
    id: 'file',
    label: 'File',
  },
  {
    description: 'Manual and automatic upload states, progress actions, retry, and deletion.',
    fields: [
      {
        accept: '.pdf,.txt',
        autoUpload: false,
        key: 'document',
        label: 'Manual upload',
        output: 'url',
        type: 'upload',
        upload: {
          handler: async ({ files }) => {
            await new Promise<void>((resolve) => setTimeout(resolve, 450))
            return files[0]
              ? `https://example.test/uploads/${encodeURIComponent(files[0].name)}`
              : null
          },
        },
      },
      {
        accept: 'image/*',
        autoUpload: true,
        key: 'images',
        label: 'Automatic multiple upload',
        multiple: true,
        output: 'object',
        type: 'upload',
        upload: {
          handler: async ({ files }) => {
            await new Promise<void>((resolve) => setTimeout(resolve, 450))
            return files.map((file) => ({
              name: file.name,
              url: `https://example.test/uploads/${encodeURIComponent(file.name)}`,
            }))
          },
        },
      },
    ],
    id: 'upload',
    label: 'Upload',
  },
  {
    description: 'Repeated object cards, add/remove/move controls, labels, and nested validation.',
    fields: [
      {
        addItemLabel: 'Add contact',
        draggable: true,
        fields: [
          { key: 'name', type: 'text', label: 'Name', validation: required },
          { key: 'email', type: 'text', label: 'Email', inputType: 'email' },
          { key: 'role', type: 'select', label: 'Role', options: roleOptions },
        ],
        itemLabel: 'Contact',
        key: 'contacts',
        label: 'Contacts',
        type: 'array-list',
      },
    ],
    id: 'array-list',
    input: { contacts: [{ email: 'ada@example.com', name: 'Ada Lovelace', role: 'owner' }] },
    label: 'Array list',
  },
  {
    description:
      'Compact repeated rows, semantic table layout, nested validation, and row actions.',
    fields: [
      {
        addItemLabel: 'Add row',
        fields: [
          { key: 'label', type: 'text', label: 'Label', validation: required },
          { key: 'quantity', type: 'number', label: 'Quantity', min: 1, default: 1 },
          { key: 'active', type: 'switch', label: 'Active', default: true },
        ],
        key: 'items',
        label: 'Line items',
        type: 'array-table',
      },
    ],
    id: 'array-table',
    input: { items: [{ active: true, label: 'Implementation', quantity: 2 }] },
    label: 'Array table',
  },
  {
    description: 'Repeated objects navigated as tabs with add/remove behavior.',
    fields: [
      {
        addItemLabel: 'Add milestone',
        fields: [
          { key: 'title', type: 'text', label: 'Title', validation: required },
          { key: 'date', type: 'date', label: 'Target date', clearable: true },
        ],
        itemLabel: 'Milestone',
        key: 'milestones',
        label: 'Milestones',
        type: 'array-tabs',
      },
    ],
    id: 'array-tabs',
    input: {
      milestones: [
        { date: '2026-09-15', title: 'Beta' },
        { date: '2026-11-01', title: 'Launch' },
      ],
    },
    label: 'Array tabs',
  },
  {
    description: 'Repeated discriminated items with variant-specific child schemas.',
    fields: [
      {
        addItemLabel: 'Add method',
        key: 'methods',
        label: 'Contact methods',
        type: 'array-variant',
        variantKey: 'kind',
        variants: [
          {
            key: 'email',
            label: 'Email',
            fields: [
              {
                key: 'address',
                type: 'text',
                label: 'Email address',
                inputType: 'email',
                validation: required,
              },
            ],
          },
          {
            key: 'phone',
            label: 'Phone',
            fields: [
              {
                key: 'number',
                type: 'phone-number',
                label: 'Phone number',
                defaultCountryCode: 'FR',
                validation: required,
              },
            ],
          },
        ],
      },
    ],
    id: 'array-variant',
    input: { methods: [{ address: 'ada@example.com', kind: 'email' }] },
    label: 'Array variants',
  },
  {
    description:
      'Popover tree selection, path display, searching, multiple selection, and cascade behavior.',
    fields: [
      {
        clearable: true,
        key: 'team',
        label: 'Team',
        options: hierarchyOptions,
        searchable: true,
        showPath: true,
        type: 'tree-select',
      },
      {
        cascade: true,
        key: 'teams',
        label: 'Multiple teams',
        multiple: true,
        options: hierarchyOptions,
        searchable: true,
        selectionControl: 'checkbox',
        type: 'tree-select',
      },
    ],
    id: 'tree-select',
    label: 'Tree select',
  },
  {
    description: 'Hierarchical cascader popup with path presentation and leaf-only selection.',
    fields: [
      {
        clearable: true,
        key: 'category',
        label: 'Category',
        leafOnly: true,
        options: hierarchyOptions,
        searchable: true,
        separator: ' / ',
        type: 'cascader',
      },
    ],
    id: 'cascader',
    label: 'Cascader',
  },
  {
    description:
      'Inline tree selection, checkbox/radio controls, propagation, and responsive layout.',
    fields: [
      {
        cascade: true,
        key: 'teams',
        label: 'Teams',
        multiple: true,
        options: hierarchyOptions,
        selectionControl: 'checkbox',
        type: 'tree',
      },
      {
        key: 'owner',
        label: 'Single owner group',
        options: hierarchyOptions,
        selectionControl: 'radio',
        type: 'tree',
      },
    ],
    id: 'tree',
    label: 'Tree',
  },
  {
    description: 'Bare grouped child controls with shared field-group sizing.',
    fields: [
      {
        fields: [
          { key: 'code', type: 'text', label: 'Code', placeholder: 'AG-001' },
          { key: 'region', type: 'select', label: 'Region', options: ['EU', 'US', 'APAC'] },
        ],
        key: 'identity',
        label: 'Identity',
        type: 'group',
      },
    ],
    id: 'group',
    label: 'Group',
  },
  {
    description: 'Semantic matrix table with row labels and nested controls.',
    fields: [
      {
        bordered: true,
        fields: [
          { key: 'enabled', type: 'switch', label: 'Enabled', default: false },
          { key: 'scope', type: 'select', label: 'Scope', options: ['read', 'write', 'admin'] },
        ],
        key: 'permissions',
        label: 'Bordered permissions',
        rowHeaderWidth: 180,
        rows: [
          { key: 'catalog', label: 'Catalog' },
          { key: 'orders', label: 'Orders' },
          { key: 'users', label: 'Users' },
        ],
        type: 'matrix',
      },
      {
        bordered: false,
        compact: true,
        fields: [
          { key: 'required', type: 'checkbox', label: 'Required', default: false },
          { key: 'sla', type: 'number', label: 'SLA · days', min: 0, max: 30, default: 2 },
        ],
        hoverable: false,
        key: 'approvalMatrix',
        label: 'Compact striped matrix',
        rowHeaderWidth: '10rem',
        rows: [
          { key: 'finance', label: 'Finance' },
          { key: 'legal', label: 'Legal' },
          { key: 'security', label: 'Security' },
        ],
        striped: true,
        type: 'matrix',
      },
    ],
    groups: [
      {
        before: 'permissions',
        description: 'Semantic row headers stay left-aligned while data controls remain centered.',
        label: 'Bordered matrix',
      },
      {
        before: 'approvalMatrix',
        description:
          'Borders, striping, hover behavior, compact density, and row-label width are authored props.',
        label: 'Presentation variants',
      },
    ],
    id: 'matrix',
    label: 'Matrix',
  },
  {
    description: 'Single and range sliders with tooltips, defaults, and disabled state.',
    fields: [
      {
        default: 65,
        key: 'confidence',
        label: 'Confidence',
        max: 100,
        min: 0,
        step: 5,
        tooltip: true,
        type: 'slider',
      },
      {
        default: [25, 75],
        key: 'range',
        label: 'Range',
        max: 100,
        min: 0,
        multiple: true,
        step: 5,
        tooltip: true,
        type: 'slider',
      },
    ],
    id: 'slider',
    label: 'Slider',
  },
  {
    description: 'Popover, inline, and swatch color editing modes.',
    fields: [
      {
        clearable: true,
        default: '#111827',
        display: 'popover',
        format: 'hex',
        key: 'accent',
        label: 'Input + popover · HEX',
        type: 'color-picker',
      },
      {
        default: 'rgb(124, 58, 237)',
        display: 'inline',
        format: 'rgb',
        key: 'brand',
        label: 'Inline · RGB',
        type: 'color-picker',
      },
      {
        clearable: true,
        default: 'hsl(199, 89%, 48%)',
        display: 'swatch',
        format: 'hsl',
        key: 'swatch',
        label: 'Swatch · HSL',
        type: 'color-picker',
      },
    ],
    groups: [
      {
        before: 'accent',
        description:
          'Popover focus stays in the text input and the panel aligns to its start edge.',
        label: 'Anchored input',
      },
      {
        before: 'brand',
        description: 'Use the picker directly when persistent color editing is appropriate.',
        label: 'Inline editor',
      },
      {
        before: 'swatch',
        description: 'A button-only trigger keeps the same format and size contract.',
        label: 'Compact swatch',
      },
    ],
    id: 'color-picker',
    label: 'Color picker',
  },
  {
    description: 'OTP pin sizing, mask behavior, and validation.',
    fields: [
      {
        key: 'otp',
        label: 'Verification code',
        length: 6,
        otp: true,
        placeholder: '•',
        type: 'one-time-code',
        validation: required,
      },
      {
        inputType: 'number',
        key: 'masked',
        label: 'Masked PIN',
        length: 4,
        mask: true,
        placeholder: '•',
        type: 'one-time-code',
      },
      { key: 'compact', label: 'Short code', length: 4, placeholder: '0', type: 'one-time-code' },
    ],
    groups: [
      {
        before: 'otp',
        description:
          'Single-character placeholders fit the pin cells and preserve native one-time-code semantics.',
        label: 'OTP',
      },
      {
        before: 'masked',
        description: 'Masking and numeric input behavior are independent authored props.',
        label: 'Masked numeric PIN',
      },
      {
        before: 'compact',
        description: 'Cell count and placeholder remain schema-controlled.',
        label: 'Length & placeholder',
      },
    ],
    id: 'one-time-code',
    label: 'One-time code',
  },
  {
    description: 'Token input wrapping, deletion, keyboard behavior, and long-value overflow.',
    fields: [
      {
        default: ['priority', 'customer-facing', 'needs-review'],
        key: 'tags',
        label: 'Tags',
        type: 'tag',
      },
      { key: 'empty', label: 'Empty tags', placeholder: 'Add a tag', type: 'tag' },
    ],
    id: 'tag',
    label: 'Tags',
  },
  {
    description: 'Keyboard-accessible rating control, clear behavior, and custom scale.',
    fields: [
      { clearable: true, default: 3, key: 'quality', label: 'Quality', max: 5, type: 'rating' },
      {
        default: 7,
        icon: 'i-lucide-circle',
        key: 'confidence',
        label: 'Confidence',
        max: 10,
        type: 'rating',
      },
    ],
    id: 'rating',
    label: 'Rating',
  },
  {
    description: 'Stateless form actions with root size propagation and disabled state.',
    fields: [
      {
        icon: 'i-lucide-sparkles',
        key: 'primary',
        label: 'Primary action',
        onClick: async () => {},
        type: 'button',
      },
      {
        color: 'neutral',
        key: 'secondary',
        label: 'Secondary action',
        onClick: async () => {},
        type: 'button',
        variant: 'outline',
      },
      {
        disabled: () => true,
        key: 'disabled',
        label: 'Disabled action',
        onClick: async () => {},
        type: 'button',
      },
    ],
    id: 'button',
    label: 'Button',
  },
  {
    description: 'Passthrough card container, child spacing, and form-grid integration.',
    fields: [
      {
        description: 'Children write at the current form level.',
        fields: [
          { key: 'headline', type: 'text', label: 'Headline', validation: required },
          {
            key: 'status',
            type: 'select',
            label: 'Status',
            options: ['draft', 'review', 'published'],
          },
        ],
        key: 'profileCard',
        label: 'Card passthrough',
        type: 'card',
      },
    ],
    id: 'card',
    label: 'Card',
  },
  {
    description: 'Passthrough vertical layout for grouped content without extra state nesting.',
    fields: [
      {
        fields: [
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'notes', type: 'textarea', label: 'Notes' },
          { key: 'enabled', type: 'switch', label: 'Enabled', default: true },
        ],
        key: 'column',
        label: 'Column passthrough',
        type: 'column',
      },
    ],
    id: 'column',
    label: 'Column',
  },
]

export function getFormFieldPlayground(id: string) {
  return formFieldPlaygrounds.find((definition) => definition.id === id)
}

export function getFormFieldPlaygroundFields(definition: FormFieldPlaygroundDefinition) {
  if (!definition.groups?.length) {
    return definition.fields
  }

  const groupsByField = new Map(definition.groups.map((group) => [group.before, group]))
  return definition.fields.flatMap((field, index): readonly FormField[] => {
    const group = groupsByField.get(field.key)
    if (!group) {
      return [field]
    }

    const section: FormField[] = [
      {
        key: `__playground-section-${index}`,
        label: group.label,
        type: 'divider',
      },
    ]
    if (group.description) {
      section.push({
        content: group.description,
        key: `__playground-section-info-${index}`,
        type: 'info',
      })
    }
    section.push(field)
    return section
  })
}
