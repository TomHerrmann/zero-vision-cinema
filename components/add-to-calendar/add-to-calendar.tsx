'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/**
 * One "Add to Calendar" button that opens a menu of calendars. Apple
 * Calendar, Outlook and Other download the event's .ics file (which those
 * apps open directly); Google opens a prefilled Google Calendar event.
 * `calendarUrl` is the route serving the .ics, which must also redirect to
 * Google with `?format=google` — /api/events/[id]/calendar for Payload
 * events, /api/halloweek/[slotId]/calendar for the Halloweek lineup.
 *
 * From md up the menu opens above the button (it sits at the bottom of a
 * card); on phones it expands in place below it, full width.
 */
export default function AddToCalendar({
  calendarUrl,
  className,
  buttonClassName = 'w-full',
}: {
  calendarUrl: string;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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

  const ics = calendarUrl;
  const options = [
    { label: 'Apple Calendar', href: ics },
    { label: 'Google Calendar', href: `${ics}?format=google`, newTab: true },
    { label: 'Outlook', href: ics },
    { label: 'Other', href: ics },
  ];

  return (
    <div ref={rootRef} className={cn('relative', className)}>
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
        <CalendarPlus className="w-5 h-5" />
        <span>Add to Calendar</span>
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', open && 'rotate-180')}
        />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Choose a calendar"
          className="mt-3 md:mt-0 md:absolute md:bottom-[68px] md:left-0 md:min-w-[240px] md:w-max z-30 flex flex-col p-1.5 bg-blackout md:bg-card border-2 border-glow/15 md:shadow-[6px_6px_0_0_rgba(0,0,0,0.55)]"
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
              className="h-[52px] md:h-12 px-3.5 flex items-center whitespace-nowrap font-utility uppercase tracking-wider text-base text-glow hover:bg-blue-light/15 focus-visible:bg-blue-light/15 outline-none"
            >
              {opt.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
