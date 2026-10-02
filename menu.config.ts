// Define the menu items
export const mainMenu = {
  home: '/',
  events: '/events',
  substack: 'https://zerovisioncinema.substack.com/',
  'Astoria Horror Club': '/astoriahorrorclub',
};

export type SeasonalMenuItem = {
  label: string;
  href: string;
  /** Shown from this moment onward. Omit to show it right away. */
  from?: string;
  /** The first moment the item is gone. */
  until: string;
  /** Key in `mainMenu` to sit after. Unknown or omitted puts it last. */
  after?: string;
};

/**
 * Menu items that only appear for a stretch of time. Dates carry an explicit
 * offset so the cutoff is Eastern time, not the server's locale.
 *
 * Only the nav entry is seasonal — the page itself stays live at its URL after
 * the item disappears, so older links (newsletters, Instagram) keep working.
 */
export const seasonalMenu: SeasonalMenuItem[] = [
  {
    label: 'Halloweek',
    href: '/halloweek2026',
    // Off the nav at midnight ET on Nov 1 2026. Still EDT (-04:00) at that
    // moment — DST ends at 2am later the same morning.
    until: '2026-11-01T00:00:00-04:00',
    after: 'events',
  },
];

/**
 * The nav/footer menu as of `now`, with any in-window seasonal items spliced in.
 *
 * Call this from a server component (Footer) or pass the result down from one
 * (the root layout → Nav), so the cutoff is judged by the server clock rather
 * than the visitor's — and so a visitor's clock can never cause a hydration
 * mismatch.
 */
export const getMainMenu = (now: Date = new Date()): Record<string, string> => {
  const active = seasonalMenu.filter(
    (item) =>
      (!item.from || now >= new Date(item.from)) && now < new Date(item.until)
  );

  const entries: [string, string][] = [];

  for (const [key, href] of Object.entries(mainMenu)) {
    entries.push([key, href]);
    for (const item of active.filter((i) => i.after === key)) {
      entries.push([item.label, item.href]);
    }
  }

  for (const item of active.filter((i) => !i.after || !(i.after in mainMenu))) {
    entries.push([item.label, item.href]);
  }

  return Object.fromEntries(entries);
};
