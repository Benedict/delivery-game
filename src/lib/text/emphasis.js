// src/lib/text/emphasis.js

/**
 * @typedef {{ text: string, bold: boolean }} Segment
 */

/**
 * Split text using **bold** markers into plain and bold segments, so the UI
 * can render emphasis without treating any of the text as HTML.
 * An unmatched ** is kept as literal text.
 * @param {string} text
 * @returns {Segment[]}
 */
export function parseEmphasis(text) {
  /** @type {Segment[]} */
  const segments = [];
  const push = (/** @type {string} */ value, /** @type {boolean} */ bold) => {
    if (value) segments.push({ text: value, bold });
  };

  const pattern = /\*\*(.+?)\*\*/gs;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    push(text.slice(last, index), false);
    push(match[1], true);
    last = index + match[0].length;
  }
  push(text.slice(last), false);
  return segments;
}
