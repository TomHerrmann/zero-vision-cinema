import { describe, it, expect } from 'vitest';
import { richTextToPlainText } from './richText';

const doc = (children: unknown[]) => ({ root: { children } });
const para = (...children: unknown[]) => ({ type: 'paragraph', children });
const text = (t: string) => ({ type: 'text', text: t });

describe('richTextToPlainText', () => {
  it('returns text from a single paragraph', () => {
    expect(richTextToPlainText(doc([para(text('Hello'))]))).toBe('Hello');
  });

  it('separates blocks with a blank line', () => {
    expect(
      richTextToPlainText(doc([para(text('One')), para(text('Two'))]))
    ).toBe('One\n\nTwo');
  });

  it('joins inline runs within a block without a separator', () => {
    expect(
      richTextToPlainText(doc([para(text('Bold'), text(' and plain'))]))
    ).toBe('Bold and plain');
  });

  it('descends into links and lists', () => {
    const link = {
      type: 'link',
      fields: { url: 'https://x' },
      children: [text('click')],
    };
    const list = {
      type: 'list',
      children: [
        { type: 'listitem', children: [text('a')] },
        { type: 'listitem', children: [text('b')] },
      ],
    };
    expect(richTextToPlainText(doc([para(text('go '), link), list]))).toBe(
      'go click\n\nab'
    );
  });

  it('turns linebreak nodes into newlines', () => {
    expect(
      richTextToPlainText(
        doc([para(text('one'), { type: 'linebreak' }, text('two'))])
      )
    ).toBe('one\ntwo');
  });

  it('drops empty blocks', () => {
    expect(
      richTextToPlainText(doc([para(text('  ')), para(text('Kept'))]))
    ).toBe('Kept');
  });

  it('returns an empty string for missing or malformed values', () => {
    expect(richTextToPlainText(undefined)).toBe('');
    expect(richTextToPlainText(null)).toBe('');
    expect(richTextToPlainText({})).toBe('');
    expect(richTextToPlainText(doc([]))).toBe('');
  });
});
