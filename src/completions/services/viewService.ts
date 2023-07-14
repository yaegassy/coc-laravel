import { Call, Name, Node, Location as ParserLocation } from 'php-parser';

import * as parser from '../../parsers/php/parser';

export const getAst = parser.getAst;
export const walk = parser.walk;
export const stripPHPTag = parser.stripPHPTag;
export const canCompletion = parser.canCompletion;

export function getServiceLocations(ast: Node) {
  const locations: ParserLocation[] = [];

  const viewFunctionArguments = getLocationOfViewFunctionArguments(ast);
  if (viewFunctionArguments) locations.push(...viewFunctionArguments);

  return locations;
}

export function getLocationOfViewFunctionArguments(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.what.kind === 'name') {
        const nameNode = callNode.what as Name;
        if (nameNode.name === 'view') {
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
