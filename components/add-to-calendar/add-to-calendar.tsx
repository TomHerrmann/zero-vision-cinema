import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/**
 * "Add to Calendar" for an event: the button downloads an .ics file (opens in
 * Apple Calendar / Outlook / most phones); the link below opens Google
 * Calendar. Both go through /api/events/[id]/calendar.
 */
export default function AddToCalendar({
  eventId,
  className,
  buttonClassName = 'w-full',
}: {
  eventId: number;
  className?: string;
  buttonClassName?: string;
}) {
  const href = `/api/events/${eventId}/calendar`;
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Button asChild variant="outline" size="lg" className={buttonClassName}>
        {/* Plain <a>: an API route, not a page to client-side navigate to. */}
        <a href={href} className="flex items-center justify-center gap-2">
          <CalendarPlus className="w-5 h-5" />
          <span>Add to Calendar</span>
        </a>
      </Button>
      <a
        href={`${href}?format=google`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-utility text-sm uppercase tracking-wide text-glow/60 hover:text-blue-light underline-offset-4 hover:underline"
      >
        or Google Calendar
      </a>
    </div>
  );
}
