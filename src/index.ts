import { ExtensionContext, window, workspace } from 'coc.nvim';

import fs from 'fs';

import * as codeActionFeature from './codeActions/codeAction';
import * as commandFeature from './commands/command';
import { getArtisanPath } from './common/shared';
import * as completionFeature from './completions/completion';
import * as definitionFeature from './definitions/definition';
import * as diagnosticFeature from './diagnostics/diagnostic';
import * as hoverFeature from './hovers/hover';
import * as projectManagerFeature from './projects/manager';
import { ProjectManagerType } from './projects/types';
import * as referenceFeature from './references/reference';
import * as watcherFeature from './watchers/watcher';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration('laravel').get<boolean>('enable')) return;

  if (!fs.existsSync(context.storagePath)) {
    fs.mkdirSync(context.storagePath, { recursive: true });
  }

  const outputChannel = window.createOutputChannel('laravel');
  if (!getArtisanPath()) {
    outputChannel.appendLine('coc-laravel extension was not activated because it is not a laravel project');
    return;
  }

  outputChannel.appendLine('Project initialization...');
  if (workspace.getConfiguration('laravel').get<boolean>('project.startupMessageEnable')) {
    window.showInformationMessage('[coc-laravel] Project initialization...');
  }

  async function initialize(projectManager: ProjectManagerType) {
    await commandFeature.register(context, projectManager, outputChannel);
    await completionFeature.register(context, projectManager, outputChannel);
    await definitionFeature.register(context, projectManager, outputChannel);
    await referenceFeature.register(context, projectManager, outputChannel);
    await hoverFeature.register(context, projectManager, outputChannel);
    await diagnosticFeature.register(context, projectManager, outputChannel);
    await codeActionFeature.register(context, outputChannel);
    await watcherFeature.register(context, projectManager, outputChannel);
  }

  projectManagerFeature.register(context, outputChannel).then(async (projectManager) => {
    if (projectManager) {
      setTimeout(async () => {
        await initialize(projectManager);
      }, 300);

      setTimeout(async () => {
        outputChannel.appendLine('[Success] Project initialization succeeded');

        if (workspace.getConfiguration('laravel').get<boolean>('project.startupMessageEnable')) {
          window.showInformationMessage('[coc-laravel] Project initialization succeeded');
        }
      }, 500);
    } else {
      outputChannel.appendLine('[Failed] Project initialization failed');
      if (workspace.getConfiguration('laravel').get<boolean>('project.startupMessageEnable')) {
        window.showErrorMessage('[coc-laravel] Project initialization failed');
      }
    }
  });
}
