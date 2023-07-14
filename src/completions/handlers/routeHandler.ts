import { CompletionItem, CompletionItemKind, LinesTextDocument, Position, TextEdit, workspace } from 'coc.nvim';

import { getArtisanPath, runRouteListJson } from '../common/shared';
import * as routeService from '../services/routeService';

type RouteListJsonType = {
  domain: string | null;
  method: string;
  uri: string;
  name: string | null;
  action: string;
  middleware: string[];
};

export async function doCompletion(document: LinesTextDocument, position: Position) {
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
  const stripedPHPTagCode = routeService.stripPHPTag(code);
  const diffOffset = code.length - stripedPHPTagCode.length;

  try {
    const ast = routeService.getAst(code);

    const serviceLocations = routeService.getServiceLocations(ast);
    if (serviceLocations.length === 0) return [];

    const offset = document.offsetAt(position) - diffOffset;
    const canCompletion = routeService.canCompletion(offset, serviceLocations);
    if (!canCompletion) return [];

    const artisanPath = getArtisanPath();
    if (!artisanPath) return [];

    const routeListJsonStr = await runRouteListJson(artisanPath);
    const routeListJson = JSON.parse(routeListJsonStr) as RouteListJsonType[];
    if (routeListJson.length === 0) return;

    for (const route of routeListJson) {
      if (route.name) {
        const adjustStartCharacter = adjustText ? position.character - adjustText.length : position.character;

        const edit: TextEdit = {
          range: {
            start: { line: position.line, character: adjustStartCharacter },
            end: position,
          },
          newText: route.name,
        };

        let documentation = '';
        documentation += `method: ${route.method}\n`;
        documentation += `uri: ${route.uri}\n`;
        if (route.middleware.length !== 0) {
          documentation += `middleware:`;
          for (const i of route.middleware) {
            documentation += `\n  - ${i}`;
          }
        }

        items.push({
          label: route.name,
          kind: CompletionItemKind.Text,
          detail: route.action,
          documentation,
          textEdit: edit,
        });
      }
    }
  } catch {}

  return items;
}
