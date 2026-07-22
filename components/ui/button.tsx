import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-utility uppercase tracking-wider transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive active:translate-x-[2px] active:translate-y-[2px]",
  {
    variants: {
      variant: {
        // Primary CTA — Glow fill on Blackout (AA ~15:1), hard offset shadow
        default:
          'bg-primary text-primary-foreground border-2 border-glow shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:bg-primary/90 active:shadow-[1px_1px_0_0_rgba(0,0,0,0.5)]',
        destructive:
          'bg-destructive text-glow border-2 border-cult-classic shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:bg-destructive/90 active:shadow-[1px_1px_0_0_rgba(0,0,0,0.5)]',
        // Secondary CTA — blue outline
        outline:
          'border-2 border-blue-light bg-transparent text-glow hover:bg-blue-light/15',
        secondary:
          'bg-secondary text-secondary-foreground border-2 border-glow/15 hover:bg-secondary/80',
        ghost:
          'hover:bg-blue-light/10 hover:text-blue-light active:translate-x-0 active:translate-y-0',
        link: 'text-blue-light normal-case tracking-normal underline-offset-4 hover:underline active:translate-x-0 active:translate-y-0',
      },
      size: {
        default: 'h-11 px-6 py-2 text-base has-[>svg]:px-4',
        sm: 'h-9 px-4 text-sm has-[>svg]:px-3',
        lg: 'h-14 px-8 text-lg has-[>svg]:px-6',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
