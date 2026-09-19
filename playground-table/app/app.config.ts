export default defineAppConfig({
  ui: {
    colors: {
      primary: 'orange',
      neutral: 'stone',
    },
    button: {
      slots: {
        base: 'font-medium',
      },
      variants: {
        size: {
          xs: { base: 'h-6 px-2 text-[11.5px] gap-1', leadingIcon: 'size-3', trailingIcon: 'size-3' },
          sm: { base: 'h-7 px-2.5 text-[12.5px] gap-1.5', leadingIcon: 'size-3.5', trailingIcon: 'size-3.5' },
          md: { base: 'h-[34px] px-[13px] text-[13px] gap-[7px]', leadingIcon: 'size-[15px]', trailingIcon: 'size-[15px]' },
          lg: { base: 'h-[38px] px-3 text-[13px] gap-[7px]', leadingIcon: 'size-4', trailingIcon: 'size-4' },
        },
      },
      compoundVariants: [
        { size: 'xs', square: true, class: 'w-6 p-0 justify-center' },
        { size: 'sm', square: true, class: 'w-7 p-0 justify-center' },
        { size: 'md', square: true, class: 'w-[34px] p-0 justify-center' },
        { size: 'lg', square: true, class: 'w-[38px] p-0 justify-center' },
        { color: 'primary', variant: 'solid', class: 'text-[#1f1d1a] font-semibold hover:bg-[#ff9f1a]' },
        { color: 'neutral', variant: 'outline', class: 'bg-[var(--ex-surface)] ring-[var(--ui-border)] text-default hover:bg-[var(--ui-bg-elevated)]' },
      ],
    },
    input: {
      variants: {
        size: {
          sm: { base: 'h-7 px-2.5 text-[12.5px]', leading: 'ps-2.5', leadingIcon: 'size-3.5' },
          md: { base: 'h-[34px] px-2.5 text-[13px] gap-2', leading: 'ps-2.5', trailing: 'pe-2.5', leadingIcon: 'size-[15px]', trailingIcon: 'size-4' },
          lg: { base: 'h-[38px] px-2.5 text-[13px] gap-2', leading: 'ps-2.5', trailing: 'pe-2.5', leadingIcon: 'size-4', trailingIcon: 'size-4' },
        },
      },
      compoundVariants: [
        { color: 'neutral', variant: 'outline', class: 'bg-[var(--ex-surface)] ring-[var(--ui-border)] focus-visible:ring-2 focus-visible:ring-primary' },
      ],
    },
    select: {
      variants: {
        size: {
          xs: { base: 'h-6 px-2 text-[11.5px] gap-1' },
          sm: { base: 'h-7 px-2.5 text-[12.5px] gap-1.5' },
          md: { base: 'h-[34px] px-2.5 text-[13px] gap-2' },
        },
      },
    },
    badge: {
      variants: {
        size: {
          xs: { base: 'text-[10.5px] px-1.5 py-0 h-[18px] font-semibold' },
          sm: { base: 'text-[11px] px-1.5 py-0 h-5 font-semibold' },
          md: { base: 'text-[11.5px] px-2 py-0 h-[21px] font-semibold' },
        },
      },
    },
    checkbox: {
      slots: {
        base: 'rounded-[4px] ring-[var(--ui-border-accented)] bg-[var(--ex-surface)]',
      },
      variants: {
        size: {
          md: { base: 'size-4', indicator: 'size-4', icon: 'size-3' },
        },
      },
    },
    fieldGroup: {
      base: 'relative',
    },
    dropdownMenu: {
      slots: {
        content: 'rounded-lg shadow-[0_16px_40px_-12px_rgba(31,29,26,.25)] ring-[var(--ui-border)] p-1.5',
        item: 'h-8 rounded-[5px] text-[13px]',
      },
    },
    popover: {
      slots: {
        content: 'rounded-lg shadow-[0_16px_40px_-12px_rgba(31,29,26,.25)] ring-[var(--ui-border)]',
      },
    },
  },
})
