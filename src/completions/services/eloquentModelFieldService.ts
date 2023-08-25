import * as phpParser from '../../parsers/php/parser';
import { type CallKindNameWithChainType } from '../../parsers/php/parser';

export function getCompletionSymbolName(code: string, editorOffset: number, callStaticSymbols: string[]) {
  let symbolName: string | undefined = undefined;

  const ast = phpParser.getAstByParseCode(code);
  if (!ast) return;

  const exprStmtNodes = phpParser.getExpressionStatementNodes(ast);
  if (exprStmtNodes.length === 0) return;

  const callStaticLookupWithChainMethods: CallKindNameWithChainType[] = [];
  for (const e of exprStmtNodes) {
    const res = phpParser.getCallStaticLookupNameWithChainFrom(e);
    if (res) callStaticLookupWithChainMethods.push(res);
  }

  for (const c of callStaticLookupWithChainMethods) {
    if (symbolName) break;

    if (!callStaticSymbols.includes(c.name)) continue;
    if (c.methods.length === 0) continue;
    for (const m of c.methods) {
      if (m.name !== 'where') continue;

      if (m.arguments.length > 0) {
        if (m.arguments[0].startOffset && m.arguments[0].endOffset) {
          if (m.arguments[0].startOffset <= editorOffset && m.arguments[0].endOffset >= editorOffset) {
            symbolName = c.name;
            break;
          }
        }
      }
    }
  }

  if (symbolName) {
    symbolName = symbolName.replace(/^\\/, '');
  }

  return symbolName;
}
