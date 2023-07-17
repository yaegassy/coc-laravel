import { ExtensionContext, commands, window } from 'coc.nvim';

import { type ProjectManagerType } from '../projects/types';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  context.subscriptions.push(
    commands.registerCommand('laravel.project.restart', async () => {
      await projectManager.bladeProjectManager.regenerate();
      await projectManager.translationProjectManager.regenerate();
      window.showInformationMessage('SUCCESS');
    })
  );
}
