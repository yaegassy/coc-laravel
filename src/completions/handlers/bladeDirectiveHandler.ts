import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  LinesTextDocument,
  MarkupKind,
  Position,
  TextEdit,
  workspace,
} from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import { CompletionItemDataType } from '../types';

export type CompletionJsonType = {
  [key: string]: string;
};

export async function doCompletion(document: LinesTextDocument, position: Position, directiveJsonFilePaths: string[]) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '@'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }
  if (!wordWithExtraChars) return [];
  if (!wordWithExtraChars.startsWith('@')) return [];

  // TODO: Adjustments should be made so that completion items are not provided
  //       in context regions where directive completion is not required

  directiveJsonFilePaths.forEach(async (completionDataPath) => {
    const directiveItems = await getCompletionItems(completionDataPath, position, wordWithExtraChars);
    if (directiveItems) {
      items.push(...directiveItems);
    }
  });

  return items;
}

export async function doResolveCompletionItem(item: CompletionItem, _token: CancellationToken, docDataDir: string) {
  if (!item.data) return item;

  const resoveItem = item.data as CompletionItemDataType;
  if (resoveItem.source !== 'laravel-blade-directive') return item;

  const dataPath = path.join(docDataDir, item.label.replace('@', '') + '.md');

  let documentationText: string | undefined;
  try {
    documentationText = fs.readFileSync(dataPath, 'utf8');
  } catch (e) {
    documentationText = undefined;
  }

  if (!documentationText) return item;

  item.documentation = {
    kind: MarkupKind.Markdown,
    value: documentationText,
  };

  return item;
}

async function getCompletionItems(completionDataPath: string, position: Position, wordWithExtraChars?: string) {
  const completionList: CompletionItem[] = [];
  if (fs.existsSync(completionDataPath)) {
    const completionJsonText = fs.readFileSync(completionDataPath, 'utf8');
    const completionJson: CompletionJsonType = JSON.parse(completionJsonText);

    if (completionJson) {
      Object.keys(completionJson).map((key) => {
        const adjustStartCharacter = wordWithExtraChars
          ? position.character - wordWithExtraChars.length
          : position.character;

        const edit: TextEdit = {
          range: {
            start: { line: position.line, character: adjustStartCharacter },
            end: position,
          },
          newText: key,
        };

        completionList.push({
          label: key,
          kind: CompletionItemKind.Text,
          insertText: key,
          detail: completionJson[key],
          textEdit: edit,
          data: <CompletionItemDataType>{
            source: 'laravel-blade-directive',
          },
        });
      });
    }
  }

  return completionList;
}
