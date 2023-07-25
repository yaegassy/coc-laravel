import { TextDocument, Range } from 'coc.nvim';

export function wholeRange(doc: TextDocument, range: Range): boolean {
  const whole = Range.create(0, 0, doc.lineCount, 0);
  return (
    whole.start.line === range.start.line &&
    whole.start.character === range.start.character &&
    whole.end.line === range.end.line &&
    whole.end.character === whole.end.character
  );
}

export function lineRange(r: Range): boolean {
  return (
    (r.start.line + 1 === r.end.line && r.start.character === 0 && r.end.character === 0) ||
    (r.start.line === r.end.line && r.start.character === 0)
  );
}

export function cursorRange(r: Range): boolean {
  return r.start.line === r.end.line && r.start.character === r.end.character;
}
