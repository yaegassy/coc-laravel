import { LinesTextDocument, Location, Position, Uri, workspace } from 'coc.nvim';

import { type ProjectManagerType } from '../../projects/types';
import * as viewService from '../services/viewService';

export async function doReference(
  document: LinesTextDocument,
  position: Position,
  projectManager: ProjectManagerType
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

  const viewReferences = Array.from(projectManager.viewReferenceProjectManager.list());
  for (const [, v] of viewReferences) {
    if (v.callViewFunctions.length === 0) continue;

    for (const callViewFunction of v.callViewFunctions) {
      if (callViewFunction.value !== text) continue;

      locations.push({
        uri: Uri.parse(v.path).toString(),
        range: callViewFunction.range,
      });
    }
  }

  return locations;
}
