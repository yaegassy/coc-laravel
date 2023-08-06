import { ExtensionContext, workspace, window } from 'coc.nvim';

import * as codeActionFeature from './codeActions/codeAction';
import * as commandFeature from './commands/command';
import * as completionFeature from './completions/completion';
import * as definitionFeature from './definitions/definition';
import * as diagnosticFeature from './diagnostics/diagnostic';
import * as hoverFeature from './hovers/hover';
import * as projectManagerFeature from './projects/manager';
import * as referenceFeature from './references/reference';
import * as watcherFeature from './watchers/watcher';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration('laravel').get<boolean>('enable')) return;

  const outputChannel = window.createOutputChannel('laravel');

  const projectManager = await projectManagerFeature.register(outputChannel);
  if (projectManager) {
    commandFeature.register(context, projectManager, outputChannel);
    completionFeature.register(context, projectManager, outputChannel);
    definitionFeature.register(context, projectManager, outputChannel);
    referenceFeature.register(context, projectManager, outputChannel);
    hoverFeature.register(context, projectManager, outputChannel);
    diagnosticFeature.register(context, projectManager, outputChannel);
    codeActionFeature.register(context, outputChannel);

    watcherFeature.register(context, projectManager, outputChannel);
  }
}
