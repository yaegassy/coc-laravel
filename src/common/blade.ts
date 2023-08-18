import { Assign, Boolean as BooleanNode, Variable } from 'php-parser';
import { BladeDocument } from 'stillat-blade-parser/out/document/bladeDocument';
import { DirectiveNode, InlinePhpNode, BladeEchoNode, BladeComponentNode } from 'stillat-blade-parser/out/nodes/nodes';

import * as phpParser from '../parsers/php/parser';
import * as bladeParser from '../parsers/blade/parser';
import { PHPRelatedBladeNodeType, PHPVariableItemType } from './types';

interface EditorPosition {
  line: number;
  character: number;
}

export function getVariableItemsWithBladeRangeOffsetsFromBladeDoc(
  bladeDoc: BladeDocument,
  bladeNodeTypeString: PHPRelatedBladeNodeType
) {
  const items: PHPVariableItemType[] = [];

  for (const bladeNode of bladeDoc.getAllNodes()) {
    let bladeStartOffset: number | undefined = undefined;
    let bladeEndOffset: number | undefined = undefined;
    let phpCode: string | undefined = undefined;

    if (bladeNodeTypeString === 'inlinePhp') {
      if (!(bladeNode instanceof InlinePhpNode)) continue;
      if (bladeNode.startPosition && !bladeNode.endPosition) continue;
      bladeStartOffset = bladeNode.startPosition?.offset;
      bladeEndOffset = bladeNode.endPosition?.offset;
      phpCode = bladeNode.sourceContent;
    } else if (bladeNodeTypeString === 'phpDirective') {
      if (!(bladeNode instanceof DirectiveNode)) continue;
      if (!bladeNode.startPosition && !bladeNode.endPosition) continue;

      const endPhpDirectiveNode = bladeNode.getFinalClosingDirective();
      if (endPhpDirectiveNode.directiveName === 'endphp') {
        if (bladeNode.directiveName === 'endphp') continue;
        if (!endPhpDirectiveNode.offset?.end) continue;

        bladeStartOffset = bladeNode.offset?.start;
        bladeEndOffset = endPhpDirectiveNode.offset.end;
        phpCode = '<?php' + bladeNode.innerContent;
      } else if (endPhpDirectiveNode.directiveName === 'php') {
        bladeStartOffset = bladeNode.startPosition?.offset;
        bladeEndOffset = bladeNode.endPosition?.offset;
        phpCode = '<?php ' + bladeNode.getPhpContent();
      }
    }

    if (bladeStartOffset == null) continue;
    if (!bladeEndOffset) continue;
    if (!phpCode) continue;

    const phpAst = phpParser.getAstByParseCode(phpCode);
    if (!phpAst) continue;

    phpParser.walk((phpNode, parent) => {
      if (!parent) return;
      if (parent.kind !== 'expressionstatement') return;
      if (phpNode.kind !== 'assign') return;
      const assignNode = phpNode as Assign;

      if (assignNode.left.kind !== 'variable') return;
      const variableNode = assignNode.left as Variable;

      if (typeof variableNode.name !== 'string') return;
      if (!variableNode.loc) return;

      let variableType: string | undefined = undefined;
      if (assignNode.right.kind === 'string') {
        variableType = 'string';
      } else if (assignNode.right.kind === 'boolean') {
        const valueBooleanNode = assignNode.right as BooleanNode;
        variableType = String(valueBooleanNode.value);
      } else if (assignNode.right.kind === 'number') {
        variableType = 'int';
      } else if (assignNode.right.kind === 'nullkeyword') {
        variableType = 'null';
      } else if (assignNode.right.kind === 'array') {
        variableType = 'array';
      } else if (assignNode.right.kind === 'call') {
        variableType = 'call';
      } else if (assignNode.right.kind === 'new') {
        variableType = 'new';
      } else if (assignNode.right.kind === 'variable') {
        variableType = 'variable';
      } else {
        variableType = 'object';
      }

      items.push({
        name: variableNode.name,
        type: variableType,
        start: variableNode.loc.start.offset,
        end: variableNode.loc.end.offset,
        bladeNodeStart: bladeStartOffset,
        bladeNodeEnd: bladeEndOffset,
        bladeNodeType: bladeNodeTypeString,
      });
    }, phpAst);
  }

  return items;
}

export function getAdjustOffsetAtBladeNodeTypeString(bladeNodeTypeString: PHPRelatedBladeNodeType) {
  let adjustOffset: number;

  switch (bladeNodeTypeString) {
    case 'inlinePhp':
      adjustOffset = 0;
      break;

    case 'phpDirective':
      adjustOffset = -1;
      break;

    default:
      adjustOffset = 0;
      break;
  }

  return adjustOffset;
}

export function getVariableItemsFromEditorOffset(phpVariableItems: PHPVariableItemType[], editorOffset: number) {
  const items: { name: string; type: string }[] = [];

  for (const v of phpVariableItems) {
    if (!v.bladeNodeType) continue;
    if (v.bladeNodeStart == null) continue;

    const adjustOffset = getAdjustOffsetAtBladeNodeTypeString(v.bladeNodeType);
    if (adjustOffset == null) continue;

    const realEndOffset = v.end + v.bladeNodeStart + adjustOffset;

    if (realEndOffset <= editorOffset) {
      items.push({
        name: v.name,
        type: v.type,
      });
    }
  }

  return items;
}

export function generateVirtualPhpEvalCode(code: string) {
  let virtualPhpCode: string = '';

  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return;

  for (const bladeNode of bladeDoc.getAllNodes()) {
    if (bladeNode instanceof InlinePhpNode) {
      virtualPhpCode += phpParser.stripPHPTag(bladeNode.sourceContent);
    } else if (bladeNode instanceof DirectiveNode) {
      const endPhpDirectiveNode = bladeNode.getFinalClosingDirective();
      if (endPhpDirectiveNode.directiveName === 'endphp') {
        if (bladeNode.directiveName === 'endphp') continue;
        virtualPhpCode += bladeNode.innerContent + '\n';
      } else if (endPhpDirectiveNode.directiveName === 'php') {
        virtualPhpCode += bladeNode.getPhpContent().replace(/^\(/, '').replace(/\)$/, ';') + '\n';
      }
    }
  }

  return virtualPhpCode;
}

export function isEditorPositionInComponentRegion(code: string, editorPostion: EditorPosition) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return undefined;

  const flags: boolean[] = [];

  bladeDoc.getAllNodes().forEach((node) => {
    if (node instanceof BladeComponentNode) {
      if (node.startPosition && node.endPosition) {
        if (
          node.startPosition.line - 1 <= editorPostion.line &&
          node.startPosition.char - 1 <= editorPostion.character &&
          node.endPosition.line - 1 >= editorPostion.line &&
          node.endPosition.char - 1 >= editorPostion.character
        ) {
          flags.push(true);
        }
      }
    }
  });

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}

export async function isEditorOffsetInBladePhpRelatedRegion(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const flags: boolean[] = [];
  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeEchoNode) {
      if (!node.startPosition) continue;
      if (!node.endPosition) continue;
      const startOffset = node.startPosition.offset;
      const endOffset = node.endPosition.offset;

      flags.push(isOffsetInRange(editorOffset, startOffset, endOffset));
    } else if (node instanceof DirectiveNode) {
      if (node.directiveName === 'php') {
        const endPhpDirectiveNode = node.getFinalClosingDirective();
        if (endPhpDirectiveNode.directiveName === 'endphp') {
          if (!node.offset) continue;
          if (!endPhpDirectiveNode.offset?.end) continue;
          const startOffset = node.offset.start;
          const endOffset = endPhpDirectiveNode.offset.end;

          flags.push(isOffsetInRange(editorOffset, startOffset, endOffset));
        } else if (endPhpDirectiveNode.directiveName === 'php') {
          if (!node.offset) continue;
          const startOffset = node.offset.start;
          const endOffset = node.offset.end;

          flags.push(isOffsetInRange(editorOffset, startOffset, endOffset));
        }
      } else if (
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
        if (!node.directiveParametersPosition.end?.offset) continue;
        const startOffset = node.directiveParametersPosition.start.offset;
        const endOffset = node.directiveParametersPosition.end.offset;

        flags.push(isOffsetInRange(editorOffset, startOffset, endOffset));
      }
    } else if (node instanceof InlinePhpNode) {
      if (!node.startPosition) continue;
      if (!node.endPosition) continue;
      const startOffset = node.startPosition.offset;
      const endOffset = node.endPosition.offset;

      flags.push(isOffsetInRange(editorOffset, startOffset, endOffset));
    } else if (node instanceof BladeComponentNode) {
      if (!node.hasParameters) continue;
      for (const parameter of node.parameters) {
        if (!parameter.isExpression) continue;
        if (!parameter.valuePosition) continue;
        if (!parameter.valuePosition.start?.offset) continue;
        if (!parameter.valuePosition.end?.offset) continue;
        const startOffset = parameter.valuePosition.start.offset;
        const endOffset = parameter.valuePosition.end.offset;

        flags.push(isOffsetInRange(editorOffset, startOffset, endOffset));
      }
    }
  }

  if (flags.includes(true)) return true;
  return false;
}

function isOffsetInRange(offset: number, startOffset: number, endOffset: number) {
  if (startOffset <= offset && endOffset >= offset) {
    return true;
  }
  return false;
}
