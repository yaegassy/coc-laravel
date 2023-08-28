import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, Uri, workspace } from 'coc.nvim';

import { type BladeProjectsManagerType, type ViewReferenceProjectManagerType } from '../../projects/types';
import * as bladeViewReferenceVariableService from '../services/bladeViewReferenceVariableService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  bladeProjectManager: BladeProjectsManagerType,
  viewReferenceProjectManager: ViewReferenceProjectManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '_$'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!bladeViewReferenceVariableService.canCompletionFromContext(code, offset)) return [];

  const filePath = Uri.parse(document.uri).path;

  let bladeKeyName: string | undefined = undefined;
  const bladeFiles = Array.from(bladeProjectManager.bladeFilelist());
  for (const b of bladeFiles) {
    if (b[1] === filePath) {
      bladeKeyName = b[0];
      break;
    }
  }
  if (!bladeKeyName) return [];

  let refKey: string | undefined = undefined;
  const dataKeys: string[] = [];
  const viewReferences = Array.from(viewReferenceProjectManager.list());
  for (const v of viewReferences) {
    if (!v[1].callViewFunctions.length) continue;
    for (const c of v[1].callViewFunctions) {
      if (c.name !== bladeKeyName) continue;
      if (!c.dataKeys.length) continue;
      for (const dataKey of c.dataKeys) {
        dataKeys.push(dataKey);
        if (!refKey) refKey = v[0];
      }
    }
  }
  if (!dataKeys.length) return [];
  if (!refKey) return [];

  for (const dataKey of dataKeys) {
    const adjustStartCharacter = wordWithExtraChars
      ? position.character - wordWithExtraChars.length
      : position.character;

    const completionText = '$' + dataKey;

    const edit: TextEdit = {
      range: {
        start: { line: position.line, character: adjustStartCharacter },
        end: position,
      },
      newText: completionText,
    };

    items.push({
      label: completionText,
      kind: CompletionItemKind.Text,
      detail: refKey,
      textEdit: edit,
    });
  }

  return items;
}
