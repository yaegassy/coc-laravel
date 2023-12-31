import { Document, LinesTextDocument, Location, Position, Range, Uri, workspace } from 'coc.nvim';

import { type ViewReferenceProjectManagerType } from '../../projects/types';
import * as viewService from '../services/viewService';

export async function doReference(
  document: LinesTextDocument,
  position: Position,
  viewReferenceProjectManager: ViewReferenceProjectManagerType
): Promise<Location[]> {
  const locations: Location[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const wordRange = doc.getWordRangeAtPosition(position, '-.');
  if (!wordRange) return [];

  const text = document.getText(wordRange) || '';
  if (!text) return [];

  const code = document.getText();
  const stripedPHPTagCode = viewService.stripPHPTag(code);
  const diffOffset = code.length - stripedPHPTagCode.length;

  const ast = viewService.getAst(code);
  if (!ast) return [];

  const serviceLocations = viewService.getServiceLocations(ast);
  if (serviceLocations.length === 0) return [];

  const offset = document.offsetAt(position) - diffOffset;
  const canProvideService = viewService.canProvideService(offset, serviceLocations);
  if (!canProvideService) return [];

  const viewReferences = Array.from(viewReferenceProjectManager.list());
  for (const [, v] of viewReferences) {
    if (v.callViewFunctions.length === 0) continue;

    for (const callViewFunction of v.callViewFunctions) {
      if (callViewFunction.name !== text) continue;

      let refDocument: Document | undefined;
      try {
        refDocument = await workspace.openTextDocument(v.path);
      } catch (e) {}
      if (!refDocument) continue;

      const startPostion = refDocument.textDocument.positionAt(callViewFunction.startOffset);
      const endPostion = refDocument.textDocument.positionAt(callViewFunction.endOffset);
      const range = Range.create(startPostion, endPostion);

      locations.push({
        uri: Uri.parse(v.path).toString(),
        range,
      });
    }
  }

  return locations;
}
