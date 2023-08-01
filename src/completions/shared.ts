import { Call, Identifier, Name, Node, StaticLookup } from 'php-parser';
import { BladeComponentNode, BladeEchoNode, DirectiveNode, InlinePhpNode } from 'stillat-blade-parser/out/nodes/nodes';

import * as bladeParser from '../parsers/blade/parser';
import * as phpParser from '../parsers/php/parser';
import { BladeWithPhpNodesRange, RangeOffset } from './types';

//
// Can php function comletion related
//

export function isEditorOffsetInBladeEchoRegionOfPhpNodeKind(code: string, editorOffset: number, phpNodeKind: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPhpNodesRange[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeEchoNode) {
      if (!node.offset) continue;

      // blade echo
      const phpCode = 'echo ' + node.content;
      const phpAst = phpParser.getAst(phpCode);
      if (!phpAst) continue;

      const phpNodes: Node[] = [];
      phpParser.walk((node) => {
        if (node.kind === phpNodeKind) {
          phpNodes.push(node);
        }
      }, phpAst);

      const contextRange: BladeWithPhpNodesRange = {
        startOffset: node.offset.start,
        endOffset: node.offset.end,
        phpNodes: phpNodes,
      };

      contextRanges.push(contextRange);
    }
  }

  // `{{` character count is 2
  // `{{` converted to `echo `, so the number of 5 characters including spaces.
  // 5 - 2 = 3
  const subAdjustOffset = 3;

  for (const contextRange of contextRanges) {
    if (contextRange.startOffset <= editorOffset && contextRange.endOffset >= editorOffset) {
      for (const nameNode of contextRange.phpNodes) {
        if (!nameNode.loc) continue;
        if (
          nameNode.loc.start.offset - subAdjustOffset + contextRange.startOffset <= editorOffset &&
          nameNode.loc.end.offset - subAdjustOffset + contextRange.startOffset >= editorOffset
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isEditorOffsetInPHPDirectiveRegionOfPhpNodeKind(
  code: string,
  editorOffset: number,
  phpNodeKind: string
) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPhpNodesRange[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof DirectiveNode) {
      if (node.directiveName !== 'php') continue;
      if (!node.offset) continue;
      const endPhpDirectiveNode = node.getFinalClosingDirective();
      if (endPhpDirectiveNode.directiveName === 'endphp') {
        if (!endPhpDirectiveNode.offset?.end) continue;

        const phpCode = node.documentContent;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const phpNodes: Node[] = [];
        phpParser.walk((node) => {
          if (node.kind === phpNodeKind) {
            phpNodes.push(node);
          }
        }, phpAst);

        const contextRange: BladeWithPhpNodesRange = {
          startOffset: node.offset.start,
          endOffset: endPhpDirectiveNode.offset.end,
          phpNodes: phpNodes,
        };

        contextRanges.push(contextRange);
      } else if (endPhpDirectiveNode.directiveName === 'php') {
        const phpCode = node.getInnerContent();
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const phpNodes: Node[] = [];
        phpParser.walk((node) => {
          if (node.kind === phpNodeKind) {
            phpNodes.push(node);
          }
        }, phpAst);

        const contextRange: BladeWithPhpNodesRange = {
          startOffset: node.offset.start,
          endOffset: node.offset.end,
          phpNodes: phpNodes,
        };

        contextRanges.push(contextRange);
      }
    }
  }

  // Number of `@php `, `@php(` characters is 5
  const addAdjustOffset = 5;

  for (const contextRange of contextRanges) {
    if (contextRange.startOffset <= editorOffset && contextRange.endOffset >= editorOffset) {
      for (const nameNode of contextRange.phpNodes) {
        if (!nameNode.loc) continue;
        if (
          nameNode.loc.start.offset + addAdjustOffset + contextRange.startOffset <= editorOffset &&
          nameNode.loc.end.offset + addAdjustOffset + contextRange.startOffset >= editorOffset
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isEditorOffsetInInlinePHPRegionOfPhpNodeKind(code: string, editorOffset: number, phpNodeKind: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPhpNodesRange[] = [];

  let addAdjustOffset = 0;

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof InlinePhpNode) {
      if (!node.startPosition) continue;
      if (!node.endPosition) continue;

      const phpCode = node.sourceContent;

      if (phpCode.startsWith('<?php')) {
        // Number of `<?php ` characters is 6
        addAdjustOffset = 6;
        // Number of `<?= ` characters is 4
      } else if (phpCode.startsWith('<?=')) {
        addAdjustOffset = 4;
      }

      const phpAst = phpParser.getAst(phpCode);
      if (!phpAst) continue;

      const phpNodes: Node[] = [];
      phpParser.walk((node) => {
        if (node.kind === phpNodeKind) {
          phpNodes.push(node);
        }
      }, phpAst);

      const contextRange: BladeWithPhpNodesRange = {
        startOffset: node.startPosition.offset,
        endOffset: node.endPosition.offset,
        phpNodes: phpNodes,
      };

      contextRanges.push(contextRange);
    }
  }

  for (const contextRange of contextRanges) {
    if (contextRange.startOffset <= editorOffset && contextRange.endOffset >= editorOffset) {
      for (const nameNode of contextRange.phpNodes) {
        if (!nameNode.loc) continue;
        if (
          nameNode.loc.start.offset + addAdjustOffset + contextRange.startOffset <= editorOffset &&
          nameNode.loc.end.offset + addAdjustOffset + contextRange.startOffset >= editorOffset
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isEditorOffsetInDirectiveWithParametersRegionOfPhpNodeKind(
  code: string,
  editorOffset: number,
  phpNodeKind: string
) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPhpNodesRange[] = [];

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

        const phpCode = node.directiveParameters.replace(/^\(/, '').replace(/\)$/, '');

        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const phpNodes: Node[] = [];
        phpParser.walk((node) => {
          if (node.kind === phpNodeKind) {
            phpNodes.push(node);
          }
        }, phpAst);

        const contextRange: BladeWithPhpNodesRange = {
          startOffset: node.directiveParametersPosition.start.offset,
          endOffset: node.directiveParametersPosition.end.offset,
          phpNodes: phpNodes,
        };

        contextRanges.push(contextRange);
      }
    }
  }

  // The string that can be retrieved with the directive parameter contains ()
  // .
  // Removed unnecessary () to parse with php-parser. Therefore, adjust
  // the first character of `(`.
  const addAdjustOffset = 1;

  for (const contextRange of contextRanges) {
    if (contextRange.startOffset <= editorOffset && contextRange.endOffset >= editorOffset) {
      for (const nameNode of contextRange.phpNodes) {
        if (!nameNode.loc) continue;
        if (
          nameNode.loc.start.offset + addAdjustOffset + contextRange.startOffset <= editorOffset &&
          nameNode.loc.end.offset + addAdjustOffset + contextRange.startOffset >= editorOffset
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isEditorOffsetInPropsValueRegionOfPhpNodeKind(code: string, editorOffset: number, phpNodeKind: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPhpNodesRange[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeComponentNode) {
      if (!node.hasParameters) continue;
      for (const parameter of node.parameters) {
        // case :xxxx is true
        if (!parameter.isExpression) continue;
        if (!parameter.valuePosition) continue;
        if (!parameter.valuePosition.start?.offset) continue;
        if (!parameter.valuePosition.end?.offset) continue;

        const phpCode = parameter.value;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const phpNodes: Node[] = [];
        phpParser.walk((node) => {
          if (node.kind === phpNodeKind) {
            phpNodes.push(node);
          }
        }, phpAst);

        const contextRange: BladeWithPhpNodesRange = {
          startOffset: parameter.valuePosition.start.offset,
          endOffset: parameter.valuePosition.end.offset,
          phpNodes: phpNodes,
        };

        contextRanges.push(contextRange);
      }
    }
  }

  // `:` + `=`
  const addAdjustOffset = 2;

  for (const contextRange of contextRanges) {
    if (contextRange.startOffset <= editorOffset && contextRange.endOffset >= editorOffset) {
      for (const nameNode of contextRange.phpNodes) {
        if (!nameNode.loc) continue;
        if (
          nameNode.loc.start.offset + addAdjustOffset + contextRange.startOffset <= editorOffset &&
          nameNode.loc.end.offset + addAdjustOffset + contextRange.startOffset >= editorOffset
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

//
// Region
//

export function isBladeEchoRegionByOffset(code: string, editorOffset: number) {
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

export function isPHPDirectiveRegionByOffset(code: string, editorOffset: number) {
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

export function isInlinePHPRegionByOffset(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof InlinePhpNode) {
      if (!node.startPosition) continue;
      if (!node.endPosition) continue;

      const rangeOffsets: RangeOffset[] = [
        {
          start: node.startPosition.offset,
          end: node.endPosition.offset,
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

export function isDirectiveWithParametersRegionByOffset(code: string, editorOffset: number) {
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

export function isComponentPropsValueRegionByOffset(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeComponentNode) {
      if (!node.hasParameters) continue;
      for (const parameter of node.parameters) {
        // case :xxxx is true
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

//
// isCallNameFunc...
//

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

export function isCallNameFuncInInlinePHPFromOffset(code: string, editorOffset: number, callName: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof InlinePhpNode) {
      if (!node.startPosition) continue;

      const phpCode = node.sourceContent;
      const phpAst = phpParser.getAst(phpCode);
      if (!phpAst) continue;

      let adjustOffset = 0;
      if (node.sourceContent.startsWith('<?php')) {
        adjustOffset = 5;
      } else if (node.sourceContent.startsWith('<?=')) {
        adjustOffset = 3;
      }

      const rangeOffsets = getRangeOfsetsFromPHPParserByCallName(
        phpAst,
        node.startPosition.offset + adjustOffset,
        callName
      );
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

//
// isTarget...
//

export function isTargetDirectiveWithParametersFromOffset(code: string, editorOffset: number, directiveName: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof DirectiveNode) {
      if (node.directiveName === directiveName) {
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

//
// isStaticMethodName...
//

export function isStaticMethodNameInBladeEchoFromOffset(
  code: string,
  editorOffset: number,
  callStaticClassName: string,
  callStaticMethodName: string
) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeEchoNode) {
      if (!node.offset) continue;

      const phpCode = node.content;
      const phpAst = phpParser.getAst(phpCode);
      if (!phpAst) continue;

      const rangeOffsets = getRangeOffsetsFromPHPParserByStaticClassAndMethodName(
        phpAst,
        node.offset.start + 2,
        callStaticClassName,
        callStaticMethodName
      );
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

export function isStaticMethodNameInPHPDirectiveFromOffset(
  code: string,
  editorOffset: number,
  callStaticClassName: string,
  callStaticMethodName: string
) {
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

        const rangeOffsets = getRangeOffsetsFromPHPParserByStaticClassAndMethodName(
          phpAst,
          node.offset.start + 4,
          callStaticClassName,
          callStaticMethodName
        );
        rangeOffsetsAll.push(...rangeOffsets);
      } else if (endPhpDirectiveNode.directiveName === 'php') {
        if (!node.directiveParametersPosition?.start?.offset) continue;

        const phpCode = node.directiveParameters;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const rangeOffsets = getRangeOffsetsFromPHPParserByStaticClassAndMethodName(
          phpAst,
          node.directiveParametersPosition.start.offset,
          callStaticClassName,
          callStaticMethodName
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

export function isStaticMethodNameInInlinePHPFromOffset(
  code: string,
  editorOffset: number,
  callStaticClassName: string,
  callStaticMethodName: string
) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof InlinePhpNode) {
      if (!node.startPosition) continue;

      const phpCode = node.sourceContent;
      const phpAst = phpParser.getAst(phpCode);
      if (!phpAst) continue;

      let adjustOffset = 0;
      if (node.sourceContent.startsWith('<?php')) {
        adjustOffset = 5;
      } else if (node.sourceContent.startsWith('<?=')) {
        adjustOffset = 3;
      }

      const rangeOffsets = getRangeOffsetsFromPHPParserByStaticClassAndMethodName(
        phpAst,
        node.startPosition.offset + adjustOffset,
        callStaticClassName,
        callStaticMethodName
      );
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

export function isStaticMethodNameInDirectiveWithParametersFromOffset(
  code: string,
  editorOffset: number,
  callStaticClassName: string,
  callStaticMethodName: string
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

        const rangeOffsets = getRangeOffsetsFromPHPParserByStaticClassAndMethodName(
          phpAst,
          node.directiveParametersPosition.start.offset,
          callStaticClassName,
          callStaticMethodName
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

export function isStaticMethodNameInComponentPropsFromOffset(
  code: string,
  editorOffset: number,
  callStaticClassName: string,
  callStaticMethodName: string
) {
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

        const rangeOffsets = getRangeOffsetsFromPHPParserByStaticClassAndMethodName(
          phpAst,
          parameter.valuePosition.start.offset,
          callStaticClassName,
          callStaticMethodName
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

function getRangeOffsetsFromPHPParserByStaticClassAndMethodName(
  ast: Node,
  adjustOffset: number,
  callStaticClassName: string,
  callStaticMethodName: string
) {
  const rangeOffsets: RangeOffset[] = [];

  phpParser.walk((node) => {
    let existsTargetStaticClass = false;
    let existsTargetStaticMethod = false;

    if (node.kind !== 'call') return;
    const callNode = node as Call;
    if (callNode.what.kind === 'staticlookup') {
      const staticLookupNode = callNode.what as unknown as StaticLookup;
      if (staticLookupNode.what.kind !== 'name') return;
      const nameNode = staticLookupNode.what as Name;
      if (nameNode.name === callStaticClassName) {
        existsTargetStaticClass = true;
      }

      if (staticLookupNode.offset.kind !== 'identifier') return;
      const identifierNode = staticLookupNode.offset as Identifier;
      if (identifierNode.name === callStaticMethodName) {
        existsTargetStaticMethod = true;
      }
    }

    if (!existsTargetStaticClass) return;
    if (!existsTargetStaticMethod) return;

    if (callNode.arguments.length >= 1) {
      if (callNode.arguments[0].loc) {
        const rangeOffset: RangeOffset = {
          start: callNode.arguments[0].loc.start.offset + adjustOffset,
          end: callNode.arguments[0].loc.end.offset + adjustOffset,
        };

        rangeOffsets.push(rangeOffset);
      }
    }
  }, ast);

  return rangeOffsets;
}
