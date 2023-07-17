import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import * as viewService from '../services/viewService';
import { type BladeProjectsManagerType } from '../../projects/types';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  bladeProjectManager: BladeProjectsManagerType
) {
  if (document.languageId !== 'php') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];
  let adjustText: string | undefined = undefined;
  const wordRange = doc.getWordRangeAtPosition(Position.create(position.line, position.character - 1), '.-');
  if (wordRange) {
    adjustText = document.getText(wordRange);
  }

  const code = document.getText();
  const stripedPHPTagCode = viewService.stripPHPTag(code);
  const diffOffset = code.length - stripedPHPTagCode.length;

  try {
    const ast = viewService.getAst(code);

    const serviceLocations = viewService.getServiceLocations(ast);
    if (serviceLocations.length === 0) return [];

    const offset = document.offsetAt(position) - diffOffset;
    const canCompletion = viewService.canCompletion(offset, serviceLocations);
    if (!canCompletion) return [];

    const viewList = Array.from(bladeProjectManager.list());
    if (viewList.length === 0) return [];

    for (const view of viewList) {
      const adjustStartCharacter = adjustText ? position.character - adjustText.length : position.character;

      const edit: TextEdit = {
        range: {
          start: { line: position.line, character: adjustStartCharacter },
          end: position,
        },
        newText: view[0],
      };

      const detail = view[1].replace(workspace.root, '').replace(/^\//, '');

      items.push({
        label: view[0],
        kind: CompletionItemKind.Text,
        detail,
        textEdit: edit,
      });
    }
  } catch {}

  return items;
}
