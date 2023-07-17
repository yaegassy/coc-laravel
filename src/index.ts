import { ExtensionContext, workspace } from 'coc.nvim';

import * as projectRestartCommandFeature from './commands/projectRestart';
import * as projectStatsCommandFeature from './commands/projectStats';
import * as completionFeature from './completions/completion';
import * as projectManagerFeature from './projects/manager';
import * as bladeWatcherFeature from './watchers/blade';
import * as tranlationWatcherFeature from './watchers/translation';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration('laravel').get<boolean>('enable')) return;

  const projectManager = await projectManagerFeature.register(context);
  if (projectManager) {
    projectStatsCommandFeature.register(context, projectManager);
    projectRestartCommandFeature.register(context, projectManager);
    bladeWatcherFeature.register(context, projectManager);
    tranlationWatcherFeature.register(context, projectManager);
    completionFeature.register(context, projectManager);
  }
}
