import { computed, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type {
  SpreadsheetColumnsModel,
  SpreadsheetContextModel,
  SpreadsheetFieldState,
  SpreadsheetFileModel,
  SpreadsheetImporter,
  SpreadsheetImportOptions,
  SpreadsheetLayoutModel,
  SpreadsheetReadiness,
  SpreadsheetRecord,
  SpreadsheetReviewModel,
  SpreadsheetRowsModel,
  SpreadsheetRuntimeSchema,
  SpreadsheetSubmitModel,
  SpreadsheetSubmitParams,
  SpreadsheetSubmitResult,
  SpreadsheetValuesModel,
} from '../types'
import { createSpreadsheetTemplateWorkbook, suggestSpreadsheetColumns } from '../utils'
import { useSpreadsheetAnswers } from './use-spreadsheet-answers'
import { useSpreadsheetColumns } from './use-spreadsheet-columns'
import { useSpreadsheetContext } from './use-spreadsheet-context'
import { useSpreadsheetEdits } from './use-spreadsheet-edits'
import { useSpreadsheetFields } from './use-spreadsheet-fields'
import { useSpreadsheetFile } from './use-spreadsheet-file'
import { useSpreadsheetLayout } from './use-spreadsheet-layout'
import { useSpreadsheetOptions } from './use-spreadsheet-options'
import { useSpreadsheetReview } from './use-spreadsheet-review'
import { useSpreadsheetRows } from './use-spreadsheet-rows'
import { useSpreadsheetSubmit } from './use-spreadsheet-submit'
import { useSpreadsheetValues } from './use-spreadsheet-values'

/** Options as the runtime reads them, with every schema type erased. */
interface SpreadsheetRuntimeOptions {
  context?: Readonly<Record<string, unknown>>
  onSubmit?: (
    params: SpreadsheetSubmitParams<unknown, unknown, unknown>,
  ) => void | SpreadsheetSubmitResult | Promise<void | SpreadsheetSubmitResult>
  submit?: { batchSize?: number }
}

/**
 * The import runtime of a schema: file, layout, columns, values, rows, review, and submit, each a
 * reactive model readable in templates and scripts. Use it headless, with the `SpreadsheetImport*`
 * parts, or with the ready-made `<SpreadsheetImport>`.
 *
 * @example
 * ```ts
 * const importer = useSpreadsheetImport(assessmentsImport, {
 *   context: { center: () => center.value, products: productsQuery() },
 *   onSubmit: ({ create, update }) => api.assessments.import({ create, update }),
 * })
 * importer.file.load(file)
 * await importer.ready()
 * importer.readiness.canSubmit
 * ```
 */
export function useSpreadsheetImport<const TSchema extends SpreadsheetRuntimeSchema>(
  schema: MaybeRefOrGetter<TSchema>,
  ...args: [keyof NonNullable<TSchema['~context']>] extends [never]
    ? [options?: SpreadsheetImportOptions<TSchema>]
    : [options: SpreadsheetImportOptions<TSchema>]
): SpreadsheetImporter<TSchema>
export function useSpreadsheetImport(
  schemaInput: MaybeRefOrGetter<SpreadsheetRuntimeSchema>,
  options: SpreadsheetRuntimeOptions = {},
): SpreadsheetImporter {
  const { t } = useUiToolsLocale()
  const schema = computed(() => toValue(schemaInput))
  const context = useSpreadsheetContext({ input: () => options.context })
  const file = useSpreadsheetFile()
  const edits = useSpreadsheetEdits()
  const answers = useSpreadsheetAnswers()
  const fields = useSpreadsheetFields({ context, schema, t })
  const layout = useSpreadsheetLayout({ context, fields, file, schema })
  const columns = useSpreadsheetColumns({ context, fields, layout })
  const options$ = useSpreadsheetOptions({ columns, context, edits, fields, layout })
  const rows = useSpreadsheetRows({
    answers,
    columns,
    context,
    edits,
    fields,
    layout,
    options: options$,
    schema,
    t,
  })
  const values = useSpreadsheetValues({ answers, fields, options: options$, rows })
  const review = useSpreadsheetReview({ layout, rows })
  const submit = useSpreadsheetSubmit({
    batchSize: options.submit?.batchSize,
    context,
    fields,
    onSubmit: options.onSubmit,
    rows,
    schema,
    t,
    values,
  })

  watch(file.workbook, () => {
    edits.clear()
    answers.clear()
    columns.clear()
    rows.reset()
    submit.reset()
  })

  const suggestions = computed(() => {
    const missing = new Set(
      columns.states.value.filter((state) => state.status === 'missing').map((state) => state.path),
    )
    if (!missing.size)
      return new Map<
        string,
        { header: SpreadsheetFieldState['header'] & object; samples: readonly string[] }
      >()
    return suggestSpreadsheetColumns({
      ctx: context.ctx.value,
      fields: fields.columnFields.value.filter((field) => missing.has(field.path)),
      headers: columns.unusedHeaders.value,
      options: options$.options.value,
      raws: layout.dataRaws.value,
      rows: layout.dataRows.value,
      t,
    })
  })
  const fieldStates = computed(() =>
    columns.states.value.map((state) => ({
      ...state,
      suggestion: suggestions.value.get(state.path) ?? null,
    })),
  )
  const missing = computed(() => fieldStates.value.filter((state) => state.status === 'missing'))

  const loading = computed(
    () =>
      context.loading.value || file.reading.value || options$.loading.value || rows.loading.value,
  )
  const readiness = computed<SpreadsheetReadiness>(() => {
    const importable = rows.importable.value.length
    const openValues = values.open.value.length
    return {
      canSubmit:
        Boolean(file.workbook.value) &&
        !loading.value &&
        !missing.value.length &&
        !openValues &&
        importable > 0,
      importable,
      invalidRows: rows.invalid.value.length,
      loading: loading.value,
      missingColumns: missing.value.length,
      openValues,
    }
  })

  function ready() {
    return new Promise<void>((resolve) => {
      const stop = watch(
        () =>
          !loading.value &&
          (!file.workbook.value || fields.fields.value.length > 0 || !context.ready.value),
        (settled) => {
          if (!settled) return
          queueMicrotask(() => stop())
          resolve()
        },
        { immediate: true },
      )
    })
  }

  function template() {
    return createSpreadsheetTemplateWorkbook({
      fields: fields.fields.value,
      guideHeaders: [
        t('spreadsheet.template.column'),
        t('spreadsheet.template.required'),
        t('spreadsheet.template.allowed'),
        t('spreadsheet.template.description'),
      ],
      guideName: t('spreadsheet.template.guide'),
      options: options$.options.value,
      sheetName: t('spreadsheet.template.sheet'),
      yes: t('spreadsheet.template.yes'),
    })
  }

  function reset() {
    file.clear()
  }

  const contextModel: SpreadsheetContextModel<unknown> = {
    get ctx() {
      return context.ctx.value
    },
    get error() {
      return context.error.value
    },
    get loading() {
      return context.loading.value
    },
    get ready() {
      return context.ready.value
    },
  }

  const fileModel: SpreadsheetFileModel = {
    clear: file.clear,
    get error() {
      return file.error.value
    },
    load: (source, name) => void file.load(source, name),
    get loaded() {
      return Boolean(file.workbook.value)
    },
    get name() {
      return file.workbook.value?.name ?? ''
    },
    paste: file.paste,
    get reading() {
      return file.reading.value
    },
    get sheets() {
      return file.sheets.value
    },
  }

  const layoutModel: SpreadsheetLayoutModel = {
    get ambiguous() {
      return layout.detection.value?.ambiguous ?? false
    },
    get candidates() {
      return layout.candidates.value
    },
    get detected() {
      return layout.detected.value
    },
    get detection() {
      return layout.detection.value
    },
    get headerRow() {
      return layout.selection.value.headerRow
    },
    get headerRowNumber() {
      return (
        layout.sheet.value?.rowNumbers[layout.selection.value.headerRow] ??
        layout.selection.value.headerRow + 1
      )
    },
    get headers() {
      return layout.headers.value
    },
    get preview() {
      return layout.preview.value
    },
    redetect: layout.redetect,
    setHeaderRow: layout.setHeaderRow,
    setSheet: layout.setSheet,
    get sheet() {
      return layout.selection.value.sheet
    },
  }

  const columnsModel: SpreadsheetColumnsModel = {
    assign: columns.assign,
    get fields() {
      return fieldStates.value
    },
    get groups() {
      return fields.groups.value
    },
    get headers() {
      return layout.headers.value
    },
    ignore: columns.ignore,
    get missing() {
      return missing.value
    },
    reset: columns.reset,
    get unusedHeaders() {
      return columns.unusedHeaders.value
    },
  }

  const valuesModel: SpreadsheetValuesModel = {
    answer: values.answer,
    choices: values.choices,
    clear: values.clear,
    get loading() {
      return options$.loading.value
    },
    get open() {
      return values.open.value
    },
    get questions() {
      return values.questions.value
    },
    get recognized() {
      return values.recognized.value
    },
    search: values.search,
  }

  const rowsModel: SpreadsheetRowsModel<SpreadsheetRecord, unknown> = {
    get all() {
      return rows.rows.value
    },
    get byMode() {
      return rows.byMode.value
    },
    cell: rows.cell,
    discard: rows.discard,
    get discarded() {
      return rows.discarded.value
    },
    distinct: rows.distinct,
    edit: rows.edit,
    exportInvalid: () => rows.exportInvalid(t('spreadsheet.review.issuesColumn')),
    get importable() {
      return rows.importable.value
    },
    get invalid() {
      return rows.invalid.value
    },
    issues: rows.issues,
    get keyFields() {
      return rows.keyFields.value
    },
    get loading() {
      return rows.loading.value
    },
    restore: rows.restore,
    revert: edits.revert,
    row: (index) => rows.rows.value[index],
    get valid() {
      return rows.valid.value
    },
  }

  const reviewModel: SpreadsheetReviewModel<SpreadsheetRecord, unknown> = {
    clearSelection: review.clearSelection,
    get fieldIssues() {
      return review.fieldIssues.value
    },
    inspect: review.inspect,
    get inspected() {
      return review.inspected.value
    },
    get issue() {
      return review.issue.value
    },
    get issueTypes() {
      return review.issueTypes.value
    },
    get level() {
      return review.level.value
    },
    get mode() {
      return review.mode.value
    },
    next: review.next,
    get position() {
      return review.position.value
    },
    previous: review.previous,
    get search() {
      return review.search.value
    },
    select: review.select,
    get selection() {
      return review.selection.value
    },
    setIssue: review.setIssue,
    setLevel: review.setLevel,
    setMode: review.setMode,
    setSearch: review.setSearch,
    setTab: review.setTab,
    get tab() {
      return review.tab.value
    },
    get visible() {
      return review.visible.value
    },
  }

  const submitModel: SpreadsheetSubmitModel = {
    get error() {
      return submit.error.value
    },
    get imported() {
      return submit.imported.value
    },
    get progress() {
      return submit.progress.value
    },
    get rejected() {
      return submit.rejected.value
    },
    reset: submit.reset,
    retryRejected: submit.retryRejected,
    run: submit.run,
    get status() {
      return submit.status.value
    },
  }

  return {
    columns: columnsModel,
    context: contextModel,
    file: fileModel,
    get layout() {
      return layoutModel
    },
    get readiness() {
      return readiness.value
    },
    ready,
    reset,
    review: reviewModel,
    rows: rowsModel,
    get schema() {
      return schema.value
    },
    submit: submitModel,
    template,
    values: valuesModel,
  }
}
