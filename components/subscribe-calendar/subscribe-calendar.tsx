'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CalendarHeart, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calendarSubscribeLinks } from '@/utils/calendarSubscribe';
import { cn } from '@/utils/utils';

/**
 * "Subscribe to our calendar": one button that opens a menu of calendar apps.
 * Each option subscribes in a tap (webcal:// for Apple and phones, the add-by-
 * URL pages for Google and Outlook), and "Copy link" covers everything else.
 * Subscribers get every event, kept up to date, from /calendar.ics.
 *
 * The menu expands in place under the button rather than floating, so it is
 * never clipped by a section's overflow and works the same on phones.
 */
export default function SubscribeCalendar({
  className,
  buttonClassName,
  label = 'Subscribe to Our Calendar',
}: {
  className?: string;
  buttonClassName?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const links = calendarSubscribeLinks();

  // Close on a click outside or Escape (returning focus to the button).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.feed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this calendar link:', links.feed);
    }
  };

  const options = [
    { label: 'Apple Calendar', href: links.apple },
    { label: 'Google Calendar', href: links.google, newTab: true },
    { label: 'Outlook', href: links.outlook, newTab: true },
  ];
  const itemClass =
    'h-[52px] md:h-12 px-3.5 flex items-center whitespace-nowrap font-utility uppercase tracking-wider text-base text-glow hover:bg-blue-light/15 focus-visible:bg-blue-light/15 outline-none text-left';

  return (
    <div ref={rootRef} className={cn('relative inline-flex flex-col', className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="lg"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(open && 'bg-blue-light/15', buttonClassName)}
      >
        <CalendarHeart className="w-5 h-5" aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Choose a calendar app"
          className="mt-3 flex flex-col p-1.5 bg-card border-2 border-glow/15"
        >
          {options.map((opt) => (
            <a
              key={opt.label}
              role="menuitem"
              href={opt.href}
              {...(opt.newTab
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              {opt.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={copy}
            className={itemClass}
          >
            {copied ? 'Link Copied' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}
