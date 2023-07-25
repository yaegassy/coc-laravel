import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { type BladeProjectsManagerType } from '../../projects/types';
import * as bladeComponentTagService from '../services/bladeComponentTagService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  bladeProjectManager: BladeProjectsManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const offset = document.offsetAt(position);
  const code = document.getText();
  if (!bladeComponentTagService.canCompletionFromContext(code, offset)) return [];

  let wordWithExtraChars: string | undefined = undefined;
  const wordWithExtraCharsRange = doc.getWordRangeAtPosition(
    Position.create(position.line, position.character - 1),
    '.-_'
  );
  if (wordWithExtraCharsRange) {
    wordWithExtraChars = document.getText(wordWithExtraCharsRange);
  }

  const components = Array.from(bladeProjectManager.componentList());

  for (const component of components) {
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
    const detail = component[1].path.replace(workspace.root, '').replace(/^\//, '');
    let documentation: string | undefined = undefined;
    if (component[1].props.length > 0) {
      documentation = `Props:\n`;
      for (const prop of component[1].props) {
        documentation += '  - ' + prop.propsKey + ' => ' + prop.propsValue + '\n';
      }
    }

    items.push({
      label: component[0],
      kind: CompletionItemKind.Text,
      detail,
      documentation: documentation ?? undefined,
      textEdit: edit,
    });
  }

  return items;
}
