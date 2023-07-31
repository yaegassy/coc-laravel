import {
  CompletionItem,
  CompletionItemKind,
  LinesTextDocument,
  MarkupKind,
  Position,
  TextEdit,
  workspace,
} from 'coc.nvim';

import { type LivewireProjectManagerType } from '../../projects/types';
import * as livewireDirectiveService from '../services/livewireDirectiveService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  livewireProjectManager: LivewireProjectManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '.-'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!livewireDirectiveService.canCompletionFromContext(code, offset)) return [];

  const livewireComponents = Array.from(livewireProjectManager.list());
  if (!livewireComponents) return [];

  for (const component of livewireComponents) {
    let documentationValue: string | undefined = undefined;

    if (component[1].properties) {
      documentationValue = '```\n';
      for (const property of component[1].properties) {
        if (property.value) {
          documentationValue += property.name + ': ' + property.value;
        } else {
          documentationValue += property.name;
        }
      }
      documentationValue += '\n```';
    }

    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;
    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: component[0],
    };
    const detail = component[1].filePath.replace(workspace.root, '').replace(/^\//, '');
    items.push({
      label: component[0],
      kind: CompletionItemKind.Text,
      detail,
      documentation: documentationValue
        ? {
            kind: MarkupKind.Markdown,
            value: documentationValue,
          }
        : undefined,
      textEdit: edit,
    });
  }

  return items;
}
