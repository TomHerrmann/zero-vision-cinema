/** Helpers for filling event fields from OMDB data (name/description). */

/** Build a minimal Payload/Lexical richText state from a plain-text plot. */
export function plotToLexical(plot: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr' as const,
          textFormat: 0,
          children: [
            {
              type: 'text',
              text: plot,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
              version: 1,
            },
          ],
        },
      ],
    },
  };
}

/** True when a richText value has no real content yet. */
export function richTextIsBlank(value: unknown): boolean {
  if (!value || typeof value !== 'object') return true;
  const root = (value as { root?: { children?: unknown[] } }).root;
  return !root?.children || root.children.length === 0;
}
