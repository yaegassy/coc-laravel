import { Location, Position, Range, TextDocument, Uri, workspace } from 'coc.nvim';

import { BladeProjectsManagerType } from '../../projects/types';
import * as bladeViewService from '../services/bladeViewService';

export async function doDefinition(
  document: TextDocument,
  position: Position,
  bladeProjectManager: BladeProjectsManagerType
): Promise<Location[]> {
  if (document.languageId !== 'blade') return [];
  const locations: Location[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const wordRange = doc.getWordRangeAtPosition(position, '-.');
  if (!wordRange) return [];

  const text = document.getText(wordRange) || '';
  if (!text) return [];

  const code = document.getText();
  const bladeDoc = bladeViewService.getBladeDocument(code);
  if (!bladeDoc) return [];

  const serviceLocations = bladeViewService.getServiceLocations(bladeDoc);
  if (serviceLocations.length === 0) return [];

  const offset = document.offsetAt(position);
  const canProvideService = bladeViewService.canProvideService(offset, serviceLocations);
  if (!canProvideService) return [];

  const bladeFile = bladeProjectManager.bladeMapStore.get(text);
  if (bladeFile) {
    const location: Location = {
      uri: Uri.parse(bladeFile).toString(),
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };

    locations.push(location);
  }

  return locations;
}
