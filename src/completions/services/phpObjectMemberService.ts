import { BladeComponentNode, BladeEchoNode, DirectiveNode, InlinePhpNode } from 'stillat-blade-parser/out/nodes/nodes';

import * as phpCommon from '../../common/php';
import * as bladeParser from '../../parsers/blade/parser';

import { BladeWithPHPObjectItemsType } from '../../common/types';

export function canCompletionFromContext(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return undefined;

  const flags: boolean[] = [];

  flags.push(isEditorOffsetInBladeEchoRegionOfPhpObjectItem(code, editorOffset));
  flags.push(isEditorOffsetInPHPDirectiveRegionOfOfPhpObjectItem(code, editorOffset));
  flags.push(isEditorOffsetInInlinePhpResionOfPhpObjectItem(code, editorOffset));
  flags.push(isEditorOffsetInDirectiveWithParametersRegionOfPhpObjectItem(code, editorOffset));
  flags.push(isEditorOffsetInPropsValueRegionOfPhpObjectItem(code, editorOffset));

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}

export function isEditorOffsetInBladeEchoRegionOfPhpObjectItem(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPHPObjectItemsType[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeEchoNode) {
      if (!node.offset) continue;

      // blade echo
      const phpCode = '<?php echo' + node.content;

      const items = phpCommon.getObjectItemsFromPhpCode(phpCode);

      const contextRange: BladeWithPHPObjectItemsType = {
        start: node.offset.start,
        end: node.offset.end,
        objectItems: items,
      };

      contextRanges.push(contextRange);
    }
  }

  // `<?php echo` character count is 10 - 1 (zero base?)
  const adjustOffset = 10 - 1;

  for (const contextRange of contextRanges) {
    if (contextRange.start <= editorOffset && contextRange.end >= editorOffset) {
      for (const i of contextRange.objectItems) {
        // In the case of `$obj->|`
        if (i.member.startOffset > i.member.endOffset) {
          if (i.member.endOffset + contextRange.start - adjustOffset === editorOffset) {
            return true;
          }
        } else {
          // In the case of `$obj->x...`
          if (
            i.member.startOffset + contextRange.start - adjustOffset <= editorOffset &&
            i.member.endOffset + contextRange.start - adjustOffset + 1 >= editorOffset
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

export function isEditorOffsetInInlinePhpResionOfPhpObjectItem(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPHPObjectItemsType[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof InlinePhpNode) {
      if (!node.startPosition) continue;
      if (!node.endPosition) continue;

      const phpCode = node.sourceContent;

      const items = phpCommon.getObjectItemsFromPhpCode(phpCode);

      const contextRange: BladeWithPHPObjectItemsType = {
        start: node.startPosition.offset,
        end: node.endPosition.offset,
        objectItems: items,
      };

      contextRanges.push(contextRange);
    }
  }

  for (const contextRange of contextRanges) {
    if (contextRange.start <= editorOffset && contextRange.end >= editorOffset) {
      for (const i of contextRange.objectItems) {
        // In the case of `$obj->|`
        if (i.member.startOffset > i.member.endOffset) {
          if (i.member.endOffset + contextRange.start === editorOffset) {
            return true;
          }
        } else {
          // In the case of `$obj->x...`
          if (
            i.member.startOffset + contextRange.start <= editorOffset &&
            i.member.endOffset + contextRange.start >= editorOffset
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

export function isEditorOffsetInPHPDirectiveRegionOfOfPhpObjectItem(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPHPObjectItemsType[] = [];

  let adjustOffset = 0;

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof DirectiveNode) {
      if (node.directiveName !== 'php') continue;
      if (!node.offset) continue;
      const endPhpDirectiveNode = node.getFinalClosingDirective();

      if (endPhpDirectiveNode.directiveName === 'endphp') {
        if (!endPhpDirectiveNode.offset?.end) continue;

        const phpCode = '<?php' + node.documentContent;
        adjustOffset = 2;

        const items = phpCommon.getObjectItemsFromPhpCode(phpCode);

        const contextRange: BladeWithPHPObjectItemsType = {
          start: node.offset.start,
          end: endPhpDirectiveNode.offset.end,
          objectItems: items,
        };

        contextRanges.push(contextRange);
      } else if (endPhpDirectiveNode.directiveName === 'php') {
        const phpCode = '<?php ' + node.getInnerContent() + ' ?>';

        adjustOffset = 1;

        const items = phpCommon.getObjectItemsFromPhpCode(phpCode);

        const contextRange: BladeWithPHPObjectItemsType = {
          start: node.offset.start,
          end: node.offset.end,
          objectItems: items,
        };

        contextRanges.push(contextRange);
      }
    }
  }

  for (const contextRange of contextRanges) {
    if (contextRange.start <= editorOffset && contextRange.end >= editorOffset) {
      for (const i of contextRange.objectItems) {
        // In the case of `$obj->|`
        if (i.member.startOffset > i.member.endOffset) {
          if (i.member.endOffset + contextRange.start - adjustOffset === editorOffset) {
            return true;
          }
        } else {
          // In the case of `$obj->x...`
          if (
            i.member.startOffset + contextRange.start <= editorOffset &&
            i.member.endOffset + contextRange.start >= editorOffset
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

export function isEditorOffsetInDirectiveWithParametersRegionOfPhpObjectItem(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPHPObjectItemsType[] = [];

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

        const phpCode = '<?php ' + node.directiveParameters.replace(/^\(/, '').replace(/\)$/, '') + ' ?>';

        const items = phpCommon.getObjectItemsFromPhpCode(phpCode);

        const contextRange: BladeWithPHPObjectItemsType = {
          start: node.directiveParametersPosition.start.offset,
          end: node.directiveParametersPosition.end.offset,
          objectItems: items,
        };

        contextRanges.push(contextRange);
      }
    }
  }

  const adjustOffset = 5;

  for (const contextRange of contextRanges) {
    if (contextRange.start <= editorOffset && contextRange.end >= editorOffset) {
      for (const i of contextRange.objectItems) {
        // In the case of `$obj->|`
        if (i.member.startOffset > i.member.endOffset) {
          if (i.member.endOffset + contextRange.start - adjustOffset === editorOffset) {
            return true;
          }
        } else {
          // In the case of `$obj->x...`
          if (
            i.member.startOffset + contextRange.start - adjustOffset + 1 <= editorOffset &&
            i.member.endOffset + contextRange.start - adjustOffset >= editorOffset
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

export function isEditorOffsetInPropsValueRegionOfPhpObjectItem(code: string, editorOffset: number) {
  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return false;

  const contextRanges: BladeWithPHPObjectItemsType[] = [];

  for (const node of bladeDoc.getAllNodes()) {
    if (node instanceof BladeComponentNode) {
      if (!node.hasParameters) continue;
      for (const parameter of node.parameters) {
        // case :xxxx is true
        if (!parameter.isExpression) continue;
        if (!parameter.valuePosition) continue;
        if (!parameter.valuePosition.start?.offset) continue;
        if (!parameter.valuePosition.end?.offset) continue;

        const phpCode = '<?php ' + parameter.value + ' ?>';
        const items = phpCommon.getObjectItemsFromPhpCode(phpCode);

        const contextRange: BladeWithPHPObjectItemsType = {
          start: parameter.valuePosition.start.offset,
          end: parameter.valuePosition.end.offset,
          objectItems: items,
        };

        contextRanges.push(contextRange);
      }
    }
  }

  const adjustOffset = 5;

  for (const contextRange of contextRanges) {
    if (contextRange.start <= editorOffset && contextRange.end >= editorOffset) {
      for (const i of contextRange.objectItems) {
        // In the case of `$obj->|`
        if (i.member.startOffset > i.member.endOffset) {
          if (i.member.endOffset + contextRange.start - adjustOffset === editorOffset) {
            return true;
          }
        } else {
          // In the case of `$obj->x...`
          if (
            i.member.startOffset + contextRange.start - adjustOffset + 1 <= editorOffset &&
            i.member.endOffset + contextRange.start - adjustOffset >= editorOffset
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}
