export default defineAppConfig({
  ui: {
    badge: {
      variants: {
        size: {
          md: { base: 'text-[11.5px] px-2 py-0 h-[21px] font-semibold' },
          sm: { base: 'text-[11px] px-1.5 py-0 h-5 font-semibold' },
          xs: { base: 'text-[10.5px] px-1.5 py-0 h-[18px] font-semibold' },
        },
      },
    },
    button: {
      compoundVariants: [
        { class: 'w-6 p-0 justify-center', size: 'xs', square: true },
        { class: 'w-7 p-0 justify-center', size: 'sm', square: true },
        { class: 'w-[34px] p-0 justify-center', size: 'md', square: true },
        { class: 'w-[38px] p-0 justify-center', size: 'lg', square: true },
        {
          class: 'text-[#1f1d1a] font-semibold hover:bg-[#ff9f1a]',
          color: 'primary',
          variant: 'solid',
        },
        {
          class:
            'bg-[var(--ex-surface)] ring-[var(--ui-border)] text-default hover:bg-[var(--ui-bg-elevated)] focus-visible:ring-2 focus-visible:ring-primary',
          color: 'neutral',
          variant: 'outline',
        },
        { class: 'focus-visible:ring-primary', color: 'neutral' },
      ],
      slots: {
        base: 'font-medium',
      },
      variants: {
        size: {
          lg: {
            base: 'h-[38px] px-3 text-[13px] gap-[7px]',
            leadingIcon: 'size-4',
            trailingIcon: 'size-4',
          },
          md: {
            base: 'h-[34px] px-[13px] text-[13px] gap-[7px]',
            leadingIcon: 'size-[15px]',
            trailingIcon: 'size-[15px]',
          },
          sm: {
            base: 'h-7 px-2.5 text-[12.5px] gap-1.5',
            leadingIcon: 'size-3.5',
            trailingIcon: 'size-3.5',
          },
          xs: {
            base: 'h-6 px-2 text-[11.5px] gap-1',
            leadingIcon: 'size-3',
            trailingIcon: 'size-3',
          },
        },
      },
    },
    checkbox: {
      slots: {
        base: 'rounded-[4px] ring-[var(--ui-border-accented)] bg-[var(--ex-surface)]',
      },
      variants: {
        size: {
          md: { base: 'size-4', icon: 'size-3', indicator: 'size-4' },
        },
      },
    },
    colors: {
      neutral: 'stone',
      primary: 'orange',
    },
    dropdownMenu: {
      slots: {
        content:
          'rounded-lg shadow-[0_16px_40px_-12px_rgba(31,29,26,.25)] ring-[var(--ui-border)] p-1.5',
        item: 'h-8 rounded-[5px] text-[13px]',
      },
    },
    fieldGroup: {
      base: 'relative',
    },
    formField: {
      slots: {
        description: 'text-[11.5px]',
        error: 'text-[11.5px]',
        help: 'text-[11.5px]',
        hint: 'text-[11.5px]',
        label: 'text-[12.5px]',
      },
    },
    input: {
      compoundVariants: [
        {
          class:
            'bg-[var(--ex-surface)] ring-[var(--ui-border)] outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-primary)_18%,transparent)]',
          color: 'neutral',
          variant: 'outline',
        },
      ],
      variants: {
        size: {
          lg: {
            base: 'h-[38px] px-2.5 text-[13px] gap-2',
            leading: 'ps-2.5',
            leadingIcon: 'size-4',
            trailing: 'pe-2.5',
            trailingIcon: 'size-4',
          },
          md: {
            base: 'h-[34px] px-2.5 text-[13px] gap-2',
            leading: 'ps-2.5',
            leadingIcon: 'size-[15px]',
            trailing: 'pe-2.5',
            trailingIcon: 'size-4',
          },
          sm: { base: 'h-7 px-2.5 text-[12.5px]', leading: 'ps-2.5', leadingIcon: 'size-3.5' },
        },
      },
    },
    inputMenu: {
      compoundVariants: [
        {
          class:
            'bg-[var(--ex-surface)] ring-[var(--ui-border)] outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-primary)_18%,transparent)]',
          color: 'neutral',
          variant: 'outline',
        },
      ],
      variants: {
        size: {
          lg: { base: 'h-[38px] px-2.5 text-[13px] gap-2' },
          md: { base: 'h-[34px] px-2.5 text-[13px] gap-2' },
          sm: { base: 'h-7 px-2.5 text-[12.5px]' },
        },
      },
    },
    inputNumber: {
      compoundVariants: [
        {
          class:
            'bg-[var(--ex-surface)] ring-[var(--ui-border)] outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-primary)_18%,transparent)]',
          color: 'neutral',
          variant: 'outline',
        },
      ],
      variants: {
        size: {
          lg: 'h-[38px] px-2.5 text-[13px] gap-2',
          md: 'h-[34px] px-2.5 text-[13px] gap-2',
          sm: 'h-7 px-2.5 text-[12.5px]',
        },
      },
    },
    inputTags: {
      compoundVariants: [
        {
          class:
            'bg-[var(--ex-surface)] ring-[var(--ui-border)] outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-primary)_18%,transparent)]',
          color: 'neutral',
          variant: 'outline',
        },
      ],
      variants: {
        size: {
          lg: { base: 'min-h-[38px] px-2 text-[13px] gap-1.5' },
          md: { base: 'min-h-[34px] px-2 text-[13px] gap-1.5' },
          sm: { base: 'min-h-7 px-1.5 text-[12.5px] gap-1' },
        },
      },
    },
    inputTime: {
      compoundVariants: [
        {
          class:
            'bg-[var(--ex-surface)] ring-[var(--ui-border)] outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-primary)_18%,transparent)]',
          color: 'neutral',
          variant: 'outline',
        },
      ],
      variants: {
        size: {
          lg: { base: 'h-[38px] px-2.5 text-[13px] gap-2' },
          md: { base: 'h-[34px] px-2.5 text-[13px] gap-2' },
          sm: { base: 'h-7 px-2.5 text-[12.5px]' },
        },
      },
    },
    popover: {
      slots: {
        content: 'rounded-lg shadow-[0_16px_40px_-12px_rgba(31,29,26,.25)] ring-[var(--ui-border)]',
      },
    },
    select: {
      compoundVariants: [
        { class: 'focus-visible:ring-primary', color: 'neutral', variant: 'outline' },
      ],
      variants: {
        size: {
          md: { base: 'h-[34px] px-2.5 text-[13px] gap-2' },
          sm: { base: 'h-7 px-2.5 text-[12.5px] gap-1.5' },
          xs: { base: 'h-6 px-2 text-[11.5px] gap-1' },
        },
      },
    },
    selectMenu: {
      compoundVariants: [
        { class: 'focus-visible:ring-primary', color: 'neutral', variant: 'outline' },
      ],
      variants: {
        size: {
          lg: { base: 'h-[38px] px-2.5 text-[13px] gap-2' },
          md: { base: 'h-[34px] px-2.5 text-[13px] gap-2' },
          sm: { base: 'h-7 px-2.5 text-[12.5px] gap-1.5' },
          xs: { base: 'h-6 px-2 text-[11.5px] gap-1' },
        },
      },
    },
    switch: {
      variants: {
        size: {
          md: { base: 'w-[34px] h-5' },
        },
      },
    },
    tabs: {
      variants: {
        size: {
          md: { trigger: 'h-[34px] px-2.5 text-[13px] font-medium gap-1.5' },
        },
      },
    },
    textarea: {
      compoundVariants: [
        {
          class:
            'bg-[var(--ex-surface)] ring-[var(--ui-border)] outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-primary)_18%,transparent)]',
          color: 'neutral',
          variant: 'outline',
        },
      ],
      variants: {
        size: {
          lg: { base: 'px-2.5 py-2 text-[13px]' },
          md: { base: 'px-2.5 py-2 text-[13px]' },
          sm: { base: 'px-2.5 py-1.5 text-[12.5px]' },
        },
      },
    },
  },
})
