import { Position } from 'coc.nvim';

import { BladeComponentNode } from 'stillat-blade-parser/out/nodes/nodes';
import * as bladeParer from '../../parsers/blade/parser';

export function getCursorPostionComponent(code: string, editorPostion: Position) {
  const componentNames: string[] = [];

  const bladeDoc = bladeParer.getBladeDocument(code);
  if (!bladeDoc) return undefined;

  bladeDoc.getAllNodes().forEach((node) => {
    if (node instanceof BladeComponentNode) {
      if (node.startPosition && node.endPosition) {
        if (
          node.startPosition.line - 1 <= editorPostion.line &&
          node.startPosition.char - 1 <= editorPostion.character &&
          node.endPosition.line - 1 >= editorPostion.line
        ) {
          componentNames.push('x-' + node.getComponentName());
        }
      }
    }
  });

  if (componentNames.length === 0) return undefined;
  return componentNames[0];
}
