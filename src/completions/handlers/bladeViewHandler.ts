import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { type BladeCacheManagerType } from '../../cacheManagers/managerTypes';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  bladeCacheManager: BladeCacheManagerType
) {
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
    const viewList = Array.from(bladeCacheManager.list());

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

function canCompletion(word: string) {
  let unnecessaryWordCount = 0;
  for (const w of word) {
    if (w !== '(') break;
    unnecessaryWordCount++;
  }

  const slicedWord = word.slice(unnecessaryWordCount);
  const evalWord = slicedWord.replace('"', "'");

  // TODO: More support
  // @includeWhen
  // @includeUnless
  // @includeFirst
  if (
    !evalWord.startsWith("@include('") &&
    !evalWord.startsWith("@includeIf('") &&
    !evalWord.startsWith("@extends('") &&
    !evalWord.startsWith("@each('")
  ) {
    return false;
  }

  return true;
}
