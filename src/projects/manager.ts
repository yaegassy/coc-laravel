import { ExtensionContext, OutputChannel, workspace } from 'coc.nvim';

import { config } from '../config';
import { SUPPORTED_LANGUAGE } from '../constant';
import { BladeProjectsManager } from './managers/blade';
import { LivewireProjectManager } from './managers/livewire';
import { PHPClassProjectManager } from './managers/phpClass';
import { PHPConstantProjectManager } from './managers/phpConstant';
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

  const phpClassProjectManager = new PHPClassProjectManager(context, workspace.root, outputChannel);
  if (config.completion.phpClassEnable) await phpClassProjectManager.initialize();

  const phpFunctionProjectManager = new PHPFunctionProjectManager(context, workspace.root, outputChannel);
  if (config.completion.phpFunctionEnable) await phpFunctionProjectManager.initialize();

  const phpConstantProjectManager = new PHPConstantProjectManager(context, workspace.root, outputChannel);
  if (config.completion.phpConstantEnable) await phpConstantProjectManager.initialize();

  const livewireProjectManager = new LivewireProjectManager(workspace.root, outputChannel);
  await livewireProjectManager.initialize();

  const projectManagers: ProjectManagerType = {
    bladeProjectManager,
    viewReferenceProjectManager,
    translationProjectManager,
    phpFunctionProjectManager,
    phpConstantProjectManager,
    phpClassProjectManager,
    livewireProjectManager,
  };

  return projectManagers;
}
