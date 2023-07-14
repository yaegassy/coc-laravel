import { ExtensionContext, workspace } from 'coc.nvim';

import * as cacheManagersFeature from './cacheManagers';
import * as regenerateCommandFeature from './commands/cacheRegenerate';
import * as statsCommandFeature from './commands/stats';
import * as completionFeature from './completions/completion';
import * as bladeWatcherFeature from './watchers/blade';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration('laravel').get<boolean>('enable')) return;

  const cacheManagers = await cacheManagersFeature.register(context);
  if (cacheManagers) {
    statsCommandFeature.register(context, cacheManagers.managers.bladeCacheManager);
    regenerateCommandFeature.register(context, cacheManagers.managers.bladeCacheManager);
    bladeWatcherFeature.register(context, cacheManagers.managers.bladeCacheManager);
    completionFeature.register(context, cacheManagers.managers.bladeCacheManager);
  }
}
