import { ExtensionContext, OutputChannel, workspace } from 'coc.nvim';

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
  const viewReferenceProjectManager = new ViewReferenceProjectManager(workspace.root, outputChannel);
  const translationProjectManager = new TranslationProjectManager(workspace.root, outputChannel);
  const phpClassProjectManager = new PHPClassProjectManager(context, workspace.root, outputChannel);
  const phpFunctionProjectManager = new PHPFunctionProjectManager(context, workspace.root, outputChannel);
  const phpConstantProjectManager = new PHPConstantProjectManager(context, workspace.root, outputChannel);
  const livewireProjectManager = new LivewireProjectManager(workspace.root, outputChannel);

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
