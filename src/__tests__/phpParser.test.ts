import { expect, test } from 'vitest';

import fs from 'fs';
import path from 'path';
import { Array as ArrayNode, Entry, Identifier, Method, Return, String as StringNode } from 'php-parser';

import * as validationService from '../completions/services/validationService';
import * as phpParser from '../parsers/php/parser';
import { type CallKindNameWithChainType } from '../parsers/php/parser';
import * as testUtils from './testUtils';

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

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const fileName = 'validation';
  const mapStore: Map<string, string> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  phpParser.walk((node, _parent) => {
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

  const ast = phpParser.getAst(code);
  if (!ast) return;
  const exists = phpParser.existsExtendsClassFor(ast, 'Component');

  expect(true).toBe(exists);
});

test('Get public properties of constructor', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'php', 'class_based_component.php'), {
    encoding: 'utf8',
  });

  const ast = phpParser.getAst(code);
  if (!ast) return;

  type ParameterType = {
    name: string;
    value?: string;
  };

  const parameters: ParameterType[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  phpParser.walk((node, _parent) => {
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

test('Test of callVariableWithChainMethodsFromExprStmtNode', () => {
  const code = testUtils.stripInitialNewline(`
$myObject->one("one_param1")->two('two_param1', 'two_param2')->three('three_param1');
$myObject2->foo("foo_param1")->bar('bar_param1', 'bar_param2')->baz('baz_param1');
  `);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const exprStmtNodes = phpParser.getExpressionStatementNodes(ast);
  if (exprStmtNodes.length === 0) return;

  const callVariableWithChainMethods: CallKindNameWithChainType[] = [];
  for (const esNode of exprStmtNodes) {
    const res = phpParser.getCallVariableNameWithChainFrom(esNode);
    if (res) callVariableWithChainMethods.push(res);
  }

  // The result of the parser will be a string omitting the $ sign
  expect(callVariableWithChainMethods[0].name).toEqual('myObject');
  expect(callVariableWithChainMethods[0].startOffset).toEqual(0);
  expect(callVariableWithChainMethods[0].endOffset).toEqual(9);
  expect(callVariableWithChainMethods[0].methods[0].name).toEqual('one');
  expect(callVariableWithChainMethods[0].methods[0].startOffset).toEqual(11);
  expect(callVariableWithChainMethods[0].methods[0].endOffset).toEqual(14);
  expect(callVariableWithChainMethods[0].methods[0].arguments![0].value).toEqual('one_param1');
  expect(callVariableWithChainMethods[0].methods[0].arguments![0].startOffset).toEqual(15);
  expect(callVariableWithChainMethods[0].methods[0].arguments![0].endOffset).toEqual(27);

  // The result of the parser will be a string omitting the $ sign
  expect(callVariableWithChainMethods[1].name).toEqual('myObject2');
  expect(callVariableWithChainMethods[1].startOffset).toEqual(86);
  expect(callVariableWithChainMethods[1].endOffset).toEqual(96);
  expect(callVariableWithChainMethods[1].methods[2].name).toEqual('baz');
  expect(callVariableWithChainMethods[1].methods[2].startOffset).toEqual(150);
  expect(callVariableWithChainMethods[1].methods[2].endOffset).toEqual(153);
  expect(callVariableWithChainMethods[1].methods[2].arguments![0].value).toEqual('baz_param1');
  expect(callVariableWithChainMethods[1].methods[2].arguments![0].startOffset).toEqual(154);
  expect(callVariableWithChainMethods[1].methods[2].arguments![0].endOffset).toEqual(166);
});

test('Test of callStaticLookupNameWithChainMethodsFromExprStmtNode', () => {
  const code = testUtils.stripInitialNewline(`
MyStatic1::one("one_param1")->two('two_param1', 'two_param2')->three('three_param1');
MyStatic2::foo("foo_param1")->bar('bar_param1', 'bar_param2')->baz('baz_param1');
  `);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const exprStmtNodes = phpParser.getExpressionStatementNodes(ast);
  if (exprStmtNodes.length === 0) return;

  const callStaticLookupWithChainMethods: CallKindNameWithChainType[] = [];
  for (const e of exprStmtNodes) {
    const res = phpParser.getCallStaticLookupNameWithChainFrom(e);
    if (res) callStaticLookupWithChainMethods.push(res);
  }

  expect(callStaticLookupWithChainMethods[0].name).toEqual('MyStatic1');
  expect(callStaticLookupWithChainMethods[0].startOffset).toEqual(0);
  expect(callStaticLookupWithChainMethods[0].endOffset).toEqual(14);
  expect(callStaticLookupWithChainMethods[0].methods[0].name).toEqual('one');
  expect(callStaticLookupWithChainMethods[0].methods[0].startOffset).toEqual(11);
  expect(callStaticLookupWithChainMethods[0].methods[0].endOffset).toEqual(14);
  expect(callStaticLookupWithChainMethods[0].methods[0].arguments![0].value).toEqual('one_param1');
  expect(callStaticLookupWithChainMethods[0].methods[0].arguments![0].startOffset).toEqual(15);
  expect(callStaticLookupWithChainMethods[0].methods[0].arguments![0].endOffset).toEqual(27);

  expect(callStaticLookupWithChainMethods[1].name).toEqual('MyStatic2');
  expect(callStaticLookupWithChainMethods[1].startOffset).toEqual(86);
  expect(callStaticLookupWithChainMethods[1].endOffset).toEqual(100);
  expect(callStaticLookupWithChainMethods[1].methods[2].name).toEqual('baz');
  expect(callStaticLookupWithChainMethods[1].methods[2].startOffset).toEqual(149);
  expect(callStaticLookupWithChainMethods[1].methods[2].endOffset).toEqual(152);
  expect(callStaticLookupWithChainMethods[1].methods[2].arguments![0].value).toEqual('baz_param1');
  expect(callStaticLookupWithChainMethods[1].methods[2].arguments![0].startOffset).toEqual(153);
  expect(callStaticLookupWithChainMethods[1].methods[2].arguments![0].endOffset).toEqual(165);
});

test('Test of callNameNameWithChainMethodsFromExprStmtNode', () => {
  const code = testUtils.stripInitialNewline(`
one("one_param1")->two('two_param1', 'two_param2')->three('three_param1');
foo("foo_param1")->bar('bar_param1', 'bar_param2')->baz('baz_param1');
  `);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const exprStmtNodes = phpParser.getExpressionStatementNodes(ast);
  if (exprStmtNodes.length === 0) return;

  const callNameWithChainMethods: CallKindNameWithChainType[] = [];
  for (const e of exprStmtNodes) {
    const res = phpParser.getCallNameNameWithChainFrom(e);
    if (res) callNameWithChainMethods.push(res);
  }

  expect(callNameWithChainMethods[0].name).toEqual('one');
  expect(callNameWithChainMethods[0].startOffset).toEqual(0);
  expect(callNameWithChainMethods[0].endOffset).toEqual(3);

  expect(callNameWithChainMethods[0].functionArguments![0].value).toEqual('one_param1');
  expect(callNameWithChainMethods[0].functionArguments![0].startOffset).toEqual(4);
  expect(callNameWithChainMethods[0].functionArguments![0].endOffset).toEqual(16);

  expect(callNameWithChainMethods[1].methods[0].name).toEqual('bar');
  expect(callNameWithChainMethods[1].methods[0].startOffset).toEqual(94);
  expect(callNameWithChainMethods[1].methods[0].endOffset).toEqual(97);
  expect(callNameWithChainMethods[1].methods[0].arguments![0].value).toEqual('bar_param1');
  expect(callNameWithChainMethods[1].methods[0].arguments![0].startOffset).toEqual(98);
  expect(callNameWithChainMethods[1].methods[0].arguments![0].endOffset).toEqual(110);
  expect(callNameWithChainMethods[1].methods[0].arguments![1].value).toEqual('bar_param2');
  expect(callNameWithChainMethods[1].methods[0].arguments![1].startOffset).toEqual(112);
  expect(callNameWithChainMethods[1].methods[0].arguments![1].endOffset).toEqual(124);
});
