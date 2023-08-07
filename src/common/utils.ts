export function elapsed(start: [number, number]) {
  if (!start) {
    return -1;
  }
  const diff = process.hrtime(start);
  return diff[0] * 1000 + diff[1] / 1000000;
}

export function stripInitialNewline(text: string) {
  return text.replace(/^\n/, '');
}
