import { expect, test } from 'vitest';

import fs from 'fs';
import path from 'path';

import { TreeCursor } from 'web-tree-sitter';
import { initializeWasmParser } from '../parsers/wasm/parser';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const WASM_PATH = path.resolve(__dirname, '..', '..', 'resources', 'wasm', 'tree-sitter-phpdoc.wasm');

test('Example of parser usage with web-tree-sitter.', async () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'other', 'phpdoc-simple.txt'), { encoding: 'utf8' });

  const parser = await initializeWasmParser(WASM_PATH);
  const tree = parser.parse(code);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const outout: any[] = [];

  const walkCursor = (cursor: TreeCursor, level = 0) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // example
      const r = {
        nodeType: cursor.nodeType,
        nodeTypeId: cursor.nodeTypeId,
        nodeText: cursor.nodeText,
        nodeId: cursor.nodeId,
        nodeIsNamed: cursor.nodeIsNamed,
        nodeIsMissing: cursor.nodeIsMissing,
        startPosition: cursor.startPosition,
        endPosition: cursor.endPosition,
        startIndex: cursor.startIndex,
        endIndex: cursor.endIndex,
        parentType: cursor.currentNode().parent?.type ?? null,
        parentText: cursor.currentNode().parent?.text ?? null,
        currentFirstChildText: cursor.currentNode().parent?.firstChild?.text ?? null,
        currentLastChildText: cursor.currentNode().lastChild?.text ?? null,
        currentPreviousSiblingText: cursor.currentNode().previousSibling?.text ?? null,
        currentNextSiblingText: cursor.currentNode().nextSibling?.text ?? null,
        level: level,
      };

      if (cursor.nodeType === 'ERROR') {
        //console.log(
        //  `Expected '${cursor.nodeType}' | start: ${JSON.stringify(cursor.startPosition)}, end: ${JSON.stringify(
        //    cursor.endPosition
        //  )}`
        //);
      } else {
        //console.log(JSON.stringify(r, null, 2));
        if (r.nodeIsNamed) {
          //outout.push(r.nodeText);
        }
      }

      if (cursor.gotoFirstChild()) {
        walkCursor(cursor, level + 1);
        cursor.gotoParent();
      }
      if (!cursor.gotoNextSibling()) break;
    }
  };

  const cursor = tree.walk();
  walkCursor(cursor);

  //console.log(JSON.stringify(outout, null, 2));

  // ...Dummy
  expect('dummy').toBe('dummy');
});
