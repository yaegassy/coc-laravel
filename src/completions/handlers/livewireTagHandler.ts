import { LinesTextDocument, Position, workspace } from 'coc.nvim';

import { type LivewireProjectManagerType } from '../../projects/types';

import * as livewireTagService from '../services/livewireTagService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  livewireProjectManager: LivewireProjectManagerType
) {
  if (document.languageId !== 'blade') return [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!livewireTagService.canCompletionFromContext(code, offset)) return [];

  const livewireComponents = Array.from(livewireProjectManager.list());
  if (!livewireComponents) return [];

  const livewireTagsData = livewireTagService.getLivewireTagsData(livewireComponents);
  if (!livewireTagsData) return [];

  const livewireComponentCompletionItems = livewireTagService.getComponentCompletionItems(
    document,
    position,
    livewireTagsData
  );
  if (!livewireComponentCompletionItems) return [];

  // Exclude item containing the close tag and data- attribute
  const items = livewireComponentCompletionItems.filter((item) => {
    if (!item.label.startsWith('/') && !item.label.startsWith('data-')) {
      return item;
    }
  });

  return items;
}
