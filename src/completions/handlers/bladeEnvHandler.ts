import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as bladeEnvService from '../services/bladeEnvService';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '.'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!bladeEnvService.canCompletionFromContext(code, offset)) return [];

  try {
    const enviroments: { [key: string]: string } = {};

    const envPath = path.join(workspace.root, '.env');
    if (fs.existsSync(envPath)) {
      const envs = fs.readFileSync(envPath, { encoding: 'utf8' }).split('\n');
      for (const i in envs) {
        const envKeyValue = envs[i].split('=');
        if (envKeyValue.length === 2 && !envKeyValue[0].startsWith('#')) {
          enviroments[envKeyValue[0]] = envKeyValue[1];
        }
      }

      Object.keys(enviroments).map((key) => {
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

        items.push({
          label: key,
          kind: CompletionItemKind.Text,
          insertText: key,
          detail: enviroments[key],
          textEdit: edit,
        });
      });
    }
  } catch {}

  return items;
}
