import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { getArtisanPath, runTinker } from '../common/shared';
import * as guardService from '../services/guardService';

type AuthGuardsJsonType = {
  guards?: {
    [key: string]: any;
  };
};

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

  // If no colon is included, no guard completion candidates are shown
  if (!adjustText?.includes(':')) return [];

  const code = document.getText();
  const stripedPHPTagCode = guardService.stripPHPTag(code);
  const diffOffset = code.length - stripedPHPTagCode.length;

  try {
    const ast = guardService.getAst(code);

    const serviceLocations = guardService.getServiceLocations(ast);
    if (serviceLocations.length === 0) return [];

    const offset = document.offsetAt(position) - diffOffset;
    const canCompletion = guardService.canCompletion(offset, serviceLocations);
    if (!canCompletion) return [];

    const artisanPath = getArtisanPath();
    if (!artisanPath) return [];

    const runCode = `echo json_encode(config('auth'), JSON_PRETTY_PRINT)`;
    const authJsonStr = await runTinker(runCode, artisanPath);
    // In fact, there are elements other than guards, but in this context only
    // guards are needed, so they are recognized as JSON-type for guards.
    const authGuardsJson: AuthGuardsJsonType = JSON.parse(authJsonStr);
    if (!authGuardsJson.guards) return [];

    Object.keys(authGuardsJson.guards).map((key) => {
      const adjustStartCharacter = adjustText ? position.character + adjustText.length : position.character;

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
