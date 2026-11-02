// src/lib/text/emphasis.test.js
import { describe, it, expect } from 'vitest';
import { parseEmphasis } from './emphasis.js';

describe('parseEmphasis', () => {
  it('returns plain text as a single segment', () => {
    expect(parseEmphasis('Week 3 complete.')).toEqual([{ text: 'Week 3 complete.', bold: false }]);
  });

  it('splits **bold** spans out of the text', () => {
    expect(parseEmphasis('⚡ **Competitor Launch:** A rival shipped.')).toEqual([
      { text: '⚡ ', bold: false },
      { text: 'Competitor Launch:', bold: true },
      { text: ' A rival shipped.', bold: false }
    ]);
  });

  it('handles several bold spans and keeps line breaks', () => {
    expect(parseEmphasis('**A** one\n\n**B** two')).toEqual([
      { text: 'A', bold: true },
      { text: ' one\n\n', bold: false },
      { text: 'B', bold: true },
      { text: ' two', bold: false }
    ]);
  });

  it('leaves an unmatched marker as literal text', () => {
    expect(parseEmphasis('5 ** 2')).toEqual([{ text: '5 ** 2', bold: false }]);
  });

  it('treats markup-like text as text, not HTML', () => {
    expect(parseEmphasis('**<b>x</b>**')).toEqual([{ text: '<b>x</b>', bold: true }]);
  });

  it('returns nothing for empty input', () => {
    expect(parseEmphasis('')).toEqual([]);
  });
});
