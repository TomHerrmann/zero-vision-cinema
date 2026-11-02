import { describe, expect, it } from 'vitest';
import { getMainMenu, mainMenu } from './menu.config';

/** Eastern-time moment as a Date (EDT through Nov 1 2026, 2am). */
const et = (iso: string) => new Date(`${iso}-04:00`);

describe('getMainMenu', () => {
  it('always includes the permanent items', () => {
    const menu = getMainMenu(et('2026-06-01T12:00:00'));
    for (const [key, href] of Object.entries(mainMenu)) {
      expect(menu[key]).toBe(href);
    }
  });

  it('shows Halloweek during the run', () => {
    expect(getMainMenu(et('2026-10-24T09:00:00'))['Halloweek']).toBe(
      '/halloweek2026'
    );
    expect(getMainMenu(et('2026-10-31T23:59:59'))['Halloweek']).toBe(
      '/halloweek2026'
    );
  });

  it('drops Halloweek from the nav at midnight ET on Nov 1 2026', () => {
    expect(getMainMenu(et('2026-11-01T00:00:00'))).not.toHaveProperty(
      'Halloweek'
    );
    expect(getMainMenu(et('2026-11-02T12:00:00'))).not.toHaveProperty(
      'Halloweek'
    );
  });

  it('orders a seasonal item after the key it names', () => {
    const keys = Object.keys(getMainMenu(et('2026-10-28T12:00:00')));
    expect(keys).toEqual([
      'home',
      'events',
      'Halloweek',
      'substack',
      'Astoria Horror Club',
    ]);
  });
});
