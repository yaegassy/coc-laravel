import { CompletionItem, LinesTextDocument, Position, workspace } from 'coc.nvim';

import { type BladeProjectsManagerType } from '../../projects/types';

import * as bladeComponentService from '../services/bladeComponentService';

export async function doCompletion(
  document: LinesTextDocument,
  position: Position,
  bladeProjectManager: BladeProjectsManagerType
) {
  if (document.languageId !== 'blade') return [];

  const items: CompletionItem[] = [];

  const doc = workspace.getDocument(document.uri);
  if (!doc) return [];

  const code = document.getText();
  const offset = document.offsetAt(position);
  if (!bladeComponentService.canCompletionFromContext(code, offset)) return [];

  const components = Array.from(bladeProjectManager.componentList());
  if (!components) return [];

  const componentTagsData = bladeComponentService.getComponentTagsData(components);
  if (!componentTagsData) return [];

  const componentCompletionItems = bladeComponentService.getComponentCompletionItems(
    componentTagsData,
    document,
    position
  );
  if (!componentCompletionItems) return [];
  items.push(...componentCompletionItems);

  return items;
}
