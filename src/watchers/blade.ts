import { ExtensionContext, workspace } from 'coc.nvim';
import { BladeCacheManagerType } from '../cacheManagers/managerTypes';

import { SUPPORTED_LANGUAGE } from '../constant';

export async function register(context: ExtensionContext, bladeCacheManager: BladeCacheManagerType) {
  if (!workspace.getConfiguration('laravel').get('completion.enable')) return;

  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const watcher = workspace.createFileSystemWatcher('**/resources/views/**/*.blade.php', false, false, false);

  watcher.onDidCreate((e) => {
    ////console.log(`====Create!!====`);
    bladeCacheManager.set([e.fsPath]);
  });

  watcher.onDidDelete((e) => {
    ////console.log(`====Delete!!====`);
    bladeCacheManager.delete([e.fsPath]);
  });

  context.subscriptions.push(watcher);
}
