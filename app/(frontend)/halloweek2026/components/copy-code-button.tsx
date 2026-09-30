'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/utils';

type Props = { code: string };

/**
 * A promo code that copies itself when clicked.
 *
 * Shows a checkmark for a couple of seconds on success, and also raises a
 * toast — the inline state alone is easy to miss when the code sits low in a
 * sponsor card. `navigator.clipboard` needs a secure context and can be
 * refused outright, so a failure says so rather than silently pretending.
 */
export default function CopyCodeButton({ code }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Don't set state on an unmounted card (a fast carousel swipe or navigation).
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`Copied ${code}`);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select the code and copy it manually.');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy promo code ${code}`}
      className={cn(
        'group inline-flex items-center gap-2 px-3 py-1',
        'font-utility text-lg tracking-widest text-glow',
        'bg-blackout/70 border-2 border-blue-light/50',
        'transition-colors hover:border-blue-light hover:bg-blue-light/15',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60',
      )}
    >
      <span>{code}</span>
      {copied ? (
        <Check className="w-4 h-4 text-blue-light" aria-hidden="true" />
      ) : (
        <Copy
          className="w-4 h-4 text-blue-light/70 group-hover:text-blue-light"
          aria-hidden="true"
        />
      )}
      {/* Announce the result without moving anything on screen. */}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}
