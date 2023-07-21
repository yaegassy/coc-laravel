import { expect, test } from 'vitest';

import fs from 'fs';
import path from 'path';
import { Array as ArrayNode, Entry, Identifier, Method, Return, String as StringNode } from 'php-parser';

import * as validationService from '../completions/services/validationService';
import * as parser from '../parsers/php/parser';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test('Determine if the FormRequest class is an inherited class', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'php', 'validation_class_extends_form_request.php'), {
    encoding: 'utf8',
  });
  const ast = validationService.getAst(code);
  if (!ast) return;

  const exists = validationService.existsExtendsFormRequest(ast);
  expect(exists).toBe(true);
});

test('Retrieve an array in a PHP file', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'php', 'lang_validation.php'), {
    encoding: 'utf8',
  });

  const ast = parser.getAst(code);
  if (!ast) return;

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

test('Determine if the name class is an inherited class', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'php', 'class_based_component.php'), {
    encoding: 'utf8',
  });

  const ast = parser.getAst(code);
  if (!ast) return;
  const exists = parser.existsExtendsClassFor(ast, 'Component');

  expect(true).toBe(exists);
});

test('Get public properties of constructor', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'php', 'class_based_component.php'), {
    encoding: 'utf8',
  });

  const ast = parser.getAst(code);
  if (!ast) return;

  type ParameterType = {
    name: string;
    value?: string;
  };

  const parameters: ParameterType[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    if (node.kind === 'method') {
      const methodNode = node as Method;
      let existsConstruct = false;
      if (typeof methodNode.name === 'object') {
        const identifierNode = methodNode.name as Identifier;
        if (identifierNode.name === '__construct') {
          existsConstruct = true;
        }
      }

      if (!existsConstruct) return;
      if (methodNode.arguments.length === 0) return;

      for (const parameter of methodNode.arguments) {
        // flags:
        //   - type MODIFIER_PUBLIC = 1;
        //   - type MODIFIER_PROTECTED = 2;
        //   - type MODIFIER_PRIVATE = 4;
        if (parameter.flags !== 1) return;

        let parameterValue: string | undefined = undefined;
        if (parameter.value) {
          if (parameter.value.kind === 'string') {
            const stringNode = parameter.value as StringNode;
            parameterValue = stringNode.value;
          }
        }

        let parameterName: string | undefined = undefined;
        if (typeof parameter.name === 'object') {
          const identifierNode = parameter.name as Identifier;
          parameterName = identifierNode.name;
        }

        if (parameterName) {
          const parameter: ParameterType = {
            name: parameterName,
            value: parameterValue,
          };

          parameters.push(parameter);
        }
      }
    }
  }, ast);

  expect(parameters[0]).toEqual({ name: 'type' });
  expect(parameters[1]).toEqual({ name: 'message', value: 'dummy' });
});

// TODO: And more...
