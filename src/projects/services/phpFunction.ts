import path from 'path';

import {
  Array as ArrayNode,
  Bin,
  Boolean as BooleanNode,
  Entry,
  Function as FunctionNode,
  Identifier,
  Name as NameNode,
  Number as NumberNode,
  Parameter as ParameterNode,
  Return,
  StaticLookup,
  String as StringNode,
  TypeReference,
  Unary,
  UnionType,
} from 'php-parser';

import * as phpParser from '../../parsers/php/parser';

import { ArgumentParameterType, PHPFunctionType } from '../types';

export function getAbusoluteAutoloadFunctionFilesFromCode(code: string, rootDir: string) {
  const files: string[] = [];

  const ast = phpParser.getAst(code);
  if (!ast) return [];

  phpParser.walk((node) => {
    if (node.kind !== 'return') return;
    const returnNode = node as Return;
    if (!returnNode.expr) return;
    if (returnNode.expr.kind !== 'array') return;
    const arrayNode = returnNode.expr as ArrayNode;
    if (arrayNode.items.length === 0) return;
    for (const item of arrayNode.items) {
      if (item.kind !== 'entry') continue;
      const entryNode = item as Entry;
      if (entryNode.value.kind !== 'bin') continue;
      const binNode = entryNode.value as Bin;
      if (binNode.right.kind !== 'string') continue;
      const stringNode = binNode.right as StringNode;
      files.push(stringNode.value);
    }
  }, ast);

  if (files.length === 0) return [];
  const abusoluteFiles = files.map((f) => path.join(rootDir, 'vendor', f.replace(/^\//, '')));

  return abusoluteFiles;
}

export function getPHPFunctions(code: string, filePath: string) {
  const phpFunctions: PHPFunctionType[] = [];

  const ast = phpParser.getAst(code);
  if (!ast) return;

  phpParser.walk((node) => {
    if (node.kind !== 'function') return;
    const functionNode = node as FunctionNode;

    if (typeof functionNode.name !== 'object') return;
    const identifierNode = functionNode.name as Identifier;
    const phpFunctionName = identifierNode.name;

    const phpFunction: PHPFunctionType = {
      name: phpFunctionName,
      path: filePath,
    };

    const argumentsParameters: ArgumentParameterType[] = [];

    if (functionNode.arguments.length > 0) {
      for (const arg of functionNode.arguments) {
        if (arg.kind !== 'parameter') continue;

        const parameterNode = arg as ParameterNode;

        let parameterTypeHint: string | undefined = undefined;
        if (parameterNode.type) {
          if (parameterNode.type.kind === 'typereference') {
            const typereferenceNode = parameterNode.type as TypeReference;
            parameterTypeHint = typereferenceNode.name;
          } else if (parameterNode.type.kind === 'name') {
            const nameNode = parameterNode.type as NameNode;
            parameterTypeHint = nameNode.name;
          } else if (parameterNode.type.kind === 'uniontype') {
            const unionTypeNode = parameterNode.type as UnionType;
            for (const uType of unionTypeNode.types) {
              if (uType.kind === 'typereference') {
                const typereferenceNode = uType as TypeReference;
                if (parameterTypeHint) {
                  parameterTypeHint + parameterTypeHint + '|';
                }
                parameterTypeHint = typereferenceNode.name;
              } else if (uType.kind === 'name') {
                const nameNode = uType as NameNode;
                if (parameterTypeHint) {
                  parameterTypeHint + parameterTypeHint + '|';
                }
                parameterTypeHint = nameNode.name;
              }
            }
          }
        }

        if (typeof parameterNode.name !== 'object') continue;
        const identifierNode = parameterNode.name as Identifier;
        const funcArgParamName = identifierNode.name;

        let funcArgParamValue: string | number | boolean | any[] | null | undefined = undefined;
        if (arg.value) {
          if (arg.value.kind === 'array') {
            const arrayNode = arg.value as ArrayNode;
            if (arrayNode.items.length === 0) {
              // e.g. $parameters = []
              // MEMO: Sets '[]' as a string
              funcArgParamValue = '[]';
            } else {
              funcArgParamValue = arrayNode.items;
            }
          } else if (arg.value.kind === 'boolean') {
            const booleanNode = arg.value as BooleanNode;
            funcArgParamValue = booleanNode.value;
          } else if (arg.value.kind === 'string') {
            const stringNode = arg.value as StringNode;
            funcArgParamValue = stringNode.raw;
          } else if (arg.value.kind === 'number') {
            const numberNode = arg.value as NumberNode;
            funcArgParamValue = numberNode.value;
          } else if (arg.value.kind === 'nullkeyword') {
            // e.g. ($idna_info = null)
            // MEMO: Sets null as a string
            funcArgParamValue = 'null';
          } else if (arg.value.kind === 'staticlookup') {
            // e.g. ($form = p\Normalizer::FORM_C)
            const staticLookupNode = arg.value as StaticLookup;
            if (staticLookupNode.what.kind === 'name') {
              const nameNode = staticLookupNode.what as NameNode;
              funcArgParamValue = nameNode.name;
            }
            if (staticLookupNode.offset) {
              // e.g. (int $options = OutputInterface::OUTPUT_NORMAL)
              if (typeof staticLookupNode.offset === 'object') {
                const identifierNode = staticLookupNode.offset as Identifier;
                funcArgParamValue = funcArgParamValue + '::' + identifierNode.name;
              }
            }
          } else if (arg.value.kind === 'name') {
            // e.g. ($variant = \INTL_IDNA_VARIANT_2003)
            const nameNode = arg.value as NameNode;
            funcArgParamValue = nameNode.name;
          } else if (arg.value.kind === 'bin') {
            const binNode = arg.value as Bin;
            const binValues: string[] = [];
            if (binNode.left.kind === 'name') {
              const nameNode = binNode.left as NameNode;
              binValues.push(nameNode.name);
            }
            if (binNode.right.kind === 'name') {
              const nameNode = binNode.right as NameNode;
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
          } else if (arg.value.kind === 'unary') {
            // e.g. (int $port = -1)
            const unaryNode = arg.value as Unary;
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
          byref: parameterNode.byref,
          nullable: parameterNode.nullable,
          variadic: parameterNode.variadic,
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
      }
    }

    phpFunction.arguments = argumentsParameters;
    phpFunctions.push(phpFunction);
  }, ast);

  return phpFunctions;
}
