import { ExtensionContext, workspace } from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../constant';
import { BladeProjectsManager } from './managers/blade';
import { TranslationProjectManager } from './managers/translation';
import { type ProjectManagerType } from './types';

export async function register(context: ExtensionContext) {
  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const bladeProjectManager = new BladeProjectsManager(workspace.root);
  const translationProjectManager = new TranslationProjectManager();

  // FIRST OPEN
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workspace.documents.map(async (doc) => {
    if (!bladeProjectManager.isInitialized()) {
      if (SUPPORTED_LANGUAGE.includes(doc.languageId)) {
        await bladeProjectManager.initialize();
        await translationProjectManager.initialize();
      }
    }
  });

  // DID OPEN
  workspace.onDidOpenTextDocument(
    async (e) => {
      if (!bladeProjectManager.isInitialized()) {
        if (SUPPORTED_LANGUAGE.includes(e.languageId)) {
          await bladeProjectManager.initialize();
          await translationProjectManager.initialize();
        }
      }
    },
    null,
    context.subscriptions
  );

  const projectManagers: ProjectManagerType = {
    bladeProjectManager,
    translationProjectManager,
  };

  return projectManagers;
}
