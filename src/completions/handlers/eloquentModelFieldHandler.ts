import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, workspace } from 'coc.nvim';

import { EloquentModelProjectManagerType } from '../../projects/types';
import * as eloquentModelService from '../services/eloquentModelFieldService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  eloquentModelProjectManager: EloquentModelProjectManagerType
) {
  if (document.languageId !== 'php') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);

  const models = Array.from(eloquentModelProjectManager.list());
  const modelSymbols: string[] = [];
  for (const m of models) {
    modelSymbols.push(m[1].name, m[1].fullQualifiedName, '\\' + m[1].fullQualifiedName);
  }

  const completionSymbolName = eloquentModelService.getCompletionSymbolName(code, offset, modelSymbols);
  if (!completionSymbolName) return [];

  const fields: { name: string; detail: string }[] = [];
  for (const m of models) {
    if (m[1].name === completionSymbolName || m[1].fullQualifiedName === completionSymbolName) {
      if (m[1].properties.length === 0) continue;

      for (const p of m[1].properties) {
        fields.push({
          name: p.name.replace(/^\$/, ''),
          detail: p.typeString,
        });
      }
    }
  }

  for (const f of fields) {
    items.push({
      label: f.name,
      kind: CompletionItemKind.Text,
      insertText: f.name,
      detail: f.detail,
    });
  }

  return items;
}
