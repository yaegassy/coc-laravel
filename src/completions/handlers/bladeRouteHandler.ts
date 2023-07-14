import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { getArtisanPath, runRouteListJson } from '../common/shared';

type RouteListJsonType = {
  domain: string | null;
  method: string;
  uri: string;
  name: string | null;
  action: string;
  middleware: string[];
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

  const artisanPath = getArtisanPath();
  if (!artisanPath) return [];

  const routeListJsonStr = await runRouteListJson(artisanPath);
  const routeListJson = JSON.parse(routeListJsonStr) as RouteListJsonType[];
  if (routeListJson.length === 0) return;

  for (const route of routeListJson) {
    if (route.name) {
      const adjustStartCharacter = wordWithExtraChars
        ? position.character - wordWithExtraChars.length
        : position.character;

      const edit: TextEdit = {
        range: {
          start: { line: position.line, character: adjustStartCharacter },
          end: position,
        },
        newText: route.name,
      };

      let documentation = '';
      documentation += `method: ${route.method}\n`;
      documentation += `uri: ${route.uri}\n`;
      if (route.middleware.length !== 0) {
        documentation += `middleware:`;
        for (const i of route.middleware) {
          documentation += `\n  - ${i}`;
        }
      }

      items.push({
        label: route.name,
        kind: CompletionItemKind.Text,
        detail: route.action,
        documentation,
        textEdit: edit,
      });
    }
  }

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

  if (!evalWord.startsWith("route('") && !evalWord.startsWith("Route::has('")) {
    return false;
  }

  return true;
}
