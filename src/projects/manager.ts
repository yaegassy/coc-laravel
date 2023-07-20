import { ExtensionContext, workspace } from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../constant';
import { BladeProjectsManager } from './managers/blade';
import { TranslationProjectManager } from './managers/translation';
import { PHPFunctionProjectManager } from './managers/phpFunction';
import { type ProjectManagerType } from './types';

export async function register(context: ExtensionContext) {
  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const bladeProjectManager = new BladeProjectsManager(workspace.root);
  const translationProjectManager = new TranslationProjectManager();
  const phpFunctionProjectManager = new PHPFunctionProjectManager();

  // FIRST OPEN
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workspace.documents.map(async (doc) => {
    if (SUPPORTED_LANGUAGE.includes(doc.languageId)) {
      if (!bladeProjectManager.isInitialized()) {
        await bladeProjectManager.initialize();
      }
      if (!translationProjectManager.isInitialized()) {
        await translationProjectManager.initialize();
      }
      if (!phpFunctionProjectManager.isInitialized()) {
        await phpFunctionProjectManager.initialize();
      }
    }
  });

  // DID OPEN
  workspace.onDidOpenTextDocument(
    async (e) => {
      if (SUPPORTED_LANGUAGE.includes(e.languageId)) {
        if (!bladeProjectManager.isInitialized()) {
          await bladeProjectManager.initialize();
        }

        if (!translationProjectManager.isInitialized()) {
          await translationProjectManager.initialize();
        }

        if (!phpFunctionProjectManager.isInitialized()) {
          await phpFunctionProjectManager.initialize();
        }
      }
    },
    null,
    context.subscriptions
  );

  const projectManagers: ProjectManagerType = {
    bladeProjectManager,
    translationProjectManager,
    phpFunctionProjectManager,
  };

  return projectManagers;
}
