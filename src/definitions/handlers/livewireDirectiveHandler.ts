import { Location, Position, Range, TextDocument, Uri, workspace } from 'coc.nvim';

import { type ProjectManagerType } from '../../projects/types';
import { isTargetDirectiveWithParametersFromOffset } from '../../completions/shared';

export async function doDefinition(
  document: TextDocument,
  position: Position,
  projectManager: ProjectManagerType
): Promise<Location[]> {
  if (document.languageId !== 'blade') return [];
  const locations: Location[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const wordRange = doc.getWordRangeAtPosition(position, '.-');
  if (!wordRange) return [];

  const text = document.getText(wordRange) || '';
  if (!text) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);

  if (!isTargetDirectiveWithParametersFromOffset(code, offset, 'livewire')) return [];

  const livewire = projectManager.livewireProjectManager.livewireMapStore.get(text);
  if (!livewire) return [];

  const location: Location = {
    uri: Uri.parse(livewire.filePath).toString(),
    range: Range.create(Position.create(0, 0), Position.create(0, 0)),
  };
  locations.push(location);

  if (livewire.templateKey) {
    const bladeFilePath = projectManager.bladeProjectManager.bladeMapStore.get(livewire.templateKey);
    if (bladeFilePath) {
      const location: Location = {
        uri: Uri.parse(bladeFilePath).toString(),
        range: Range.create(Position.create(0, 0), Position.create(0, 0)),
      };
      locations.push(location);
    }
  }

  return locations;
}
