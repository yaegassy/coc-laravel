import { Node, Location as ParserLocation } from 'php-parser';

import * as phpParser from '../../parsers/php/parser';

export const getAst = phpParser.getAst;
export const walk = phpParser.walk;
export const stripPHPTag = phpParser.stripPHPTag;
export const canCompletion = phpParser.canCompletion;

export function getServiceLocations(ast: Node) {
  const locations: ParserLocation[] = [];

  const dunderFunctionArguments = phpParser.getLocationOfCallFunctionArgumentsFor(ast, '__');
  if (dunderFunctionArguments) locations.push(...dunderFunctionArguments);

  const transFunctionArguments = phpParser.getLocationOfCallFunctionArgumentsFor(ast, 'trans');
  if (transFunctionArguments) locations.push(...transFunctionArguments);

  return locations;
}
