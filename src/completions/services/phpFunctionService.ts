import { BladeComponentNode, BladeEchoNode, DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';
import * as bladeParser from '../../parsers/blade/parser';
import { RangeOffset } from '../types';

export function canCompletionFromPHPRegionInBlade(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return undefined;

  const flags: boolean[] = [];

  flags.push(isBladeEchoRegion(code, editorOffset));
  flags.push(isPHPDirectiveRegion(code, editorOffset));
  flags.push(isDirectiveWithParametersRegion(code, editorOffset));
  flags.push(isComponentPropsRegion(code, editorOffset));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}

function isBladeEchoRegion(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeEchoNode) {
      if (!node.offset) continue;
      const rangeOffsets: RangeOffset[] = [
        {
          start: node.offset.start,
          end: node.offset.end,
        },
      ];

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

function isPHPDirectiveRegion(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof DirectiveNode) {
      if (node.directiveName !== 'php') continue;
      if (!node.offset) continue;
      const endPhpDirectiveNode = node.getFinalClosingDirective();
      if (endPhpDirectiveNode.directiveName === 'endphp') {
        if (!endPhpDirectiveNode.offset?.end) continue;

        const rangeOffsets: RangeOffset[] = [
          {
            start: node.offset.start,
            end: endPhpDirectiveNode.offset.end,
          },
        ];

        rangeOffsetsAll.push(...rangeOffsets);
      } else if (endPhpDirectiveNode.directiveName === 'php') {
        const rangeOffsets: RangeOffset[] = [
          {
            start: node.offset.start,
            end: node.offset.end,
          },
        ];

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

function isDirectiveWithParametersRegion(code: string, editorOffset: number) {
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
        if (!node.directiveParametersPosition.end?.offset) continue;

        const rangeOffsets: RangeOffset[] = [
          {
            start: node.directiveParametersPosition.start.offset,
            end: node.directiveParametersPosition.end.offset,
          },
        ];

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

function isComponentPropsRegion(code: string, editorOffset: number) {
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
        if (!parameter.valuePosition.end?.offset) continue;

        const rangeOffsets: RangeOffset[] = [
          {
            start: parameter.valuePosition.start.offset,
            end: parameter.valuePosition.end.offset,
          },
        ];

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

export function canCompletionFromContextWord(word: string) {
  if (
    word.startsWith('"') ||
    word.startsWith("'") ||
    word.startsWith('>') ||
    word.startsWith('-') ||
    word.startsWith(':')
  ) {
    return false;
  }

  return true;
}
