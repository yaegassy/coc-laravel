import { ExtensionContext, window } from 'coc.nvim';

import fs from 'fs';

import * as codeActionFeature from './codeActions/codeAction';
import * as commandFeature from './commands/command';
import { getArtisanPath } from './common/shared';
import * as completionFeature from './completions/completion';
import { config } from './config';
import * as definitionFeature from './definitions/definition';
import * as diagnosticFeature from './diagnostics/diagnostic';
import * as hoverFeature from './hovers/hover';
import * as projectManagerFeature from './projects/manager';
import * as referenceFeature from './references/reference';
import * as watcherFeature from './watchers/watcher';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!config.enable) return;

  if (!fs.existsSync(context.storagePath)) {
    fs.mkdirSync(context.storagePath, { recursive: true });
  }

  const outputChannel = window.createOutputChannel('laravel');
  if (!getArtisanPath()) {
    outputChannel.appendLine('coc-laravel extension was not activated because it is not a laravel project');
    return;
  }

  outputChannel.appendLine('Project initialization...');
  if (config.project.startupMessageEnable) {
    window.showInformationMessage('[coc-laravel] Project initialization...');
  }

  const projectManager = await projectManagerFeature.register(context, outputChannel);
  if (!projectManager) return;

  await commandFeature.register(context, projectManager, outputChannel);
  await completionFeature.register(context, projectManager, outputChannel);
  await definitionFeature.register(context, projectManager, outputChannel);
  await referenceFeature.register(context, projectManager, outputChannel);
  await hoverFeature.register(context, projectManager, outputChannel);
  await diagnosticFeature.register(context, projectManager, outputChannel);
  await codeActionFeature.register(context, outputChannel);
  await watcherFeature.register(context, projectManager, outputChannel);

  Promise.all([
    projectManager.bladeProjectManager.initialize(),
    projectManager.viewReferenceProjectManager.initialize(),
    projectManager.translationProjectManager.initialize(),
    projectManager.phpClassProjectManager.initialize(),
    projectManager.phpFunctionProjectManager.initialize(),
    projectManager.phpConstantProjectManager.initialize(),
    projectManager.livewireProjectManager.initialize(),
    projectManager.eloquentModelProjectManager.initialize(),
  ]).then(() => {
    outputChannel.appendLine('[Success] Project initialization succeeded');
    if (config.project.startupMessageEnable) {
      window.showInformationMessage('[coc-laravel] Project initialization succeeded');
    }
  });
}
