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

  //
  // Search by bladeProjectManager with bladeKey
  //

  const bladeKey = text.replace('livewire:', 'livewire.');
  const blade = bladeProjectManager.bladeMapStore.get(bladeKey);
  if (blade) {
    const bladeLocation: Location = {
      uri: Uri.parse(blade).toString(),
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };
    locations.push(bladeLocation);
  }

  //
  // Search by livewireProjectManager with livewireKey
  //

  const livewireKey = text.replace('livewire:', '');
  const livewire = livewireProjectManager.livewireMapStore.get(livewireKey);
  if (livewire) {
    const livewireLocation: Location = {
      uri: Uri.parse(livewire.filePath).toString(),
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };
    locations.push(livewireLocation);

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
  }

  return locations;
}
