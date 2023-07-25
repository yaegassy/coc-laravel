import { Call, Identifier, Name, Node, StaticLookup } from 'php-parser';
import { BladeComponentNode, BladeEchoNode, DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';

import * as bladeParser from '../parsers/blade/parser';
import * as phpParser from '../parsers/php/parser';
import { RangeOffset } from './types';

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

export function isComponentParameterValueRegionByOffset(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeComponentNode) {
      if (!node.hasParameters) continue;
      for (const parameter of node.parameters) {
        // case :xxxx is true
        //if (!parameter.isExpression) continue;
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

export function isComponentRegionAfterComponentNameByOffset(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const rangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeComponentNode) {
      const componentNameNode = node.name;
      if (!componentNameNode?.endPosition) continue;

      let contextEndOffset: number = editorOffset;
      if (node.endPosition) {
        if (node.isClosingTag || node.isSelfClosing) {
          contextEndOffset = node.endPosition.offset;
        } else {
          // **MEMO**:
          //
          // There seems to be a difference in the position returned by the
          // parser depending on the context. Therefore, the offset was
          // corrected.
          const adjustOffset = 2;
          contextEndOffset = node.endPosition.offset + adjustOffset;
        }
      }

      const rangeOffsets: RangeOffset[] = [
        {
          start: componentNameNode.endPosition.offset,
          end: contextEndOffset,
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

//
// isDenyKindName...
//

export function isDenyKindNameInBladeEchoFromOffset(code: string, editorOffset: number, denyKindName: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const denyRangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeEchoNode) {
      if (!node.offset) continue;

      const phpCode = node.content;
      const phpAst = phpParser.getAst(phpCode);
      if (!phpAst) continue;

      const denyRangeOffsets = getDenyRangeOffsetsFromPHPParserByKindName(phpAst, node.offset.start + 2, denyKindName);

      denyRangeOffsetsAll.push(...denyRangeOffsets);
    }
  }

  for (const rangeDenyOffset of denyRangeOffsetsAll) {
    if (rangeDenyOffset.start <= editorOffset && rangeDenyOffset.end >= editorOffset) {
      return true;
    }
  }

  return false;
}

export function isDenyKindNameInPHPDirectiveFromOffset(code: string, editorOffset: number, denyKindName: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const denyRangeOffsetsAll: RangeOffset[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof DirectiveNode) {
      if (node.directiveName !== 'php') continue;
      if (!node.offset) continue;
      const endPhpDirectiveNode = node.getFinalClosingDirective();
      if (endPhpDirectiveNode.directiveName === 'endphp') {
        const phpCode = node.documentContent;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const rangeOffsets = getDenyRangeOffsetsFromPHPParserByKindName(phpAst, node.offset.start + 4, denyKindName);
        denyRangeOffsetsAll.push(...rangeOffsets);
      } else if (endPhpDirectiveNode.directiveName === 'php') {
        if (!node.directiveParametersPosition?.start?.offset) continue;

        const phpCode = node.directiveParameters;
        const phpAst = phpParser.getAst(phpCode);
        if (!phpAst) continue;

        const rangeOffsets = getDenyRangeOffsetsFromPHPParserByKindName(
          phpAst,
          node.directiveParametersPosition.start.offset,
          denyKindName
        );
        denyRangeOffsetsAll.push(...rangeOffsets);
      }
    }
  }

  for (const denyRangeOffset of denyRangeOffsetsAll) {
    if (denyRangeOffset.start <= editorOffset && denyRangeOffset.end >= editorOffset) {
      return true;
    }
  }

  return false;
}

export function isDenyKindNameInDirectiveWithParametersFromOffset(
  code: string,
  editorOffset: number,
  denyKindName: string
) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const denyRangeOffsetsAll: RangeOffset[] = [];

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

        const denyRangeOffsets = getDenyRangeOffsetsFromPHPParserByKindName(
          phpAst,
          node.directiveParametersPosition.start.offset,
          denyKindName
        );
        denyRangeOffsetsAll.push(...denyRangeOffsets);
      }
    }
  }

  for (const denyRangeOffset of denyRangeOffsetsAll) {
    if (denyRangeOffset.start <= editorOffset && denyRangeOffset.end >= editorOffset) {
      return true;
    }
  }

  return false;
}

export function isDenyKindNameInComponentPropsFromOffset(code: string, editorOffset: number, denyKindName: string) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const denyRangeOffsetsAll: RangeOffset[] = [];

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

        const denyRangeOffsets = getDenyRangeOffsetsFromPHPParserByKindName(
          phpAst,
          parameter.valuePosition.start.offset + 1,
          denyKindName
        );

        denyRangeOffsetsAll.push(...denyRangeOffsets);
      }
    }
  }

  for (const denyRangeOffset of denyRangeOffsetsAll) {
    if (denyRangeOffset.start <= editorOffset && denyRangeOffset.end >= editorOffset) {
      return true;
    }
  }

  return false;
}

function getDenyRangeOffsetsFromPHPParserByKindName(ast: Node, adjustOffset: number, denyKindName: string) {
  const denyRangeOffsets: RangeOffset[] = [];

  phpParser.walk((node) => {
    if (node.kind !== denyKindName) return;
    if (!node.loc) return;

    const denyRangeOffset: RangeOffset = {
      start: node.loc.start.offset + adjustOffset,
      end: node.loc.end.offset + adjustOffset,
    };

    denyRangeOffsets.push(denyRangeOffset);
  }, ast);

  return denyRangeOffsets;
}
