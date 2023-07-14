import { Call, Identifier, Name, Node, Location as ParserLocation, PropertyLookup } from 'php-parser';

import * as parser from '../../parsers/php/parser';

export const getAst = parser.getAst;
export const walk = parser.walk;
export const stripPHPTag = parser.stripPHPTag;
export const canCompletion = parser.canCompletion;

export function getServiceLocations(ast: Node) {
  const locations: ParserLocation[] = [];

  const routeFunctionArguments = getLocationsOfRouteFunctionArguments(ast);
  if (routeFunctionArguments.length !== 0) locations.push(...routeFunctionArguments);

  const chainRouteFunctionArgumentsOfRedirectFunction =
    getLocationsByChainRouteFunctionArgumentsOfRedirectFunction(ast);
  if (chainRouteFunctionArgumentsOfRedirectFunction.length !== 0)
    locations.push(...chainRouteFunctionArgumentsOfRedirectFunction);

  return locations;
}

export function getLocationsOfRouteFunctionArguments(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.what.kind === 'name') {
        const nameNode = callNode.what as Name;
        if (nameNode.name === 'route') {
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

export function getLocationsByChainRouteFunctionArgumentsOfRedirectFunction(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
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
