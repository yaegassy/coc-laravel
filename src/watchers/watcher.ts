import { ExtensionContext } from 'coc.nvim';

import { type ProjectManagerType } from '../projects/types';

import * as bladeWatcherFeature from './features/blade';
import * as translationWatcherFeature from './features/translation';
import * as phpFunctionWatcherFeature from './features/phpFunction';
export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  await bladeWatcherFeature.register(context, projectManager);
  await translationWatcherFeature.register(context, projectManager);
  await phpFunctionWatcherFeature.register(context, projectManager);
}
