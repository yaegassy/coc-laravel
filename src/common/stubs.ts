import {
  Array as ArrayNode,
  Boolean as BooleanNode,
  Call,
  Cast,
  Constant as ConstantNode,
  Entry,
  Identifier,
  Name,
  Number as NumberNode,
  String as StringNode,
} from 'php-parser';

import * as phpParser from '../parsers/php/parser';

export function getContextListFromStubMapPHPCode(code: string, name: string) {
  const contextList: { name: string; path: string }[] = [];

  const ast = phpParser.getAst(code);
  if (!ast) return;

  phpParser.walk((node) => {
    if (node.kind !== 'constant') return;
    const constantNode = node as ConstantNode;
    if (typeof constantNode.name !== 'object') return;
    const identifierNode = constantNode.name as Identifier;
    if (identifierNode.name !== name) return;
    if (!constantNode.value) return;
    if (typeof constantNode.value !== 'object') return;
    if (constantNode.value.kind !== 'array') return;
    const arrayNode = constantNode.value as ArrayNode;
    if (arrayNode.items.length === 0) return;

    for (const item of arrayNode.items) {
      if (item.kind !== 'entry') continue;
      const entryNode = item as Entry;
      if (!entryNode.key) continue;
      if (entryNode.key.kind !== 'string') continue;
      if (entryNode.value.kind !== 'string') continue;

      const keyStringNode = entryNode.key as StringNode;
      const valueStringNode = entryNode.value as StringNode;

      contextList.push({
        name: keyStringNode.value,
        path: valueStringNode.value,
      });
    }
  }, ast);

  if (contextList.length === 0) return [];

  return contextList;
}

export function isAllowStubFile(file: string, stubs: string[]) {
  for (const stub of stubs) {
    if (file.startsWith(stub)) {
      return true;
    }
  }

  return false;
}

export function getDefineValueFromDefineNameInPHPCode(code: string, defineName: string) {
  const defineValues: (string | number | boolean)[] = [];

  const ast = phpParser.getAst(code);
  if (!ast) return;

  phpParser.walk((node, parent) => {
    if (!parent) return;
    if (node.kind !== 'name' && parent.kind !== 'call') return;
    const nameNode = node as Name;
    const parentCallNode = parent as Call;
    if (nameNode.name !== 'define') return;

    if (parentCallNode.arguments.length === 0) return;
    if (parentCallNode.arguments.length === 1) return;
    if (parentCallNode.arguments[0].kind !== 'string') return;
    const defineNameStringNode = parentCallNode.arguments[0] as StringNode;
    if (defineNameStringNode.value !== defineName) return;

    if (parentCallNode.arguments[1].kind === 'string') {
      const defineValueStringNode = parentCallNode.arguments[1] as StringNode;
      defineValues.push(defineValueStringNode.value);
    } else if (parentCallNode.arguments[1].kind === 'boolean') {
      const defineValueBooleanNode = parentCallNode.arguments[1] as BooleanNode;
      defineValues.push(defineValueBooleanNode.value);
    } else if (parentCallNode.arguments[1].kind === 'number') {
      const defineValueNumberNode = parentCallNode.arguments[1] as NumberNode;
      defineValues.push(Number(defineValueNumberNode.value));
    } else if (parentCallNode.arguments[1].kind === 'nullkeyword') {
      defineValues.push('null');
    } else if (parentCallNode.arguments[1].kind === 'array') {
      const defineValueArrayNode = parentCallNode.arguments[1] as ArrayNode;
      if (defineValueArrayNode.items.length === 0) {
        defineValues.push('[]');
      } else {
        defineValues.push('[...omission]');
      }
    } else if (parentCallNode.arguments[1].kind === 'cast') {
      const defineValueCastNode = parentCallNode.arguments[1] as Cast;
      if (defineValueCastNode.expr.kind === 'name') {
        const castExprNameNode = defineValueCastNode.expr as Name;
        defineValues.push(defineValueCastNode.raw + castExprNameNode.name);
      } else {
        defineValues.push('<...cast:omission>');
      }
    } else {
      defineValues.push('<...omission>');
    }
  }, ast);

  if (defineValues.length === 0) return;
  return defineValues[0];
}
