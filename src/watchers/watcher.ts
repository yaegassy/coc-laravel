import { ExtensionContext } from 'coc.nvim';

import { type ProjectManagerType } from '../projects/types';
import * as autoloadFilesPhpWatcherManager from './managers/autoloadFilesPhp';
import * as phpFileExtensionWatcherManager from './managers/phpFileExtension';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  await phpFileExtensionWatcherManager.register(context, projectManager);
  await autoloadFilesPhpWatcherManager.register(context, projectManager);
}
