import { Call, Identifier, Name, Node, Location as ParserLocation, PropertyLookup } from 'php-parser';

import * as phpParser from '../../parsers/php/parser';

export const getAst = phpParser.getAst;
export const walk = phpParser.walk;
export const stripPHPTag = phpParser.stripPHPTag;
export const canCompletion = phpParser.canCompletion;

export function getServiceLocations(ast: Node) {
  const locations: ParserLocation[] = [];

  const routeFunctionArguments = phpParser.getLocationOfCallFunctionArgumentsFor(ast, 'route');
  if (routeFunctionArguments.length !== 0) locations.push(...routeFunctionArguments);

  const chainRouteFunctionArgumentsOfRedirectFunction =
    getLocationsByChainRouteFunctionArgumentsOfRedirectFunction(ast);
  if (chainRouteFunctionArgumentsOfRedirectFunction.length !== 0)
    locations.push(...chainRouteFunctionArgumentsOfRedirectFunction);

  return locations;
}

export function getLocationsByChainRouteFunctionArgumentsOfRedirectFunction(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  phpParser.walk((node, _parent) => {
    let existsRedirect = false;
    let existsRoute = false;

    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        if (propertyLookupNode.what.kind === 'call') {
          const callNode = propertyLookupNode.what as Call;
          if (callNode.what.kind === 'name') {
            const nameNode = callNode.what as Name;
            if (nameNode.name === 'redirect') {
              existsRedirect = true;
            }
          }
        }

        if (existsRedirect) {
          if (propertyLookupNode.offset.kind === 'identifier') {
            const identifierNode = propertyLookupNode.offset as Identifier;
            if (identifierNode.name === 'route') {
              existsRoute = true;
            }
          }
        }
      }

      if (existsRoute) {
        if (callNode.arguments[0].loc) {
          locations.push(callNode.arguments[0].loc);
        }
      }
    }

    existsRedirect = false;
    existsRoute = false;
  }, ast);

  return locations;
}
