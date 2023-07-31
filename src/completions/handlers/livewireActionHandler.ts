import { LinesTextDocument, Position, Uri, workspace } from 'coc.nvim';

import { type LivewireMapValueType, type LivewireProjectManagerType } from '../../projects/types';
import * as livewireActionService from '../services/livewireActionService';

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
  if (!livewireActionService.canCompletionFromContext(code, offset)) return [];

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

  const { globalAttributes, valueSets } =
    livewireActionService.getLivewireActionGlobalAttributeAndValueSetsData(currentComponent);

  const livewireActionCompletionItems = livewireActionService.getComponentCompletionItems(
    document,
    position,
    globalAttributes,
    valueSets
  );
  if (!livewireActionCompletionItems) return [];

  // Exclude item containing the close tag and data- attribute
  const items = livewireActionCompletionItems.filter((item) => {
    if (!item.label.startsWith('/') && !item.label.startsWith('data-')) {
      return item;
    }
  });

  return items;
}
