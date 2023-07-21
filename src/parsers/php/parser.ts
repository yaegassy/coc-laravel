import {
  Class as ClassNode,
  Engine,
  Identifier,
  Method,
  Node,
  Location as ParserLocation,
  String as StringNode,
  Call,
  Name,
} from 'php-parser';

export type ParameterType = {
  name: string;
  value?: string;
};

export function getAst(code: string) {
  try {
    const parserEngine = getParserEngine();
    return parserEngine.parseEval(stripPHPTag(code));
  } catch (e) {
    return undefined;
  }
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

export function existsExtendsClassFor(ast: Node, name: string) {
  let exists = false;

  walk((node) => {
    if (node.kind === 'class') {
      const classNode = node as ClassNode;
      if (classNode.extends?.name === name) {
        exists = true;
      }
    }
  }, ast);

  return exists;
}

export function getPublicParametersOfConstructor(ast: Node) {
  const parameters: ParameterType[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  walk((node, _parent) => {
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

  return parameters;
}

export function getLocationOfCallFunctionArgumentsFor(ast: Node, name: string) {
  const locations: ParserLocation[] = [];

  walk((node) => {
    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.what.kind === 'name') {
        const nameNode = callNode.what as Name;
        if (nameNode.name === name) {
          if (callNode.arguments.length >= 1) {
            if (callNode.arguments[0].loc) {
              locations.push(callNode.arguments[0].loc);
            }
          }
        }
      }
    }
  }, ast);

  return locations;
}
