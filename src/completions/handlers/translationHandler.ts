import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { type TranslationProjectManagerType } from '../../projects/types';
import * as translationService from '../services/translationService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  translationProjectManager: TranslationProjectManagerType
) {
  if (document.languageId !== 'php') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];
  let adjustText: string | undefined = undefined;
  const wordRange = doc.getWordRangeAtPosition(Position.create(position.line, position.character - 1), '.-_');
  if (wordRange) {
    adjustText = document.getText(wordRange);
  }

  const code = document.getText();
  const stripedPHPTagCode = translationService.stripPHPTag(code);
  const diffOffset = code.length - stripedPHPTagCode.length;

  try {
    const ast = translationService.getAst(code);
    if (!ast) return [];

    const serviceLocations = translationService.getServiceLocations(ast);
    if (serviceLocations.length === 0) return [];

    const offset = document.offsetAt(position) - diffOffset;
    const canCompletion = translationService.canCompletion(offset, serviceLocations);
    if (!canCompletion) return [];

    const translationList = Array.from(translationProjectManager.list());
    if (translationList.length === 0) return [];

    for (const translation of translationList) {
      const adjustStartCharacter = adjustText ? position.character - adjustText.length : position.character;

      const edit: TextEdit = {
        range: {
          start: { line: position.line, character: adjustStartCharacter },
          end: position,
        },
        newText: translation[0],
      };
      const detail = translation[1].replace(workspace.root, '').replace(/^\//, '');

      items.push({
        label: translation[0],
        kind: CompletionItemKind.Text,
        detail,
        textEdit: edit,
      });
    }
  } catch {}

  return items;
}
