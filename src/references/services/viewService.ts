import { Node, Location as ParserLocation } from 'php-parser';

import * as phpParser from '../../parsers/php/parser';

export const getAst = phpParser.getAst;
export const walk = phpParser.walk;
export const stripPHPTag = phpParser.stripPHPTag;

export function getServiceLocations(ast: Node) {
  return phpParser.getLocationOfCallFunctionArgumentsFor(ast, 'view');
}

export function canProvideService(documentOffset: number, parserLocations: ParserLocation[]) {
  for (const p of parserLocations) {
    if (p.start.offset <= documentOffset && p.end.offset >= documentOffset) {
      return true;
    }
  }

  return false;
}
