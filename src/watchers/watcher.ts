import { ExtensionContext, OutputChannel } from 'coc.nvim';

import { type ProjectManagerType } from '../projects/types';
import * as phpFileExtensionWatcherManager from './managers/phpFileExtension';
//import * as vendorComposerWatcherManager from './managers/vendorComposer';

export async function register(
  context: ExtensionContext,
  projectManager: ProjectManagerType,
  outputChannel: OutputChannel
) {
  outputChannel.appendLine('Start registration for watcher feature');

  await phpFileExtensionWatcherManager.register(context, projectManager);
  //await vendorComposerWatcherManager.register(context, projectManager);
}
