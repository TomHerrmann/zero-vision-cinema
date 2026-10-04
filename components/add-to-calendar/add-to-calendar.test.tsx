import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AddToCalendar from './add-to-calendar';

const trigger = () => screen.getByRole('button', { name: /add to calendar/i });

describe('AddToCalendar', () => {
  it('is one button with the menu closed', () => {
    render(<AddToCalendar eventId={10} />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens a menu of calendars pointing at the event', () => {
    render(<AddToCalendar eventId={10} />);
    fireEvent.click(trigger());

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    const items = screen.getAllByRole('menuitem');
    expect(items.map((a) => a.textContent)).toEqual([
      'Apple Calendar',
      'Google Calendar',
      'Outlook',
      'Other',
    ]);
    expect(items[0]).toHaveAttribute('href', '/api/events/10/calendar');
    expect(items[1]).toHaveAttribute(
      'href',
      '/api/events/10/calendar?format=google'
    );
    expect(items[1]).toHaveAttribute('target', '_blank');
    expect(items[3]).toHaveAttribute('href', '/api/events/10/calendar');
  });

  it('closes on Escape, an outside click, or a pick', () => {
    render(<AddToCalendar eventId={10} />);

    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger()).toHaveFocus();

    fireEvent.click(trigger());
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(trigger());
    fireEvent.click(screen.getAllByRole('menuitem')[3]);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
