import { describe, expect, it } from 'vitest'

import { detectCsvDelimiter, parseCsv } from '#ui-tools/file-preview/utils/csv'

describe('file preview CSV parsing', () => {
  it('detects semicolons from French spreadsheet exports, commas, and tabs', () => {
    expect(detectCsvDelimiter('Compte;Produit;Montant HT\nA;B;1 240,00')).toBe(';')
    expect(detectCsvDelimiter('name,"city, country",age\n')).toBe(',')
    expect(detectCsvDelimiter('a\tb\tc')).toBe('\t')
  })

  it('handles quotes, doubled quotes, line breaks inside quotes, and a byte order mark', () => {
    const { delimiter, rows } = parseCsv(
      '﻿Produit;Note\r\n"Pack ""Entreprise""";"Deux\nlignes"\r\nOral B2;ok',
    )

    expect(delimiter).toBe(';')
    expect(rows).toStrictEqual([
      ['Produit', 'Note'],
      ['Pack "Entreprise"', 'Deux\nlignes'],
      ['Oral B2', 'ok'],
    ])
  })

  it('stops after the row limit and reports that the file was cut', () => {
    const text = ['h', ...Array.from({ length: 10 }, (_, index) => String(index))].join('\n')

    expect(parseCsv(text, { maxRows: 4 })).toMatchObject({
      complete: false,
      rows: [['h'], ['0'], ['1'], ['2']],
    })
    expect(parseCsv('a\nb\n', { maxRows: 2 })).toMatchObject({
      complete: true,
      rows: [['a'], ['b']],
    })
  })
})
