import {
  Array as ArrayNode,
  Boolean as BooleanNode,
  Call,
  Cast,
  Function as FunctionNode,
  Identifier,
  Name,
  Namespace as NamespaceNode,
  Number as NumberNode,
  String as StringNode,
} from 'php-parser';

import * as phpParser from '../parsers/php/parser';

export function getConstantOfDefineNameFromPHPCode(code: string) {
  const defineNames: string[] = [];

  const ast = phpParser.getAst(code);
  if (!ast) return [];

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
    defineNames.push(defineNameStringNode.value);
  }, ast);

  return defineNames;
}

export function getConstantOfDefineValueFromDefineNameInPHPCode(code: string, defineName: string) {
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

export function getFunctionFromPHPCode(code: string) {
  const functionNames: string[] = [];

  const ast = phpParser.getAst(code);
  if (!ast) return [];

  phpParser.walk((node) => {
    if (node.kind !== 'function') return;

    const functionNode = node as FunctionNode;
    if (typeof functionNode.name !== 'object') return;
    const identifierNode = functionNode.name as Identifier;
    functionNames.push(identifierNode.name);
  }, ast);

  return functionNames;
}

export function getNamespaceFromPHPCode(code: string) {
  const namespaces: string[] = [];

  const ast = phpParser.getAst(code);
  if (!ast) return [];

  phpParser.walk((node) => {
    if (node.kind !== 'namespace') return;
    const namespaceNode = node as NamespaceNode;
    namespaces.push(namespaceNode.name);
  }, ast);

  return namespaces;
}
