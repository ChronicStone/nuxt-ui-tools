import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router } from 'vue-router'

import FormProvider from '#ui-tools/form/components/provider/form-provider.vue'
import FormRoot from '#ui-tools/form/components/root/form.vue'
import { useForm } from '#ui-tools/form/composables/use-form'
import { useFormApi } from '#ui-tools/form/composables/use-form-api'
import type {
  FormApiController,
  FormController,
  FormObject,
  FormRenderShell,
  FormSubmitHandler,
  FormUiConfig,
  FormValidationMode,
  FormValue,
} from '#ui-tools/form/types'

import { setAppConfig, setBreakpoint } from '../nuxt-state'
import type { BreakpointKey } from '../nuxt-state'
import { resetCookies } from '../stubs/nuxt-app'

export interface MountFormOptions {
  schema: unknown
  input?: FormObject
  syncInput?: boolean | readonly string[]
  validate?: FormValidationMode
  shell?: FormRenderShell
  ui?: FormUiConfig
  breakpoint?: BreakpointKey
  appConfig?: FormObject
  onSubmit?: FormSubmitHandler<FormObject, FormValue>
  settle?: boolean
}

export interface FormHarness {
  wrapper: VueWrapper
  router: Router
  queryClient: QueryClient
  form: FormController<unknown, FormValue>
  formApi: FormApiController
  input: Ref<FormObject | undefined>
  setInputValue: (value: FormObject) => Promise<void>
  setSyncInput: (value: boolean | readonly string[]) => Promise<void>
  button: (label: string) => DOMWrapper<Element>
  submitted: { value: FormObject; result: { success: boolean; data?: FormValue } }[]
  output: () => FormObject
  cancelled: FormObject[]
  flush: (rounds?: number) => Promise<void>
  until: (predicate: () => boolean, timeout?: number) => Promise<void>
  field: (path: string) => DOMWrapper<Element>
  control: (path: string) => DOMWrapper<Element>
  setInput: (path: string, value: string) => Promise<void>
  submit: () => Promise<void>
  unmount: () => void
}

export async function mountForm(options: MountFormOptions): Promise<FormHarness> {
  setBreakpoint(options.breakpoint ?? 'xl')
  setAppConfig(options.appConfig ?? {})
  resetCookies()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: { render: () => h('div') }, path: '/' }],
  })
  await router.push({ path: '/' })
  await router.isReady()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false, staleTime: 0 } },
  })
  const input = ref<FormObject | undefined>(options.input)
  const syncInput = ref<boolean | readonly string[] | undefined>(options.syncInput)
  const submitted: FormHarness['submitted'] = []
  const cancelled: FormObject[] = []
  const captured = createCapture()
  const wrapper = mount(createHost({ cancelled, captured, input, options, submitted, syncInput }), {
    attachTo: document.body,
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })

  async function flush(rounds = 3) {
    for (let index = 0; index < rounds; index += 1) {
      // oxlint-disable-next-line no-await-in-loop -- settling rounds must run sequentially
      await nextTick()
      // oxlint-disable-next-line no-await-in-loop -- settling rounds must run sequentially
      await macrotask()
    }
    await nextTick()
  }

  async function until(predicate: () => boolean, timeout = 2000) {
    const started = Date.now()
    while (!predicate()) {
      if (Date.now() - started > timeout) {
        throw new Error('until(): timed out')
      }
      // oxlint-disable-next-line no-await-in-loop -- polling until the predicate holds
      await flush(1)
    }
    await nextTick()
  }

  function field(path: string) {
    const found = wrapper.find(`[data-form-field="${path}"]`)
    if (!found.exists()) {
      throw new Error(`Field "${path}" is not rendered`)
    }
    return found
  }

  function control(path: string) {
    const found = field(path).find('input, textarea, select, [data-ui-trigger]')
    if (!found.exists()) {
      throw new Error(`Field "${path}" has no control`)
    }
    return found
  }

  async function setInput(path: string, value: string) {
    await control(path).setValue(value)
    await flush(1)
  }

  async function submit() {
    await wrapper.find('form').trigger('submit')
    await flush()
  }

  async function setInputValue(value: FormObject) {
    input.value = value
    await flush()
  }

  async function setSyncInput(value: boolean | readonly string[]) {
    syncInput.value = value
    await flush()
  }

  function button(label: string) {
    const found = wrapper.findAll('button').find((candidate) => candidate.text().trim() === label)
    if (!found) {
      throw new Error(`Button "${label}" is not rendered`)
    }
    return found
  }

  if (options.settle !== false) {
    await flush()
  }
  const { form, formApi } = captured
  if (!form || !formApi) {
    throw new Error('Form host did not mount')
  }

  return {
    button,
    cancelled,
    control,
    field,
    flush,
    form,
    formApi,
    input,
    // SAFETY: the harness mounts untyped schemas, so the controller output is the runtime FormObject.
    output: () => form.output.value as FormObject,
    queryClient,
    router,
    setInput,
    setInputValue,
    setSyncInput,
    submit,
    submitted,
    unmount: () => wrapper.unmount(),
    until,
    wrapper,
  }
}

interface HostCapture {
  form?: FormController<unknown, FormValue>
  formApi?: FormApiController
}

function createCapture(): HostCapture {
  return {}
}

interface HostParams {
  options: MountFormOptions
  input: Ref<FormObject | undefined>
  syncInput: Ref<boolean | readonly string[] | undefined>
  submitted: FormHarness['submitted']
  cancelled: FormObject[]
  captured: HostCapture
}

function createHost(params: HostParams) {
  const Inner = defineComponent({
    name: 'FormHost',
    setup() {
      params.captured.formApi = useFormApi()
      const form = useForm({
        input: params.input,
        onSubmit: params.options.onSubmit,
        // SAFETY: the harness accepts any authored schema literal; the runtime validates it structurally.
        schema: params.options.schema as FormValue,
        syncInput: () => params.syncInput.value ?? false,
        validate: params.options.validate,
      })
      params.captured.form = form
      return () =>
        h(FormRoot, {
          form,
          onCancel: (value: FormObject) => params.cancelled.push(value),
          onSubmit: (value: FormObject, result: { success: boolean; data?: FormValue }) =>
            params.submitted.push({ result, value }),
          shell: params.options.shell,
          ui: params.options.ui,
        })
    },
  })
  return defineComponent({
    name: 'Host',
    setup() {
      return () => h(FormProvider, null, { default: () => h(Inner) })
    },
  })
}

function macrotask() {
  // oxlint-disable-next-line avoid-new -- there is no promise-returning timer in happy-dom
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}

export function deferred<T>() {
  let release: (value: T) => void = noopResolve
  let fail: (reason: Error) => void = noopResolve
  // oxlint-disable-next-line avoid-new -- tests release these promises by hand
  const promise = new Promise<T>((resolve, reject) => {
    release = resolve
    fail = reject
  })
  void swallow(promise)
  return {
    promise,
    reject: (reason: Error) => {
      fail(reason)
    },
    resolve: (value: T) => {
      release(value)
    },
  }
}

function noopResolve() {
  return null
}

async function swallow(promise: Promise<unknown>) {
  try {
    await promise
  } catch {
    return null
  }
  return null
}

export function labels(harness: FormHarness) {
  return harness.wrapper
    .findAll('[data-ui="UFormField"] > [data-ui-label-wrapper] > [data-ui-label]')
    .map((node) => node.text().trim())
}

export function errorOf(harness: FormHarness, path: string) {
  const error = harness.field(path).find('[data-ui-error]')
  return error.exists() ? error.text().trim() : undefined
}
