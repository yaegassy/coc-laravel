import { ExtensionContext } from 'coc.nvim';

import { type ProjectManagerType } from '../projects/types';

import * as bladeWatcherFeature from './features/blade';
import * as phpFunctionWatcherFeature from './features/phpFunction';
import * as translationWatcherFeature from './features/translation';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  await bladeWatcherFeature.register(context, projectManager);
  await translationWatcherFeature.register(context, projectManager);
  await phpFunctionWatcherFeature.register(context, projectManager);
}
