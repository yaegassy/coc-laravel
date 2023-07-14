import {
  Entry,
  Expression,
  Identifier,
  Method,
  Node,
  Location as ParserLocation,
  Return,
  Class as ClassNode,
} from 'php-parser';

import * as parser from '../../parsers/php/parser';

export const getAst = parser.getAst;
export const walk = parser.walk;
export const stripPHPTag = parser.stripPHPTag;
export const canCompletion = parser.canCompletion;

export function getServiceLocations(ast: Node) {
  const locations: ParserLocation[] = [];

  const rulesValue = getLocationsOfRulesValue(ast);
  if (rulesValue) locations.push(...rulesValue);

  return locations;
}

export function getLocationsOfRulesValue(ast: Node) {
  const rulesValueLocations: ParserLocation[] = [];

  const rulesMethodNode = getMethodNodeByName(ast, 'rules');
  const exprNode = getExpressionNodeContainReturnNode(rulesMethodNode);

  parser.walk((node, parent) => {
    if (node.kind === 'entry' && parent?.kind === 'array') {
      const entryNode = node as Entry;
      if (entryNode.key) {
        if (entryNode.value.loc) {
          rulesValueLocations.push(entryNode.value.loc);
        }
      }
    }
  }, exprNode[0]);

  return rulesValueLocations;
}

function getMethodNodeByName(ast: Node, name: string) {
  const methods: Method[] = [];

  parser.walk((node) => {
    if (node.kind === 'method') {
      const methodNode = node as Method;
      if (typeof methodNode.name === 'object' && 'name' in methodNode.name) {
        const identifierNode = methodNode.name as Identifier;
        if (identifierNode.name === name) {
          methods.push(methodNode);
        }
      }
    }
  }, ast);

  return methods[0];
}

function getExpressionNodeContainReturnNode(ast: Node) {
  const expressions: Expression[] = [];

  parser.walk((node) => {
    if (node.kind === 'return') {
      const returnNode = node as Return;
      if (returnNode.expr) {
        const exprNode = returnNode.expr as Expression;
        expressions.push(exprNode);
      }
    }
  }, ast);

  return expressions;
}

export function existsExtendsFormRequest(ast: Node) {
  let exists = false;

  parser.walk((node) => {
    if (node.kind === 'class') {
      const classNode = node as ClassNode;
      if (classNode.extends?.name === 'FormRequest') {
        exists = true;
      }
    }
  }, ast);

  return exists;
}
