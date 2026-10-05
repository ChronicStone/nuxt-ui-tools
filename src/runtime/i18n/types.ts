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
    clearSearch: string
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
    rowOne: string
    rowOther: string
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
    date: {
      range: string
      custom: string
      start: string
      end: string
      presets: {
        today: string
        yesterday: string
        sevenDaysAgo: string
        startOfMonth: string
        startOfYear: string
        last7Days: string
        last30Days: string
        thisMonth: string
        lastMonth: string
        yearToDate: string
      }
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
  issues: {
    required: string
    number: string
    date: string
    boolean: string
    unknownValue: string
    notFound: string
    skipped: string
    duplicate: string
    exists: string
    email: string
    pattern: string
    minLength: string
    maxLength: string
    min: string
    max: string
    between: string
    notFuture: string
  }
  template: {
    sheet: string
    guide: string
    column: string
    required: string
    allowed: string
    description: string
    yes: string
  }
  steps: {
    file: string
    columns: string
    values: string
    review: string
    submit: string
    auto: string
  }
  stepHints: {
    file: string
    columns: string
    values: string
    review: string
    submit: string
  }
  headings: {
    file: {
      title: string
      description: string
    }
    columns: {
      title: string
      description: string
    }
    values: {
      title: string
      description: string
    }
    review: {
      title: string
      description: string
    }
    submit: {
      title: string
      description: string
    }
  }
  nav: {
    back: string
    continue: string
    cancel: string
    close: string
    import: string
    another: string
    blockers: {
      file: string
      columns: string
      values: string
      review: string
      invalid: string
    }
  }
  file: {
    dropTitle: string
    dropBrowse: string
    dropHint: string
    dropHintNoLimit: string
    paste: string
    reading: string
    readFailed: string
    replace: string
    summary: string
    sheet: string
    sheetOption: string
    headerRow: string
    rowOption: string
    emptyRow: string
    detected: string
    titleRows: string
    ambiguous: string
    noMatch: string
    useDetected: string
    previewTitle: string
    previewHeader: string
    expected: string
    expectedCount: string
    optional: string
    fromContext: string
    template: string
  }
  columns: {
    field: string
    column: string
    samples: string
    none: string
    columnFor: string
    emptyColumn: string
    statuses: {
      matched: string
      manual: string
      default: string
      missing: string
      unmatched: string
    }
    suggestion: string
    useSuggestion: string
    reset: string
    reads: string
    found: string
    allFound: string
    unused: string
  }
  values: {
    value: string
    rows: string
    answer: string
    rowCount: string
    choose: string
    search: string
    loading: string
    valueFor: string
    /** Heading of values checked against options that depend on other columns. */
    scope: string
    condition: string
    leaveEmpty: string
    skipRows: string
    create: string
    statuses: {
      open: string
      user: string
      policy: string
      recognized: string
    }
    recognized: string
    nothing: string
  }
  table: {
    tabs: {
      all: string
      importable: string
      invalid: string
      discarded: string
    }
    levels: {
      all: string
      blocking: string
      warnings: string
    }
    modes: {
      all: string
      create: string
      update: string
    }
    search: string
    anyIssue: string
    byColumn: string
    byIssue: string
    columnIssueOption: string
    issueOption: string
    clearFilter: string
    selected: string
    discard: string
    restore: string
    clearSelection: string
    row: string
    selectRow: string
    selectAll: string
    inspectRow: string
    empty: string
    emptyCell: string
    edited: string
    defaulted: string
    created: string
    stored: string
    rowCount: string
    modeCreate: string
    modeUpdate: string
    status: {
      valid: string
      warning: string
      blocking: string
      discarded: string
    }
    reasons: {
      manual: string
      value: string
      limit: string
      duplicate: string
      existing: string
    }
  }
  inspector: {
    title: string
    close: string
    position: string
    positionNone: string
    previous: string
    next: string
    issues: string
    noIssue: string
    values: string
    inFile: string
    revert: string
    discard: string
    restore: string
    allRows: string
    answerIt: string
  }
  stats: {
    importable: string
    invalid: string
    discarded: string
    create: string
    update: string
    warnings: string
    blocking: string
  }
  review: {
    issuesColumn: string
    export: string
  }
  summary: {
    file: string
    toImport: string
    create: string
    update: string
    invalid: string
    discarded: string
    edited: string
    created: string
  }
  progress: {
    running: string
    count: string
    done: string
    doneHint: string
    rejected: string
    rejectedHint: string
    retry: string
    review: string
    error: string
    tryAgain: string
  }
}

export interface UiToolsFormMessages {
  /** Confirmations asked before discarding work. */
  confirm: {
    unsavedChanges: string
  }
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
      removeNamedItem: string
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
      tokens: {
        day: string
        month: string
        year: string
        hour: string
        minute: string
      }
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
      open: string
      cancel: string
      retry: string
      replace: string
      uploading: string
      queued: string
      pending: string
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
  details: {
    /** Accessible name of an item's copy button. */
    copy: string
    /** Announced once the value is on the clipboard. */
    copied: string
  }
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

export interface UiToolsFilePreviewMessages {
  /** Name shown for a file that has none, such as a pasted image. */
  untitled: string
  close: string
  expand: string
  restore: string
  previous: string
  next: string
  /** Gallery position in the header: "{current} / {total}". */
  counter: string
  /** Announced on navigation: "{current} of {total}: {name}". */
  position: string
  details: string
  download: string
  openInNewTab: string
  moreActions: string
  retry: string
  kinds: {
    image: string
    video: string
    audio: string
    pdf: string
    text: string
    csv: string
    markdown: string
    office: string
    archive: string
    other: string
  }
  fields: {
    name: string
    type: string
    size: string
    modified: string
    dimensions: string
    duration: string
    lines: string
    rows: string
    columns: string
  }
  converted: {
    title: string
    /** "The original is a {kind} file." */
    description: string
    download: string
  }
  errors: {
    sourceTitle: string
    sourceDescription: string
    /** "This browser can't display {extension} files". */
    decodeTitle: string
    decodeDescription: string
    pdfTitle: string
    pdfDescription: string
    open: string
  }
  fallback: {
    title: string
    /** "{extension} files can't be shown here. Download it to open it in another app." */
    description: string
    descriptionUnnamed: string
  }
  /** "Showing the first {size} of {total}." */
  truncated: string
  image: {
    zoomIn: string
    zoomOut: string
    fit: string
    rotate: string
  }
  media: {
    play: string
    pause: string
    mute: string
    unmute: string
    volume: string
    speed: string
    captions: string
    pictureInPicture: string
    fullscreen: string
    exitFullscreen: string
    seek: string
  }
  text: {
    wrap: string
    copy: string
    copied: string
    /** "{count} lines" */
    lines: string
    formatted: string
  }
  csv: {
    /** "{count} rows" */
    rows: string
    /** "{count} columns" */
    columns: string
    /** "Delimiter “{value}”" */
    delimiter: string
    tab: string
    bom: string
  }
  markdown: {
    preview: string
    source: string
  }
}

export interface Messages {
  dashboard: UiToolsDashboardMessages
  filePreview: UiToolsFilePreviewMessages
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
