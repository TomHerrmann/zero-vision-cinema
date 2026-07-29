import { cn } from '@/utils/utils';
import type { LucideIcon } from 'lucide-react';

type Props = {
  kicker?: string;
  title: React.ReactNode;
  as?: 'h1' | 'h2';
  icon?: LucideIcon;
  align?: 'center' | 'left';
  className?: string;
  /** Extra classes for the heading element (e.g. responsive size overrides) */
  titleClassName?: string;
};

/**
 * Stamped section header used across the site: caps kicker chip + big Bootzy
 * display heading + broken rule. Replaces the old gradient-clipped header blocks.
 */
export default function SectionHeading({
  kicker,
  title,
  as = 'h2',
  icon: Icon,
  align = 'center',
  className,
  titleClassName,
}: Props) {
  const Heading = as;
  const centered = align === 'center';

  return (
    <div
      className={cn(
        centered ? 'text-center items-center' : 'text-left items-start',
        'flex flex-col',
        className
      )}
    >
      {kicker && (
        <span className={cn('zvc-badge mb-6', centered && 'mx-auto')}>
          {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
          {kicker}
        </span>
      )}

      <Heading
        className={cn(
          'zvc-heading text-[2.75rem] md:text-[5rem] lg:text-[6rem] mb-6',
          titleClassName
        )}
      >
        {title}
      </Heading>

      <span className={cn('zvc-rule', centered && 'mx-auto')} aria-hidden="true" />
    </div>
  );
}
