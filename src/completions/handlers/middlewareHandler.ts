import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { getArtisanPath, runTinker } from '../../common/shared';
import * as middlewareService from '../services/middlewareService';

export async function doCompletion(document: LinesTextDocument, position: Position) {
  if (document.languageId !== 'php') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];
  let adjustText: string | undefined = undefined;
  const wordRange = doc.getWordRangeAtPosition(Position.create(position.line, position.character - 1), '.-:');
  if (wordRange) {
    adjustText = document.getText(wordRange);
  }

  // If a colon is included, do not display middleware completion candidates
  // because you only want to display guard completion candidates
  if (adjustText?.includes(':')) return [];

  const code = document.getText();
  const stripedPHPTagCode = middlewareService.stripPHPTag(code);
  const diffOffset = code.length - stripedPHPTagCode.length;

  try {
    const ast = middlewareService.getAst(code);

    const serviceLocations = middlewareService.getServiceLocations(ast);
    if (serviceLocations.length === 0) return [];

    const offset = document.offsetAt(position) - diffOffset;
    const canCompletion = middlewareService.canCompletion(offset, serviceLocations);
    if (!canCompletion) return [];

    const artisanPath = getArtisanPath();
    if (!artisanPath) return [];

    const runCode = `echo json_encode(array_merge(app('Illuminate\\Contracts\\Http\\Kernel')->getMiddlewareGroups(), app('Illuminate\\Contracts\\Http\\Kernel')->getRouteMiddleware()), JSON_PRETTY_PRINT)`;
    const middlewareJsonStr = await runTinker(runCode, artisanPath);
    const middlewareJson = JSON.parse(middlewareJsonStr);

    Object.keys(middlewareJson).map((key) => {
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
        textEdit: edit,
      });
    });
  } catch {}

  return items;
}
