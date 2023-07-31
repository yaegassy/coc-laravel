import { LinesTextDocument, Position, Uri, workspace } from 'coc.nvim';

import { type LivewireMapValueType, type LivewireProjectManagerType } from '../../projects/types';
import * as livewireEventService from '../services/livewireEventService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  livewireProjectManager: LivewireProjectManagerType,
  viewPath: string
) {
  if (document.languageId !== 'blade') return [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!livewireEventService.canCompletionFromContext(code, offset)) return [];

  const viewUri = Uri.parse(viewPath).toString();
  const templateKey = document.uri
    .replace(viewUri, '')
    .replace(/^\//, '')
    .replace('.blade.php', '')
    .replace(/\//g, '.');

  const livewireComponents = Array.from(livewireProjectManager.list());
  if (!livewireComponents) return [];

  let currentComponent: [string, LivewireMapValueType] | undefined = undefined;
  for (const component of livewireComponents) {
    if (!component[1].templateKey) continue;
    if (component[1].templateKey !== templateKey) continue;
    currentComponent = component;
  }
  if (!currentComponent) return;

  const livewireEventGlobalAttributes = livewireEventService.getLivewireEventGlobalAttributeData();
  if (!livewireEventGlobalAttributes) return;

  const livewireEventCompletionItems = livewireEventService.getComponentCompletionItems(
    document,
    position,
    livewireEventGlobalAttributes
  );
  if (!livewireEventCompletionItems) return [];

  // Exclude item containing the close tag and data- attribute
  const items = livewireEventCompletionItems.filter((item) => {
    if (!item.label.startsWith('/') && !item.label.startsWith('data-')) {
      return item;
    }
  });

  return items;
}
