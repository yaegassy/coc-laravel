import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const wordRange = doc.getWordRangeAtPosition(Position.create(position.line, position.character - 1), '(\'".');
  if (!wordRange) return [];

  const text = document.getText(wordRange) || '';
  if (!text) return [];
  if (!text.startsWith('env("') && !text.startsWith("env('")) return [];

  const enviroments: { [key: string]: string } = {};

  try {
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
        items.push({
          label: key,
          kind: CompletionItemKind.Text,
          insertText: key,
          detail: enviroments[key],
        });
      });
    }
  } catch {}

  return items;
}
