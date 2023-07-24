import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { type BladeProjectsManagerType } from '../../projects/types';
import * as bladeViewService from '../services/bladeViewService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  bladeProjectManager: BladeProjectsManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '.-'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!bladeViewService.canCompletionFromContext(code, offset)) return [];

  try {
    const viewList = Array.from(bladeProjectManager.bladeFilelist());

    for (const view of viewList) {
      const adjustStartCharacter = wordWithExtraChars
        ? position.character - wordWithExtraChars.length
        : position.character;
      const edit: TextEdit = {
        range: {
          start: { line: position.line, character: adjustStartCharacter },
          end: position,
        },
        newText: view[0],
      };
      const detail = view[1].replace(workspace.root, '').replace(/^\//, '');
      items.push({
        label: view[0],
        kind: CompletionItemKind.Text,
        detail,
        textEdit: edit,
      });
    }
  } catch {}

  return items;
}
