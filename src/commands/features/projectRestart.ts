import { ExtensionContext, commands, window } from 'coc.nvim';

import { config } from '../../config';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  context.subscriptions.push(
    commands.registerCommand('laravel.project.restart', async () => {
      await projectManager.bladeProjectManager.restart();
      await projectManager.viewReferenceProjectManager.restart();
      await projectManager.translationProjectManager.restart();
      await projectManager.livewireProjectManager.restart();
      if (config.completion.phpFunctionEnable) await projectManager.phpFunctionProjectManager.restart();
      if (config.completion.phpClassEnable) await projectManager.phpClassProjectManager.restart();
      if (config.completion.phpConstantEnable) await projectManager.phpConstantProjectManager.restart();

      window.showInformationMessage('SUCCESS');
    })
  );
}
