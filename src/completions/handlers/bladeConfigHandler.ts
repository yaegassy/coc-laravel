import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { getArtisanPath, runTinker } from '../../common/shared';
import * as bladeConfigService from '../services/bladeConfigService';

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
  if (!bladeConfigService.canCompletionFromContext(code, offset)) return [];

  const artisanPath = getArtisanPath();
  if (!artisanPath) return [];

  const runCode = 'echo json_encode(config()->all());';

  const out = await runTinker(runCode, artisanPath);
  if (!out) return;

  const configData = JSON.parse(out);
  const configItems = getConfig(configData);

  Object.keys(configItems).map((key) => {
    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: configItems[key].name,
    };

    items.push({
      label: configItems[key].name,
      kind: CompletionItemKind.Value,
      insertText: configItems[key].name,
      detail: String(configItems[key].value),
      textEdit: edit ? edit : undefined,
    });
  });

  return items;
}

function getConfig(config: any) {
  let out: any[] = [];
  if (config) {
    Object.keys(config).map((key: any) => {
      if (config[key] instanceof Array) {
        out.push({ name: key, value: 'array(...)' });
      } else if (config[key] instanceof Object) {
        out.push({ name: key, value: 'array(...)' });
        out = out.concat(
          getConfig(config[key]).map((c) => {
            c.name = key + '.' + c.name;
            return c;
          })
        );
      } else {
        out.push({ name: key, value: config[key] });
      }
    });
  }
  return out;
}
