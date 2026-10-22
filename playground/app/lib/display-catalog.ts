import { h } from 'vue'

import type { DisplayKind, DisplaySpec } from '#ui-tools/display'

export interface DisplayCatalogExample {
  caption: string
  /** Spans both columns of the catalog grid. */
  wide?: boolean
  spec: DisplaySpec
}

export interface DisplayCatalogKind {
  kind: DisplayKind
  description: string
  examples: readonly DisplayCatalogExample[]
}

function scene(from: string, to: string, accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/><circle cx="238" cy="58" r="30" fill="${accent}" opacity="0.85"/><path d="M0 150 L90 92 L160 138 L230 100 L320 150 L320 180 L0 180 Z" fill="#ffffff" opacity="0.35"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SCENES = {
  dawn: scene('#fde68a', '#f97316', '#fff7ed'),
  dusk: scene('#c7d2fe', '#4f46e5', '#eef2ff'),
  forest: scene('#bbf7d0', '#15803d', '#f0fdf4'),
  slate: scene('#e2e8f0', '#334155', '#f8fafc'),
}

/** A link resolved after a short wait, like a signed URL fetched on demand. */
function signedUrl(file: string) {
  return () =>
    new Promise<string>((resolve) => {
      setTimeout(() => resolve(`https://example.com/signed/${file}?expires=600`), 600)
    })
}

export const displayCatalog: readonly DisplayCatalogKind[] = [
  {
    description: 'Titles a group of fields.',
    examples: [
      {
        caption: 'eyebrow',
        spec: { display: 'heading', props: { title: 'Billing', variant: 'eyebrow' } },
      },
      {
        caption: 'sm · count',
        spec: { display: 'heading', props: { count: 24, size: 'sm', title: 'Candidates' } },
      },
      {
        caption: 'md · icon · action',
        spec: {
          display: 'heading',
          props: {
            action: { label: 'See all' },
            icon: 'i-lucide-calendar',
            title: 'Planned sessions',
          },
        },
      },
      {
        caption: 'lg · tile · registered tone',
        spec: {
          display: 'heading',
          props: {
            description: 'Applied to the next invoices of the account.',
            icon: 'i-lucide-receipt',
            size: 'lg',
            title: 'Payment terms',
            tone: 'violet',
          },
        },
      },
    ],
    kind: 'heading',
  },
  {
    description: 'Copy in seven registers.',
    examples: [
      {
        caption: 'body',
        spec: {
          display: 'text',
          props: {
            text: 'Candidates get their notice seven days before the session, with the address.',
          },
        },
      },
      {
        caption: 'lead',
        spec: {
          display: 'text',
          props: { appearance: 'lead', text: 'This order books 30 licences on the 2026 contract.' },
        },
      },
      {
        caption: 'muted',
        spec: {
          display: 'text',
          props: { appearance: 'muted', text: 'The centre may move the time up to 48 h before.' },
        },
      },
      {
        caption: 'caption · icon',
        spec: {
          display: 'text',
          props: { appearance: 'caption', icon: 'i-lucide-info', text: 'Amounts include VAT.' },
        },
      },
      {
        caption: 'quote · author',
        spec: {
          display: 'text',
          props: {
            appearance: 'quote',
            author: 'Ben Martin',
            meta: 'Oct 14',
            text: '“Please book a quiet room for the oral part, two candidates are hard of hearing.”',
          },
        },
      },
      {
        caption: 'legal · title',
        spec: {
          display: 'text',
          props: {
            appearance: 'legal',
            icon: 'i-lucide-shield',
            text: 'Results are kept five years, then deleted. Candidates can ask for access or correction.',
            title: 'Data protection',
          },
        },
      },
      {
        caption: 'prose · maxLines',
        spec: {
          display: 'text',
          props: {
            appearance: 'prose',
            maxLines: 2,
            paragraphs: [
              h('span', [
                'Import the list as ',
                h('code', '.xlsx'),
                '. The ',
                h('b', 'Name'),
                ' and ',
                h('b', 'Email'),
                ' columns are required; see ',
                h('a', { href: '#' }, 'the template'),
                '.',
              ]),
              'One candidate per row. Duplicates are merged on the email address, keeping the latest row.',
            ],
          },
        },
        wide: true,
      },
    ],
    kind: 'text',
  },
  {
    description: 'Notices, from a quiet line to a banner.',
    examples: [
      {
        caption: 'soft · info',
        spec: {
          display: 'alert',
          props: { message: 'Sent seven days before each session.', title: 'Automatic notices' },
        },
      },
      {
        caption: 'outline · warning',
        spec: {
          display: 'alert',
          props: {
            appearance: 'outline',
            message: '6 credits left out of 120.',
            title: 'Contract nearly used',
            tone: 'warning',
          },
        },
      },
      {
        caption: 'subtle · success',
        spec: {
          display: 'alert',
          props: {
            appearance: 'subtle',
            message: 'Accreditation valid until 2027.',
            title: 'Centre verified',
            tone: 'success',
          },
        },
      },
      {
        caption: 'solid · error',
        spec: {
          display: 'alert',
          props: {
            appearance: 'solid',
            message: 'The card expired on Sept 30.',
            title: 'Payment refused',
            tone: 'error',
          },
        },
      },
      {
        caption: 'callout · primary',
        spec: {
          display: 'alert',
          props: {
            appearance: 'callout',
            icon: 'i-lucide-bell',
            message: 'Candidates are told by email and SMS.',
            tone: 'primary',
          },
        },
      },
      {
        caption: 'inline',
        spec: {
          display: 'alert',
          props: { appearance: 'inline', message: 'The change applies to the next invoice.' },
        },
      },
      {
        caption: 'banner · actions',
        spec: {
          display: 'alert',
          props: {
            actions: [{ label: 'Later' }, { color: 'primary', label: 'Send', variant: 'solid' }],
            appearance: 'banner',
            icon: 'i-lucide-send',
            message: 'They were added after the Oct 14 sending.',
            title: '12 candidates without a notice',
            tone: 'primary',
          },
        },
        wide: true,
      },
      {
        caption: 'items · icon per line',
        spec: {
          display: 'alert',
          props: {
            items: [
              { icon: 'i-lucide-id-card', text: 'A valid ID' },
              { icon: 'i-lucide-file-text', text: 'The notice, printed or on a phone' },
            ],
            title: 'To bring',
            tone: 'warning',
          },
        },
      },
      {
        caption: 'list · details',
        spec: {
          display: 'alert',
          props: {
            details: 'Row 12: birth date missing.',
            list: ['Row 4: invalid email', 'Row 9: duplicate'],
            title: '3 rows rejected',
            tone: 'error',
          },
        },
      },
    ],
    kind: 'alert',
  },
  {
    description: 'Label → value pairs.',
    examples: [
      {
        caption: 'ledger · groups · copy · emphasis · loading',
        spec: {
          display: 'facts',
          props: {
            actions: [{ icon: 'i-lucide-pencil', label: 'Edit the contract' }],
            groups: [
              {
                aside: '2026',
                items: [
                  { copy: true, label: 'Reference', mono: true, value: 'CT-2026-0148' },
                  { hint: '12 offered', label: 'Credits', value: 120 },
                ],
                title: 'Contract',
              },
              {
                items: [
                  { label: 'Payment', value: 'Transfer · 30 days' },
                  { label: 'Pending invoices', loading: true },
                  { emphasis: true, label: 'Committed', value: '€9,840.00' },
                ],
                title: 'Billing',
              },
            ],
          },
        },
      },
      {
        caption: 'grid · chip · mono · dash',
        spec: {
          display: 'facts',
          props: {
            items: [
              { chip: { label: 'Active', tone: 'success' }, label: 'Status', value: 'Active' },
              { label: 'Created', value: 'Feb 3, 2026' },
              { label: 'Owner', value: 'Camille Laurent' },
              { label: 'Centres', value: 4 },
              { label: 'Company ID', mono: true, value: '552 100 554 00025' },
              { label: 'Language' },
            ],
            layout: 'grid',
          },
        },
      },
      {
        caption: 'inline · tone',
        spec: {
          display: 'facts',
          props: {
            items: [
              { label: 'Candidates', value: 24 },
              { label: 'Sessions', value: 3 },
              { label: 'Attendance', tone: 'success', value: '96 %' },
            ],
            layout: 'inline',
          },
        },
      },
      {
        caption: 'columns · link',
        spec: {
          display: 'facts',
          props: {
            items: [
              { label: 'Address', value: '12 Republic street, Lyon' },
              { label: 'Contact', to: 'mailto:billing@arvelle.com', value: 'billing@arvelle.com' },
              { label: 'Client code', value: 'ARV-0042' },
            ],
            labelWidth: '7rem',
            layout: 'columns',
          },
        },
      },
      {
        caption: 'tiles',
        spec: {
          display: 'facts',
          props: {
            items: [
              { label: 'Left', value: 36 },
              { label: 'Next', value: 'Oct 24' },
              { label: 'Average', value: 812 },
            ],
            layout: 'tiles',
          },
        },
        wide: true,
      },
    ],
    kind: 'facts',
  },
  {
    description: 'One figure, or a row of them.',
    examples: [
      {
        caption: 'hero · chip',
        spec: {
          display: 'stat',
          props: {
            caption: 'Incl. VAT · due Nov 21',
            chip: { label: 'Quote' },
            label: 'Amount due',
            value: '€3,110.40',
          },
        },
      },
      {
        caption: 'price · status',
        spec: {
          display: 'stat',
          props: {
            label: 'Price per candidate',
            status: { icon: 'i-lucide-circle-check', text: 'Contract rate applied' },
            unit: 'excl. VAT',
            value: '€96.00',
            variant: 'price',
          },
        },
      },
      {
        caption: 'row · tone',
        spec: {
          display: 'stat',
          props: {
            items: [
              { label: 'Enrolled', value: 124 },
              { caption: '79 %', label: 'Taken', value: 98 },
              { label: 'Pass rate', tone: 'success', value: '87 %' },
            ],
            variant: 'row',
          },
        },
      },
      {
        caption: 'trend · sparkline',
        spec: {
          display: 'stat',
          props: {
            caption: 'vs. September',
            delta: { value: '+12 %' },
            label: 'Sessions this month',
            trend: [18, 24, 21, 30, 37, 42],
            value: 42,
            variant: 'trend',
          },
        },
      },
    ],
    kind: 'stat',
  },
  {
    description: 'Lines that add up to a total.',
    examples: [
      {
        caption: 'open · subtotal · footnote',
        spec: {
          display: 'breakdown',
          props: {
            footnote: 'Discount from 20 candidates.',
            lines: [
              { detail: '24 × €96.00', label: 'TOEIC licences', value: '€2,304.00' },
              { detail: '10 %', label: 'Volume discount', tone: 'success', value: '−€230.40' },
              { label: 'Subtotal', subtotal: true, value: '€2,073.60' },
              { detail: '20 %', label: 'VAT', value: '€414.72' },
            ],
            total: { chip: { label: 'Quote' }, label: 'Total', value: '€2,488.32' },
          },
        },
      },
      {
        caption: 'collapsible',
        spec: {
          display: 'breakdown',
          props: {
            lines: [
              { label: 'Subtotal', value: '€2,073.60' },
              { detail: '20 %', label: 'VAT', value: '€414.72' },
            ],
            mode: 'collapsible',
            total: { label: 'Total', value: '€2,488.32' },
          },
        },
      },
      {
        caption: 'compare',
        spec: {
          display: 'breakdown',
          props: {
            columns: ['Current', 'Renewal'],
            lines: [
              { label: 'Unit price', tone: 'success', values: ['€96.00', '€89.00'] },
              { label: 'Credits', values: ['120', '150'] },
            ],
            mode: 'compare',
            total: { label: 'Total excl. VAT', values: ['€10,368', '€11,748'] },
          },
        },
        wide: true,
      },
    ],
    kind: 'breakdown',
  },
  {
    description: 'Usage, shares, scores, levels.',
    examples: [
      {
        caption: 'bar · thresholds',
        spec: {
          display: 'meter',
          props: {
            caption: '36 left · expires Dec 31',
            label: 'Credits used',
            max: 120,
            thresholds: { error: 90, warning: 70 },
            value: 84,
          },
        },
      },
      {
        caption: 'split',
        spec: {
          display: 'meter',
          props: {
            parts: [
              { label: 'Training account', tone: 'primary', value: 60 },
              { label: 'Company', tone: 'neutral', value: 40 },
            ],
            variant: 'split',
          },
        },
      },
      {
        caption: 'segments · legend',
        spec: {
          display: 'meter',
          props: {
            label: 'Autumn campaign',
            parts: [
              { label: 'Taken', tone: 'success', value: 62 },
              { label: 'Planned', tone: 'info', value: 21 },
              { label: 'To plan', tone: 'neutral', value: 17 },
            ],
            valueLabel: '100 candidates',
            variant: 'segments',
          },
        },
      },
      {
        caption: 'ring · parts',
        spec: {
          display: 'meter',
          props: {
            max: 990,
            parts: [
              { icon: 'i-lucide-headphones', label: 'Listening', max: 495, value: 445 },
              { icon: 'i-lucide-book-open', label: 'Reading', max: 495, value: 400 },
            ],
            value: 845,
            variant: 'ring',
          },
        },
      },
      {
        caption: 'scale · current · target',
        spec: {
          display: 'meter',
          props: {
            current: 3,
            label: 'CEFR level',
            levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
            target: 4,
            valueLabel: 'B2 · aiming for C1',
            variant: 'scale',
          },
        },
        wide: true,
      },
    ],
    kind: 'meter',
  },
  {
    description: 'Small charts in the dashboard palette.',
    examples: [
      {
        caption: 'bars · highlight last',
        spec: {
          display: 'chart',
          props: {
            aside: '2026',
            data: [
              { label: 'May', value: 18 },
              { label: 'Jun', value: 24 },
              { label: 'Jul', value: 21 },
              { label: 'Aug', value: 30 },
              { label: 'Sep', value: 37 },
              { label: 'Oct', value: 42 },
            ],
            title: 'Sessions per month',
          },
        },
      },
      {
        caption: 'line',
        spec: {
          display: 'chart',
          props: {
            aside: '+52 pts',
            data: [
              { label: 'May', value: 760 },
              { label: 'Jun', value: 771 },
              { label: 'Jul', value: 768 },
              { label: 'Aug', value: 789 },
              { label: 'Sep', value: 801 },
              { label: 'Oct', value: 812 },
            ],
            title: 'Average score',
            variant: 'line',
          },
        },
      },
      {
        caption: 'donut · legend',
        spec: {
          display: 'chart',
          props: {
            aside: '412 sittings',
            data: [
              { label: 'TOEIC', value: 222 },
              { label: 'Linguaskill', value: 115 },
              { label: 'Pipplet', value: 75 },
            ],
            title: 'By test',
            variant: 'donut',
          },
        },
      },
      {
        caption: 'funnel · rates',
        spec: {
          display: 'chart',
          props: {
            data: [
              { label: 'Invited', value: 120 },
              { label: 'Enrolled', value: 96 },
              { label: 'Taken', value: 82 },
              { label: 'Certified', value: 71 },
            ],
            title: 'Autumn campaign',
            variant: 'funnel',
          },
        },
      },
    ],
    kind: 'chart',
  },
  {
    description: 'A light read-only table.',
    examples: [
      {
        caption: 'numeric · sticky header and footer · maxHeight · max',
        spec: {
          display: 'table',
          props: {
            caption: '7 candidates · Oct 14 session',
            columns: [
              { key: 'name', label: 'Candidate' },
              { key: 'date', label: 'Date' },
              { key: 'listening', label: 'Listening', numeric: true },
              { key: 'reading', label: 'Reading', numeric: true },
              { key: 'total', label: 'Total', numeric: true },
            ],
            footer: { listening: 424, name: 'Average', reading: 374, total: 798 },
            max: 5,
            maxHeight: 220,
            note: 'Official scores',
            rows: [
              { date: 'Oct 14', listening: 445, name: 'Camille Laurent', reading: 400, total: 845 },
              { date: 'Oct 14', listening: 390, name: 'Yanis Haddad', reading: 345, total: 735 },
              { date: 'Oct 15', listening: 420, name: 'Inès Moreau', reading: 370, total: 790 },
              { date: 'Oct 16', listening: 480, name: 'Léa Fontaine', reading: 425, total: 905 },
              { date: 'Oct 17', listening: 400, name: 'Malik Diallo', reading: 360, total: 760 },
              { date: 'Oct 17', listening: 455, name: 'Hugo Bernard', reading: 410, total: 865 },
              { date: 'Oct 18', listening: 375, name: 'Chloé Petit', reading: 310, total: 685 },
            ],
          },
        },
        wide: true,
      },
    ],
    kind: 'table',
  },
  {
    description: 'What a submit will change.',
    examples: [
      {
        caption: 'inline · showUnchanged',
        spec: {
          display: 'diff',
          props: {
            items: [
              {
                after: 'invoices@arvelle.com',
                before: 'billing@arvelle.com',
                label: 'Billing email',
              },
              { after: '45 days', before: '30 days', label: 'Payment delay' },
              { after: 'Arvelle Group', before: 'Arvelle Group', changed: false, label: 'Company' },
            ],
            showUnchanged: true,
          },
        },
      },
      {
        caption: 'columns · unchanged dimmed · note',
        spec: {
          display: 'diff',
          props: {
            items: [
              { after: 'Arvelle Group', before: 'Arvelle Group', changed: false, label: 'Company' },
              {
                after: 'Lyon',
                before: 'Villeurbanne',
                label: 'City',
                note: { label: 'Moved', tone: 'info' },
              },
              { after: '12 %', before: '10 %', label: 'Discount' },
            ],
            variant: 'columns',
          },
        },
      },
    ],
    kind: 'diff',
  },
  {
    description: 'One entity, or a stack of them.',
    examples: [
      {
        caption: 'row · image · badges · trailing',
        spec: {
          display: 'record',
          props: {
            badges: [{ label: '12 / 16 seats', tone: 'success' }],
            image: { alt: 'Exam room', src: SCENES.dawn },
            meta: 'Lyon Part-Dieu · Oct 24',
            metaIcon: 'i-lucide-map-pin',
            reference: 'SES-0412',
            title: 'TOEIC Listening & Reading',
            trailing: '€96',
            trailingCaption: 'excl. VAT',
          },
        },
      },
      {
        caption: 'compact · icon tile · link',
        spec: {
          display: 'record',
          props: {
            icon: 'i-lucide-headphones',
            meta: 'Adaptive test · 1 h 30',
            title: 'Linguaskill Business',
            to: '#',
            tone: 'teal',
            variant: 'compact',
          },
        },
      },
      {
        caption: 'card · description',
        spec: {
          display: 'record',
          props: {
            badges: [{ label: 'New', tone: 'primary' }],
            description:
              '16 seats, step-free access, parking 200 m away. TOEIC and Linguaskill sessions Monday to Saturday, oral exams by appointment.',
            image: { alt: 'Centre', src: SCENES.dusk },
            meta: '12 Republic street, Lyon',
            metaIcon: 'i-lucide-map-pin',
            title: 'Lyon Part-Dieu centre',
            variant: 'card',
          },
        },
      },
      {
        caption: 'stack · max 3',
        spec: {
          display: 'record',
          props: {
            heading: 'Selected sessions',
            headingIcon: 'i-lucide-calendar',
            items: [
              {
                chip: { label: '12 seats', tone: 'success' },
                icon: 'i-lucide-calendar',
                meta: 'Lyon Part-Dieu',
                title: 'TOEIC · Oct 24, 9:00',
              },
              {
                chip: { label: '3 seats', tone: 'warning' },
                icon: 'i-lucide-calendar',
                meta: 'Villeurbanne',
                title: 'TOEIC · Oct 28, 14:00',
              },
              {
                chip: { label: 'Open', tone: 'info' },
                icon: 'i-lucide-headphones',
                meta: 'Remote',
                title: 'Linguaskill · Nov 4',
                tone: 'info',
              },
              {
                chip: { label: '16 seats', tone: 'success' },
                icon: 'i-lucide-calendar',
                meta: 'Lyon Part-Dieu',
                title: 'TOEIC · Nov 7, 9:00',
              },
              {
                chip: { label: 'Full', tone: 'error' },
                icon: 'i-lucide-calendar',
                meta: 'Villeurbanne',
                title: 'TOEIC · Nov 14, 9:00',
              },
            ],
            max: 3,
            variant: 'stack',
          },
        },
      },
    ],
    kind: 'record',
  },
  {
    description: 'Who is behind it.',
    examples: [
      {
        caption: 'user · chip',
        spec: {
          display: 'person',
          props: {
            chip: { label: 'Owner' },
            description: 'camille.laurent@arvelle.com',
            name: 'Camille Laurent',
          },
        },
      },
      {
        caption: 'group · overflow',
        spec: {
          display: 'person',
          props: {
            label: '8 invigilators',
            people: [
              { name: 'Camille Laurent' },
              { name: 'Yanis Haddad' },
              { name: 'Inès Moreau' },
              { name: 'Léa Fontaine' },
              { name: 'Malik Diallo' },
              { name: 'Hugo Bernard' },
              { name: 'Chloé Petit' },
              { name: 'Ben Martin' },
            ],
            variant: 'group',
          },
        },
      },
      {
        caption: 'contact · copy',
        spec: {
          display: 'person',
          props: {
            contacts: [
              {
                href: 'mailto:ben.martin@example.com',
                icon: 'i-lucide-mail',
                value: 'ben.martin@example.com',
              },
              { href: 'tel:+33478123456', icon: 'i-lucide-phone', value: '04 78 12 34 56' },
            ],
            description: 'Account manager',
            name: 'Ben Martin',
            variant: 'contact',
          },
        },
        wide: true,
      },
    ],
    kind: 'person',
  },
  {
    description: 'Eight list shapes.',
    examples: [
      {
        caption: 'bullets',
        spec: {
          display: 'list',
          props: {
            items: [
              { text: 'Arrive 30 min early' },
              { text: 'Phone off during the test' },
              { text: 'Results within 7 days' },
            ],
          },
        },
      },
      {
        caption: 'numbered',
        spec: {
          display: 'list',
          props: {
            items: [
              { text: 'Import the candidates' },
              { text: 'Pick the sessions' },
              { text: 'Send the notices' },
            ],
            variant: 'numbered',
          },
        },
      },
      {
        caption: 'icons',
        spec: {
          display: 'list',
          props: {
            items: [
              { icon: 'i-lucide-calendar', text: 'Thursday Oct 24, 9:00' },
              { icon: 'i-lucide-map-pin', text: '12 Republic street, Lyon' },
              { icon: 'i-lucide-clock', text: 'Duration: 2 h 30' },
            ],
            variant: 'icons',
          },
        },
      },
      {
        caption: 'checks',
        spec: {
          display: 'list',
          props: {
            items: [
              { done: true, text: 'Contract signed' },
              { done: true, text: 'Centre accredited' },
              { description: 'Needed before the first invoice', text: 'Direct debit mandate' },
            ],
            variant: 'checks',
          },
        },
      },
      {
        caption: 'steps',
        spec: {
          display: 'list',
          props: {
            items: [
              { done: true, text: 'Request received' },
              { current: true, description: 'Answer within 48 h', text: 'Centre review' },
              { text: 'Notices' },
            ],
            variant: 'steps',
          },
        },
      },
      {
        caption: 'columns',
        spec: {
          display: 'list',
          props: {
            items: ['English', 'Spanish', 'German', 'Italian', 'French', 'Portuguese'].map(
              (text) => ({ text }),
            ),
            variant: 'columns',
          },
        },
      },
      {
        caption: 'files · lazy signed link',
        spec: {
          display: 'list',
          props: {
            items: [
              { href: signedUrl('notice-laurent.pdf'), size: 186_000, text: 'Notice-Laurent.pdf' },
              { href: signedUrl('candidates-q4.xlsx'), size: 24_000, text: 'Candidates-Q4.xlsx' },
            ],
            preview: false,
            variant: 'files',
          },
        },
      },
      {
        caption: 'chips · registered tones',
        spec: {
          display: 'list',
          props: {
            items: [
              { text: 'TOEIC', tone: 'primary' },
              { text: 'Linguaskill', tone: 'info' },
              { text: 'Eligible', tone: 'success' },
              { text: 'Procertif', tone: 'violet' },
              { text: 'Remote', tone: 'teal' },
              { text: 'Cancelled', tone: 'error' },
            ],
            variant: 'chips',
          },
        },
      },
    ],
    kind: 'list',
  },
  {
    description: 'Past events and planned ones.',
    examples: [
      {
        caption: 'pipeline · current',
        spec: {
          display: 'timeline',
          props: {
            current: 2,
            items: [
              { time: 'Oct 12', title: 'Request' },
              { time: 'Oct 13', title: 'Approved' },
              { time: 'Oct 24', title: 'Planned' },
              { title: 'Taken' },
              { title: 'Result' },
            ],
            variant: 'pipeline',
          },
        },
        wide: true,
      },
      {
        caption: 'vertical · actor · planned dashed',
        spec: {
          display: 'timeline',
          props: {
            items: [
              {
                actor: { name: 'Camille Laurent' },
                date: '2026-10-12T09:14:00',
                title: 'Request created',
              },
              { date: '2026-10-13', title: 'Approved by the centre', tone: 'success' },
              {
                date: '2026-10-14',
                description: '24 candidates · 2 bounces',
                title: 'Notices sent',
                tone: 'info',
              },
              { date: '2026-10-24', title: 'Session' },
            ],
            now: '2026-10-22T12:00:00',
          },
        },
      },
      {
        caption: 'schedule · today marker',
        spec: {
          display: 'timeline',
          props: {
            items: [
              {
                date: '2026-10-10',
                description: 'Sent · 22 opens',
                title: 'Reminder D-14',
                tone: 'success',
              },
              {
                date: '2026-10-17',
                description: 'Sent · 18 opens',
                title: 'Reminder D-7',
                tone: 'success',
              },
              { date: '2026-10-23', description: 'Planned · 6 candidates', title: 'Reminder D-1' },
              { date: '2026-10-24', title: 'Deadline' },
            ],
            now: '2026-10-22T12:00:00',
            variant: 'schedule',
          },
        },
      },
      {
        caption: 'log',
        spec: {
          display: 'timeline',
          props: {
            items: [
              {
                actor: { name: 'Camille Laurent' },
                date: '2026-10-22T09:14:00',
                title: 'imported 24 candidates',
              },
              {
                actor: { name: 'Ben Martin' },
                date: '2026-10-22T09:20:00',
                title: 'applied the volume discount',
              },
              { actor: { name: 'System' }, date: '2026-10-22T10:02:00', title: 'sent 24 notices' },
            ],
            variant: 'log',
          },
        },
        wide: true,
      },
    ],
    kind: 'timeline',
  },
  {
    description: 'A moment, a span, a deadline.',
    examples: [
      {
        caption: 'tile · time',
        spec: {
          display: 'date',
          props: {
            description: 'Lyon Part-Dieu',
            end: '2026-10-24T11:30:00',
            time: true,
            title: 'TOEIC Listening & Reading',
            value: '2026-10-24T09:00:00',
          },
        },
      },
      {
        caption: 'range · duration',
        spec: {
          display: 'date',
          props: { end: '2026-10-31', value: '2026-10-01', variant: 'range' },
        },
      },
      {
        caption: 'countdown · urgency',
        spec: {
          display: 'date',
          props: { now: '2026-10-22T08:00:00', value: '2026-10-24T18:00:00', variant: 'countdown' },
        },
      },
      {
        caption: 'countdown · overdue',
        spec: {
          display: 'date',
          props: { now: '2026-10-22T08:00:00', value: '2026-10-19', variant: 'countdown' },
        },
      },
    ],
    kind: 'date',
  },
  {
    description: 'Images, video, documents, links.',
    examples: [
      {
        caption: 'image · caption',
        spec: {
          display: 'media',
          props: { alt: 'Access map', caption: 'Entrance B, 2nd floor', src: SCENES.slate },
        },
      },
      {
        caption: 'gallery · overflow',
        spec: {
          display: 'media',
          props: {
            caption: 'Exam room · 5 photos',
            images: [SCENES.dawn, SCENES.dusk, SCENES.forest, SCENES.slate, SCENES.dawn].map(
              (src) => ({ src }),
            ),
            variant: 'gallery',
          },
        },
      },
      {
        caption: 'video · poster',
        spec: {
          display: 'media',
          props: {
            duration: '0:05',
            src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            thumbnail: SCENES.forest,
            title: 'How the oral test runs',
            variant: 'video',
          },
        },
      },
      {
        caption: 'document · lazy signed link',
        spec: {
          display: 'media',
          props: {
            name: 'Notice-Camille-Laurent.pdf',
            pages: 2,
            preview: false,
            size: 186_000,
            src: signedUrl('notice-camille-laurent.pdf'),
            type: 'application/pdf',
            variant: 'document',
          },
        },
      },
      {
        caption: 'link · unfurl',
        spec: {
          display: 'media',
          props: {
            description: 'Wed Oct 23 · 17:30 – 18:00',
            href: 'https://teams.microsoft.com/l/meetup-join/example',
            thumbnail: SCENES.dusk,
            title: 'Invigilator briefing',
            variant: 'link',
          },
        },
        wide: true,
      },
    ],
    kind: 'media',
  },
  {
    description: 'Values people copy.',
    examples: [
      {
        caption: 'block · json',
        spec: {
          display: 'code',
          props: {
            language: 'json',
            value: JSON.stringify(
              { candidate: 'CND-20931', event: 'result.published', level: 'B2', score: 845 },
              null,
              2,
            ),
          },
        },
      },
      {
        caption: 'value · open',
        spec: {
          display: 'code',
          props: {
            href: 'https://example.com/i/ARV-Q4-7KD2',
            icon: 'i-lucide-link',
            value: 'https://example.com/i/ARV-Q4-7KD2',
            variant: 'value',
          },
        },
      },
      {
        caption: 'secret · reveal',
        spec: {
          display: 'code',
          props: { icon: 'i-lucide-key', value: 'exa_live_8Hq2vN4kP0x3f9a', variant: 'secret' },
        },
        wide: true,
      },
    ],
    kind: 'code',
  },
  {
    description: 'Says what is missing and how to fix it.',
    examples: [
      {
        caption: 'dashed · actions',
        spec: {
          display: 'empty',
          props: {
            actions: [
              { icon: 'i-lucide-upload', label: 'Import' },
              { color: 'primary', icon: 'i-lucide-plus', label: 'Add', variant: 'solid' },
            ],
            description: 'Import a file or add them one by one.',
            icon: 'i-lucide-users',
            title: 'No candidate yet',
          },
        },
      },
      {
        caption: 'plain',
        spec: { display: 'empty', props: { title: 'No document attached', variant: 'plain' } },
      },
    ],
    kind: 'empty',
  },
  {
    description: 'Folds; items can hold other display blocks.',
    examples: [
      {
        caption: 'separated · nested facts',
        spec: {
          display: 'accordion',
          props: {
            items: [
              {
                block: {
                  display: 'facts',
                  props: {
                    items: [
                      { label: 'Unit', value: '€96' },
                      { label: 'Discount', value: '10 %' },
                      { label: 'Delay', value: '30 d' },
                    ],
                    layout: 'inline',
                  },
                },
                defaultOpen: true,
                icon: 'i-lucide-receipt',
                label: 'Pricing',
              },
              {
                content: 'Free up to 72 h before the session, charged after.',
                icon: 'i-lucide-shield',
                label: 'Cancellation',
              },
            ],
          },
        },
      },
      {
        caption: 'flush',
        spec: {
          display: 'accordion',
          props: {
            items: [
              {
                content: 'The credit is used unless a medical certificate arrives within 5 days.',
                label: 'What if a candidate is absent?',
              },
              {
                content: 'Yes, once, up to 72 h before the test.',
                label: 'Can a candidate change session?',
              },
            ],
            variant: 'flush',
          },
        },
      },
    ],
    kind: 'accordion',
  },
]
