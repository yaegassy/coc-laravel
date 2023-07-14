import { Call, Identifier, Name, Node, Location as ParserLocation, PropertyLookup, StaticLookup } from 'php-parser';

import * as parser from '../../parsers/php/parser';

export const getAst = parser.getAst;
export const walk = parser.walk;
export const stripPHPTag = parser.stripPHPTag;
export const canCompletion = parser.canCompletion;

export function getServiceLocations(ast: Node) {
  const locations: ParserLocation[] = [];

  const case1Locations = serviceWalkCase1(ast);
  if (case1Locations) locations.push(...case1Locations);

  const case2Locations = serviceWalkCase2(ast);
  if (case2Locations) locations.push(...case2Locations);

  const case3Locations = serviceWalkCase3(ast);
  if (case3Locations) locations.push(...case3Locations);

  const case4Locations = serviceWalkCase4(ast);
  if (case4Locations) locations.push(...case4Locations);

  const case5Locations = serviceWalkCase5(ast);
  if (case5Locations) locations.push(...case5Locations);

  return locations;
}

/**
 * Case1:
 *   - Route::middleware("..."),
 *   - Route::middleware(["...", "..."])
 */
function serviceWalkCase1(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    let existsRoute = false;
    let existsMiddleware = false;

    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        if (propertyLookupNode.what.kind === 'call') {
          const callNode = propertyLookupNode.what as Call;
          if (callNode.what.kind === 'staticlookup') {
            const staticLookupNode = callNode.what as unknown as StaticLookup;
            if (staticLookupNode.what.kind === 'name') {
              const nameNode = staticLookupNode.what as Name;
              if (nameNode.name === 'Route') {
                existsRoute = true;
              }
            }

            if (existsRoute && staticLookupNode.offset.kind === 'identifier') {
              const identifierNode = staticLookupNode.offset as Identifier;
              if (identifierNode.name === 'middleware') {
                existsMiddleware = true;
              }
            }
          }

          if (existsMiddleware && callNode.arguments.length > 0) {
            for (const arg of callNode.arguments) {
              if (arg.loc) {
                // ====
                locations.push(arg.loc);
              }
            }
          }
        }
      }
    }
  }, ast);

  return locations;
}

/**
 * Case2:
 *   - Route::xxx()->middleware("...")...;
 *   - Route::xxx()->middleware(["...", "..."])...;
 */
function serviceWalkCase2(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    let existsRoute = false;
    let existsMiddleware = false;

    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        if (propertyLookupNode.what.kind === 'call') {
          // ====
          const callNode = propertyLookupNode.what as Call;
          if (callNode.what.kind === 'propertylookup') {
            const propertyLookupNode = callNode.what as unknown as PropertyLookup;
            if (propertyLookupNode.what.kind === 'call') {
              const callNode = propertyLookupNode.what as Call;
              if (callNode.what.kind === 'staticlookup') {
                const staticLookupNode = callNode.what as unknown as StaticLookup;
                if (staticLookupNode.what.kind === 'name') {
                  const nameNode = staticLookupNode.what as Name;
                  if (nameNode.name === 'Route') {
                    existsRoute = true;
                  }
                }
              }
            }

            if (existsRoute && propertyLookupNode.offset.kind === 'identifier') {
              const identifierNode = propertyLookupNode.offset as Identifier;
              if (identifierNode.name === 'middleware') {
                existsMiddleware = true;
              }
            }
          }

          // ====
          if (existsMiddleware && callNode.arguments.length > 0) {
            for (const arg of callNode.arguments) {
              if (arg.loc) {
                // ====
                locations.push(arg.loc);
              }
            }
          }
        }
      }
    }
  }, ast);

  return locations;
}

/**
 * Case3:
 * - Route::xxx()->...->middleware("...");
 * - Route::xxx()->...->middleware(["...", "..."]);
 */
function serviceWalkCase3(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    let existsRoute = false;
    let existsMiddleware = false;

    if (node.kind === 'call') {
      // ====
      const callNode = node as Call;
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        if (propertyLookupNode.what.kind === 'call') {
          const callNode = propertyLookupNode.what as Call;
          if (callNode.what.kind === 'propertylookup') {
            const propertyLookupNode = callNode.what as unknown as PropertyLookup;
            if (propertyLookupNode.what.kind === 'call') {
              const callNode = propertyLookupNode.what as Call;
              if (callNode.what.kind === 'staticlookup') {
                const staticLookupNode = callNode.what as unknown as StaticLookup;
                if (staticLookupNode.what.kind === 'name') {
                  const nameNode = staticLookupNode.what as Name;
                  if (nameNode.name === 'Route') {
                    existsRoute = true;
                  }
                }
              }
            }
          }
        }

        if (existsRoute) {
          if (propertyLookupNode.offset.kind === 'identifier') {
            const identifierNode = propertyLookupNode.offset as Identifier;
            if (identifierNode.name === 'middleware') {
              existsMiddleware = true;
            }
          }
        }
      }

      // ====
      if (existsMiddleware && callNode.arguments.length > 0) {
        for (const arg of callNode.arguments) {
          if (arg.loc) {
            // ====
            locations.push(arg.loc);
          }
        }
      }
    }
  }, ast);

  return locations;
}

/**
 * Case4: incomplete
 *   - Route::middleware("..."
 *   - Route::middleware(["...", "..."]
 */
function serviceWalkCase4(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    let existsRoute = false;
    let existsMiddleware = false;
    let existsIncomplete = false;

    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.arguments && !callNode.arguments[0]) {
        existsIncomplete = true;
      }

      if (callNode.what.kind === 'staticlookup') {
        const staticLookupNode = callNode.what as unknown as StaticLookup;
        if (staticLookupNode.what.kind === 'name') {
          const nameNode = staticLookupNode.what as Name;
          if (nameNode.name === 'Route') {
            existsRoute = true;
          }
        }

        if (existsRoute && staticLookupNode.offset.kind === 'identifier') {
          const identifierNode = staticLookupNode.offset as Identifier;
          if (identifierNode.name === 'middleware') {
            existsMiddleware = true;
          }
        }

        if (!existsIncomplete && existsMiddleware && callNode.arguments.length > 0) {
          for (const arg of callNode.arguments) {
            if (arg.loc) {
              locations.push(arg.loc);
            }
          }
        }
      }
    }
  }, ast);

  return locations;
}

/**
 * Case5: incomplete
 *   - Route::xxx()->...middleware("..."
 *   - Route::xxx()->...middleware(["...", "..."]
 */
function serviceWalkCase5(ast: Node) {
  const locations: ParserLocation[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser.walk((node, _parent) => {
    let existsRoute = false;
    let existsMiddleware = false;

    if (node.kind === 'call') {
      const callNode = node as Call;
      ///console.log(JSON.stringify(callNode, null, 2));
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        if (propertyLookupNode.what.kind === 'call') {
          const callNode = propertyLookupNode.what as Call;
          if (callNode.what.kind === 'staticlookup') {
            const staticLookupNode = callNode.what as unknown as StaticLookup;
            if (staticLookupNode.what.kind === 'name') {
              const nameNode = staticLookupNode.what as Name;
              if (nameNode.name === 'Route') {
                existsRoute = true;
              }
            }
          }
        }

        if (existsRoute && propertyLookupNode.offset.kind === 'identifier') {
          const identifierNode = propertyLookupNode.offset as Identifier;
          if (identifierNode.name === 'middleware') {
            existsMiddleware = true;
          }
        }
      }

      if (existsMiddleware && callNode.arguments.length > 0) {
        for (const arg of callNode.arguments) {
          if (arg.loc) {
            // ====
            locations.push(arg.loc);
          }
        }
      }
    }
  }, ast);

  return locations;
}
