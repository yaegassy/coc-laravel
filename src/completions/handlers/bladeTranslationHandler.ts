import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { type TranslationProjectManagerType } from '../../projects/types';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  translationProjectManager: TranslationProjectManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const canCompletionWordRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '(\'".-@:_'
  );
  if (!canCompletionWordRange) return [];

  const canCompletionWord = document.getText(canCompletionWordRange) || '';
  if (!canCompletion(canCompletionWord)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '.-_'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  try {
    const translationList = Array.from(translationProjectManager.list());

    for (const view of translationList) {
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

function canCompletion(word: string) {
  let unnecessaryWordCount = 0;
  for (const w of word) {
    if (w !== '(') break;
    unnecessaryWordCount++;
  }

  const slicedWord = word.slice(unnecessaryWordCount);
  const evalWord = slicedWord.replace('"', "'");

  if (!evalWord.startsWith("@lang('") && !evalWord.startsWith("__('")) {
    return false;
  }

  return true;
}
