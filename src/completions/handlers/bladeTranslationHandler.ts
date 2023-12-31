import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { type TranslationProjectManagerType } from '../../projects/types';
import * as bladeTranslationService from '../services/bladeTranslationService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  translationProjectManager: TranslationProjectManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '.-_'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!bladeTranslationService.canCompletionFromContext(code, offset)) return [];

  try {
    const translationList = Array.from(translationProjectManager.list());

    for (const translation of translationList) {
      const adjustStartCharacter = wordWithExtraChars
        ? position.character - wordWithExtraChars.length
        : position.character;
      const edit: TextEdit = {
        range: {
          start: { line: position.line, character: adjustStartCharacter },
          end: position,
        },
        newText: translation[0],
      };
      const detail = translation[1].replace(workspace.root, '').replace(/^\//, '');
      items.push({
        label: translation[0],
        kind: CompletionItemKind.Text,
        detail,
        textEdit: edit,
      });
    }
  } catch {}

  return items;
}
