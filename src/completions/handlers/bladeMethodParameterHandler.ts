import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import * as bladeMethodParameterService from '../services/bladeMethodParameterService';

import { METHOD_DIRECTIVE_PARAMETERS } from '../../constant';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '' // dummy
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!bladeMethodParameterService.canCompletionFromContext(code, offset)) return [];

  try {
    for (const method of METHOD_DIRECTIVE_PARAMETERS) {
      const adjustStartCharacter = wordWithExtraChars
        ? position.character - wordWithExtraChars.length
        : position.character;

      const edit: TextEdit = {
        range: {
          start: { line: position.line, character: adjustStartCharacter },
          end: position,
        },
        newText: method,
      };

      items.push({
        label: method,
        kind: CompletionItemKind.Text,
        textEdit: edit,
      });
    }
  } catch {}

  return items;
}
