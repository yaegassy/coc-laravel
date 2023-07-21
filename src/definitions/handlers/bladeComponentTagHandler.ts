import { Location, Position, Range, TextDocument, Uri, workspace } from 'coc.nvim';

import { type ProjectManagerType } from '../../projects/types';

export async function doDefinition(
  document: TextDocument,
  position: Position,
  projectManager: ProjectManagerType
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

  const component = projectManager.bladeProjectManager.componentMapStore.get(text);

  if (component) {
    const location: Location = {
      uri: Uri.parse(component.path).toString(),
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };
    locations.push(location);
  }

  return locations;
}
