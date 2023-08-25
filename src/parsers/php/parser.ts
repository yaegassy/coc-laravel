import {
  Array as ArrayNode,
  Bin,
  Boolean as BooleanNode,
  Call,
  Class as ClassNode,
  Engine,
  Expression,
  ExpressionStatement,
  Identifier,
  Method,
  Name,
  Node,
  Number as NumberNode,
  Parameter as ParameterNode,
  Location as ParserLocation,
  PropertyLookup,
  Property as PropertyNode,
  StaticLookup,
  String as StringNode,
  TypeReference,
  Unary,
  UnionType,
  UseGroup,
  UseItem,
  Variable,
} from 'php-parser';

import { ArgumentParameterType, PHPUseItemType } from '../../common/types';

export type ParameterType = {
  name: string;
  value?: string;
};

export type CallKindNameWithChainType = {
  name: string;
  startOffset?: number;
  endOffset?: number;
  methods: CallMethodType[];
  functionArguments?: CallArgumentsType[];
};

export type CallArgumentsType = {
  value: string | number | boolean;
  startOffset?: number;
  endOffset?: number;
};

export type CallMethodType = {
  name: string;
  startOffset?: number;
  endOffset?: number;
  arguments: CallArgumentsType[];
};

export function getAst(code: string) {
  try {
    const parserEngine = getParserEngine();
    return parserEngine.parseEval(stripPHPTag(code));
  } catch (e) {
    return undefined;
  }
}

export function getAstByEvalCode(code: string) {
  try {
    const parserEngine = getParserEngine();
    return parserEngine.parseEval(stripPHPTag(code));
  } catch (e) {
    return undefined;
  }
}

export function getAstByParseCode(code: string) {
  try {
    const parserEngine = getParserEngine();
    return parserEngine.parseCode(code, '');
  } catch (e) {
    return undefined;
  }
}

export function stripPHPTag(code: string) {
  return code.replace('<?php', '').replace('?>', '').replace('<?=', '');
}

function getParserEngine() {
  const parserEngine = new Engine({
    parser: {
      debug: false,
      extractDoc: true,
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

export function existsUseItemFor(ast: Node, name: string) {
  let exists = false;

  walk((node) => {
    if (node.kind === 'useitem') {
      const useItemNode = node as UseItem;
      if (useItemNode.name !== name) return;
      exists = true;
    }
  }, ast);

  return exists;
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

export function getClassNodeExtendsFor(ast: Node, name: string) {
  let returnClassNode: ClassNode | undefined = undefined;

  const targetClassNodes: ClassNode[] = [];
  walk((node) => {
    if (node.kind === 'class') {
      const classNode = node as ClassNode;
      if (!classNode.extends) return;
      if (classNode.extends.name !== name) return;
      targetClassNodes.push(classNode);
    }
  }, ast);

  if (targetClassNodes.length > 0) returnClassNode = targetClassNodes[0];
  return returnClassNode;
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

export function getLocationOfCallFunctionArgumentsFor(ast: Node, callName: string) {
  const locations: ParserLocation[] = [];

  walk((node) => {
    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.what.kind === 'name') {
        const nameNode = callNode.what as Name;
        if (nameNode.name === callName) {
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

export function getPropertyValueFromPropertyNode(node: PropertyNode) {
  let propertyValue: string | number | boolean | any[] | null | undefined = undefined;

  if (!node.value) return;

  if (node.value.kind === 'array') {
    const arrayNode = node.value as ArrayNode;
    if (arrayNode.items.length === 0) {
      // e.g. $parameters = []
      // MEMO: Sets '[]' as a string
      propertyValue = '[]';
    } else {
      propertyValue = arrayNode.items;
    }
  } else if (node.value.kind === 'boolean') {
    const booleanNode = node.value as BooleanNode;
    propertyValue = booleanNode.value;
  } else if (node.value.kind === 'string') {
    const stringNode = node.value as StringNode;
    propertyValue = stringNode.raw;
  } else if (node.value.kind === 'number') {
    const numberNode = node.value as NumberNode;
    propertyValue = numberNode.value;
  } else if (node.value.kind === 'nullkeyword') {
    // e.g. ($idna_info = null)
    // MEMO: Sets null as a string
    propertyValue = 'null';
  } else if (node.value.kind === 'staticlookup') {
    // e.g. ($form = p\Normalizer::FORM_C)
    const staticLookupNode = node.value as StaticLookup;
    if (staticLookupNode.what.kind === 'name') {
      const nameNode = staticLookupNode.what as Name;
      propertyValue = nameNode.name;
    }
    if (staticLookupNode.offset) {
      // e.g. (int $options = OutputInterface::OUTPUT_NORMAL)
      if (typeof staticLookupNode.offset === 'object') {
        const identifierNode = staticLookupNode.offset as Identifier;
        propertyValue = propertyValue + '::' + identifierNode.name;
      }
    }
  } else if (node.value.kind === 'name') {
    // e.g. ($variant = \INTL_IDNA_VARIANT_2003)
    const nameNode = node.value as Name;
    propertyValue = nameNode.name;
  } else if (node.value.kind === 'bin') {
    const binNode = node.value as Bin;
    const binValues: string[] = [];
    if (binNode.left.kind === 'name') {
      const nameNode = binNode.left as Name;
      binValues.push(nameNode.name);
    }
    if (binNode.right.kind === 'name') {
      const nameNode = binNode.right as Name;
      binValues.push(nameNode.name);
    }

    if (binValues.length === 1) {
      propertyValue = binValues[0];
    } else if (binValues.length > 1) {
      for (const [i, v] of binValues.entries()) {
        if (i === 0) {
          propertyValue = v;
        } else {
          propertyValue += '|' + v;
        }
      }
    }
  } else if (node.value.kind === 'unary') {
    // e.g. (int $port = -1)
    const unaryNode = node.value as Unary;
    if (unaryNode.what.kind === 'number') {
      const numberNode = unaryNode.what as NumberNode;
      propertyValue = unaryNode.type + numberNode.value;
    }
  } else {
    propertyValue = '=CHECK=';
  }

  return propertyValue;
}

export function getArgumentParametersFromMethodParametersNode(nodes: ParameterNode[]) {
  const argumentsParameters: ArgumentParameterType[] = [];

  if (nodes.length === 0) return [];
  for (const node of nodes) {
    let parameterTypeHint: string | undefined = undefined;

    if (node.type) {
      if (node.type.kind === 'typereference') {
        const typereferenceNode = node.type as TypeReference;
        parameterTypeHint = typereferenceNode.name;
      } else if (node.type.kind === 'name') {
        const nameNode = node.type as Name;
        parameterTypeHint = nameNode.name;
      } else if (node.type.kind === 'uniontype') {
        const unionTypeNode = node.type as UnionType;
        for (const uType of unionTypeNode.types) {
          if (uType.kind === 'typereference') {
            const typereferenceNode = uType as TypeReference;
            if (parameterTypeHint) {
              parameterTypeHint + parameterTypeHint + '|';
            }
            parameterTypeHint = typereferenceNode.name;
          } else if (uType.kind === 'name') {
            const nameNode = uType as Name;
            if (parameterTypeHint) {
              parameterTypeHint + parameterTypeHint + '|';
            }
            parameterTypeHint = nameNode.name;
          }
        } // for
      }
    }
    if (typeof node.name !== 'object') continue;
    const identifierNode = node.name as Identifier;

    const funcArgParamName = identifierNode.name;
    let funcArgParamValue: string | number | boolean | any[] | null | undefined = undefined;

    if (node.value) {
      if (node.value.kind === 'array') {
        const arrayNode = node.value as ArrayNode;
        if (arrayNode.items.length === 0) {
          // e.g. $parameters = []
          // MEMO: Sets '[]' as a string
          funcArgParamValue = '[]';
        } else {
          funcArgParamValue = arrayNode.items;
        }
      } else if (node.value.kind === 'boolean') {
        const booleanNode = node.value as BooleanNode;
        funcArgParamValue = booleanNode.value;
      } else if (node.value.kind === 'string') {
        const stringNode = node.value as StringNode;
        funcArgParamValue = stringNode.raw;
      } else if (node.value.kind === 'number') {
        const numberNode = node.value as NumberNode;
        funcArgParamValue = numberNode.value;
      } else if (node.value.kind === 'nullkeyword') {
        // e.g. ($idna_info = null)
        // MEMO: Sets null as a string
        funcArgParamValue = 'null';
      } else if (node.value.kind === 'staticlookup') {
        // e.g. ($form = p\Normalizer::FORM_C)
        const staticLookupNode = node.value as StaticLookup;
        if (staticLookupNode.what.kind === 'name') {
          const nameNode = staticLookupNode.what as Name;
          funcArgParamValue = nameNode.name;
        }
        if (staticLookupNode.offset) {
          // e.g. (int $options = OutputInterface::OUTPUT_NORMAL)
          if (typeof staticLookupNode.offset === 'object') {
            const identifierNode = staticLookupNode.offset as Identifier;
            funcArgParamValue = funcArgParamValue + '::' + identifierNode.name;
          }
        }
      } else if (node.value.kind === 'name') {
        // e.g. ($variant = \INTL_IDNA_VARIANT_2003)
        const nameNode = node.value as Name;
        funcArgParamValue = nameNode.name;
      } else if (node.value.kind === 'bin') {
        const binNode = node.value as Bin;
        const binValues: string[] = [];
        if (binNode.left.kind === 'name') {
          const nameNode = binNode.left as Name;
          binValues.push(nameNode.name);
        }
        if (binNode.right.kind === 'name') {
          const nameNode = binNode.right as Name;
          binValues.push(nameNode.name);
        }

        if (binValues.length === 1) {
          funcArgParamValue = binValues[0];
        } else if (binValues.length > 1) {
          for (const [i, v] of binValues.entries()) {
            if (i === 0) {
              funcArgParamValue = v;
            } else {
              funcArgParamValue += '|' + v;
            }
          }
        }
      } else if (node.value.kind === 'unary') {
        // e.g. (int $port = -1)
        const unaryNode = node.value as Unary;
        if (unaryNode.what.kind === 'number') {
          const numberNode = unaryNode.what as NumberNode;
          funcArgParamValue = unaryNode.type + numberNode.value;
        }
      } else {
        funcArgParamValue = '=CHECK=';
      }
    }

    const argumentParameter: ArgumentParameterType = {
      name: funcArgParamName,
      value: funcArgParamValue ? funcArgParamValue : undefined,
      byref: node.byref,
      nullable: node.nullable,
      variadic: node.variadic,
      typehint: parameterTypeHint ? parameterTypeHint : undefined,
    };

    // **MEMO**:
    // Duplicate argument parameter name exist when
    // attributes are used. In that case, overwrite with new
    // argument parameter.
    const lastArgumentsParameter = argumentsParameters[argumentsParameters.length - 1];
    if (lastArgumentsParameter) {
      if (lastArgumentsParameter.name === funcArgParamName) {
        argumentsParameters[argumentsParameters.length - 1] = argumentParameter;
        continue;
      }
    }

    argumentsParameters.push(argumentParameter);
  } // for

  return argumentsParameters;
}

export function getCallVariableNameWithChainFrom(expressionStatementNode: ExpressionStatement) {
  let callVariableName: string | undefined = undefined;
  let callVariableNameStartOffset: number | undefined = undefined;
  let callVariableNameEndOffset: number | undefined = undefined;

  const callMethods: CallMethodType[] = [];

  walk((node, parent) => {
    if (!parent) return;

    if (
      // $myObject->...()->...(|);
      (node.kind === 'call' && parent.kind === 'expressionstatement') ||
      // $myObject->...(|)->...();
      (node.kind === 'call' && parent.kind === 'propertylookup')
    ) {
      let callName: string | undefined = undefined;
      let callNameStartOffset: number | undefined = undefined;
      let callNameEndOffset: number | undefined = undefined;

      const callArguments: CallArgumentsType[] = [];

      const callNode = node as Call;
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        // $myObject
        if (propertyLookupNode.what.kind === 'variable') {
          const variableNode = propertyLookupNode.what as Variable;
          if (typeof variableNode.name === 'string') {
            if (!callVariableName) {
              callVariableName = variableNode.name;
              if (variableNode.loc) {
                callVariableNameStartOffset = variableNode.loc.start.offset;
                callVariableNameEndOffset = variableNode.loc.end.offset;
              }
            }
          }
        }
        // ...->Method
        if (propertyLookupNode.offset.kind === 'identifier') {
          const identifierNode = propertyLookupNode.offset as Identifier;
          callName = identifierNode.name;
          if (identifierNode.loc) {
            callNameStartOffset = identifierNode.loc.start.offset;
            callNameEndOffset = identifierNode.loc.end.offset;
          }
        }
      }

      if (callNode.arguments.length > 0) {
        for (const arg of callNode.arguments) {
          const argumentItem = retrieveCallArgumentTypeItemFromExpression(arg);
          if (argumentItem) {
            if (arg.loc) {
              const argStartOffset = arg.loc.start.offset;
              const argEndOffset = arg.loc.end.offset;

              callArguments.push({
                value: argumentItem,
                startOffset: argStartOffset,
                endOffset: argEndOffset,
              });
            }
          }
        }
      }

      if (!callName) return;

      callMethods.push({
        name: callName,
        startOffset: callNameStartOffset,
        endOffset: callNameEndOffset,
        arguments: callArguments,
      });
    }
  }, expressionStatementNode);

  if (!callVariableName) return;
  if (callMethods.length === 0) return;

  const callVariableNameWithChainMethods: CallKindNameWithChainType = {
    name: callVariableName,
    startOffset: callVariableNameStartOffset,
    endOffset: callVariableNameEndOffset,
    methods: callMethods,
  };

  return callVariableNameWithChainMethods;
}

export function getExpressionStatementNodes(ast: Node) {
  const exprStmtNodes: ExpressionStatement[] = [];

  walk((node) => {
    if (node.kind !== 'expressionstatement') return;
    const expressionStatementNode = node as ExpressionStatement;
    exprStmtNodes.push(expressionStatementNode);
  }, ast);

  return exprStmtNodes;
}

export function getCallStaticLookupNameWithChainFrom(expressionStatementNode: ExpressionStatement) {
  let callStaticLookupName: string | undefined = undefined;
  let callStaticLookupNameStartOffset: number | undefined = undefined;
  let callStaticLookupNameEndOffset: number | undefined = undefined;

  const callMethods: CallMethodType[] = [];

  walk((node, parent) => {
    if (!parent) return;

    if (
      // Route::...()->...(|);
      (node.kind === 'call' && parent.kind === 'expressionstatement') ||
      // Route::...(|)->...();
      (node.kind === 'call' && parent.kind === 'propertylookup')
    ) {
      let callName: string | undefined = undefined;
      let callNameStartOffset: number | undefined = undefined;
      let callNameEndOffset: number | undefined = undefined;

      const callArguments: CallArgumentsType[] = [];

      const callNode = node as Call;
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        if (propertyLookupNode.offset.kind === 'identifier') {
          const identifierNode = propertyLookupNode.offset as Identifier;
          callName = identifierNode.name;
          if (identifierNode.loc) {
            callNameStartOffset = identifierNode.loc.start.offset;
            callNameEndOffset = identifierNode.loc.end.offset;
          }
        }
      }

      // MyStatic::
      if (callNode.what.kind === 'staticlookup') {
        const staticLookupNode = callNode.what as unknown as StaticLookup;
        // MyStatic
        if (staticLookupNode.what.kind === 'name') {
          const nameNode = staticLookupNode.what as Name;
          if (!callStaticLookupName) {
            callStaticLookupName = nameNode.name;
            if (staticLookupNode.loc) {
              callStaticLookupNameStartOffset = staticLookupNode.loc.start.offset;
              callStaticLookupNameEndOffset = staticLookupNode.loc.end.offset;
            }
          }
        }
        // ...::method
        if (staticLookupNode.offset.kind === 'identifier') {
          const identifierNode = staticLookupNode.offset as Identifier;
          callName = identifierNode.name;
          if (identifierNode.loc) {
            callNameStartOffset = identifierNode.loc.start.offset;
            callNameEndOffset = identifierNode.loc.end.offset;
          }
        }
      }

      if (callNode.arguments.length > 0) {
        for (const arg of callNode.arguments) {
          const argumentItem = retrieveCallArgumentTypeItemFromExpression(arg);
          if (argumentItem != null) {
            if (arg.loc) {
              const argStartOffset = arg.loc.start.offset;
              const argEndOffset = arg.loc.end.offset;

              callArguments.push({
                value: argumentItem,
                startOffset: argStartOffset,
                endOffset: argEndOffset,
              });
            }
          }
        }
      }

      if (!callName) return;

      callMethods.push({
        name: callName,
        startOffset: callNameStartOffset,
        endOffset: callNameEndOffset,
        arguments: callArguments,
      });
    }
  }, expressionStatementNode);

  if (!callStaticLookupName) return;
  if (callMethods.length === 0) return;

  const callStaticLookupNameWithChainMethods: CallKindNameWithChainType = {
    name: callStaticLookupName,
    startOffset: callStaticLookupNameStartOffset,
    endOffset: callStaticLookupNameEndOffset,
    methods: callMethods,
  };

  return callStaticLookupNameWithChainMethods;
}

export function getCallNameNameWithChainFrom(expressionStatementNode: ExpressionStatement) {
  let callNameName: string | undefined = undefined;
  let callNameNameStartOffset: number | undefined = undefined;
  let callNameNameEndOffset: number | undefined = undefined;

  const callMethods: CallMethodType[] = [];

  // Arguments of the first function to be called must be stored at the top level
  // e.g. one(|)->...
  const callFunctionArguments: CallArgumentsType[] = [];

  walk((node, parent) => {
    if (!parent) return;

    if (
      (node.kind === 'call' && parent.kind === 'expressionstatement') ||
      (node.kind === 'call' && parent.kind === 'propertylookup')
    ) {
      let callName: string | undefined = undefined;
      let callNameStartOffset: number | undefined = undefined;
      let callNameEndOffset: number | undefined = undefined;

      const callArguments: CallArgumentsType[] = [];

      const callNode = node as Call;
      if (callNode.what.kind === 'propertylookup') {
        const propertyLookupNode = callNode.what as unknown as PropertyLookup;
        if (propertyLookupNode.offset.kind === 'identifier') {
          const identifierNode = propertyLookupNode.offset as Identifier;
          callName = identifierNode.name;
          if (identifierNode.loc) {
            callNameStartOffset = identifierNode.loc.start.offset;
            callNameEndOffset = identifierNode.loc.end.offset;
          }
        }
      }

      // ===
      if (callNode.what.kind === 'name') {
        const nameNode = callNode.what as Name;
        callNameName = nameNode.name;
        if (nameNode.loc) {
          callNameNameStartOffset = nameNode.loc.start.offset;
          callNameNameEndOffset = nameNode.loc.end.offset;
        }

        // ===
        if (callNode.arguments.length > 0) {
          for (const arg of callNode.arguments) {
            const argumentItem = retrieveCallArgumentTypeItemFromExpression(arg);
            if (argumentItem != null) {
              if (arg.loc) {
                const argStartOffset = arg.loc.start.offset;
                const argEndOffset = arg.loc.end.offset;

                callFunctionArguments.push({
                  value: argumentItem,
                  startOffset: argStartOffset,
                  endOffset: argEndOffset,
                });
              }
            }
          }
        }
      }

      if (callNode.arguments.length > 0) {
        for (const arg of callNode.arguments) {
          const argumentItem = retrieveCallArgumentTypeItemFromExpression(arg);
          if (argumentItem != null) {
            if (arg.loc) {
              const argStartOffset = arg.loc.start.offset;
              const argEndOffset = arg.loc.end.offset;

              callArguments.push({
                value: argumentItem,
                startOffset: argStartOffset,
                endOffset: argEndOffset,
              });
            }
          }
        }
      }

      if (!callName) return;

      callMethods.push({
        name: callName,
        startOffset: callNameStartOffset,
        endOffset: callNameEndOffset,
        arguments: callArguments,
      });
    }
  }, expressionStatementNode);

  if (!callNameName) return;
  if (callMethods.length === 0) return;

  const callStaticLookupNameWithChainMethods: CallKindNameWithChainType = {
    name: callNameName,
    startOffset: callNameNameStartOffset,
    endOffset: callNameNameEndOffset,
    methods: callMethods,
    functionArguments: callFunctionArguments,
  };

  return callStaticLookupNameWithChainMethods;
}

function retrieveCallArgumentTypeItemFromExpression(expression: Expression) {
  if (expression.kind === 'string') {
    const stringNode = expression as StringNode;
    return stringNode.value;
  } else if (expression.kind === 'array') {
    const arrayNode = expression as ArrayNode;
    if (arrayNode.items.length === 0) {
      return '[]';
    } else {
      // MEMO
      return '[...]';
    }
  } else if (expression.kind === 'boolean') {
    const booleanNode = expression as BooleanNode;
    return `"${booleanNode.value}"`;
  } else if (expression.kind === 'number') {
    const numberNode = expression as NumberNode;
    return numberNode.value;
  } else if (expression.kind === 'nullkeyword') {
    return 'null';
  } else if (expression.kind === 'name') {
    const nameNode = expression as Name;
    return nameNode.name;
  } else if (expression.kind === 'bin') {
    const binNode = expression as Bin;
    const binValues: string[] = [];
    if (binNode.left.kind === 'name') {
      const nameNode = binNode.left as Name;
      binValues.push(nameNode.name);
    }
    if (binNode.right.kind === 'name') {
      const nameNode = binNode.right as Name;
      binValues.push(nameNode.name);
    }
    if (binValues.length === 1) {
      return binValues[0];
    } else if (binValues.length > 1) {
      let binArgValue = '';
      for (const [i, v] of binValues.entries()) {
        if (i === 0) {
          binArgValue = v;
        } else {
          binArgValue += '|' + v;
        }

        return binArgValue;
      }
    }
  }
}

export function getUseItems(code: string) {
  const items: PHPUseItemType[] = [];

  const ast = getAstByParseCode(code);
  if (!ast) return [];

  walk((node, parent) => {
    if (!parent) return;
    if (parent.kind !== 'usegroup') return;
    const useGroupNode = parent as UseGroup;
    if (!useGroupNode.loc) return;

    let useGroupName: string | undefined = undefined;
    if (useGroupNode.name) {
      useGroupName = useGroupNode.name;
    }

    let useGroupType: string | undefined = undefined;
    if (useGroupNode.type) {
      useGroupType = useGroupNode.type;
    }

    const useGroupStartOffset = useGroupNode.loc.start.offset;
    const useGroupEndOffset = useGroupNode.loc.end.offset;

    if (node.kind !== 'useitem') return;
    const useItemNode = node as UseItem;
    if (!useItemNode.loc) return;
    const useItemName = useItemNode.name;
    const useItemStartOffset = useItemNode.loc.start.offset;
    const useItemEndOffset = useItemNode.loc.end.offset;

    let aliasName: string | undefined = undefined;
    let aliasStartOffset: number | undefined = undefined;
    let aliasEndOffset: number | undefined = undefined;
    if (useItemNode.alias) {
      if (useItemNode.alias.loc) {
        aliasStartOffset = useItemNode.alias.loc.start.offset;
        aliasEndOffset = useItemNode.alias.loc.end.offset;
      }
      if (useItemNode.alias.kind === 'identifier') {
        const identifierNode = useItemNode.alias as Identifier;
        aliasName = identifierNode.name;
      }
    }

    items.push({
      name: useItemName,
      startOffset: useItemStartOffset,
      endOffset: useItemEndOffset,
      aliasName,
      aliasStartOffset,
      aliasEndOffset,
      groupName: useGroupName,
      groupType: useGroupType,
      groupStartOffset: useGroupStartOffset,
      groupEndOffset: useGroupEndOffset,
    });
  }, ast);

  return items;
}
