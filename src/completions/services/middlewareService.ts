import { Node } from 'php-parser';

import * as phpParser from '../../parsers/php/parser';
import { type CallKindNameWithChainType } from '../../parsers/php/parser';

export const getAst = phpParser.getAst;
export const walk = phpParser.walk;
export const stripPHPTag = phpParser.stripPHPTag;
export const canCompletion = phpParser.canCompletion;

export function canCompletionFromContext(ast: Node, editorOffset: number) {
  const flags: boolean[] = [];

  const phpTagLength = '<?php'.length;
  const adjustedOffset = editorOffset - phpTagLength;

  const exprStmtNodes = phpParser.getExpressionStatementNodes(ast);
  if (exprStmtNodes.length === 0) return;

  const callStaticLookupWithChainMethods: CallKindNameWithChainType[] = [];
  for (const e of exprStmtNodes) {
    const res = phpParser.getCallStaticLookupNameWithChainFrom(e);
    if (res) callStaticLookupWithChainMethods.push(res);
  }

  for (const c of callStaticLookupWithChainMethods) {
    if (c.name !== 'Route') continue;
    if (c.methods.length === 0) continue;
    for (const m of c.methods) {
      if (m.name !== 'middleware') continue;
      if (m.arguments.length > 0) {
        if (m.arguments[0].startOffset && m.arguments[0].endOffset) {
          if (m.arguments[0].startOffset <= editorOffset && m.arguments[0].endOffset >= editorOffset) {
            flags.push(true);
          }
        }
      } else {
        if (m.startOffset && m.endOffset) {
          if (m.startOffset <= adjustedOffset && m.endOffset >= adjustedOffset) {
            flags.push(true);
          }
        }
      }
    }
  }

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}
