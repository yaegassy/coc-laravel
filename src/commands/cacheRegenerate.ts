import { ExtensionContext, commands, window } from 'coc.nvim';

import { type BladeCacheManagerType } from '../cacheManagers/managerTypes';

export async function register(context: ExtensionContext, bladeCacheManager: BladeCacheManagerType) {
  context.subscriptions.push(
    commands.registerCommand('laravel.cache.regenerate', async () => {
      await bladeCacheManager.regenerate();
      window.showInformationMessage('SUCCESS');
    })
  );
}
