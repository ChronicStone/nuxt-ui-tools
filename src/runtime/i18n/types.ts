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
    perPage: string
    range: string
    rangeEmpty: string
    pageOf: string
    page: string
    pageSizeOption: string
    previousPage: string
    nextPage: string
    firstPage: string
    lastPage: string
  }
  controls: {
    addFilter: string
    resetFilters: string
    columnsCount: string
    close: string
    loadingMore: string
    searchFilters: string
    noMatchingFilters: string
    view: string
    searchColumns: string
    configurableColumns: string
    resetColumns: string
    sort: string
    loadMore: string
    clearSelection: string
  }
  selectionBar: {
    selection: string
    allResults: string
    more: string
    clear: string
  }
  summaries: {
    total: string
    page: string
    filtered: string
    selection: string
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
    editor: {
      clear: string
    }
    sheet: {
      done: string
      back: string
      sortBy: string
      order: string
    }
    panel: {
      trigger: string
      clearAll: string
      apply: string
      done: string
      reset: string
      results: string
      matching: string
      matchMode: string
    }
    options: {
      empty: string
      /** Remote option pages failed to load. */
      loadError: string
      retry: string
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
      filteredTitle: string
      filteredDescription: string
      reset: string
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
  /** Form page chrome. Counts use `Intl.PluralRules`: `One` for "one", `Other` otherwise. */
  page: {
    /** Accessible name of the section navigation when the schema gives it no title. */
    navigation: string
    /** Marks an optional section, in the navigation and on its card. */
    optional: string
    /** Badge under the page title and name of a section's dirty marker. */
    unsavedChanges: string
    /** Button of a modified section that puts its values back. */
    resetSection: string
    /** Bold count inserted in `remaining` and `modified`: "{count} sections". */
    sectionsOne: string
    sectionsOther: string
    /** Navigation summary while required sections are incomplete: "{count} to complete." */
    remaining: string
    /** Navigation summary once every required section is complete. */
    complete: string
    /** Navigation summary of a form with dirty checking: "{count} modified." */
    modifiedOne: string
    modifiedOther: string
    /** Navigation summary of a form with dirty checking and no change. */
    unmodified: string
    /** Accessible status of a navigation entry. */
    status: {
      complete: string
      pending: string
      invalid: string
    }
  }
  states: {
    contextError: {
      title: string
      description: string
      action: string
    }
  }
  validation: {
    required: string
    dateMin: string
    dateMax: string
  }
  fields: {
    text: {
      defaultPlaceholder: string
      clear: string
    }
    description: {
      more: string
      close: string
    }
    file: {
      drop: string
      replace: string
      remove: string
      add: string
    }
    array: {
      addItem: string
      removeItem: string
      dragItem: string
      editItem: string
      confirmDelete: string
      empty: string
      item: string
      expand: string
      collapse: string
      unique: string
    }
    password: {
      show: string
      hide: string
      requirements: string
    }
    options: {
      refresh: string
      create: string
      creating: string
      createNamed: string
      loadMore: string
      loadingMore: string
      retry: string
      loadError: string
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
      confirm: string
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
      clear: string
    }
  }
}

export interface UiToolsDashboardMessages {
  states: {
    loading: string
    refreshing: string
    empty: string
    error: string
    errorDescription: string
    retry: string
  }
  funnel: {
    base: string
    fromPrevious: string
  }
  menu: {
    label: string
    showTable: string
    hideTable: string
    download: string
    expand: string
  }
  table: {
    category: string
    label: string
    value: string
    total: string
    share: string
    change: string
    severity: string
    time: string
    description: string
    actions: string
  }
  freshness: {
    updated: string
    /** Label before a relative time ("Updated" · 3 min ago). */
    prefix: string
  }
  stat: {
    goal: string
  }
  compare: {
    previous: string
    year: string
    none: string
    /** Stat caption with `compare`: "vs {value} previous period". */
    caption: string
    /** Legend label of a series' comparison: "{label} (previous period)". */
    series: string
  }
  refresh: {
    label: string
    auto: string
    off: string
  }
  page: {
    /** Before the time the data on screen was fetched, after the date: "updated" 3 min ago. */
    updated: string
    /** While the first data loads, after the date. */
    loading: string
  }
  series: {
    /** Button of a chart whose series a filter picks, listing the options. */
    add: string
    /** Accessible name of a series chip's remove button: "Remove {label}". */
    remove: string
  }
  filters: {
    /** Accessible name of a filter bar. */
    label: string
    /** Accessible name of the view tabs. */
    views: string
    /** Text of an empty selection. */
    all: string
    /** Items of a boolean filter. */
    yes: string
    no: string
    /** Pill text of several selected values: "{label} +{count}". */
    more: string
    search: string
    empty: string
    loading: string
    loadError: string
    retry: string
    clearSelection: string
    /** Heading of the presets under a filter's options. */
    presets: string
    /** Accessible name of a pill's clear button: "Clear {label}". */
    clear: string
    reset: string
  }
  format: {
    /** Signed difference of two percentages, `Intl.PluralRules` "one" form: "{value} pt". */
    pointsOne: string
    pointsOther: string
  }
  /** Accessible name of a row's `⋮` menu. */
  rowActions: string
  alerts: {
    empty: string
    severity: {
      error: string
      warning: string
      info: string
      success: string
    }
  }
}

export interface Messages {
  dashboard: UiToolsDashboardMessages
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
