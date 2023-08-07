import { Array as ArrayNode, Constant as ConstantNode, Entry, Identifier, String as StringNode } from 'php-parser';

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
