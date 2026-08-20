import type ts from 'typescript'

/**
 * Build-time support for the `defineQueryPrefetch(...)` page macro.
 *
 * Pages declare their data requirements with a single top-level
 * `defineQueryPrefetch(routeName, resolve)` statement in `<script setup>`.
 * The transform moves that call into `definePageMeta({ queryPrefetch })` so the
 * resolved route carries its own prefetch definition.
 */

const SCRIPT_SETUP_TAG_RE = /<script\b(?=[^>]*\bsetup\b)[^>]*>/

type TextEdit = {
  end: number
  start: number
  text: string
}

function getMacroCall(typescript: typeof ts, statement: ts.Statement, name: string) {
  if (
    !typescript.isExpressionStatement(statement) ||
    !typescript.isCallExpression(statement.expression)
  )
    return
  if (!typescript.isIdentifier(statement.expression.expression)) return
  if (statement.expression.expression.text !== name) return
  return statement.expression
}

function getPropertyName(
  typescript: typeof ts,
  property: ts.ObjectLiteralElement,
  source: ts.SourceFile,
) {
  if (typescript.isSpreadAssignment(property)) return

  const name = 'name' in property ? property.name : undefined
  if (!name) return
  if (typescript.isComputedPropertyName(name)) {
    const expression = name.expression
    if (
      typescript.isStringLiteral(expression) ||
      typescript.isNoSubstitutionTemplateLiteral(expression)
    )
      return expression.text
    return
  }

  return name.getText(source)
}

function applyTextEdits(code: string, edits: TextEdit[]) {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (transformed, edit) =>
        `${transformed.slice(0, edit.start)}${edit.text}${transformed.slice(edit.end)}`,
      code,
    )
}

/**
 * Rewrites a page SFC's `defineQueryPrefetch(...)` statement into
 * `definePageMeta({ queryPrefetch: ... })`.
 *
 * Returns `undefined` when the page does not use the macro, and throws on
 * unsupported shapes: multiple macro calls, multiple `definePageMeta` calls, a
 * non-object `definePageMeta` argument, or a manually configured
 * `queryPrefetch` meta key.
 */
export function transformQueryPrefetchMacro(typescript: typeof ts, code: string, id: string) {
  const scriptTag = SCRIPT_SETUP_TAG_RE.exec(code)
  if (!scriptTag) return

  const scriptStart = scriptTag.index + scriptTag[0].length
  const scriptEnd = code.indexOf('</script>', scriptStart)
  if (scriptEnd === -1) return

  const script = code.slice(scriptStart, scriptEnd)
  const source = typescript.createSourceFile(
    id,
    script,
    typescript.ScriptTarget.Latest,
    true,
    typescript.ScriptKind.TSX,
  )
  const prefetchStatements = source.statements
    .map((statement) => ({
      call: getMacroCall(typescript, statement, 'defineQueryPrefetch'),
      statement,
    }))
    .filter((entry): entry is { call: ts.CallExpression; statement: ts.Statement } => !!entry.call)

  if (!prefetchStatements.length) return
  if (prefetchStatements.length > 1)
    throw new Error(`Multiple defineQueryPrefetch calls are not supported in ${id}`)

  const pageMetaStatements = source.statements
    .map((statement) => ({
      call: getMacroCall(typescript, statement, 'definePageMeta'),
      statement,
    }))
    .filter((entry): entry is { call: ts.CallExpression; statement: ts.Statement } => !!entry.call)

  if (pageMetaStatements.length > 1)
    throw new Error(`Multiple definePageMeta calls are not supported in ${id}`)

  const prefetch = prefetchStatements[0]
  if (!prefetch) return

  const { call: prefetchCall, statement: prefetchStatement } = prefetch
  if (prefetchCall.arguments.length !== 2)
    throw new Error(`defineQueryPrefetch must receive a route name and resolver in ${id}`)

  const prefetchCode = prefetchCall.getText(source)
  const pageMeta = pageMetaStatements[0]

  if (!pageMeta)
    return applyTextEdits(code, [
      {
        start: scriptStart + prefetchStatement.getStart(source),
        end: scriptStart + prefetchStatement.end,
        text: `definePageMeta({\n  queryPrefetch: ${prefetchCode},\n})`,
      },
    ])

  const meta = pageMeta.call.arguments[0]
  if (!meta || !typescript.isObjectLiteralExpression(meta))
    throw new Error(`definePageMeta must receive an object when using defineQueryPrefetch in ${id}`)

  if (meta.properties.some((property) => typescript.isSpreadAssignment(property)))
    throw new Error(
      `definePageMeta spreads are unsupported when using defineQueryPrefetch in ${id}`,
    )

  const alreadyConfigured = meta.properties.some(
    (property) => getPropertyName(typescript, property, source) === 'queryPrefetch',
  )
  if (alreadyConfigured)
    throw new Error(`queryPrefetch is already configured through definePageMeta in ${id}`)

  return applyTextEdits(code, [
    {
      start: scriptStart + meta.getStart(source) + 1,
      end: scriptStart + meta.getStart(source) + 1,
      text: `\n  queryPrefetch: ${prefetchCode},`,
    },
    {
      start: scriptStart + prefetchStatement.getStart(source),
      end: scriptStart + prefetchStatement.end,
      text: '',
    },
  ])
}
