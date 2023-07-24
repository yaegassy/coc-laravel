import { Call, Name, Node } from 'php-parser';
import { BladeComponentNode, BladeEchoNode, DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';

import * as bladeParser from '../parsers/blade/parser';
import * as phpParser from '../parsers/php/parser';
import { RangeOffset } from './types';

export function isCallNameFuncInBladeEchoFromOffset(code: string, editorOffset: number, callName: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeEchoNode) {
      if (!node.offset) continue;

      const phpCode = node.content;
      const phpAst = phpParser.getAst(phpCode);
      if (!phpAst) continue;

      const rangeOffsets = getRangeOfsetsFromPHPParserByCallName(phpAst, node.offset.start + 2, callName);
      rangeOffsetsAll.push(...rangeOffsets);
    }
  }

  for (const rangeOffset of rangeOffsetsAll) {
    if (rangeOffset.start <= editorOffset && rangeOffset.end >= editorOffset) {
      return true;
    }
  }

  return false;
}

export function isCallNameFuncInPHPDirectiveFromOffset(code: string, editorOffset: number, callName: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof DirectiveNode) {
      if (node.directiveName !== 'php') continue;
      if (!node.offset) continue;
      const endPhpDirectiveNode = node.getFinalClosingDirective();
      if (endPhpDirectiveNode.directiveName === 'endphp') {
        const phpCode = node.documentContent;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const rangeOffsets = getRangeOfsetsFromPHPParserByCallName(phpAst, node.offset.start + 4, callName);
        rangeOffsetsAll.push(...rangeOffsets);
      } else if (endPhpDirectiveNode.directiveName === 'php') {
        if (!node.directiveParametersPosition?.start?.offset) continue;

        const phpCode = node.directiveParameters;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const rangeOffsets = getRangeOfsetsFromPHPParserByCallName(
          phpAst,
          node.directiveParametersPosition.start.offset,
          callName
        );
        rangeOffsetsAll.push(...rangeOffsets);
      }
    }
  }

  for (const rangeOffset of rangeOffsetsAll) {
    if (rangeOffset.start <= editorOffset && rangeOffset.end >= editorOffset) {
      return true;
    }
  }

  return false;
}

export function isCallNameFuncInDirectiveWithParametersFromOffset(
  code: string,
  editorOffset: number,
  callName: string
) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof DirectiveNode) {
      if (
        node.directiveName === 'if' ||
        node.directiveName === 'elseif' ||
        node.directiveName === 'unless' ||
        node.directiveName === 'isset' ||
        node.directiveName === 'empty' ||
        node.directiveName === 'switch' ||
        node.directiveName === 'for' ||
        node.directiveName === 'foreach' ||
        node.directiveName === 'forelse' ||
        node.directiveName === 'while' ||
        node.directiveName === 'continue' ||
        node.directiveName === 'break' ||
        node.directiveName === 'checked' ||
        node.directiveName === 'selected' ||
        node.directiveName === 'disabled' ||
        node.directiveName === 'readonly' ||
        node.directiveName === 'required'
      ) {
        if (!node.directiveParametersPosition) continue;
        if (!node.directiveParametersPosition.start?.offset) continue;

        const phpCode = node.directiveParameters;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const rangeOffsets = getRangeOfsetsFromPHPParserByCallName(
          phpAst,
          node.directiveParametersPosition.start.offset,
          callName
        );
        rangeOffsetsAll.push(...rangeOffsets);
      }
    }
  }

  for (const rangeOffset of rangeOffsetsAll) {
    if (rangeOffset.start <= editorOffset && rangeOffset.end >= editorOffset) {
      return true;
    }
  }

  return false;
}

export function isCallNameFuncInComponentPropsFromOffset(code: string, editorOffset: number, callName: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeComponentNode) {
      if (!node.hasParameters) continue;
      for (const parameter of node.parameters) {
        if (!parameter.isExpression) continue;
        if (!parameter.valuePosition) continue;
        if (!parameter.valuePosition.start?.offset) continue;

        const phpCode = parameter.value;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const rangeOffsets = getRangeOfsetsFromPHPParserByCallName(
          phpAst,
          parameter.valuePosition.start.offset,
          callName
        );

        rangeOffsetsAll.push(...rangeOffsets);
      }
    }
  }

  for (const rangeOffset of rangeOffsetsAll) {
    if (rangeOffset.start <= editorOffset && rangeOffset.end >= editorOffset) {
      return true;
    }
  }

  return false;
}

function getRangeOfsetsFromPHPParserByCallName(ast: Node, adjustOffset: number, callName: string) {
  const rangeOffsets: RangeOffset[] = [];

  phpParser.walk((node) => {
    if (node.kind === 'call') {
      const callNode = node as Call;
      if (callNode.what.kind === 'name') {
        const nameNode = callNode.what as Name;
        if (nameNode.name === callName) {
          if (callNode.arguments.length >= 1) {
            if (callNode.arguments[0].loc) {
              const rangeOffset: RangeOffset = {
                start: callNode.arguments[0].loc.start.offset + adjustOffset,
                end: callNode.arguments[0].loc.end.offset + adjustOffset,
              };

              rangeOffsets.push(rangeOffset);
            }
          }
        }
      }
    }
  }, ast);
  return rangeOffsets;
}
