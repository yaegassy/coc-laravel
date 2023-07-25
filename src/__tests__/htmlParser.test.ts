import { expect, test } from 'vitest';

import * as htmlParser from '../parsers/html/parser';

import fs from 'fs';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test('Html parser example test', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'html', 'example.html'), { encoding: 'utf8' });
  const parsedDoc = htmlParser.parse(code);

  expect(parsedDoc.findNodeAt(9).tag).toBe('main');
  expect(parsedDoc.findNodeAt(9).start).toBe(8);
  expect(parsedDoc.findNodeAt(9).end).toBe(43);
  expect(parsedDoc.findNodeAt(9).startTagEnd).toBe(14);
  expect(parsedDoc.findNodeAt(9).endTagStart).toBe(36);
  expect(parsedDoc.findNodeAt(9).parent?.tag).toBe('div');
  expect(parsedDoc.findNodeAt(9).children[0].tag).toBe('p');
});
