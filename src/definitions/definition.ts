import {
  CancellationToken,
  Definition,
  DefinitionProvider,
  ExtensionContext,
  languages,
  Location,
  Position,
  TextDocument,
  workspace,
} from 'coc.nvim';

import { DOCUMENT_SELECTOR, SUPPORTED_LANGUAGE } from '../constant';
import { type ProjectManagerType } from '../projects/types';
import * as bladeComponentTagHandler from './handlers/bladeComponentTagHandler';
import * as bladeViewHandler from './handlers/bladeViewHandler';
import * as livewireDirectiveHandler from './handlers/livewireDirectiveHandler';
import * as livewireTagHandler from './handlers/livewireTagHandler';
import * as viewHandler from './handlers/viewHandler';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('definition.enable')) return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  await projectManager.bladeProjectManager.onReady(() => {});
  await projectManager.livewireProjectManager.onReady(() => {});

  context.subscriptions.push(
    languages.registerDefinitionProvider(DOCUMENT_SELECTOR, new LaravelDefinitionProvider(context, projectManager))
  );
}

class LaravelDefinitionProvider implements DefinitionProvider {
  _context: ExtensionContext;
  projectManager: ProjectManagerType;

  constructor(context: ExtensionContext, projectManager: ProjectManagerType) {
    this._context = context;
    this.projectManager = projectManager;
  }

  async provideDefinition(
    document: TextDocument,
    position: Position,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: CancellationToken
  ): Promise<Definition> {
    const locations: Location[] = [];

    const bladeComponentTagDefinitionItems = await bladeComponentTagHandler.doDefinition(
      document,
      position,
      this.projectManager.bladeProjectManager
    );
    if (bladeComponentTagDefinitionItems) {
      locations.push(...bladeComponentTagDefinitionItems);
    }

    const bladeViewDefinitionItems = await bladeViewHandler.doDefinition(
      document,
      position,
      this.projectManager.bladeProjectManager
    );
    if (bladeViewDefinitionItems) {
      locations.push(...bladeViewDefinitionItems);
    }

    const viewDefinitionItems = await viewHandler.doDefinition(
      document,
      position,
      this.projectManager.bladeProjectManager
    );
    if (viewDefinitionItems) {
      locations.push(...viewDefinitionItems);
    }

    const livewireTagDefinitionItems = await livewireTagHandler.doDefinition(
      document,
      position,
      this.projectManager.livewireProjectManager,
      this.projectManager.bladeProjectManager
    );
    if (livewireTagDefinitionItems) {
      locations.push(...livewireTagDefinitionItems);
    }

    const livewireDirectiveDefinitionItems = await livewireDirectiveHandler.doDefinition(
      document,
      position,
      this.projectManager.livewireProjectManager,
      this.projectManager.bladeProjectManager
    );
    if (livewireDirectiveDefinitionItems) {
      locations.push(...livewireDirectiveDefinitionItems);
    }

    return locations;
  }
}
