import { Assign, Boolean as BooleanNode, Variable } from 'php-parser';
import { BladeDocument } from 'stillat-blade-parser/out/document/bladeDocument';
import { DirectiveNode, InlinePhpNode } from 'stillat-blade-parser/out/nodes/nodes';

import * as phpParser from '../parsers/php/parser';
import * as bladeParser from '../parsers/blade/parser';
import { PhpRelatedBladeNodeType, PhpVariableItemType } from './types';

export function getVariableItemsWithBladeRangeOffsetsFromBladeDoc(
  bladeDoc: BladeDocument,
  bladeNodeTypeString: PhpRelatedBladeNodeType
) {
  const items: PhpVariableItemType[] = [];

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

    if (!bladeStartOffset) continue;
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

export function getAdjustOffsetAtBladeNodeTypeString(bladeNodeTypeString: PhpRelatedBladeNodeType) {
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

export function getVariableItemsFromEditorOffset(phpVariableItems: PhpVariableItemType[], editorOffset: number) {
  const items: { name: string; type: string }[] = [];

  for (const v of phpVariableItems) {
    if (!v.bladeNodeType) continue;
    if (!v.bladeNodeStart) continue;

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
