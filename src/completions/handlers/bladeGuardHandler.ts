import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { getArtisanPath, runTinker } from '../../common/shared';

type AuthGuardsJsonType = {
  guards?: {
    [key: string]: any;
  };
};

export async function doCompletion(document: LinesTextDocument, position: Position) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const canCompletionWordRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '(\'".-@:'
  );
  if (!canCompletionWordRange) return [];
  const canCompletionWord = document.getText(canCompletionWordRange) || '';
  if (!canCompletion(canCompletionWord)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '.-'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  try {
    const artisanPath = getArtisanPath();
    if (!artisanPath) return [];
    const runCode = `echo json_encode(config('auth'), JSON_PRETTY_PRINT)`;
    const authJsonStr = await runTinker(runCode, artisanPath);
    // In fact, there are elements other than guards, but in this context only
    // guards are needed, so they are recognized as JSON-type for guards.
    const authGuardsJson: AuthGuardsJsonType = JSON.parse(authJsonStr);
    if (!authGuardsJson.guards) return [];

    Object.keys(authGuardsJson.guards).map((key) => {
      const adjustStartCharacter = wordWithExtraChars
        ? position.character + wordWithExtraChars.length
        : position.character;
      const edit: TextEdit = {
        range: {
          start: { line: position.line, character: adjustStartCharacter },
          end: position,
        },
        newText: key,
      };
      items.push({
        label: key,
        kind: CompletionItemKind.Text,
        textEdit: edit,
      });
    });
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

  if (!evalWord.startsWith("Auth::guard('")) {
    return false;
  }

  return true;
}
