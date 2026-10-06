import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TicketsSoldCell } from './TicketsSoldCell';

// Only the two props the cell reads; the admin passes many more.
const cell = (cellData: number | null, eventType?: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(<TicketsSoldCell {...({ cellData, rowData: { eventType } } as any)} />);

describe('TicketsSoldCell', () => {
  it('shows the count for ZVC events', () => {
    cell(12, 'zvc');
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows 0 rather than blank for a ZVC event with no sales', () => {
    cell(null, 'zvc');
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it.each(['ahc', 'bookclub'])('shows N/A for %s events', (eventType) => {
    cell(0, eventType);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('falls back to the count when the row has no event type', () => {
    cell(3);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
