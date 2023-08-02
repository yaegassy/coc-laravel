import {
  CancellationToken,
  ExtensionContext,
  LinesTextDocument,
  Location,
  Position,
  ReferenceContext,
  ReferenceProvider,
  languages,
  workspace,
} from 'coc.nvim';

import { DOCUMENT_SELECTOR, SUPPORTED_LANGUAGE } from '../constant';
import { type ProjectManagerType } from '../projects/types';
import * as viewReferenceHandler from './handlers/viewHandler';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('reference.enable')) return;

  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  await projectManager.bladeProjectManager.onReady(() => {});
  await projectManager.viewReferenceProjectManager.onReady(() => {});

  context.subscriptions.push(
    languages.registerReferencesProvider(DOCUMENT_SELECTOR, new LaravelReferenceProvider(context, projectManager))
  );
}

class LaravelReferenceProvider implements ReferenceProvider {
  _context: ExtensionContext;
  projectManager: ProjectManagerType;

  constructor(context: ExtensionContext, projectManager: ProjectManagerType) {
    this._context = context;
    this.projectManager = projectManager;
  }

  async provideReferences(
    document: LinesTextDocument,
    position: Position,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ReferenceContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: CancellationToken
  ): Promise<Location[]> {
    const locations: Location[] = [];

    const viewReferenceItems = await viewReferenceHandler.doReference(
      document,
      position,
      this.projectManager.viewReferenceProjectManager
    );
    if (viewReferenceItems) {
      locations.push(...viewReferenceItems);
    }

    return locations;
  }
}
