import { Location, Position, Range, TextDocument, Uri, workspace } from 'coc.nvim';

import { type ProjectManagerType } from '../../projects/types';
import * as viewService from '../services/viewService';

export async function doDefinition(
  document: TextDocument,
  position: Position,
  projectManager: ProjectManagerType
): Promise<Location[]> {
  if (document.languageId !== 'php') return [];
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

  try {
    const ast = viewService.getAst(code);

    const serviceLocations = viewService.getServiceLocations(ast);
    if (serviceLocations.length === 0) return [];

    const offset = document.offsetAt(position) - diffOffset;
    const canProvideService = viewService.canProvideService(offset, serviceLocations);
    if (!canProvideService) return [];
  } catch (e) {}

  const bladeFile = projectManager.bladeProjectManager.bladeMapStore.get(text);
  if (bladeFile) {
    const location: Location = {
      uri: Uri.parse(bladeFile).toString(),
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };

    locations.push(location);
  }

  return locations;
}
