import { Engine, Node, Location as ParserLocation } from 'php-parser';

export function getAst(code: string) {
  const parserEngine = getParserEngine();
  return parserEngine.parseEval(stripPHPTag(code));
}

export function stripPHPTag(code: string) {
  return code.replace('<?php', '').replace('?>', '');
}

function getParserEngine() {
  const parserEngine = new Engine({
    parser: {
      debug: false,
      extractDoc: false,
      php7: true,
      locations: true,
      suppressErrors: true,
    },
    ast: {
      all_tokens: false,
      withPositions: true,
    },
  });

  return parserEngine;
}

function isNode(value: any): boolean {
  return typeof value === 'object' && value !== null && typeof value.kind === 'string';
}

function collectChildNodes(node: Node) {
  const childNodes: Node[] = [];

  for (const key of Object.keys(node)) {
    const property = node[key];

    if (Array.isArray(property)) {
      for (const propertyElement of property) {
        if (isNode(propertyElement)) {
          childNodes.push(propertyElement);
        }
      }
    } else if (isNode(property)) {
      childNodes.push(property);
    }
  }

  return childNodes;
}

export function walk(callback: (node: Node, parent: Node | undefined) => void, node: Node, parent?: Node) {
  //callback(node, parent);
  const children = collectChildNodes(node);
  for (const child of children) {
    walk(callback, child, node);
  }
  callback(node, parent);
}

export function canCompletion(documentOffset: number, parserLocations: ParserLocation[]) {
  for (const p of parserLocations) {
    if (p.start.offset <= documentOffset && p.end.offset >= documentOffset) {
      return true;
    }
  }

  return false;
}
