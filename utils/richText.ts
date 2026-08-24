/**
 * True when a Lexical richText value has no meaningful content — used to decide
 * whether to fall back to the OMDB summary for an event's description.
 */
type LexicalNode = { type?: string; text?: string; children?: unknown[] };

/** Depth-first text of one Lexical node — inline marks, links, and list items all
 * carry their content in `children`, so nothing needs a per-type branch. */
function nodeText(node: unknown): string {
  const n = node as LexicalNode;
  if (n?.type === 'linebreak') return '\n';
  if (typeof n?.text === 'string') return n.text;
  if (Array.isArray(n?.children)) return n.children.map(nodeText).join('');
  return '';
}

/**
 * Flatten a Lexical richText value to plain text, blocks separated by blank
 * lines — for targets that take text rather than HTML (Discord embeds). Formatting
 * marks are dropped; `formatEventDescription` in utils/formatDate reads only the
 * first text node and is not a substitute.
 */
export function richTextToPlainText(value: unknown): string {
  const children = (value as { root?: { children?: unknown[] } })?.root
    ?.children;
  if (!children) return '';
  return children
    .map((block) => nodeText(block).trim())
    .filter(Boolean)
    .join('\n\n');
}

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
