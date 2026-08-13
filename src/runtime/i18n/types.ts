import type { DeepPartial } from '#ui-tools/shared/types/utils'

export interface UiToolsTableMessages {
  header: {
    refreshData: string
    tableView: string
    gridView: string
  }
  footer: {
    rowsSelected: string
    rowsPerPage: string
    page: string
    pageSizeOption: string
    previousPage: string
    nextPage: string
    firstPage: string
    lastPage: string
  }
  controls: {
    addFilter: string
    searchFilters: string
    noMatchingFilters: string
    view: string
    searchColumns: string
    configurableColumns: string
    resetColumns: string
    sort: string
    loadMore: string
  }
  columnsMenu: {
    sortAsc: string
    sortDesc: string
    clearSort: string
    pinToLeft: string
    pinToRight: string
    unpinColumn: string
    hideColumn: string
  }
  filters: {
    panel: {
      trigger: string
      clearAll: string
      apply: string
    }
    options: {
      empty: string
    }
    booleans: {
      true: string
      false: string
      empty: string
    }
    preview: {
      empty: string
      selected: string
    }
    operators: {
      contains: string
      is: string
      isNot: string
      isAnyOf: string
      gt: string
      gte: string
      lt: string
      lte: string
      before: string
      after: string
      between: string
    }
  }
  states: {
    loaded: string
    loadingMore: string
    empty: {
      title: string
      description: string
    }
    gridError: {
      title: string
      description: string
      action: string
    }
    gridEmpty: {
      title: string
      description: string
    }
  }
}

export interface UiToolsSpreadsheetMessages {
  common: {
    steps: string
    previous: string
    continue: string
    closeImport: string
    preparingReview: string
    preparingReviewDescription: string
    importRows: string
    exportDiscardedRows: string
    importSummary: string
    clickToChangeHeaderRow: string
    referencesStepHint: string
    sheetStats: string
    arrayValue: string
    objectValue: string
    arraySummary: string
    objectSummary: string
  }
  steps: {
    upload: {
      title: string
      description: string
      stageTitle: string
    }
    structure: {
      title: string
      description: string
      stageTitle: string
      loadWorkbookFirstTitle: string
      loadWorkbookFirstDescription: string
      sheetLabel: string
      previewTitle: string
      autoDetected: string
      headerDetectedAtRow: string
    }
    matching: {
      title: string
      description: string
      matched: string
      needsMatch: string
      missing: string
      autoMapped: string
      ignored: string
      ignoreField: string
      columnFallback: string
      systemField: string
      requirement: string
      spreadsheetColumn: string
      statusHeader: string
      required: string
      optional: string
      searchColumns: string
      selectColumn: string
      assigned: string
      available: string
      autoMappedField: string
      ignoredColumns: string
    }
    references: {
      title: string
      description: string
    }
    review: {
      title: string
      description: string
      importLimit: string
      selected: string
      discard: string
      restore: string
      discardRow: string
      next: string
      prev: string
      backToTable: string
      restoreRow: string
      allRows: string
      valid: string
      invalid: string
      discarded: string
      allIssues: string
      blocking: string
      warnings: string
      ready: string
      validRows: string
      noBlockingIssues: string
      willNotBeImported: string
      nothingDiscarded: string
      row: string
      blockingIssues: string
      warningsOnly: string
      validRow: string
      issueBadgeBlocking: string
      issueBadgeWarning: string
      noValue: string
      overflowTitle: string
      overflowDescription: string
      discardedStatus: string
      blockingStatus: string
      warningStatus: string
      validStatus: string
      issueRowsProgress: string
      inspectingRow: string
      propertyGroups: string
      issueGroups: string
      rowData: string
      issuesOnThisRow: string
      byProperty: string
      byIssueType: string
      ruleKey: string
      groupedByIssueType: string
      rowLevelIssue: string
      affectsFullRow: string
      property: string
      valueInFile: string
      viewAllRowsWithThisIssue: string
      autoTrim: string
    }
  }
  upload: {
    dropzoneLabel: string
    dropzoneDescription: string
    parsingFailed: string
    downloadTemplate: string
    downloadTemplateDescription: string
  }
  validation: {
    required: string
    maxLength: string
    minLength: string
    number: string
    min: string
    max: string
    between: string
    oneOf: string
    unrecognizedValue: string
    invalidNumberInput: string
    invalidBooleanInput: string
    missingValue: string
    parseFailed: string
  }
}

export interface UiToolsFormMessages {
  actions: {
    nextButton: string
    prevButton: string
    submitButton: string
    cancelButton: string
    resetButton: string
  }
  fields: {
    text: {
      defaultPlaceholder: string
    }
    options: {
      refresh: string
      create: string
      creating: string
      createNamed: string
    }
    hierarchy: {
      search: string
      empty: string
      clear: string
    }
    rating: {
      value: string
    }
    date: {
      start: string
      end: string
      clear: string
    }
    time: {
      format: string
      hour: string
      minute: string
      clear: string
    }
    color: {
      open: string
      clear: string
    }
    upload: {
      upload: string
      remove: string
      failed: string
    }
    phone: {
      country: string
      number: string
    }
  }
}

export interface Messages {
  form: UiToolsFormMessages
  table: UiToolsTableMessages
  spreadsheet: UiToolsSpreadsheetMessages
}

export type Direction = 'ltr' | 'rtl'

export interface Locale<TMessages = Messages> {
  name: string
  code: string
  dir: Direction
  messages: TMessages
}

export type UiToolsMessages = Messages
export type UiToolsLocaleMessages = Messages
export type UiToolsLocaleMessagesPartial = DeepPartial<Messages>
export type UiToolsDirection = Direction
export type UiToolsLocale<TMessages = Messages> = Locale<TMessages>
