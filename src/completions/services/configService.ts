import { Node, Location as ParserLocation } from 'php-parser';

import * as parser from '../../parsers/php/parser';

export const getAst = parser.getAst;
export const walk = parser.walk;
export const stripPHPTag = parser.stripPHPTag;
export const canCompletion = parser.canCompletion;

export function getServiceLocations(ast: Node) {
  const locations: ParserLocation[] = [];

  const location = parser.getLocationOfCallFunctionArgumentsFor(ast, 'config');
  if (location) locations.push(...location);

  return locations;
}
