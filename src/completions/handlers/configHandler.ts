import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { getArtisanPath, runTinker } from '../../common/shared';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const wordRange = doc.getWordRangeAtPosition(Position.create(position.line, position.character - 1), '(\'".');
  if (!wordRange) return [];

  const text = document.getText(wordRange) || '';
  if (!text) return [];
  if (!text.startsWith('config("') && !text.startsWith("config('")) return [];

  const artisanPath = getArtisanPath();

  const runCode = 'echo json_encode(config()->all(), JSON_PRETTY_PRINT);';
  if (artisanPath) {
    const out = await runTinker(runCode, artisanPath);

    try {
      const configData = JSON.parse(out);
      const configItems = getConfig(configData);

      let edit: TextEdit | undefined;
      Object.keys(configItems).map((key) => {
        if (text.includes('.')) {
          const enteredTextItem = text.replace(/config\(/, '').replace(/["']/g, '') || '';
          edit = {
            range: {
              start: {
                line: position.line,
                character: position.character - enteredTextItem.length,
              },
              end: position,
            },
            newText: configItems[key].name,
          };
        }

        items.push({
          label: configItems[key].name,
          kind: CompletionItemKind.Value,
          insertText: configItems[key].name,
          detail: String(configItems[key].value),
          textEdit: edit ? edit : undefined,
        });
      });
    } catch {}
  }

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
