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
  { label: 'Starter', value: 'starter', description: 'Simple workflows' },
  { label: 'Scale', value: 'scale', description: 'Team workflows' },
  { label: 'Enterprise', value: 'enterprise', description: 'Advanced governance' },
] as const

const roleOptions = [
  { label: 'Owner', value: 'owner', description: 'Full workspace access' },
  { label: 'Manager', value: 'manager', description: 'Operational access' },
  { label: 'Reviewer', value: 'reviewer', description: 'Read and comment' },
] as const

const hierarchyOptions = [
  {
    label: 'Engineering',
    value: 'engineering',
    children: [
      { label: 'Frontend', value: 'frontend' },
      { label: 'Backend', value: 'backend' },
      { label: 'Platform', value: 'platform' },
    ],
  },
  {
    label: 'Product',
    value: 'product',
    children: [
      { label: 'Product management', value: 'pm' },
      { label: 'Product design', value: 'design' },
    ],
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
    id: 'text',
    label: 'Text',
    description: 'Text inputs, native input types, hints, validation, and disabled state.',
    fields: [
      {
        key: 'name',
        type: 'text',
        label: 'Name',
        placeholder: 'Ada Lovelace',
        validation: required,
      },
      {
        key: 'email',
        type: 'text',
        inputType: 'email',
        label: 'Email',
        placeholder: 'ada@example.com',
      },
      {
        key: 'disabled',
        type: 'text',
        label: 'Disabled',
        default: 'Read only',
        disabled: () => true,
      },
    ],
  },
  {
    id: 'password',
    label: 'Password',
    description: 'Password visibility controls, validation, and sizing.',
    fields: [
      {
        key: 'password',
        type: 'password',
        label: 'Default reveal control',
        placeholder: 'Enter a password',
        validation: required,
      },
      {
        key: 'fixed',
        type: 'password',
        label: 'Reveal disabled',
        placeholder: 'Always masked',
        visibilityToggle: false,
      },
      {
        key: 'customReveal',
        type: 'password',
        label: 'Custom reveal affordance',
        default: 'secret-value',
        visibilityToggle: {
          showIcon: 'i-lucide-scan-eye',
          hideIcon: 'i-lucide-eye-closed',
          showLabel: 'Preview secret',
          hideLabel: 'Mask secret',
        },
      },
      {
        key: 'disabled',
        type: 'password',
        label: 'Disabled',
        default: 'secret-value',
        disabled: () => true,
      },
    ],
    groups: [
      {
        label: 'Visibility behavior',
        description: 'Default reveal, disabled reveal, and authored reveal controls.',
        before: 'password',
      },
      {
        label: 'States',
        description: 'Disabled controls keep the same geometry and affordances.',
        before: 'disabled',
      },
    ],
  },
  {
    id: 'textarea',
    label: 'Textarea',
    description: 'Long-form input, placeholder behavior, validation, and disabled state.',
    fields: [
      {
        key: 'summary',
        type: 'textarea',
        label: 'Summary',
        placeholder: 'Describe the change…',
        validation: required,
      },
      {
        key: 'disabled',
        type: 'textarea',
        label: 'Disabled',
        default: 'This content is locked.',
        disabled: () => true,
      },
    ],
  },
  {
    id: 'number',
    label: 'Number',
    description: 'Numeric stepping, min/max constraints, defaults, and disabled state.',
    fields: [
      { key: 'seats', type: 'number', label: 'Seats', min: 1, max: 100, step: 1, default: 12 },
      { key: 'budget', type: 'number', label: 'Budget', min: 0, step: 250, placeholder: '5000' },
      { key: 'disabled', type: 'number', label: 'Disabled', default: 42, disabled: () => true },
    ],
  },
  {
    id: 'auto-complete',
    label: 'Autocomplete',
    description: 'Searchable option input, multiple selection, creation, and clear behavior.',
    fields: [
      {
        key: 'role',
        type: 'auto-complete',
        label: 'Search + clear',
        options: roleOptions,
        clearable: true,
      },
      {
        key: 'roles',
        type: 'auto-complete',
        label: 'Multiple values',
        options: roleOptions,
        multiple: true,
        clearable: true,
      },
      {
        key: 'asyncRole',
        type: 'auto-complete',
        label: 'Async + refresh',
        clearable: true,
        options: { source: loadRoleOptions, allowOptionsRefresh: true },
      },
      {
        key: 'createdRole',
        type: 'auto-complete',
        label: 'Search + create',
        clearable: true,
        createItem: 'always',
        options: {
          source: roleOptions,
          create: {
            label: 'Create role',
            handler: async ({ label }) => {
              await sleep(350)
              return { label, value: label.toLowerCase().replaceAll(/\s+/g, '-') }
            },
          },
        },
      },
      {
        key: 'createdRoleButton',
        type: 'auto-complete',
        label: 'Dedicated create action',
        clearable: true,
        createItem: false,
        options: {
          source: roleOptions,
          create: {
            label: 'Create role',
            handler: async ({ label }) => {
              await sleep(500)
              return { label, value: label.toLowerCase().replaceAll(/\s+/g, '-') }
            },
          },
        },
      },
    ],
    groups: [
      {
        label: 'Selection modes',
        description: 'Single and multiple autocomplete behavior.',
        before: 'role',
      },
      {
        label: 'Async options',
        description: 'Promise-backed options expose loading and an explicit refresh action.',
        before: 'asyncRole',
      },
      {
        label: 'Creation',
        description: 'Missing values can be authored from the search term.',
        before: 'createdRole',
      },
    ],
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    description: 'Boolean checkbox alignment with labels, descriptions, and disabled state.',
    fields: [
      {
        key: 'terms',
        type: 'checkbox',
        label: 'Accept the terms',
        description: 'Required before continuing.',
        validation: required,
      },
      { key: 'marketing', type: 'checkbox', label: 'Product updates', default: true },
      {
        key: 'disabled',
        type: 'checkbox',
        label: 'Disabled option',
        default: true,
        disabled: () => true,
      },
    ],
  },
  {
    id: 'switch',
    label: 'Switch',
    description: 'Boolean and custom-value switches with icons, loading, and disabled states.',
    fields: [
      {
        key: 'autosave',
        type: 'switch',
        label: 'Autosave',
        default: true,
        checkedIcon: 'i-lucide-check',
        uncheckedIcon: 'i-lucide-x',
      },
      { key: 'notifications', type: 'switch', label: 'Notifications', default: false },
      { key: 'disabled', type: 'switch', label: 'Disabled', default: true, disabled: () => true },
    ],
  },
  {
    id: 'switch-group',
    label: 'Switch group',
    description: 'Option-driven switch groups in vertical and horizontal layouts.',
    fields: [
      {
        key: 'alerts',
        type: 'switch-group',
        label: 'Alerts',
        options: roleOptions,
        orientation: 'vertical',
        default: ['owner'],
      },
      {
        key: 'compact',
        type: 'switch-group',
        label: 'Horizontal',
        options: planOptions,
        orientation: 'horizontal',
      },
    ],
  },
  {
    id: 'radio',
    label: 'Radio',
    description: 'Single-choice radio options with labels, descriptions, and validation.',
    fields: [
      { key: 'plan', type: 'radio', label: 'Plan', options: planOptions, validation: required },
      {
        key: 'disabled',
        type: 'radio',
        label: 'Disabled',
        options: planOptions,
        default: 'starter',
        disabled: () => true,
      },
    ],
  },
  {
    id: 'radio-card',
    label: 'Radio cards',
    description: 'Card-style single selection with horizontal and vertical presentations.',
    fields: [
      {
        key: 'plan',
        type: 'radio-card',
        label: 'Plan',
        options: planOptions,
        orientation: 'horizontal',
        validation: required,
      },
      {
        key: 'fallback',
        type: 'radio-card',
        label: 'Vertical',
        options: planOptions,
        orientation: 'vertical',
        default: 'scale',
      },
    ],
  },
  {
    id: 'checkbox-group',
    label: 'Checkbox group',
    description: 'Multi-choice option groups across list, card, and horizontal layouts.',
    fields: [
      {
        key: 'roles',
        type: 'checkbox-group',
        label: 'Roles',
        options: roleOptions,
        variant: 'list',
        default: ['manager'],
      },
      {
        key: 'plans',
        type: 'checkbox-group',
        label: 'Card variant',
        options: planOptions,
        variant: 'card',
        orientation: 'horizontal',
      },
    ],
  },
  {
    id: 'checkbox-card',
    label: 'Checkbox cards',
    description: 'Card-style multi-selection with richer option copy.',
    fields: [
      {
        key: 'plans',
        type: 'checkbox-card',
        label: 'Enabled plans',
        options: planOptions,
        orientation: 'horizontal',
        default: ['starter'],
      },
    ],
  },
  {
    id: 'select',
    label: 'Select',
    description: 'Searchable, clearable, and multi-select menu behavior.',
    fields: [
      {
        key: 'role',
        type: 'select',
        label: 'Searchable + clear',
        options: roleOptions,
        searchable: true,
        clearable: true,
        validation: required,
      },
      {
        key: 'roles',
        type: 'select',
        label: 'Multiple selection',
        options: roleOptions,
        searchable: true,
        multiple: true,
        clearable: true,
      },
      {
        key: 'asyncRole',
        type: 'select',
        label: 'Async source + refresh',
        searchable: true,
        clearable: true,
        options: { source: loadRoleOptions, allowOptionsRefresh: true },
      },
      {
        key: 'createdRole',
        type: 'select',
        label: 'Search + create',
        searchable: true,
        clearable: true,
        createItem: { position: 'bottom', when: 'always' },
        options: {
          source: roleOptions,
          create: {
            label: 'Create role',
            handler: async ({ label }) => {
              await sleep(350)
              return { label, value: label.toLowerCase().replaceAll(/\s+/g, '-') }
            },
          },
        },
      },
      {
        key: 'createdRoleButton',
        type: 'select',
        label: 'Dedicated create action',
        searchable: true,
        clearable: true,
        createItem: false,
        options: {
          source: roleOptions,
          create: {
            label: 'Create role',
            handler: async ({ label }) => {
              await sleep(500)
              return { label, value: label.toLowerCase().replaceAll(/\s+/g, '-') }
            },
          },
        },
      },
      {
        key: 'disabled',
        type: 'select',
        label: 'Disabled',
        options: roleOptions,
        default: 'owner',
        disabled: () => true,
      },
    ],
    groups: [
      {
        label: 'Core selection',
        description: 'Search, clear, validation, and multiple selection.',
        before: 'role',
      },
      {
        label: 'Async & refresh',
        description: 'Remote-like options with pending and refresh states.',
        before: 'asyncRole',
      },
      {
        label: 'Creation',
        description: 'Create and immediately select values that are not in the source.',
        before: 'createdRole',
      },
      { label: 'States', before: 'disabled' },
    ],
  },
  {
    id: 'date',
    label: 'Date',
    description: 'Manual input, calendar popup placement, clearing, limits, and localization.',
    fields: [
      {
        key: 'launchDate',
        type: 'date',
        label: 'Manual + calendar',
        clearable: true,
        manualInput: { format: 'dd/MM/yyyy', placeholder: 'dd/mm/yyyy' },
        calendar: { yearRange: [2020, 2035] },
        validation: required,
      },
      {
        key: 'usDate',
        type: 'date',
        label: 'MM/DD manual format',
        clearable: true,
        manualInput: { format: 'MM/dd/yyyy', placeholder: 'mm/dd/yyyy' },
        default: '2026-08-20',
      },
      {
        key: 'minimalCalendar',
        type: 'date',
        label: 'Minimal calendar chrome',
        clearable: true,
        calendar: { monthControls: false, yearControls: false },
        previewFormat: { dateStyle: 'medium' },
      },
      {
        key: 'boundedDate',
        type: 'date',
        label: 'Bounded + Date output',
        min: '2026-01-01',
        max: '2026-12-31',
        outputFormat: 'date',
        clearable: true,
      },
    ],
    groups: [
      {
        label: 'Editable input',
        description: 'Typing keeps focus while the anchored calendar remains interactive.',
        before: 'launchDate',
      },
      {
        label: 'Formatting',
        description: 'Manual parsing and preview formats are independently authored.',
        before: 'usDate',
      },
      {
        label: 'Calendar chrome',
        description: 'Month/year controls can be hidden without changing date semantics.',
        before: 'minimalCalendar',
      },
      {
        label: 'Constraints & output',
        description: 'Min/max limits and output representation stay schema-controlled.',
        before: 'boundedDate',
      },
    ],
  },
  {
    id: 'datetime',
    label: 'Date-time',
    description: 'Date-time manual controls, popup behavior, and clearing.',
    fields: [
      {
        key: 'startsAt',
        type: 'datetime',
        label: 'Starts at',
        clearable: true,
        validation: required,
      },
      {
        key: 'disabled',
        type: 'datetime',
        label: 'Disabled',
        default: '2026-08-20T09:30',
        disabled: () => true,
      },
    ],
  },
  {
    id: 'daterange',
    label: 'Date range',
    description: 'Two-ended date range editing, clearing, and responsive layout.',
    fields: [{ key: 'window', type: 'daterange', label: 'Date window', clearable: true }],
  },
  {
    id: 'monthrange',
    label: 'Month range',
    description: 'Month-range editing with compact grouped controls.',
    fields: [{ key: 'period', type: 'monthrange', label: 'Reporting period', clearable: true }],
  },
  {
    id: 'datetimerange',
    label: 'Date-time range',
    description: 'Start/end date-time editing and grouped sizing behavior.',
    fields: [
      { key: 'window', type: 'datetimerange', label: 'Availability window', clearable: true },
    ],
  },
  {
    id: 'month',
    label: 'Month',
    description: 'Month selection and clear behavior.',
    fields: [{ key: 'month', type: 'month', label: 'Billing month', clearable: true }],
  },
  {
    id: 'year',
    label: 'Year',
    description: 'Bounded year input and clearing.',
    fields: [
      { key: 'year', type: 'year', label: 'Fiscal year', min: 2020, max: 2035, clearable: true },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    description: 'Time popup placement, minute stepping, bounds, and clear behavior.',
    fields: [
      {
        key: 'reviewTime',
        type: 'time',
        label: 'Review time',
        default: '09:30',
        minuteStep: 15,
        clearable: true,
      },
      {
        key: 'bounded',
        type: 'time',
        label: 'Business hours',
        min: '08:00',
        max: '18:00',
        minuteStep: 30,
      },
    ],
  },
  {
    id: 'phone-number',
    label: 'Phone number',
    description: 'Country selector, dial code, number formatting, and clear behavior.',
    fields: [
      {
        key: 'phone',
        type: 'phone-number',
        label: 'National display · international value',
        defaultCountryCode: 'FR',
        clearable: true,
      },
      {
        key: 'restricted',
        type: 'phone-number',
        label: 'FR / BE / CH only',
        countryCodes: ['FR', 'BE', 'CH'],
        defaultCountryCode: 'FR',
        format: 'e164',
      },
      {
        key: 'raw',
        type: 'phone-number',
        label: 'Raw typing · no validity icon',
        defaultCountryCode: 'US',
        displayFormat: 'raw',
        validityIndicator: false,
        clearable: true,
      },
      {
        key: 'mobile',
        type: 'phone-number',
        label: 'Mobile numbers only',
        defaultCountryCode: 'FR',
        numberType: ['MOBILE'],
        format: 'e164',
      },
    ],
    groups: [
      {
        label: 'Display vs value',
        description:
          'Valid input formats nationally in-place while the stored value keeps its authored format.',
        before: 'phone',
      },
      {
        label: 'Country policy',
        description: 'Country availability and output format are independent controls.',
        before: 'restricted',
      },
      {
        label: 'Presentation behavior',
        description: 'Live normalization and validity feedback can both be disabled.',
        before: 'raw',
      },
      {
        label: 'Number policy',
        description: 'Restrict accepted phone-number types without changing the input UI.',
        before: 'mobile',
      },
    ],
  },
  {
    id: 'hidden',
    label: 'Hidden',
    description: 'Stateful non-rendered data and submit omission behavior.',
    fields: [
      { key: 'internalId', type: 'hidden', default: 'draft_001' },
      { key: 'omitted', type: 'hidden', default: 'never-submit', submit: { omit: true } },
      {
        key: 'visibleCompanion',
        type: 'text',
        label: 'Visible companion',
        default: 'Inspect live state below',
      },
    ],
    notes: [
      'Hidden fields intentionally render no control; inspect the state/output panels to verify behavior.',
    ],
  },
  {
    id: 'info',
    label: 'Info',
    description: 'Informational content inside the form grid.',
    fields: [
      {
        key: 'info',
        type: 'info',
        content: 'This information block should align cleanly with surrounding form content.',
      },
      {
        key: 'companion',
        type: 'text',
        label: 'Companion field',
        placeholder: 'Check vertical rhythm',
      },
    ],
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Section separators with and without labels.',
    fields: [
      { key: 'before', type: 'text', label: 'Before divider' },
      { key: 'section', type: 'divider', label: 'Section title' },
      { key: 'after', type: 'text', label: 'After divider' },
      { key: 'plainDivider', type: 'divider' },
    ],
  },
  {
    id: 'input-group',
    label: 'Input group',
    description: 'Bare child controls joined into one Nuxt UI field group.',
    fields: [
      {
        key: 'phoneParts',
        type: 'input-group',
        label: 'Weighted phone group',
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
      },
      {
        key: 'money',
        type: 'input-group',
        label: 'Mixed controls',
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
      },
      {
        key: 'verticalCredentials',
        type: 'input-group',
        label: 'Vertical group',
        orientation: 'vertical',
        fields: [
          { key: 'username', type: 'text', label: 'Username', placeholder: 'ada' },
          { key: 'password', type: 'password', label: 'Password', placeholder: 'Secret' },
        ],
      },
    ],
    groups: [
      {
        label: 'Weighted layout',
        description:
          'Child spans become actual FieldGroup flex weights instead of arbitrary equal widths.',
        before: 'phoneParts',
      },
      {
        label: 'Mixed controls',
        description:
          'Select, number, and other Nuxt UI controls join with native group radii and focus treatment.',
        before: 'money',
      },
      {
        label: 'Orientation',
        description: 'The same primitive supports vertical control stacks.',
        before: 'verticalCredentials',
      },
    ],
  },
  {
    id: 'object',
    label: 'Object',
    description: 'Nested state, card presentation, child grid, and validation.',
    fields: [
      {
        key: 'profile',
        type: 'object',
        label: 'Profile',
        layout: { variant: 'card' },
        fields: [
          { key: 'firstName', type: 'text', label: 'First name', validation: required },
          { key: 'lastName', type: 'text', label: 'Last name', validation: required },
          { key: 'role', type: 'select', label: 'Role', options: roleOptions },
        ],
      },
    ],
  },
  {
    id: 'custom-component',
    label: 'Custom component',
    description: 'Custom rendered content inside field layout and runtime state.',
    fields: [
      {
        key: 'custom',
        type: 'custom-component',
        label: 'Custom renderer',
        default: 'custom-value',
        render: ({ api }) =>
          h('div', { class: 'rounded-md border border-default bg-muted/30 px-3 py-2 text-sm' }, [
            h('div', { class: 'font-medium text-highlighted' }, 'Custom field renderer'),
            h('div', { class: 'text-muted' }, `Current value: ${String(api.value.get() ?? '—')}`),
          ]),
      },
    ],
  },
  {
    id: 'file',
    label: 'File',
    description: 'Single and multiple file selection with accept filters.',
    fields: [
      { key: 'avatar', type: 'file', label: 'Avatar', accept: 'image/*' },
      { key: 'documents', type: 'file', label: 'Documents', accept: '.pdf,.txt', multiple: true },
    ],
  },
  {
    id: 'upload',
    label: 'Upload',
    description: 'Manual and automatic upload states, progress actions, retry, and deletion.',
    fields: [
      {
        key: 'document',
        type: 'upload',
        label: 'Manual upload',
        output: 'url',
        accept: '.pdf,.txt',
        autoUpload: false,
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
        key: 'images',
        type: 'upload',
        label: 'Automatic multiple upload',
        output: 'object',
        accept: 'image/*',
        multiple: true,
        autoUpload: true,
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
  },
  {
    id: 'array-list',
    label: 'Array list',
    description: 'Repeated object cards, add/remove/move controls, labels, and nested validation.',
    fields: [
      {
        key: 'contacts',
        type: 'array-list',
        label: 'Contacts',
        itemLabel: 'Contact',
        addItemLabel: 'Add contact',
        draggable: true,
        fields: [
          { key: 'name', type: 'text', label: 'Name', validation: required },
          { key: 'email', type: 'text', label: 'Email', inputType: 'email' },
          { key: 'role', type: 'select', label: 'Role', options: roleOptions },
        ],
      },
    ],
    input: { contacts: [{ name: 'Ada Lovelace', email: 'ada@example.com', role: 'owner' }] },
  },
  {
    id: 'array-table',
    label: 'Array table',
    description:
      'Compact repeated rows, semantic table layout, nested validation, and row actions.',
    fields: [
      {
        key: 'items',
        type: 'array-table',
        label: 'Line items',
        addItemLabel: 'Add row',
        fields: [
          { key: 'label', type: 'text', label: 'Label', validation: required },
          { key: 'quantity', type: 'number', label: 'Quantity', min: 1, default: 1 },
          { key: 'active', type: 'switch', label: 'Active', default: true },
        ],
      },
    ],
    input: { items: [{ label: 'Implementation', quantity: 2, active: true }] },
  },
  {
    id: 'array-tabs',
    label: 'Array tabs',
    description: 'Repeated objects navigated as tabs with add/remove behavior.',
    fields: [
      {
        key: 'milestones',
        type: 'array-tabs',
        label: 'Milestones',
        itemLabel: 'Milestone',
        addItemLabel: 'Add milestone',
        fields: [
          { key: 'title', type: 'text', label: 'Title', validation: required },
          { key: 'date', type: 'date', label: 'Target date', clearable: true },
        ],
      },
    ],
    input: {
      milestones: [
        { title: 'Beta', date: '2026-09-15' },
        { title: 'Launch', date: '2026-11-01' },
      ],
    },
  },
  {
    id: 'array-variant',
    label: 'Array variants',
    description: 'Repeated discriminated items with variant-specific child schemas.',
    fields: [
      {
        key: 'methods',
        type: 'array-variant',
        label: 'Contact methods',
        variantKey: 'kind',
        addItemLabel: 'Add method',
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
    input: { methods: [{ kind: 'email', address: 'ada@example.com' }] },
  },
  {
    id: 'tree-select',
    label: 'Tree select',
    description:
      'Popover tree selection, path display, searching, multiple selection, and cascade behavior.',
    fields: [
      {
        key: 'team',
        type: 'tree-select',
        label: 'Team',
        options: hierarchyOptions,
        searchable: true,
        clearable: true,
        showPath: true,
      },
      {
        key: 'teams',
        type: 'tree-select',
        label: 'Multiple teams',
        options: hierarchyOptions,
        searchable: true,
        multiple: true,
        selectionControl: 'checkbox',
        cascade: true,
      },
    ],
  },
  {
    id: 'cascader',
    label: 'Cascader',
    description: 'Hierarchical cascader popup with path presentation and leaf-only selection.',
    fields: [
      {
        key: 'category',
        type: 'cascader',
        label: 'Category',
        options: hierarchyOptions,
        searchable: true,
        clearable: true,
        leafOnly: true,
        separator: ' / ',
      },
    ],
  },
  {
    id: 'tree',
    label: 'Tree',
    description:
      'Inline tree selection, checkbox/radio controls, propagation, and responsive layout.',
    fields: [
      {
        key: 'teams',
        type: 'tree',
        label: 'Teams',
        options: hierarchyOptions,
        multiple: true,
        selectionControl: 'checkbox',
        cascade: true,
      },
      {
        key: 'owner',
        type: 'tree',
        label: 'Single owner group',
        options: hierarchyOptions,
        selectionControl: 'radio',
      },
    ],
  },
  {
    id: 'group',
    label: 'Group',
    description: 'Bare grouped child controls with shared field-group sizing.',
    fields: [
      {
        key: 'identity',
        type: 'group',
        label: 'Identity',
        fields: [
          { key: 'code', type: 'text', label: 'Code', placeholder: 'AG-001' },
          { key: 'region', type: 'select', label: 'Region', options: ['EU', 'US', 'APAC'] },
        ],
      },
    ],
  },
  {
    id: 'matrix',
    label: 'Matrix',
    description: 'Semantic matrix table with row labels and nested controls.',
    fields: [
      {
        key: 'permissions',
        type: 'matrix',
        label: 'Bordered permissions',
        bordered: true,
        rowHeaderWidth: 180,
        rows: [
          { key: 'catalog', label: 'Catalog' },
          { key: 'orders', label: 'Orders' },
          { key: 'users', label: 'Users' },
        ],
        fields: [
          { key: 'enabled', type: 'switch', label: 'Enabled', default: false },
          { key: 'scope', type: 'select', label: 'Scope', options: ['read', 'write', 'admin'] },
        ],
      },
      {
        key: 'approvalMatrix',
        type: 'matrix',
        label: 'Compact striped matrix',
        bordered: false,
        striped: true,
        compact: true,
        hoverable: false,
        rowHeaderWidth: '10rem',
        rows: [
          { key: 'finance', label: 'Finance' },
          { key: 'legal', label: 'Legal' },
          { key: 'security', label: 'Security' },
        ],
        fields: [
          { key: 'required', type: 'checkbox', label: 'Required', default: false },
          { key: 'sla', type: 'number', label: 'SLA · days', min: 0, max: 30, default: 2 },
        ],
      },
    ],
    groups: [
      {
        label: 'Bordered matrix',
        description: 'Semantic row headers stay left-aligned while data controls remain centered.',
        before: 'permissions',
      },
      {
        label: 'Presentation variants',
        description:
          'Borders, striping, hover behavior, compact density, and row-label width are authored props.',
        before: 'approvalMatrix',
      },
    ],
  },
  {
    id: 'slider',
    label: 'Slider',
    description: 'Single and range sliders with tooltips, defaults, and disabled state.',
    fields: [
      {
        key: 'confidence',
        type: 'slider',
        label: 'Confidence',
        min: 0,
        max: 100,
        step: 5,
        default: 65,
        tooltip: true,
      },
      {
        key: 'range',
        type: 'slider',
        label: 'Range',
        min: 0,
        max: 100,
        step: 5,
        multiple: true,
        default: [25, 75],
        tooltip: true,
      },
    ],
  },
  {
    id: 'color-picker',
    label: 'Color picker',
    description: 'Popover, inline, and swatch color editing modes.',
    fields: [
      {
        key: 'accent',
        type: 'color-picker',
        label: 'Input + popover · HEX',
        display: 'popover',
        format: 'hex',
        default: '#111827',
        clearable: true,
      },
      {
        key: 'brand',
        type: 'color-picker',
        label: 'Inline · RGB',
        display: 'inline',
        format: 'rgb',
        default: 'rgb(124, 58, 237)',
      },
      {
        key: 'swatch',
        type: 'color-picker',
        label: 'Swatch · HSL',
        display: 'swatch',
        format: 'hsl',
        default: 'hsl(199, 89%, 48%)',
        clearable: true,
      },
    ],
    groups: [
      {
        label: 'Anchored input',
        description:
          'Popover focus stays in the text input and the panel aligns to its start edge.',
        before: 'accent',
      },
      {
        label: 'Inline editor',
        description: 'Use the picker directly when persistent color editing is appropriate.',
        before: 'brand',
      },
      {
        label: 'Compact swatch',
        description: 'A button-only trigger keeps the same format and size contract.',
        before: 'swatch',
      },
    ],
  },
  {
    id: 'one-time-code',
    label: 'One-time code',
    description: 'OTP pin sizing, mask behavior, and validation.',
    fields: [
      {
        key: 'otp',
        type: 'one-time-code',
        label: 'Verification code',
        length: 6,
        otp: true,
        placeholder: '•',
        validation: required,
      },
      {
        key: 'masked',
        type: 'one-time-code',
        label: 'Masked PIN',
        length: 4,
        mask: true,
        inputType: 'number',
        placeholder: '•',
      },
      { key: 'compact', type: 'one-time-code', label: 'Short code', length: 4, placeholder: '0' },
    ],
    groups: [
      {
        label: 'OTP',
        description:
          'Single-character placeholders fit the pin cells and preserve native one-time-code semantics.',
        before: 'otp',
      },
      {
        label: 'Masked numeric PIN',
        description: 'Masking and numeric input behavior are independent authored props.',
        before: 'masked',
      },
      {
        label: 'Length & placeholder',
        description: 'Cell count and placeholder remain schema-controlled.',
        before: 'compact',
      },
    ],
  },
  {
    id: 'tag',
    label: 'Tags',
    description: 'Token input wrapping, deletion, keyboard behavior, and long-value overflow.',
    fields: [
      {
        key: 'tags',
        type: 'tag',
        label: 'Tags',
        default: ['priority', 'customer-facing', 'needs-review'],
      },
      { key: 'empty', type: 'tag', label: 'Empty tags', placeholder: 'Add a tag' },
    ],
  },
  {
    id: 'rating',
    label: 'Rating',
    description: 'Keyboard-accessible rating control, clear behavior, and custom scale.',
    fields: [
      { key: 'quality', type: 'rating', label: 'Quality', max: 5, default: 3, clearable: true },
      {
        key: 'confidence',
        type: 'rating',
        label: 'Confidence',
        max: 10,
        default: 7,
        icon: 'i-lucide-circle',
      },
    ],
  },
  {
    id: 'button',
    label: 'Button',
    description: 'Stateless form actions with root size propagation and disabled state.',
    fields: [
      {
        key: 'primary',
        type: 'button',
        label: 'Primary action',
        icon: 'i-lucide-sparkles',
        onClick: async () => {},
      },
      {
        key: 'secondary',
        type: 'button',
        label: 'Secondary action',
        color: 'neutral',
        variant: 'outline',
        onClick: async () => {},
      },
      {
        key: 'disabled',
        type: 'button',
        label: 'Disabled action',
        disabled: () => true,
        onClick: async () => {},
      },
    ],
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Passthrough card container, child spacing, and form-grid integration.',
    fields: [
      {
        key: 'profileCard',
        type: 'card',
        label: 'Card passthrough',
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
      },
    ],
  },
  {
    id: 'column',
    label: 'Column',
    description: 'Passthrough vertical layout for grouped content without extra state nesting.',
    fields: [
      {
        key: 'column',
        type: 'column',
        label: 'Column passthrough',
        fields: [
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'notes', type: 'textarea', label: 'Notes' },
          { key: 'enabled', type: 'switch', label: 'Enabled', default: true },
        ],
      },
    ],
  },
]

export function getFormFieldPlayground(id: string) {
  return formFieldPlaygrounds.find((definition) => definition.id === id)
}

export function getFormFieldPlaygroundFields(definition: FormFieldPlaygroundDefinition) {
  if (!definition.groups?.length) return definition.fields

  const groupsByField = new Map(definition.groups.map((group) => [group.before, group]))
  return definition.fields.flatMap((field, index): readonly FormField[] => {
    const group = groupsByField.get(field.key)
    if (!group) return [field]

    const section: FormField[] = [
      {
        key: `__playground-section-${index}`,
        type: 'divider',
        label: group.label,
      },
    ]
    if (group.description) {
      section.push({
        key: `__playground-section-info-${index}`,
        type: 'info',
        content: group.description,
      })
    }
    section.push(field)
    return section
  })
}
