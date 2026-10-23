/**
 * True when a Lexical richText value has no meaningful content — used to decide
 * whether to fall back to the OMDB summary for an event's description.
 */
export function richTextIsEmpty(value: unknown): boolean {
  const children = (value as { root?: { children?: unknown[] } })?.root
    ?.children;
  if (!children || children.length === 0) return true;
  return children.every((child) => {
    const node = child as { type?: string; children?: unknown[]; text?: string };
    if (node.text != null) return node.text.trim() === '';
    return !node.children || node.children.length === 0;
  });
}

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] };

/** Lexical richText → plain text, blocks separated by a blank line. */
export function richTextToPlain(value: unknown): string {
  const blocks = (value as { root?: { children?: LexicalNode[] } })?.root
    ?.children;
  if (!blocks) return '';
  const textOf = (node: LexicalNode): string =>
    node.type === 'linebreak'
      ? '\n'
      : (node.text ?? '') + (node.children ?? []).map(textOf).join('');
  return blocks
    .map((block) => textOf(block).trim())
    .filter(Boolean)
    .join('\n\n');
}
