# Public API Proposal

This document proposes concrete public API shapes for the V2 form runtime.

The goal is not to lock implementation details yet.
The goal is to compare authoring ergonomics through practical examples.

## Design Goals

The public API should:

- stay schema-first
- preserve strong inferred output types
- support nested scopes and stepped forms
- support both plain promise async resolvers and TanStack Query
- make dependencies typed and teachable
- keep field-specific property ownership sharp
- provide a clean global field-property/default layer

## Shared Vocabulary Used In Examples

To make the examples concrete, the proposals below assume a few helper concepts.

These are illustrative, not final:

- `defineFormSchema(...)`
- `field.text(...)`, `field.select(...)`, `field.group(...)`, `field.array(...)`
- `dep.root(...)`
- `dep.parent(...)`
- `dep.previous(...)`
- `asyncOptions(...)`
- `queryOptions(...)`
- `defineFormConfig(...)`

## Proposal A

## Object-literal schema with typed helper functions

This keeps the legacy feel the closest:

- object-first
- arrays of field objects
- explicit field `key`
- helpers only where typing is needed most

This is currently the strongest candidate.

### Basic form

```ts
const userForm = defineFormSchema({
  key: 'user-profile',
  title: 'Edit profile',
  fields: [
    field.text('firstName', {
      label: 'First name',
      required: true,
    }),
    field.text('lastName', {
      label: 'Last name',
      required: true,
    }),
    field.select('role', {
      label: 'Role',
      required: true,
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Member', value: 'MEMBER' },
      ],
    }),
  ],
})
```

Behavior:

- output type is inferred from field definitions
- literal option values become literal output unions
- field-specific props are only accepted on the matching field kind

### Nested object scope

```ts
const addressForm = defineFormSchema({
  key: 'address',
  fields: [
    field.group('address', {
      label: 'Address',
      fields: [
        field.select('country', {
          label: 'Country',
          required: true,
          options: asyncOptions({
            resolve: async () => getCountries(),
          }),
        }),
        field.text('city', {
          label: 'City',
          required: true,
        }),
        field.text('postalCode', {
          label: 'Postal code',
          required: true,
        }),
      ],
    }),
  ],
})
```

Behavior:

- children are scoped under `address`
- local sibling dependencies resolve against that scope
- `api.getValue(dep.root("address.country"))` stays typed

### Typed dependencies

```ts
const organisationForm = defineFormSchema({
  key: 'organisation',
  fields: [
    field.select('type', {
      label: 'Organisation type',
      required: true,
      options: [
        { label: 'Company', value: 'COMPANY' },
        { label: 'Individual', value: 'INDIVIDUAL' },
      ],
    }),
    field.text('companyName', {
      label: 'Company name',
      dependencies: {
        type: dep.previous('type'),
      },
      condition: ({ deps }) => deps.type === 'COMPANY',
      required: ({ deps }) => deps.type === 'COMPANY',
    }),
  ],
})
```

Behavior:

- `deps.type` is inferred as `"COMPANY" | "INDIVIDUAL"`
- forward references are rejected
- `dep.previous("type")` only works for fields defined earlier in the same scope

### Parent-scope dependencies

```ts
const contactsForm = defineFormSchema({
  key: 'contacts',
  fields: [
    field.group('email', {
      label: 'Email',
      fields: [
        field.text('value', {
          required: true,
          disabled: true,
        }),
        field.button('edit', {
          text: 'Edit',
          dependencies: {
            email: dep.parent('value'),
          },
          action: ({ deps }) => openEmailUpdateDialog({ currentEmail: deps.email }),
        }),
      ],
      input: {
        preformat: (value: string) => ({ value }),
        transform: (value: { value: string }) => value.value,
      },
    }),
  ],
})
```

Behavior:

- `dep.parent("value")` means "the current parent object scope"
- `deps.email` is inferred from the sibling field output in that parent scope
- grouped input/output reshaping is explicit under `input`

### Ancestor traversal

```ts
const vehicleSearchForm = defineFormSchema({
  key: 'vehicle-search',
  fields: [
    field.group('search', {
      fields: [
        field.radio('hasRegistration', {
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          defaultValue: true,
        }),
        field.group('query', {
          dependencies: {
            hasRegistration: dep.parent('hasRegistration'),
          },
          fields: [
            field.text('value', {
              dependencies: {
                hasRegistration: dep.parent(1, 'hasRegistration'),
              },
              props: ({ deps }) => ({
                mask: deps.hasRegistration ? 'AA-123-AA' : 'VIN################',
              }),
            }),
          ],
        }),
      ],
    }),
  ],
})
```

Behavior:

- `dep.parent(1, "hasRegistration")` explicitly climbs one extra ancestor
- this preserves legacy `$parent:1` power, but with typed helpers

### Async options with plain promises

```ts
const cityForm = defineFormSchema({
  key: 'city',
  fields: [
    field.select('country', {
      label: 'Country',
      required: true,
      options: asyncOptions({
        resolve: async () => getCountries(),
      }),
    }),
    field.autoComplete('city', {
      label: 'City',
      dependencies: {
        country: dep.previous('country'),
        query: dep.self(),
      },
      options: asyncOptions({
        watch: ['country', 'query'],
        resolve: async ({ deps }) => {
          if (!deps.country || !deps.query) return []
          return getCities({ country: deps.country, query: deps.query })
        },
      }),
    }),
  ],
})
```

Behavior:

- async options can be plain promises
- watch keys reference dependency aliases instead of raw paths

### Async options with TanStack Query

```ts
const categoryForm = defineFormSchema({
  key: 'category',
  fields: [
    field.select('categoryId', {
      label: 'Category',
      options: asyncOptions({
        query: () =>
          queryOptions({
            queryKey: ['categories'],
            queryFn: () => api.categories.list(),
          }),
      }),
    }),
    field.select('manufacturerId', {
      label: 'Manufacturer',
      dependencies: {
        categoryId: dep.previous('categoryId'),
      },
      options: asyncOptions({
        query: ({ deps }) =>
          queryOptions({
            queryKey: ['manufacturers', deps.categoryId],
            queryFn: () => api.manufacturers.list({ categoryId: deps.categoryId }),
            enabled: Boolean(deps.categoryId),
          }),
      }),
    }),
  ],
})
```

Behavior:

- TanStack is supported as a first-class path
- the form runtime normalizes both `resolve` and `query`

### Global field defaults

```ts
const formConfig = defineFormConfig({
  defaults: {
    field: {
      size: 'md',
      labelWidth: 'fit',
    },
    kinds: {
      text: {
        props: {
          clearable: true,
        },
      },
      select: {
        props: {
          filterable: true,
        },
      },
    },
  },
})

const userForm = defineFormSchema({
  key: 'user',
  config: formConfig,
  fields: [
    field.text('firstName', { label: 'First name' }),
    field.select('role', {
      label: 'Role',
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Member', value: 'MEMBER' },
      ],
    }),
  ],
})
```

Behavior:

- global defaults merge only into compatible field kinds
- invalid default props for a field kind are rejected by types

### Stepped forms

```ts
const onboardingForm = defineFormSchema({
  key: 'onboarding',
  layout: {
    mode: 'modal',
    showStepper: false,
  },
  steps: [
    {
      key: 'account',
      title: 'Account',
      fields: [
        field.text('email', {
          label: 'Email',
          required: true,
        }),
      ],
      actions: [action.next({ label: 'Continue' })],
    },
    {
      key: 'verification',
      title: 'Verification',
      fields: [
        field.otp('code', {
          label: 'Verification code',
          required: true,
          dependencies: {
            email: dep.root('email'),
          },
          hint: ({ deps }) => `Code sent to ${deps.email}`,
        }),
      ],
      actions: [action.submit({ label: 'Validate' })],
    },
  ],
  guards: {
    beforeNext: async ({ step, state, api }) => {
      if (step.key !== 'account') return true
      return sendVerificationCode({ email: state.email, api })
    },
  },
})
```

## Proposal A assessment

Pros:

- closest to current DX
- practical migration path
- easiest to read in real business schemas
- helper usage is focused on hard parts only

Cons:

- still somewhat object-heavy
- field arrays can become large
- helper composition for complex dependencies may still feel verbose

## Proposal B

## Builder-first DSL

This pushes harder toward guided authoring and stronger scope typing.

### Example

```ts
const userForm = defineFormSchema((form) => {
  form.text('firstName', {
    label: 'First name',
    required: true,
  })

  form.text('lastName', {
    label: 'Last name',
    required: true,
  })

  form.select('role', {
    label: 'Role',
    options: [
      { label: 'Admin', value: 'ADMIN' },
      { label: 'Member', value: 'MEMBER' },
    ],
  })

  form.group('email', { label: 'Email' }, (group) => {
    group.text('value', {
      required: true,
      disabled: true,
    })

    group.button('edit', {
      dependencies: {
        email: group.parent('value'),
      },
      action: ({ deps }) => openEmailUpdateDialog({ currentEmail: deps.email }),
    })
  })
})
```

Behavior:

- scope is encoded by the builder itself
- `group.parent(...)` can be strongly typed
- builder methods can reject illegal field placement earlier

### Async example

```ts
const itemForm = defineFormSchema((form) => {
  form.select('categoryId', {
    label: 'Category',
    options: asyncOptions({
      query: () =>
        queryOptions({
          queryKey: ['categories'],
          queryFn: api.categories.list,
        }),
    }),
  })

  form.select('manufacturerId', {
    label: 'Manufacturer',
    dependencies: {
      categoryId: form.previous('categoryId'),
    },
    options: asyncOptions({
      resolve: ({ deps }) => api.manufacturers.list({ categoryId: deps.categoryId }),
    }),
  })
})
```

## Proposal B assessment

Pros:

- strongest scope guidance
- easiest place to enforce "previous fields only"
- could produce the cleanest type system

Cons:

- less natural for JSON-ish declarative schemas
- heavier syntax for large static forms
- less familiar than the current form style

## Proposal C

## Hybrid literal schema plus explicit dependency builders

This proposal keeps fields as plain objects but moves dependencies, async, and transforms into more explicit top-level mini-DSLs.

### Example

```ts
const form = defineFormSchema({
  key: 'organisation',
  fields: [
    {
      kind: 'select',
      key: 'type',
      label: 'Organisation type',
      options: staticOptions([
        { label: 'Company', value: 'COMPANY' },
        { label: 'Individual', value: 'INDIVIDUAL' },
      ]),
    },
    {
      kind: 'text',
      key: 'companyName',
      label: 'Company name',
      when: dependsOn({
        type: dep.previous('type'),
      }).condition(({ type }) => type === 'COMPANY'),
      required: dependsOn({
        type: dep.previous('type'),
      }).map(({ type }) => type === 'COMPANY'),
    },
  ],
})
```

### Async example

```ts
const form = defineFormSchema({
  key: 'item',
  fields: [
    {
      kind: 'select',
      key: 'categoryId',
      label: 'Category',
      options: queryOptionsSource(() =>
        queryOptions({
          queryKey: ['categories'],
          queryFn: api.categories.list,
        }),
      ),
    },
    {
      kind: 'select',
      key: 'manufacturerId',
      label: 'Manufacturer',
      options: promiseOptionsSource(
        dependsOn({
          categoryId: dep.previous('categoryId'),
        }).resolve(({ categoryId }) => api.manufacturers.list({ categoryId })),
      ),
    },
  ],
})
```

## Proposal C assessment

Pros:

- very explicit
- helper logic is reusable
- dependencies can be composed outside field objects

Cons:

- starts to feel "frameworky"
- more ceremony than Proposal A
- may be harder to scan in normal business schemas

## Comparison

## Authoring ergonomics

Best:

- Proposal A

Strongest type-guided construction:

- Proposal B

Most explicit but most ceremonial:

- Proposal C

## Migration friendliness

Best:

- Proposal A

Worst:

- Proposal B

## Fit for this repository

Best balance:

- Proposal A

Why:

- it keeps the schema-first consumer story familiar
- it still lets us radically improve dependency typing
- it leaves room for config/registry-driven internals
- it supports a clean global field-property layer

## Recommended Direction

Recommend Proposal A as the primary public direction, with two selective borrowings:

- borrow builder-like helper scope functions where they improve typing
- borrow explicit helper wrappers for async and dependency sources

In practice that means:

- object-literal schema remains the main authoring style
- field-kind constructors like `field.text(...)` replace raw broad field objects
- dependency helpers like `dep.previous(...)`, `dep.parent(...)`, `dep.root(...)` replace raw strings
- async wrappers normalize plain promises and TanStack Query
- global field defaults live in an explicit config layer

## Concrete recommended surface

Directionally:

```ts
const form = defineFormSchema({
  key: 'example',
  config: defineFormConfig({
    defaults: {
      field: { size: 'md' },
      kinds: {
        text: { props: { clearable: true } },
      },
    },
  }),
  fields: [
    field.text('firstName', {
      label: 'First name',
      required: true,
    }),
    field.select('country', {
      label: 'Country',
      options: asyncOptions({
        resolve: getCountries,
      }),
    }),
    field.autoComplete('city', {
      label: 'City',
      dependencies: {
        country: dep.previous('country'),
        query: dep.self(),
      },
      options: asyncOptions({
        query: ({ deps }) =>
          queryOptions({
            queryKey: ['cities', deps.country, deps.query],
            queryFn: () => getCities({ country: deps.country, query: deps.query }),
            enabled: Boolean(deps.country && deps.query),
          }),
      }),
    }),
  ],
})
```

## Open points in the recommended direction

- whether field constructors should be mandatory or optional sugar
- whether grouped transform APIs should stay as `preformat/transform` or be renamed
- whether `dep.parent(1, "foo")` is the final ancestor syntax
- how far typed `api.field(...)` helpers should go
- whether arrays should stay split by field kind or collapse into one configurable array field

## Dependency API Refinement

The earlier examples in this file still treat dependencies too much like "typed values".
That is not enough.

The dependency API should be more granular.

A dependency source should be able to expose independent channels such as:

- state
- options
- maybe later validation
- maybe later metadata
- maybe later layout or visibility state

This matters because a field may want:

- only the current value of another field
- only that field's options
- both value and options
- one alias for state and another alias for options

So the dependency model should not force a single bundled shape by default.

## Better direction

The builder should feel like this:

```ts
dependencies: (dep) => ({
  query: dep.self().state<string>(),
  country: dep.field('meta.country').state<string | null>(),
  manufacturerOptions: dep.field('manufacturerId').options<ManufacturerOption>(),
  manufacturer: dep.field('manufacturerId').channels({
    state: dep.state<string | null>(),
    options: dep.options<ManufacturerOption>(),
  }),
})
```

This is better because:

- each alias clearly states what it listens to
- a field can depend on the same source multiple ways
- the API can grow new channels later without redesigning the whole surface

## Recommended channel vocabulary

### 1. `state`

Use for current field value/state.

```ts
dep.field('meta.country').state<string | null>()
dep.parent('value').state<string>()
dep.self().state<string>()
```

### 2. `options`

Use for option-bearing fields when the consumer cares about option collections or option loading.

```ts
dep.field('manufacturerId').options<ManufacturerOption>()
```

### 3. `channels`

Use when the same alias should expose multiple channels together.

```ts
dep.field('manufacturerId').channels({
  state: dep.state<string | null>(),
  options: dep.options<ManufacturerOption>(),
})
```

This would produce:

```ts
deps.manufacturer.state.value
deps.manufacturer.options.items
deps.manufacturer.options.loading
deps.manufacturer.options.refresh()
```

## Recommended runtime shapes

### State dependency handle

```ts
type FormStateDependency<TValue> = {
  kind: 'state'
  path: string
  value: TValue
  initialValue: TValue
  set: (value: TValue) => void
  get: () => TValue
}
```

### Options dependency handle

```ts
type FormOptionsDependency<TOption> = {
  kind: 'options'
  path: string
  items: TOption[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}
```

### Multi-channel dependency handle

```ts
type FormChannelsDependency<TValue, TOption> = {
  kind: 'channels'
  path: string
  state: FormStateDependency<TValue>
  options: FormOptionsDependency<TOption>
}
```

## Practical examples

### Only listen to state

```ts
field.text('city', {
  dependencies: (dep) => ({
    country: dep.field('meta.country').state<string | null>(),
  }),
  disabled: ({ deps }) => !deps.country.value,
})
```

### Only listen to options

```ts
field.info('manufacturer-summary', {
  dependencies: (dep) => ({
    manufacturerOptions: dep.field('manufacturerId').options<ManufacturerOption>(),
  }),
  content: ({ deps }) => {
    if (deps.manufacturerOptions.loading) return 'Loading...'
    return `${deps.manufacturerOptions.items.length} manufacturers available`
  },
})
```

### Listen to both, under separate aliases

```ts
field.button('refreshManufacturers', {
  dependencies: (dep) => ({
    category: dep.field('categoryId').state<string | null>(),
    manufacturerOptions: dep.field('manufacturerId').options<ManufacturerOption>(),
  }),
  props: ({ deps }) => ({
    disabled: !deps.category.value,
    loading: deps.manufacturerOptions.loading,
  }),
  action: ({ deps }) => deps.manufacturerOptions.refresh(),
})
```

### Listen to both, under one alias

```ts
field.select('manufacturerId', {
  dependencies: (dep) => ({
    manufacturer: dep.field('manufacturerId').channels({
      state: dep.state<string | null>(),
      options: dep.options<ManufacturerOption>(),
    }),
  }),
  hint: ({ deps }) => {
    const selected = deps.manufacturer.state.value
    const label = deps.manufacturer.options.items.find((option) => option.value === selected)?.label

    return label ? `Selected: ${label}` : undefined
  },
})
```

## Why this is more extendable

Later channels can be added without breaking the model:

- `validation`
- `dirty`
- `visibility`
- `custom`

For example:

```ts
dep.field('country').channels({
  state: dep.state<string | null>(),
  validation: dep.validation(),
})
```

That is much easier to evolve than an API that assumes every dependency is primarily a value dependency.

## Recommended direction update

The dependency API should move toward:

```ts
dependencies: (dep) => ({
  country: dep.field('meta.country').state<string | null>(),
  manufacturerOptions: dep.field('manufacturerId').options<ManufacturerOption>(),
  manufacturer: dep.field('manufacturerId').channels({
    state: dep.state<string | null>(),
    options: dep.options<ManufacturerOption>(),
  }),
})
```

instead of:

```ts
dependencies: (dep) => ({
  country: dep.field('meta.country').value<string | null>(),
})
```

because channels are:

- more explicit
- more granular
- more extensible
- closer to the real needs of the form engine

## Locked dependency direction

The current leading direction is:

- dependency declarations stay local on each field
- a dependency starts from a source
- channels are added by chaining
- single-channel and multi-channel dependencies use the same fluent shape

Directionally:

```ts
dependencies: (dep) => ({
  query: dep.self().state<string>(),
  country: dep.field('meta.country').state<string | null>(),
  manufacturer: dep.field('manufacturerId').state<string | null>().options<ManufacturerOption>(),
})
```

This means:

- `dep.field(...)` selects the source
- `.state<T>()` subscribes to state/value
- `.options<T>()` subscribes to options
- chaining accumulates channels on the same alias

Runtime consumption:

```ts
deps.query.state.value
deps.country.state.value

deps.manufacturer.state.value
deps.manufacturer.options.items
deps.manufacturer.options.loading
deps.manufacturer.options.refresh()
```

For single-channel dependencies, the library may optionally flatten the runtime shape:

```ts
deps.country.value
```

but the more uniform model is likely:

```ts
deps.country.state.value
```

I currently lean toward the uniform shape because it keeps the mental model stable.

## Rewritten from real schemas

Below are representative `tars-profile-frontend` examples rewritten with the locked dependency chaining direction.

## Example 1: User profile form

Source inspiration:

- `app/entities/user/schema.tsx`

```ts
export function userFormSchema(params: { mode: 'orga-onboarding' | 'user-onboarding' | 'update' }) {
  const { $i18n, $i18nValidators } = useNuxtApp()

  return defineFormSchema({
    key: 'user-profile',
    controls: {
      confirmNavOnDirty: params.mode === 'update',
    },
    actions: params.mode === 'update' ? undefined : [],
    fields: (t) =>
      t
        .radio('meta.title', {
          label: () => $i18n.t('labels.gender'),
          required: true,
          size: 8,
          options: [
            { label: () => $i18n.t('values.gender.MR'), value: 'MR' },
            { label: () => $i18n.t('values.gender.MRS'), value: 'MRS' },
          ] as const,
        })
        .text('firstName', {
          label: () => $i18n.t('labels.firstName'),
          required: true,
        })
        .text('lastName', {
          label: () => $i18n.t('labels.lastName'),
          required: true,
        })
        .group('email', {
          label: () => $i18n.t('labels.email'),
          required: true,
          input: {
            preformat: (email: string) => ({ value: email }),
            transform: (email: { value: string }) => email?.value ?? '',
          },
          fields: (g) =>
            g
              .text('value', {
                required: true,
                validators: {
                  email: $i18nValidators.email,
                },
                disabled: true,
              })
              .button('edit', {
                condition: () => params.mode === 'update',
                dependencies: (dep) => ({
                  email: dep.parent('value').state<string>(),
                }),
                props: { icon: 'heroicons-solid:pencil' },
                action: ({ deps }) =>
                  updateUserEmail({
                    currentEmail: deps.email.state.value,
                  }),
              }),
        })
        .select('meta.country', {
          label: () => $i18n.t('labels.country'),
          placeholder: () => $i18n.t('placeholders.country'),
          required: true,
          options: asyncOptions({
            resolve: getCountries,
            external: [$i18n.locale],
          }),
        })
        .hidden('meta.contacts.mobileCountryCode', {
          output: t.string(),
        })
        .group('meta.contacts.mobile', {
          label: () => $i18n.t('labels.mobilePhone'),
          required: true,
          input: {
            preformat: (value: string) => ({ value: formatPhoneNumber(value) }),
            transform: (phone: { value: string }) => phone?.value ?? '',
          },
          fields: (g) =>
            g
              .phoneNumber('value', {
                required: true,
                dependencies: (dep) => ({
                  countryCode: dep.root('meta.contacts.mobileCountryCode').state<string | null>(),
                }),
                props: ({ deps }) => ({
                  defaultCountryCode: 'detect',
                  storedCountryCode: deps.countryCode.state.value,
                }),
                disabled: true,
              })
              .button('edit', {
                dependencies: (dep) => ({
                  phone: dep.parent().state<{ value: string }>(),
                }),
                props: { icon: 'heroicons-solid:pencil' },
                action: async ({ api }) => {
                  const result = await updateUserPhone({ mode: 'update' })
                  if (!result) return

                  api.setValue(g.parent('value'), result.phone)
                  api.setValue(t.root('meta.contacts.mobileCountryCode'), result.mobileCountryCode)
                },
              }),
        }),
  })
}
```

What this shows:

- parent-object dependencies stay readable
- cross-scope state dependencies remain explicit
- no raw `$parent` strings are needed

## Example 2: Address search and manual mode

Source inspiration:

- `app/entities/addresses/schema.tsx`

```ts
export function addressFormSchema(params?: { defaultCountry?: string }) {
  const { $i18n } = useNuxtApp()

  return defineFormSchema({
    key: "address",
    fields: (t) =>
      t
        .select("indexedMeta.type", {
          label: () => $i18n.t("labels.addressType"),
          required: true,
          options: Object.values(AddressTypes).map(type => ({
            label: () => $i18n.t(`values.addressType.${type}`),
            value: type,
          })),
        })
        .text("meta.name", {
          label: () => $i18n.t("labels.addressTitle"),
          placeholder: () => $i18n.t("placeholders.addressTitle"),
          required: true,
          dependencies: dep => ({
            type: dep.field("indexedMeta.type").state<AddressTypes>(),
          }),
          onDependencyChange: ({ deps, api }) => {
            const value = api.getValue<string>()
            if (value || !deps.type.state.value) return
            api.setValue($i18n.t(`values.addressType.${deps.type.state.value}`))
          },
          onRendered: ({ deps, api }) => {
            const value = api.getValue<string>()
            if (value || !deps.type.state.value) return
            api.setValue($i18n.t(`values.addressType.${deps.type.state.value}`))
          },
        })
        .select("meta.country", {
          label: () => $i18n.t("labels.country"),
          placeholder: () => $i18n.t("placeholders.country"),
          size: 8,
          required: true,
          defaultValue: params?.defaultCountry,
          options: asyncOptions({
            resolve: getCountries,
            external: [$i18n.locale],
          }),
        })
        .autoComplete("addressSearch", {
          label: () => $i18n.t("labels.searchAddress"),
          size: 8,
          dependencies: dep => ({
            query: dep.self().state<string>(),
            country: dep.field("meta.country").state<string | null>(),
            manual: dep.field("indexedMeta.manual").state<boolean>(),
          }),
          disabled: ({ deps }) => !deps.country.state.value,
          options: asyncOptions({
            resolve: ({ deps }) => {
              const country = deps.country.state.value
              const query = deps.query.state.value

              if (!country || !query) return []
              return getMapsPlacesOptions({ country, query })
            },
            debounce: 500,
          }),
          labelExtra: ({ deps, api }) => (
            <label class="flex items-center gap-2 mr-2">
              <NSwitch
                size="small"
                value={deps.manual.state.value}
                onUpdate:value={value => api.setValue("indexedMeta.manual", value)}
              />
              {$i18n.t("labels.manualInput")}
            </label>
          ),
          props: ({ api }) => ({
            blurAfterSelect: true,
            clearAfterSelect: false,
            onSelect: async (value: string) => {
              const placeDetails = await getMapsPlaceDetails(value)
              if (!placeDetails) return

              const place = mapGooglePlaceToAddress(placeDetails)

              api.setValue("indexedMeta.manual", false)
              api.setValue("geoCode.place_id", place.place_id)
              api.setValue("meta.postCode", place.postCode)
              api.setValue("meta.number", place.number)
              api.setValue("meta.street", place.street)
              api.setValue("meta.city", place.city)
              api.setValue("geoCode.address_components", place.address_components)
              api.setValue("geoCode.geometry", place.geometry)
            },
          }),
        })
        .hidden("indexedMeta.manual", {
          output: t.boolean(),
          defaultValue: false,
          watch: ({ value, api }) => {
            if (value !== false) return
            api.setValue("meta.number", null)
            api.setValue("meta.street", null)
            api.setValue("meta.box", null)
            api.setValue("meta.postCode", null)
            api.setValue("meta.city", null)
          },
        })
  })
}
```

What this shows:

- `dep.self().state<T>()` is a clean way to model query-like self-listening
- the dependency declaration stays compact
- the field can later add options channels if needed without changing the overall shape

## Example 3: Cross-step phone verification

Source inspiration:

- `app/entities/auth/schema.tsx`

```ts
export function updateUserPhoneFormSchema(params: { mode: "create" | "update" }) {
  const { $i18n, $i18nValidators } = useNuxtApp()

  return defineFormSchema({
    key: "user-phone",
    title: ({ currentStep }) =>
      currentStep === 0
        ? $i18n.t(`actions.${params.mode === "create" ? "fillUserPhone" : "updateUserPhone"}`)
        : $i18n.t("labels.verificationCode"),
    modal: {
      maxWidth: "500px",
      showCloseButton: params.mode === "update",
      allowOutsideClick: params.mode === "update",
    },
    layout: { gridSize: 1 },
    controls: { showStepper: false },
    steps: (s) =>
      s
        .step("phone", {
          actions: [action.next()],
          fields: (t) =>
            t
              .hidden("mobileCountryCode", {
                output: t.string(),
              })
              .phoneNumber("phone", {
                label: () => $i18n.t("labels.mobilePhone"),
                required: true,
                dependencies: dep => ({
                  countryCode: dep.field("mobileCountryCode").state<string | null>(),
                }),
                props: ({ deps }) => ({
                  defaultCountryCode: "detect",
                  countryCodes: [...AllowedSmsCountries],
                  storedCountryCode: deps.countryCode.state.value,
                }),
              }),
        })
        .step("verification", {
          actions: [action.submit({ label: () => $i18n.t("actions.validate") })],
          fields: (t, ctx) =>
            t
              .otp("code", {
                required: true,
                dependencies: dep => ({
                  phone: dep.step("phone").field("phone").state<string>(),
                }),
                props: {
                  template: "###-###",
                  block: true,
                  allowInput: "numeric",
                  size: "large",
                },
                watch: ({ api }) => api.clearCustomError(),
                input: {
                  transform: (code: string) => Number(code),
                },
                label: ({ deps }) => (
                  <span class="text-xs text-gray-600">
                    {$i18n.t("messages.validationCodeSent", {
                      phone: deps.phone.state.value ?? "N/A",
                    })}
                  </span>
                ),
                validators: {
                  sixDigitCode: $i18nValidators.withI18nMessage(
                    (value: string) => !!value && value.length === 6 && !Number.isNaN(Number(value)),
                  ),
                },
              })
              .info("resend-code", {
                dependencies: dep => ({
                  phone: dep.step("phone").field("phone").state<string>(),
                }),
                content: ({ deps, api }) => (
                  <div class="w-full flex items-center justify-center">
                    <ResendCodeTimer
                      waitTime={90}
                      onResend={() => {
                        api.setValue("code", "")
                        api.clearCustomError("code")
                        sendMobileValidationCode(deps.phone.state.value)
                      }}
                    />
                  </div>
                ),
              }),
        }),
  })
}
```

What this shows:

- cross-step references can stay explicit and local
- the dependency syntax stays consistent with same-step and parent-scope refs

## Example 4: Vehicle search nested ancestor case

Source inspiration:

- `app/entities/drafts/schema/item.tsx`

```ts
export function vehicleSearchFields(params: {
  itemShortId: string
  activeCharacteristics: Array<any>
}) {
  const { $i18n, $api, $recaptcha } = useNuxtApp()
  const userStore = useUserStore()

  return defineFormFields((t) =>
    t.object('search_immatriculation', {
      omit: true,
      props: { frameless: true },
      condition: () =>
        params.activeCharacteristics.some(
          (c) => c.model.key === CharacteristicKeys.VEHICLE_REGISTRATION_NUMBER,
        ),
      fields: (o) =>
        o
          .radio('hasImmatriculation', {
            condition: () => userStore.activeOrganisation?.meta?.country === 'FR',
            label: () => $i18n.t('labels.vehiculeIsRegistered'),
            defaultValue: true,
            size: 8,
            options: [
              { value: true, label: () => $i18n.t('labels.yes') },
              { value: false, label: () => $i18n.t('labels.no') },
            ],
          })
          .group('search', {
            condition: () => userStore.activeOrganisation?.meta?.country === 'FR',
            dependencies: (dep) => ({
              hasImmatriculation: dep.parent('hasImmatriculation').state<boolean>(),
            }),
            label: ({ deps }) =>
              deps.hasImmatriculation.state.value
                ? $i18n.t('labels.searchVehiculeRegisteredNumber')
                : $i18n.t('labels.searchVehicleVin'),
            fields: (g) =>
              g
                .text('value', {
                  dependencies: (dep) => ({
                    hasImmatriculation: dep.parent(1, 'hasImmatriculation').state<boolean>(),
                  }),
                  props: ({ deps }) => ({
                    mask: deps.hasImmatriculation.state.value
                      ? VEHICLE_IMMATRICULATION_MASK
                      : VEHICLE_VIN_MASK,
                  }),
                  onDependencyChange: ({ api }) => api.setValue(''),
                })
                .button('searchButton', {
                  text: () => $i18n.t('actions.search'),
                  dependencies: (dep) => ({
                    value: dep.parent('value').state<string>(),
                    hasImmatriculation: dep
                      .root('search_immatriculation.hasImmatriculation')
                      .state<boolean>(),
                  }),
                  props: ({ deps }) => ({
                    type: 'primary',
                    disabled: !deps.value.state.value,
                  }),
                  action: async ({ api, deps }) => {
                    const recaptcha = await $recaptcha('searchVehicule')
                    const query = deps.value.state.value?.replace(/[^A-Za-z0-9]/g, '')

                    const { data } = await withErrorHandling(() =>
                      deps.hasImmatriculation.state.value
                        ? $api.vehicles.getVehicleByLicensePlate({
                            licensePlateNumber: query,
                            recaptcha,
                            itemShortId: params.itemShortId,
                          })
                        : $api.vehicles.getVehicleByVin({
                            vin: query,
                            recaptcha,
                            itemShortId: params.itemShortId,
                          }),
                    )

                    if (!data?.data) return

                    setVehicleCharacteristics(data.data, {
                      api,
                      characteristics: params.activeCharacteristics.map((c) => c.model),
                    })
                  },
                }),
          }),
    }),
  )
}
```

What this shows:

- the hardest `$parent:1` case still stays readable
- the dependency syntax remains consistent
- no extra `channels(...)` container is needed
