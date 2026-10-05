import { useAppConfig } from 'nuxt/app'
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type {
  FormObject,
  FormRendererController,
  FormRuntime,
  FormSubmitHandlerResult,
  FormUiConfig,
  FormValidationMode,
  FormValue,
} from '../types'
import {
  getSchemaAutoFocus,
  getSchemaDirtyNavigation,
  getSchemaSyncInput,
  getSchemaUi,
  getSchemaValidationMode,
} from '../utils/controls'
import { isRecord } from '../utils/path'
import { isString, isUndefined, stringArray } from '../utils/predicate'
import { collectFormFieldsPaths } from '../utils/state'
import { resolveFormText } from '../utils/text'
import { mergeFormUi, resolveAppFormUi } from '../utils/ui'
import { useFormConfirm } from './use-form-confirm'
import { provideFormRuntime, useFormRuntime } from './use-form-runtime'
import { provideFormUi } from './use-form-ui'

export interface UseFormRootParams {
  /** Controller from `useForm`. Its schema, input, and policies win over the direct ones. */
  form: () => FormRendererController | undefined
  /** Runtime owned by a parent. The root renders it and neither creates, binds nor disposes it. */
  runtime?: () => FormRuntime | undefined
  schema: () => FormValue
  input: () => FormObject | undefined
  syncInput: () => boolean | readonly string[] | undefined
  validate: () => FormValidationMode | undefined
  ui: () => FormUiConfig | undefined
  onSubmitted: (value: FormObject, result: FormSubmitHandlerResult<FormValue>) => void
  onCancelled: (value: FormObject) => void
}

/**
 * Root of a rendered form. It creates the runtime and binds it to the controller, provides the
 * runtime and the presentation config to the fields, guards navigation away from a dirty form,
 * and owns submit and cancel. `<NutForm>` and `FormPage` both render from it.
 */
export function useFormRoot(params: UseFormRootParams) {
  const router = useRouter()
  const { t } = useUiToolsLocale()
  const appConfig = useAppConfig()

  const schema = computed(() => params.form()?.schema.value ?? params.schema() ?? {})
  const formUi = provideFormUi(
    computed<FormUiConfig>(() =>
      mergeFormUi(resolveAppFormUi(appConfig), getSchemaUi(schema.value), params.ui()),
    ),
  )
  const input = computed(() => params.form()?.input.value ?? params.input())
  const syncInput = computed<boolean | readonly string[]>(
    () => params.form()?.syncInput.value ?? params.syncInput() ?? getSchemaSyncInput(schema.value),
  )
  const validationMode = computed<FormValidationMode>(
    () =>
      params.form()?.validationMode.value ??
      params.validate() ??
      getSchemaValidationMode(schema.value),
  )
  const ownedRuntime = params.runtime?.()
  const runtime = ownedRuntime ?? useFormRuntime({ input, schema, syncInput, validationMode })

  provideFormRuntime(runtime)

  const confirm = useFormConfirm()
  // Set once the user agrees to discard their changes, so cancelling and the navigation it
  // triggers ask only once. Editing again re-arms the question.
  let leaveConfirmed = false
  watch(
    () => runtime.dirtyPaths.value,
    () => {
      leaveConfirmed = false
    },
  )

  if (!ownedRuntime) {
    watch(
      params.form,
      (controller, previousController) => {
        previousController?.unbind(runtime)
        controller?.bind(runtime)
      },
      { immediate: true },
    )

    onBeforeUnmount(() => params.form()?.unbind(runtime))
  }

  onMounted(async () => {
    await nextTick()
    const target = getSchemaAutoFocus(schema.value)
    if (isString(target)) {
      await runtime.focusField(target)
      return
    }
    if (target === true) {
      await focusFirstField()
    }
  })

  if (import.meta.client) {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!shouldConfirmDirtyNavigation()) {
        return
      }
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))
  }

  const removeRouteGuard = router.beforeEach((to, from) => {
    // A submit handler that navigates once the values are saved is not leaving unsaved work.
    if (runtime.actionPending.value === 'submit' || isSameDocument(to, from)) {
      return true
    }
    if (leaveConfirmed || !shouldConfirmDirtyNavigation()) {
      return true
    }
    return confirmLeave()
  })
  onBeforeUnmount(removeRouteGuard)

  const contextPending = computed<boolean>(() =>
    Object.values(runtime.context).some(
      (resource) => 'pending' in resource && resource.pending && isUndefined(resource.value),
    ),
  )
  const contextLoading = computed<boolean>(() =>
    Object.values(runtime.context).some((resource) => 'loading' in resource && resource.loading),
  )
  const contextError = computed<string | undefined>(() => {
    for (const resource of Object.values(runtime.context)) {
      if (!('error' in resource) || !resource.error) {
        continue
      }
      if (resource.error instanceof Error) {
        return resource.error.message
      }
      if (isString(resource.error)) {
        return resource.error
      }
      return t('form.states.contextError.description')
    }
    return undefined
  })

  async function refreshContext() {
    await Promise.all(
      Object.values(runtime.context).flatMap((resource) =>
        'refresh' in resource ? [resource.refresh()] : [],
      ),
    )
  }

  async function submit() {
    const controller = params.form()
    const result = controller ? await controller.submitHandler() : await runtime.submitHandler()
    if (result.success) {
      params.onSubmitted(runtime.output.value, result)
    }
  }

  async function cancel() {
    if (!leaveConfirmed && shouldConfirmDirtyNavigation() && !(await confirmLeave())) {
      return
    }
    params.onCancelled(runtime.output.value)
  }

  async function confirmLeave() {
    leaveConfirmed = await confirm({
      kind: 'unsaved-changes',
      message: getDirtyNavigationMessage(),
    })
    return leaveConfirmed
  }

  function shouldConfirmDirtyNavigation() {
    if (!runtime.isDirty.value) {
      return false
    }
    const config = getSchemaDirtyNavigation(schema.value)
    if (!config) {
      return false
    }
    if (!isRecord(config)) {
      return config === true
    }
    const ignored = stringArray(config.ignorePaths)
    return runtime.dirtyPaths.value.some(
      (path) =>
        !ignored.some((ignoredPath) => path === ignoredPath || path.startsWith(`${ignoredPath}.`)),
    )
  }

  function getDirtyNavigationMessage() {
    const config = getSchemaDirtyNavigation(schema.value)
    if (!isRecord(config)) {
      return t('form.confirm.unsavedChanges')
    }
    const message = Object.getOwnPropertyDescriptor(config, 'message')?.value
    return resolveFormText(message) ?? t('form.confirm.unsavedChanges')
  }

  async function focusFirstField() {
    const parentPath = runtime.currentStepRoot.value ? [runtime.currentStepRoot.value] : []
    for (const path of collectFormFieldsPaths(runtime.currentFields.value, parentPath)) {
      // oxlint-disable-next-line no-await-in-loop -- stop at the first field that takes focus
      if (await runtime.focusField(path)) {
        return
      }
    }
  }

  return {
    cancel,
    contextError,
    contextLoading,
    contextPending,
    formUi,
    input,
    refreshContext,
    runtime,
    schema,
    submit,
    validationMode,
  }
}

/** A change of hash only, such as a form page recording the section in view. */
function isSameDocument(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  return to.fullPath.split('#')[0] === from.fullPath.split('#')[0]
}
