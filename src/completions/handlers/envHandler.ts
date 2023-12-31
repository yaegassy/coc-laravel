import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import * as envService from '../services/envService';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  if (document.languageId !== 'php') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];
  let adjustText: string | undefined = undefined;
  const wordRange = doc.getWordRangeAtPosition(Position.create(position.line, position.character - 1), '.');
  if (wordRange) {
    adjustText = document.getText(wordRange);
  }

  const code = document.getText();
  const stripedPHPTagCode = envService.stripPHPTag(code);
  const diffOffset = code.length - stripedPHPTagCode.length;

  try {
    const ast = envService.getAst(code);
    if (!ast) return [];

    const serviceLocations = envService.getServiceLocations(ast);
    if (serviceLocations.length === 0) return [];

    const offset = document.offsetAt(position) - diffOffset;
    const canCompletion = envService.canCompletion(offset, serviceLocations);
    if (!canCompletion) return [];

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
        const adjustStartCharacter = adjustText ? position.character - adjustText.length : position.character;

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
          detail: enviroments[key],
          textEdit: edit,
        });
      });
    }
  } catch {}

  return items;
}
