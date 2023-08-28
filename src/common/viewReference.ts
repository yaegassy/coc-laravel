import {
  Array as ArrayNode,
  ArrowFunc,
  Call,
  Name,
  Return as ReturnNode,
  String as StringNode,
  Entry,
  PropertyLookup,
  Identifier,
} from 'php-parser';

import * as phpParser from '../parsers/php/parser';
import { CallViewFunctionForReferenceType } from './types';

export function getReturnOrArrowFuncNodesFromPHPCode(code: string) {
  const ast = phpParser.getAstByParseCode(code);
  if (!ast) return [];

  const nodes: (ReturnNode | ArrowFunc)[] = [];

  phpParser.walk((node) => {
    if (node.kind === 'return') {
      const returnNode = node as ReturnNode;
      nodes.push(returnNode);
    } else if (node.kind === 'arrowfunc') {
      const arrowfuncNode = node as ArrowFunc;
      nodes.push(arrowfuncNode);
    }
  }, ast);

  return nodes;
}

export function getCallViewFunctionsNonChainWithMethod(node: ReturnNode | ArrowFunc) {
  const callViewFuncsForReference: CallViewFunctionForReferenceType[] = [];

  phpParser.walk((node, parent) => {
    if (!parent) return;
    if (node.kind !== 'call') return;

    // If ast contains a chain-method, it is a properlookup. As an example of
    // use, the `with` chain-method is excluded because it can be obtained by
    // another function
    if (parent.kind === 'propertylookup') return;

    const callNode = node as Call;
    if (callNode.what.kind !== 'name') return;

    const nameNode = callNode.what as Name;
    if (nameNode.name !== 'view') return;
    if (!nameNode.loc) return;
    if (callNode.arguments.length === 0) return;
    if (callNode.arguments[0].kind !== 'string') return;
    const stringNode = callNode.arguments[0] as StringNode;
    const viewName = stringNode.value;

    const dataKeys: string[] = [];
    if (callNode.arguments[1]) {
      if (callNode.arguments[1].kind === 'array') {
        const arrayNode = callNode.arguments[1] as ArrayNode;
        if (arrayNode.items.length > 0) {
          for (const i of arrayNode.items) {
            if (i.kind !== 'entry') continue;
            const entryNode = i as Entry;
            if (!entryNode.key) continue;
            if (typeof entryNode.key !== 'object') continue;
            if (entryNode.key.kind !== 'string') continue;
            const entryKeyStringNode = entryNode.key as StringNode;
            // ====
            const dataKey = entryKeyStringNode.value;
            dataKeys.push(dataKey);
          }
        }
      }
    }

    callViewFuncsForReference.push({
      name: viewName,
      startOffset: nameNode.loc.start.offset,
      endOffset: nameNode.loc.end.offset,
      dataKeys,
    });
  }, node);

  if (!callViewFuncsForReference.length) return;
  return callViewFuncsForReference[0];
}

export function getCallViewFunctionsWithChainWithMethod(returnOrArrowFuncNode: ReturnNode | ArrowFunc) {
  let callFunctionName: string | undefined = undefined;
  let callFunctionNameStartOffset: number | undefined = undefined;
  let callFunctionNameEndOffset: number | undefined = undefined;
  let viewName: string | undefined = undefined;
  const callChainWithMethodData: { name: string; argumentKeys: string[] }[] = [];

  phpParser.walk((node, parent) => {
    if (!parent) return;

    if (
      node.kind === 'call' &&
      (parent.kind === 'propertylookup' || parent.kind === 'return' || parent.kind === 'arrowfunc')
    ) {
      let methodCallName: string | undefined = undefined;
      const argumentKeys: string[] = [];

      const callNode = node as Call;

      // === call view function
      if (callNode.what.kind === 'name') {
        const nameNode = callNode.what as Name;
        callFunctionName = nameNode.name; //

        if (nameNode.loc) {
          callFunctionNameStartOffset = nameNode.loc.start.offset; //
          callFunctionNameEndOffset = nameNode.loc.end.offset; //
        }

        // === call view function argument
        if (callNode.arguments.length > 0) {
          for (const [index, arg] of callNode.arguments.entries()) {
            if (arg.kind === 'string') {
              const argStringNode = arg as StringNode;
              if (index !== 0) continue;
              viewName = argStringNode.value;
            }
          }
        }
      }

      // === chain-method name
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        if (propertyLookupNode.offset.kind === 'identifier') {
          const identifierNode = propertyLookupNode.offset as Identifier;
          methodCallName = identifierNode.name;
        }

        // === cain-method argument
        if (callNode.arguments.length > 0) {
          for (const [index, arg] of callNode.arguments.entries()) {
            if (arg.kind === 'string') {
              const argStringNode = arg as StringNode;
              if (index !== 0) continue;
              argumentKeys.push(argStringNode.value);
            } else if (arg.kind === 'array') {
              const argArrayNode = arg as ArrayNode;
              if (!argArrayNode.items.length) continue;
              for (const item of argArrayNode.items) {
                if (item.kind !== 'entry') continue;
                const entryNode = item as Entry;
                if (!entryNode.key) continue;
                if (entryNode.key.kind !== 'string') continue;
                const stringNode = entryNode.key as StringNode;
                argumentKeys.push(stringNode.value);
              }
            }
          }
        }
      }

      if (!methodCallName) return;
      if (methodCallName !== 'with') return;

      callChainWithMethodData.push({
        name: methodCallName,
        argumentKeys,
      });
    }
  }, returnOrArrowFuncNode);

  if (!callFunctionName) return;
  if (callFunctionName !== 'view') return;
  if (!viewName) return;
  if (!callChainWithMethodData.length) return;
  if (!callFunctionNameStartOffset) return;
  if (!callFunctionNameEndOffset) return;

  const dataKeys: string[] = [];
  for (const m of callChainWithMethodData) {
    for (const k of m.argumentKeys) {
      dataKeys.push(k);
    }
  }

  const callViewFunctionForReference: CallViewFunctionForReferenceType = {
    name: viewName,
    startOffset: callFunctionNameStartOffset,
    endOffset: callFunctionNameEndOffset,
    dataKeys,
  };

  return callViewFunctionForReference;
}
