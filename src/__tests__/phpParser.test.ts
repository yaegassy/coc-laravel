import { expect, test } from 'vitest';

import fs from 'fs';
import path from 'path';

import * as parser from '../parsers/php/parser';

import { Return, Array as ArrayNode, Entry, String as StringNode } from 'php-parser';

import * as validationService from '../completions/services/validationService';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test('Determine if the FormRequest class is an inherited class', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'php', 'validation_class_extends_form_request.php'), {
    encoding: 'utf8',
  });
  const ast = validationService.getAst(code);

  const exists = validationService.existsExtendsFormRequest(ast);
  expect(exists).toBe(true);
});

test('Retrieve an array in a PHP file', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'php', 'lang', 'validation.php'), {
    encoding: 'utf8',
  });

  const ast = parser.getAst(code);

  const fileName = 'validation';
  const mapStore: Map<string, string> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    let targetKeyName: string | undefined = undefined;
    let targetKeyValue: string | undefined = undefined;

    if (node.kind === 'return') {
      const returnNode = node as Return;
      if (!returnNode.expr) return;
      if (returnNode.expr.kind !== 'array') return;

      const arrayNode = returnNode.expr as ArrayNode;

      for (const item of arrayNode.items) {
        if (item.kind !== 'entry') continue;
        const entryNode = item as Entry;

        if (!entryNode.key) continue;
        if (entryNode.key.kind !== 'string') continue;
        const keyNameNode = entryNode.key as StringNode;
        targetKeyName = keyNameNode.value;

        // MEMO: Does an array need to be addressed?
        if (entryNode.value.kind !== 'string') continue;
        const keyValueNode = entryNode.value as StringNode;
        targetKeyValue = keyValueNode.value;

        if (targetKeyName && targetKeyValue) {
          mapStore.set(fileName + '.' + targetKeyName, targetKeyValue);
        }
      }
    }
  }, ast);

  const mapStoreEntiesArray = Array.from(mapStore.entries());
  expect(mapStoreEntiesArray.length).toBe(83);
  expect(mapStoreEntiesArray[0]).toEqual(['validation.accepted', 'The :attribute field must be accepted.']);
  expect(mapStoreEntiesArray[82]).toEqual(['validation.uuid', 'The :attribute field must be a valid UUID.']);
});

// TODO: And more...
