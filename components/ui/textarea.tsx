import * as React from 'react';

import { cn } from '@/utils/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-2 border-glow/15 bg-blackout/40 placeholder:text-glow/40 focus-visible:border-blue-light focus-visible:ring-blue-light/40 aria-invalid:ring-destructive/30 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full px-4 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
