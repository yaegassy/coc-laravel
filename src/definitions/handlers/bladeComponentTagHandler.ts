import { Location, Position, Range, TextDocument, Uri, workspace } from 'coc.nvim';

import fs from 'fs';

import { type BladeProjectsManagerType } from '../../projects/types';
import * as bladeComponentTagHandlerService from '../services/bladeComponentTagHandlerService';

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

  if (!text.startsWith('x-')) return [];

  const component = bladeProjectManager.componentMapStore.get(text);
  if (!component) return [];

  let componentFileType: string | undefined;
  if (component.path.endsWith('.blade.php')) {
    componentFileType = 'blade';
  } else if (component.path.endsWith('.php')) {
    componentFileType = 'php';
  }
  if (!componentFileType) return [];

  if (componentFileType === 'blade') {
    const location: Location = {
      uri: Uri.parse(component.path).toString(),
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };
    locations.push(location);

    const classBasedComponentFilePath = await bladeComponentTagHandlerService.getClassBasedComponentFilePath(text);
    if (classBasedComponentFilePath) {
      try {
        await fs.promises.lstat(classBasedComponentFilePath);

        const location: Location = {
          uri: Uri.parse(classBasedComponentFilePath).toString(),
          range: Range.create(Position.create(0, 0), Position.create(0, 0)),
        };
        locations.push(location);
      } catch (e) {
        // noop
      }
    }
  }

  if (componentFileType === 'php') {
    const location: Location = {
      uri: Uri.parse(component.path).toString(),
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };
    locations.push(location);

    const bladeMapValue = await bladeComponentTagHandlerService.getCallViewOfViewValue(component.path);
    if (bladeMapValue) {
      const bladeFilePath = bladeProjectManager.bladeMapStore.get(bladeMapValue);
      if (bladeFilePath) {
        const location: Location = {
          uri: Uri.parse(bladeFilePath).toString(),
          range: Range.create(Position.create(0, 0), Position.create(0, 0)),
        };
        locations.push(location);
      }
    }
  }

  return locations;
}
