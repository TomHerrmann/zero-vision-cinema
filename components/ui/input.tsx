import * as React from 'react';

import { cn } from '@/utils/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-glow/40 selection:bg-blue-light selection:text-glow flex h-11 w-full min-w-0 border-2 border-glow/15 bg-blackout/40 px-4 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-blue-light focus-visible:ring-blue-light/40 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/30 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
