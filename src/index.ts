import { ExtensionContext, workspace } from 'coc.nvim';

import * as projectRestartCommandFeature from './commands/projectRestart';
import * as projectStatsCommandFeature from './commands/projectStats';
import * as completionFeature from './completions/completion';
import * as definitionFeature from './definitions/definition';
import * as projectManagerFeature from './projects/manager';
import * as watcherFeature from './watchers/watcher';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration('laravel').get<boolean>('enable')) return;

  const projectManager = await projectManagerFeature.register(context);
  if (projectManager) {
    projectStatsCommandFeature.register(context, projectManager);
    projectRestartCommandFeature.register(context, projectManager);
    watcherFeature.register(context, projectManager);
    completionFeature.register(context, projectManager);
    definitionFeature.register(context, projectManager);
  }
}
