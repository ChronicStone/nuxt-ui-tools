import type { FilePreviewFile } from '#ui-tools/file-preview'

function pdfText(value: string) {
  return value.replaceAll(/[()\\]/gu, (char) => `\\${char}`)
}

/** Builds a small valid PDF with one page per entry. Text must stay ASCII so byte offsets match. */
function pdf(pages: readonly (readonly string[])[]) {
  const objects = new Map<number, string>([
    [1, '<< /Type /Catalog /Pages 2 0 R >>'],
    [
      2,
      `<< /Type /Pages /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    ],
    [3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'],
  ])
  pages.forEach((lines, index) => {
    const [title = '', ...body] = lines
    const stream = [
      'BT',
      '/F1 22 Tf',
      '72 760 Td',
      `(${pdfText(title)}) Tj`,
      '/F1 12 Tf',
      '0 -18 Td',
      ...body.flatMap((line) => ['0 -20 Td', `(${pdfText(line)}) Tj`]),
      'ET',
    ].join('\n')
    objects.set(
      4 + index * 2,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + index * 2} 0 R >>`,
    )
    objects.set(5 + index * 2, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })

  let output = '%PDF-1.4\n'
  const offsets: number[] = []
  for (const [id, body] of [...objects].toSorted(([left], [right]) => left - right)) {
    offsets.push(output.length)
    output += `${id} 0 obj\n${body}\nendobj\n`
  }
  const xref = output.length
  output += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`
  output += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  output += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([output], { type: 'application/pdf' })
}

async function photo() {
  const canvas = document.createElement('canvas')
  canvas.width = 3200
  canvas.height = 2400
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available')
  const sky = context.createLinearGradient(0, 0, 0, 2400)
  sky.addColorStop(0, '#27365a')
  sky.addColorStop(0.55, '#c07a7c')
  sky.addColorStop(1, '#f7cf95')
  context.fillStyle = sky
  context.fillRect(0, 0, 3200, 2400)
  context.fillStyle = '#ffe3ad'
  context.beginPath()
  context.arc(2360, 1320, 150, 0, Math.PI * 2)
  context.fill()
  for (let x = 0; x < 3200; x += 90) {
    const height = 260 + ((x * 7919) % 420)
    context.fillStyle = '#4a3f55'
    context.fillRect(x, 1640 - height, 84, height + 200)
    context.fillStyle = 'rgba(255, 207, 133, 0.75)'
    for (let y = 1660 - height; y < 1620; y += 44)
      if ((x + y) % 3 === 0) context.fillRect(x + 22, y, 14, 20)
  }
  context.fillStyle = '#2b2530'
  context.fillRect(0, 1840, 3200, 560)
  context.fillStyle = '#ffffff'
  context.font = '600 72px system-ui, sans-serif'
  context.fillText('Salle d’examen 3 · Lyon', 120, 2260)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      0.88,
    )
  })
}

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><g transform="translate(256 214)"><circle r="126" fill="none" stroke="#ff9600" stroke-width="46" stroke-dasharray="600 192" stroke-linecap="round" transform="rotate(38)"/><circle r="58" fill="#1f1d1a"/><circle cx="94" cy="-94" r="24" fill="#1f5fa8"/></g><text x="256" y="452" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="66" fill="#1f1d1a">clairval</text></svg>`

const CSV = `﻿Compte;Produit;Mois;Évaluations;Prix unitaire HT;Montant HT
Clairval Langues;Oral B2 — Anglais;2026-07;128;42,00;5 376,00
Clairval Langues;Écrit B2 — Anglais;2026-07;96;35,00;3 360,00
Clairval Langues;"Pack ""Entreprise"" — 3 langues";2026-08;12;120,00;1 440,00
Clairval Langues;Oral C1 — Anglais;2026-09;29;48,00;1 392,00
Lumen Formation;Oral B2 — Espagnol;2026-09;40;42,00;1 680,00`

const JSON_PAYLOAD = JSON.stringify({
  data: {
    account: { id: 'acc_clairval', name: 'Clairval Langues' },
    assessmentId: 'asm_7f3c1b',
    result: { level: 'B2', passed: true, score: 71 },
  },
  event: 'assessment.completed',
  id: 'evt_01J8Z7K4Q2',
})

const MARKDOWN = `# Webhook integration

ExAssess sends a signed \`POST\` to your endpoint when an assessment changes state.

## Verify the signature

1. Read the \`X-Signature\` header.
2. Compute an HMAC-SHA256 of the raw body with your secret.
3. Compare both values in constant time.

> Retries back off for 24 hours. Answer with a \`2xx\` within 10 seconds.`

const CONTRACT_PAGES = [
  [
    'Contrat-cadre de prestations',
    'Contrat CLV-2026-02',
    '',
    'Entre ExAssess SAS et Clairval Langues SAS.',
    'Article 1 - Objet',
    'Article 2 - Duree : douze mois a compter du 1er octobre 2026.',
  ],
  [
    'Conditions financieres',
    'Oral B2 - Anglais : 42,00 EUR HT',
    'Ecrit B2 - Anglais : 35,00 EUR HT',
    'Oral C1 - Anglais : 48,00 EUR HT',
  ],
  [
    'Signatures',
    'Fait a Lyon, le 12 septembre 2026.',
    '',
    'Pour le Prestataire                Pour le Client',
  ],
] as const

/** Sample files for every renderer. Video and audio are MDN's CC0 samples. */
export async function createFilePreviewSamples(): Promise<FilePreviewFile[]> {
  const contract = pdf(CONTRACT_PAGES)
  let attempts = 0

  return [
    {
      details: [{ label: 'Uploaded by', value: 'Sophie Marchand' }],
      name: 'Contrat-cadre-CLV-2026-02.pdf',
      src: contract,
      updatedAt: '2026-09-12',
    },
    { name: 'Centre-examen-Lyon-salle-3.jpg', src: await photo(), updatedAt: '2026-08-29' },
    { name: 'clairval-logo.svg', src: new Blob([LOGO], { type: 'image/svg+xml' }) },
    {
      name: 'flower.mp4',
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    },
    {
      name: 't-rex-roar.mp3',
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
    },
    { name: 'consommation-T3-2026.csv', src: new Blob([CSV], { type: 'text/csv' }) },
    {
      name: 'webhook-assessment.completed.json',
      src: new Blob([JSON_PAYLOAD], { type: 'application/json' }),
    },
    { name: 'README-integration.md', src: new Blob([MARKDOWN], { type: 'text/markdown' }) },
    {
      name: 'Statuts-Clairval-Langues.docx',
      rendition: {
        name: 'Statuts.pdf',
        src: pdf([
          [
            'Statuts constitutifs',
            'Clairval Langues SAS',
            'Article 1 - Forme',
            'Article 2 - Objet',
          ],
        ]),
      },
      size: 248_000,
      src: new Blob(['docx'], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    },
    { name: 'Budget-formation-2027.xlsx', size: 96_000, src: new Blob(['xlsx']) },
    {
      name: 'Export-resultats-2025.zip',
      size: 42_000_000,
      src: new Blob(['zip'], { type: 'application/zip' }),
    },
    { name: 'Badge-IMG_2041.heic', src: new Blob(['not an image'], { type: 'image/heic' }) },
    {
      name: 'Certificat-Qualiopi-2026.pdf',
      src: async () => {
        attempts += 1
        await new Promise((resolve) => setTimeout(resolve, 600))
        if (attempts === 1) throw new Error('403 AccessDenied · the signed link expired')
        return pdf([
          ['Certificat qualite', 'Actions de formation', 'Valable jusqu au 30 septembre 2029.'],
        ])
      },
    },
  ]
}
