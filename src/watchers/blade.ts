import { ExtensionContext, workspace } from 'coc.nvim';
import { type ProjectManagerType } from '../projects/types';

import { SUPPORTED_LANGUAGE } from '../constant';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;

  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const watcher = workspace.createFileSystemWatcher('**/resources/views/**/*.blade.php', false, false, false);

  watcher.onDidCreate((e) => {
    ////console.log(`====Create!!====`);
    projectManager.bladeProjectManager.set([e.fsPath]);
  });

  watcher.onDidDelete((e) => {
    ////console.log(`====Delete!!====`);
    projectManager.bladeProjectManager.delete([e.fsPath]);
  });

  context.subscriptions.push(watcher);
}
