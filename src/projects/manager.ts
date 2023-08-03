import { ExtensionContext, OutputChannel, workspace } from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../constant';
import { BladeProjectsManager } from './managers/blade';
import { LivewireProjectManager } from './managers/livewire';
import { PHPFunctionProjectManager } from './managers/phpFunction';
import { TranslationProjectManager } from './managers/translation';
import { ViewReferenceProjectManager } from './managers/viewReference';
import { type ProjectManagerType } from './types';

export async function register(context: ExtensionContext, outputChannel: OutputChannel) {
  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const bladeProjectManager = new BladeProjectsManager(workspace.root, outputChannel);
  await bladeProjectManager.initialize();

  const viewReferenceProjectManager = new ViewReferenceProjectManager(workspace.root, outputChannel);
  await viewReferenceProjectManager.initialize();

  const translationProjectManager = new TranslationProjectManager(workspace.root, outputChannel);
  await translationProjectManager.initialize();

  const phpFunctionProjectManager = new PHPFunctionProjectManager(workspace.root, outputChannel);
  await phpFunctionProjectManager.initialize();

  const livewireProjectManager = new LivewireProjectManager(workspace.root, outputChannel);
  await livewireProjectManager.initialize();

  // FIRST OPEN
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workspace.documents.map(async (doc) => {
    if (SUPPORTED_LANGUAGE.includes(doc.languageId)) {
      if (!bladeProjectManager.isInitialized()) {
        await bladeProjectManager.initialize();
      }
      if (!viewReferenceProjectManager.isInitialized()) {
        await viewReferenceProjectManager.initialize();
      }
      if (!translationProjectManager.isInitialized()) {
        await translationProjectManager.initialize();
      }
      if (!phpFunctionProjectManager.isInitialized()) {
        await phpFunctionProjectManager.initialize();
      }
      if (!livewireProjectManager.isInitialized()) {
        await livewireProjectManager.initialize();
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
        if (!viewReferenceProjectManager.isInitialized()) {
          await viewReferenceProjectManager.initialize();
        }
        if (!translationProjectManager.isInitialized()) {
          await translationProjectManager.initialize();
        }
        if (!phpFunctionProjectManager.isInitialized()) {
          await phpFunctionProjectManager.initialize();
        }
        if (!livewireProjectManager.isInitialized()) {
          await livewireProjectManager.initialize();
        }
      }
    },
    null,
    context.subscriptions
  );

  const projectManagers: ProjectManagerType = {
    bladeProjectManager,
    viewReferenceProjectManager,
    translationProjectManager,
    phpFunctionProjectManager,
    livewireProjectManager,
  };

  return projectManagers;
}
