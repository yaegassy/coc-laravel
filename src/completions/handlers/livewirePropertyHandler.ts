import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  LinesTextDocument,
  Position,
  TextEdit,
  Uri,
  workspace,
} from 'coc.nvim';

import { type LivewireMapValueType, type LivewireProjectManagerType } from '../../projects/types';
import * as livewirePropertyService from '../services/livewirePropertyService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  livewireProjectManager: LivewireProjectManagerType,
  viewPath: string
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!livewirePropertyService.canCompletionFromPHPRegionInBladeByOffset(code, offset)) return [];
  if (livewirePropertyService.hasDenyKindNameFromPHPRegionInBladeByOffset(code, offset)) return [];

  const viewUri = Uri.parse(viewPath).toString();
  const templateKey = document.uri
    .replace(viewUri, '')
    .replace(/^\//, '')
    .replace('.blade.php', '')
    .replace(/\//g, '.');

  const livewireComponents = Array.from(livewireProjectManager.list());
  if (!livewireComponents) return [];

  let currentComponent: [string, LivewireMapValueType] | undefined = undefined;
  for (const component of livewireComponents) {
    if (!component[1].templateKey) continue;
    if (component[1].templateKey !== templateKey) continue;
    currentComponent = component;
  }
  if (!currentComponent) return;

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_$'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  for (const property of currentComponent[1].properties) {
    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: '$' + property.name,
    };

    const workspaceRootUri = Uri.parse(workspace.root).toString();
    const componetFilePathUri = Uri.parse(currentComponent[1].filePath).toString();
    const relativeFilePath = componetFilePathUri.replace(workspaceRootUri, '').replace(/^\//, '');

    items.push({
      label: '$' + property.name,
      kind: CompletionItemKind.Variable,
      detail: relativeFilePath,
      insertTextFormat: InsertTextFormat.PlainText,
      textEdit: edit,
    });
  }

  return items;
}
