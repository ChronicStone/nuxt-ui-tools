const escapes = new Map([
  ['"', '&quot;'],
  ['&', '&amp;'],
  ["'", '&#39;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
])

function escape(text: string) {
  return text.replaceAll(/["&'<>]/gu, (char) => escapes.get(char) ?? char)
}

function inline(text: string) {
  return escape(text)
    .replaceAll(/`([^`]+)`/gu, '<code>$1</code>')
    .replaceAll(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>')
}

/**
 * Tiny markdown renderer for the playground: headings, paragraphs, lists, quotes, and fenced code.
 * Real apps pass their own renderer (MDC, markdown-it with DOMPurify, ...).
 */
export function renderPlaygroundMarkdown(source: string) {
  const blocks = source.replaceAll('\r\n', '\n').split(/\n{2,}/u)
  return blocks
    .map((block) => {
      const lines = block.split('\n')
      const heading = /^(#{1,3}) (.*)$/u.exec(block)
      if (heading)
        return `<h${heading[1]?.length}>${inline(heading[2] ?? '')}</h${heading[1]?.length}>`
      if (block.startsWith('```'))
        return `<pre><code>${escape(lines.slice(1, -1).join('\n'))}</code></pre>`
      if (lines.every((line) => /^[-*] /u.test(line)))
        return `<ul>${lines.map((line) => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`
      if (lines.every((line) => /^\d+\. /u.test(line)))
        return `<ol>${lines.map((line) => `<li>${inline(line.replace(/^\d+\. /u, ''))}</li>`).join('')}</ol>`
      if (block.startsWith('> '))
        return `<blockquote>${inline(block.replaceAll(/^> /gmu, ''))}</blockquote>`
      return `<p>${inline(block)}</p>`
    })
    .join('\n')
}
