import { BladeDocument } from 'stillat-blade-parser/out/document/bladeDocument';
import { BladeComponentNode } from 'stillat-blade-parser/out/nodes/nodes';

interface EditorPosition {
  line: number;
  character: number;
}

export function getBladeDocument(code: string) {
  const parsedBladeDoc = BladeDocument.fromText(code);
  if (parsedBladeDoc) {
    return parsedBladeDoc;
  }

  return undefined;
}

export function isComponentRegion(code: string, editorPostion: EditorPosition) {
  const bladeDoc = getBladeDocument(code);
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
