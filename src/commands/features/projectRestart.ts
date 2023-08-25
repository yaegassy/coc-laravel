import { ExtensionContext, commands, window } from 'coc.nvim';

import { config } from '../../config';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  context.subscriptions.push(
    commands.registerCommand('laravel.project.restart', async () => {
      await projectManager.bladeProjectManager.restart();
      await projectManager.viewReferenceProjectManager.restart();
      if (config.completion.translationEnable) await projectManager.translationProjectManager.restart();
      if (config.completion.livewireEnable) await projectManager.livewireProjectManager.restart();
      if (config.completion.phpFunctionEnable) await projectManager.phpFunctionProjectManager.restart();
      if (config.completion.phpClassEnable) await projectManager.phpClassProjectManager.restart();
      if (config.completion.phpConstantEnable) await projectManager.phpConstantProjectManager.restart();
      if (config.completion.eloquentModelFieldEnable) await projectManager.eloquentModelProjectManager.restart();

      window.showInformationMessage('SUCCESS');
    })
  );
}
