import { Location, Position, Range, TextDocument, Uri, workspace } from 'coc.nvim';

import { type BladeProjectsManagerType, type LivewireProjectManagerType } from '../../projects/types';

export async function doDefinition(
  document: TextDocument,
  position: Position,
  livewireProjectManager: LivewireProjectManagerType,
  bladeProjectManager: BladeProjectsManagerType
): Promise<Location[]> {
  if (document.languageId !== 'blade') return [];
  const locations: Location[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const wordRange = doc.getWordRangeAtPosition(position, ':.-');
  if (!wordRange) return [];

  const text = document.getText(wordRange) || '';
  if (!text) return [];

  if (!text.startsWith('livewire:')) return [];

  const livewireKey = text.replace('livewire:', '');

  const livewire = livewireProjectManager.livewireMapStore.get(livewireKey);
  if (!livewire) return [];

  const location: Location = {
    uri: Uri.parse(livewire.filePath).toString(),
    range: Range.create(Position.create(0, 0), Position.create(0, 0)),
  };
  locations.push(location);

  if (livewire.templateKey) {
    const bladeFilePath = bladeProjectManager.bladeMapStore.get(livewire.templateKey);
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
