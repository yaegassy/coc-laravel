import fs from 'fs';
import { Call, Name, String as StringNode } from 'php-parser';

import * as phpParser from '../../parsers/php/parser';
import { CallViewFunctionType, ViewReferenceMapValueType } from '../types';

export async function getViewReferenceMapValue(file: string) {
  const code = await fs.promises.readFile(file, { encoding: 'utf8' });
  const ast = phpParser.getAst(code);

  const callViewFuncs: CallViewFunctionType[] = [];

  phpParser.walk((node) => {
    if (node.kind !== 'call') return;

    const callNode = node as Call;
    if (!callNode.loc) return;
    if (callNode.what.kind !== 'name') return;

    const nameNode = callNode.what as Name;
    if (nameNode.name !== 'view') return;
    if (callNode.arguments.length === 0) return;
    if (callNode.arguments[0].kind !== 'string') return;
    const stringNode = callNode.arguments[0] as StringNode;

    const value = stringNode.value;

    callViewFuncs.push({
      value,
      range: {
        start: {
          line: callNode.loc.start.line - 1,
          character: callNode.loc.start.column,
        },
        end: {
          line: callNode.loc.end.line - 1,
          character: callNode.loc.end.column,
        },
      },
    });
  }, ast);

  if (callViewFuncs.length >= 1) {
    const referenceMapValue: ViewReferenceMapValueType = {
      path: file,
      callViewFunctions: callViewFuncs,
    };

    return referenceMapValue;
  }

  return undefined;
}
